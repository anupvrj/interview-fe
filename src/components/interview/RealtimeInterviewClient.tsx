"use client";

import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2,
  AlertCircle,
  PhoneOff,
  CheckCircle2,
  ArrowLeft,
  X,
} from "lucide-react";
import { interviewApi, codingInterviewApi, Interview } from "@/lib/api";
import {
  invalidateAfterAiInterviewSessionFromStorage,
  invalidateAfterCodingSessionCompleteFromStorage,
} from "@/lib/invalidate-queries";
import { normalizeInterviewDurationMinutes } from "@/lib/interviewDuration";
import { formatDuration } from "@/lib/utils";
import { BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES } from "@/lib/interviewWebSocketPolicy";
import {
  AI_INTERVIEWER_PERSONAS,
  pickRandomPersona,
} from "@/lib/aiPersonas";
import type { AIInterviewerPersona } from "@/lib/aiPersonas";
import { AiPersonaAvatar } from "@/components/interview/AiPersonaAvatar";
import { InterviewBriefingDialog } from "@/components/interview/InterviewBriefingDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supportsDisplayMediaCapture } from "@/lib/codingSessionRecording";
import {
  buildRealtimeWsPath,
  buildVoiceQueryParam,
  providerDisplayLabel,
  resolveVoiceProvider,
  usesUnifiedVoiceProtocol,
  type VoiceProvider,
} from "@/lib/voiceProviders";
import {
  revealedAssistantText,
  shouldHoldAssistantCaptionUntilAudio,
  SPEECH_CAPTION_FINISH_DEBOUNCE_MS,
} from "@/lib/voice/speechSyncedTranscript";
import { createVoiceTransport } from "@/lib/voiceTransport/createVoiceTransport";
import type { VoiceTransport } from "@/lib/voiceTransport/types";

/** Hard fallback minutes added on top of target (used if AI never sends interview_complete). */
const EXTRA_BUFFER_MINUTES = 5;

/** Reconnect attempt counter (e.g. 1/3) in the yellow banner — production candidates see a generic message only. */
const SHOW_RECONNECT_ATTEMPT_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_APP_ENV === "staging";

/** Fallback when interview has no stored provider (legacy drafts). */
const ENV_VOICE_PROVIDER = resolveVoiceProvider(
  process.env.NEXT_PUBLIC_VOICE_PROVIDER,
);

const unstartedDraftDiscardTimers = new Map<string, number>();

const RECORDING_OPT_IN_STORAGE_PREFIX = "interviewRecordingOptIn_";

function shouldShowInterviewBriefing(
  status: Interview["status"] | undefined,
  isCodingDiscussion: boolean,
  codingEmbed: boolean,
): boolean {
  return status === "draft" && !isCodingDiscussion && !codingEmbed;
}

/** Gemini Live output is 24 kHz PCM16. */
const GEMINI_PLAYBACK_RATE = 24000;
/** Flush a playback batch once we have ~100ms of audio. */
const PLAYBACK_BATCH_SAMPLES = 2400;
/** Or flush after this idle gap so the first words still start quickly. */
const PLAYBACK_BATCH_IDLE_MS = 80;

function decodeBase64Pcm16(base64Audio: string): Int16Array | null {
  const binaryString = atob(base64Audio);
  if (binaryString.length < 2) return null;
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i) & 0xff;
  }
  const even = bytes.byteLength & ~1;
  if (even < 2) return null;
  const pcm16 = new Int16Array(even / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, even);
  for (let i = 0; i < pcm16.length; i++) {
    pcm16[i] = view.getInt16(i * 2, true);
  }
  return pcm16;
}

function pcmRateFromMime(mime?: string): number {
  const match = /rate=(\d+)/i.exec(mime ?? "");
  const rate = match ? Number(match[1]) : GEMINI_PLAYBACK_RATE;
  return Number.isFinite(rate) && rate > 0 ? rate : GEMINI_PLAYBACK_RATE;
}

/** Thought-signature blobs decoded as PCM are high-ZCR static, often 40–80ms. */
function isLikelyStaticPcm(pcm: Int16Array): boolean {
  if (pcm.length < 720) return false;
  let crossings = 0;
  let energy = 0;
  for (let i = 1; i < pcm.length; i++) {
    const sample = pcm[i]!;
    energy += sample * sample;
    if ((pcm[i - 1]! >= 0) !== (sample >= 0)) crossings += 1;
  }
  const zcr = crossings / pcm.length;
  const rms = Math.sqrt(energy / pcm.length) / 32768;
  return rms > 0.015 && zcr > 0.42;
}

function resamplePcm16ToFloat32(
  pcm16: Int16Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) {
    const out = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      out[i] = pcm16[i]! / 32768;
    }
    return out;
  }
  const ratio = toRate / fromRate;
  const outLen = Math.max(1, Math.floor(pcm16.length * ratio));
  const out = new Float32Array(outLen);
  const last = pcm16.length - 1;
  for (let i = 0; i < outLen; i++) {
    const src = i / ratio;
    const i0 = Math.min(last, Math.floor(src));
    const i1 = Math.min(last, i0 + 1);
    const frac = src - i0;
    const s0 = pcm16[i0]! / 32768;
    const s1 = pcm16[i1]! / 32768;
    out[i] = s0 * (1 - frac) + s1 * frac;
  }
  return out;
}

export type CodingDiscussionHostEvent = "leave" | "done" | "close";

export type RealtimeInterviewClientProps = {
  interviewId: string;
  isCodingDiscussion: boolean;
  /**
   * Compact layout: hidden camera video (iframe or sidebar) vs full interview page.
   */
  codingEmbed: boolean;
  /**
   * Rendered on the coding session page (same document). Uses callbacks instead of postMessage.
   */
  codingDiscussionHost?: boolean;
  onCodingDiscussionHostNotify?: (event: CodingDiscussionHostEvent) => void;
  /**
   * Reuse the parent page's getUserMedia stream. This component will not stop those tracks on cleanup.
   */
  reuseMediaStreamRef?: RefObject<MediaStream | null>;
  className?: string;
};

export function RealtimeInterviewClient({
  interviewId,
  isCodingDiscussion,
  codingEmbed,
  codingDiscussionHost = false,
  onCodingDiscussionHostNotify,
  reuseMediaStreamRef,
  className,
}: RealtimeInterviewClientProps) {
  const router = useRouter();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  // Target duration in seconds — general: 15/30 min; coding discussion: metadata.discussionDurationMinutes.
  const targetDurationSec = isCodingDiscussion
    ? (interview?.metadata?.discussionDurationMinutes ?? 60) * 60
    : normalizeInterviewDurationMinutes(interview?.metadata?.interviewDuration) *
      60;
  const maxDurationSec = targetDurationSec + EXTRA_BUFFER_MINUTES * 60;
  const [error, setError] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [videoStreamActive, setVideoStreamActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);

  // Transcript state
  const [transcript, setTranscript] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([]);
  const [currentAssistantTranscript, setCurrentAssistantTranscript] =
    useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [lastAIMessage, setLastAIMessage] = useState("");
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  // Number of consecutive reconnect attempts received — used to escalate from
  // non-blocking banner (1-2 attempts) to blocking dialog (all attempts failed).
  const [reconnectAttemptCount, setReconnectAttemptCount] = useState(0);
  const [isClosingFailed, setIsClosingFailed] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  // Non-blocking toast shown for soft failures during an active interview
  // (upload errors, WS send errors). Does not interrupt the interview.
  const [activeError, setActiveError] = useState<string>("");
  const [showEndInterviewConfirm, setShowEndInterviewConfirm] = useState(false);
  const [showInterviewComplete, setShowInterviewComplete] = useState(false);
  const [interviewCompleteCountdown, setInterviewCompleteCountdown] = useState(15);
  const interviewCompleteAutoCloseRef = useRef<NodeJS.Timeout | null>(null);
  const interviewCompleteCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const pendingInterviewCompleteRef = useRef(false);
  const showInterviewCompleteRef = useRef(false);
  const interviewCompleteRevealTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Candidate-initiated end-interview confirmation dialog
  const [showConfirmEndInterview, setShowConfirmEndInterview] = useState(false);
  /** Recording consent before interview starts (after "Start Interview"). */
  const [showRecordingOptIn, setShowRecordingOptIn] = useState(false);
  /** First-time draft briefing — socket stays closed until the candidate accepts. */
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingAccepted, setBriefingAccepted] = useState(false);
  const [acceptingBriefing, setAcceptingBriefing] = useState(false);
  const openedRecordingAfterBriefingRef = useRef(false);
  const launchingInterviewRef = useRef(false);
  /** Avoid double-handling when Radix fires onOpenChange after Yes/No. */
  const recordingOptInResolvedRef = useRef(false);
  const startInterviewLatestRef = useRef<(() => Promise<void>) | null>(null);
  const shouldDiscardUnstartedRef = useRef(false);
  const codingEmbedAutostartStartedRef = useRef(false);
  const [embedAutostartPending, setEmbedAutostartPending] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  /** False when `mediaStreamRef` points at `reuseMediaStreamRef` (parent owns tracks). */
  const mediaStreamOwnedRef = useRef(true);
  const websocketRef = useRef<WebSocket | null>(null);
  const voiceTransportRef = useRef<VoiceTransport | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartedRef = useRef(false);
  // AudioWorkletNode is the primary processor; ScriptProcessorNode used as fallback only.
  const audioProcessorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  // Resumes mic capture when the tab regains focus (backgrounding auto-suspends
  // the AudioContext); the server-side silence keepalive covers the idle gap.
  const visibilityResumeHandlerRef = useRef<(() => void) | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const audioBufferRef = useRef<Int16Array[]>([]);
  const audioBufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingAudioRef = useRef(false);
  const nextPlayAtRef = useRef(0);
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playbackNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackSourceRateRef = useRef(GEMINI_PLAYBACK_RATE);
  const pendingPlaybackRef = useRef<Int16Array[]>([]);
  const playbackWorkletFailedRef = useRef(false);
  const isInterviewActiveRef = useRef(false);
  const connectionInitiatedRef = useRef(false);
  const isResumingRef = useRef(false);
  /** Gemini Resume button: server hydrates transcript from DB and skips re-greeting. */
  const geminiResumePayloadRef = useRef<{
    reconnectResume: boolean;
    elapsedTimeSec: number;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const aiAudioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(
    null,
  );
  const voiceProviderRef = useRef<VoiceProvider>(ENV_VOICE_PROVIDER);
  const [activeVoiceProvider, setActiveVoiceProvider] =
    useState<VoiceProvider>(ENV_VOICE_PROVIDER);
  // Ref mirror for isMicOn — avoids stale closure in sendAudioChunk / onaudioprocess
  const isMicOnRef = useRef(true);
  /** Application-level WS keepalive for Gemini path (reduces proxy idle closes). */
  const clientWsHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  /** Pending auto-reconnect timer after a benign WS drop during an active interview. */
  const autoReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoReconnectAttemptsRef = useRef(0);
  const MAX_AUTO_RECONNECT_ATTEMPTS = 4;
  // Ref mirror of elapsedTime so setTimeout/onclose closures always read the current
  // value, not the stale value captured at the time connectWebSocket() was called.
  const elapsedTimeRef = useRef(0);
  const pendingAssistantTextRef = useRef("");
  const pendingAssistantCompleteRef = useRef(false);
  const captionStartedAtRef = useRef(0);
  const captionRevealTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const captionFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastCommittedAssistantRef = useRef("");

  const stopClientWsHeartbeat = () => {
    if (clientWsHeartbeatRef.current) {
      clearInterval(clientWsHeartbeatRef.current);
      clientWsHeartbeatRef.current = null;
    }
  };

  const stopAiPlayback = () => {
    for (const source of playbackSourcesRef.current) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    playbackSourcesRef.current = [];
    playbackNodeRef.current?.port.postMessage({ type: "clear" });
    pendingPlaybackRef.current = [];
    audioQueueRef.current = [];
    audioBufferRef.current = [];
    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }
    nextPlayAtRef.current = 0;
    isPlayingAudioRef.current = false;
  };

  const stopCaptionRevealTimer = () => {
    if (captionRevealTimerRef.current) {
      clearInterval(captionRevealTimerRef.current);
      captionRevealTimerRef.current = null;
    }
    if (captionFinishTimerRef.current) {
      clearTimeout(captionFinishTimerRef.current);
      captionFinishTimerRef.current = null;
    }
  };

  const resetSpeechSyncedCaption = () => {
    stopCaptionRevealTimer();
    pendingAssistantTextRef.current = "";
    pendingAssistantCompleteRef.current = false;
    captionStartedAtRef.current = 0;
    setCurrentAssistantTranscript("");
  };

  const commitSpeechSyncedCaption = () => {
    stopCaptionRevealTimer();
    const full = pendingAssistantTextRef.current.trim();
    pendingAssistantTextRef.current = "";
    pendingAssistantCompleteRef.current = false;
    captionStartedAtRef.current = 0;
    if (!full || full === lastCommittedAssistantRef.current) {
      setCurrentAssistantTranscript("");
      return;
    }
    lastCommittedAssistantRef.current = full;
    setTranscript((prev) => [
      ...prev,
      { role: "assistant", content: full, timestamp: new Date() },
    ]);
    setLastAIMessage(full);
    setCurrentAssistantTranscript("");
  };

  const beginSpeechSyncedCaption = () => {
    if (captionFinishTimerRef.current) {
      clearTimeout(captionFinishTimerRef.current);
      captionFinishTimerRef.current = null;
    }
    if (captionStartedAtRef.current === 0) {
      captionStartedAtRef.current = Date.now();
    }
    if (captionRevealTimerRef.current) return;
    captionRevealTimerRef.current = setInterval(() => {
      const full = pendingAssistantTextRef.current;
      if (!full) return;
      setCurrentAssistantTranscript(
        revealedAssistantText(full, Date.now() - captionStartedAtRef.current),
      );
    }, 80);
  };

  const scheduleFinishSpeechSyncedCaption = () => {
    if (captionFinishTimerRef.current) {
      clearTimeout(captionFinishTimerRef.current);
    }
    captionFinishTimerRef.current = setTimeout(() => {
      captionFinishTimerRef.current = null;
      if (isPlayingAudioRef.current) return;
      if (!pendingAssistantCompleteRef.current) return;
      commitSpeechSyncedCaption();
    }, SPEECH_CAPTION_FINISH_DEBOUNCE_MS);
  };

  const startClientWsHeartbeat = () => {
    stopClientWsHeartbeat();
    // 10s interval — well under any 30–60s proxy idle timeout.
    // Chrome throttles backgrounded-tab setInterval to ≥1s, so 10s is still fine.
    // Server responds with {type:"pong"} so traffic flows in both directions.
    clientWsHeartbeatRef.current = setInterval(() => {
      const ws = websocketRef.current;
      // Keepalive during prep (before Start) and mid-interview — some proxies idle-close
      // without traffic; do not gate on isInterviewActive for Gemini.
      if (
        ws?.readyState === WebSocket.OPEN &&
        usesUnifiedVoiceProtocol(voiceProviderRef.current)
      ) {
        try {
          ws.send(JSON.stringify({ type: "client_ping", t: Date.now() }));
        } catch {
          /* ignore */
        }
      }
    }, 10_000);
  };

  /** One random persona per page load; matches WebSocket voice query. */
  const interviewerPersonaRef = useRef<AIInterviewerPersona | null>(null);
  if (!interviewerPersonaRef.current) {
    interviewerPersonaRef.current =
      codingDiscussionHost && isCodingDiscussion
        ? AI_INTERVIEWER_PERSONAS[0]!
        : pickRandomPersona();
  }
  const interviewerPersona = interviewerPersonaRef.current;

  const notifyCodingDiscussionExit = useCallback(
    (event: CodingDiscussionHostEvent) => {
      if (codingDiscussionHost) {
        onCodingDiscussionHostNotify?.(event);
        return;
      }
      if (
        codingEmbed &&
        typeof globalThis.window !== "undefined" &&
        globalThis.window.parent !== globalThis.window
      ) {
        const typeMap: Record<
          CodingDiscussionHostEvent,
          | "itrix-coding-discussion-leave"
          | "itrix-coding-discussion-done"
          | "itrix-coding-discussion-close"
        > = {
          leave: "itrix-coding-discussion-leave",
          done: "itrix-coding-discussion-done",
          close: "itrix-coding-discussion-close",
        };
        globalThis.window.parent.postMessage(
          { type: typeMap[event], interviewId },
          globalThis.location.origin,
        );
      }
    },
    [
      codingDiscussionHost,
      codingEmbed,
      interviewId,
      onCodingDiscussionHostNotify,
    ],
  );

  /** When true (e.g. institute policy), denying screen capture may use blocking error UI. */
  const requireSessionRecording =
    interview?.metadata?.requireSessionRecording === true;

  useEffect(() => {
    codingEmbedAutostartStartedRef.current = false;
    openedRecordingAfterBriefingRef.current = false;
    setShowBriefing(false);
    setBriefingAccepted(false);
    setAcceptingBriefing(false);
    loadInterview();
    return () => {
      cleanup();
    };
  }, [interviewId]);

  // Setup media stream only after the main UI (including <video>) is mounted.
  // While `loading` is true we return early and there is no video ref — polling here used to race with
  // WebSocket errors that swap to the full-screen error layout (unmounts video) during getUserMedia.
  useEffect(() => {
    if (loading) return;
    // Full-screen error replaces main UI — no video node to attach; avoid infinite poll.
    if (error && !isInterviewActive && !connectionFailed) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setTimeout> | null = null;

    const checkVideoElement = () => {
      if (cancelled) return;
      if (mediaStreamRef.current) return;

      if (reuseMediaStreamRef) {
        const shared = reuseMediaStreamRef.current;
        if (shared) {
          mediaStreamRef.current = shared;
          mediaStreamOwnedRef.current = false;
          const v = shared.getVideoTracks()[0];
          const a = shared.getAudioTracks()[0];
          setIsCameraOn(v?.enabled ?? true);
          const micOn = a?.enabled ?? true;
          isMicOnRef.current = micOn;
          setIsMicOn(micOn);
          setVideoStreamActive(!!v && v.readyState === "live");
          return;
        }
        pollId = setTimeout(checkVideoElement, 100);
        return;
      }

      if (videoRef.current) {
        mediaStreamOwnedRef.current = true;
        void setupMediaStream();
      } else {
        pollId = setTimeout(checkVideoElement, 100);
      }
    };

    const timeoutId = setTimeout(checkVideoElement, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (pollId) clearTimeout(pollId);
    };
  }, [loading, error, isInterviewActive, connectionFailed, reuseMediaStreamRef]);

  useEffect(() => {
    showInterviewCompleteRef.current = showInterviewComplete;
  }, [showInterviewComplete]);

  useEffect(() => {
    if (!isInterviewActive || elapsedTime < maxDurationSec) return;
    // Server already completed or farewell still playing — do not cut mid-speech.
    if (
      pendingInterviewCompleteRef.current ||
      showInterviewComplete ||
      isAISpeaking
    ) {
      return;
    }
    endInterview();
  }, [elapsedTime, isInterviewActive, isAISpeaking, showInterviewComplete]);

  // Keep the ref in sync so onclose/setTimeout closures always see the current value.
  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInterviewActiveRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const existing = unstartedDraftDiscardTimers.get(interviewId);
    if (existing) {
      window.clearTimeout(existing);
      unstartedDraftDiscardTimers.delete(interviewId);
    }
    return () => {
      if (isCodingDiscussion || codingEmbed) return;
      const timer = window.setTimeout(() => {
        unstartedDraftDiscardTimers.delete(interviewId);
        if (!shouldDiscardUnstartedRef.current) return;
        void interviewApi.deleteDraftOrActive(interviewId).catch(() => {});
      }, 1500);
      unstartedDraftDiscardTimers.set(interviewId, timer);
    };
  }, [interviewId, isCodingDiscussion, codingEmbed]);

  const loadInterview = async () => {
    try {
      const data = await interviewApi.get(interviewId);
      setInterview(data);
      shouldDiscardUnstartedRef.current = data.status === "draft";
      const storedProvider = resolveVoiceProvider(
        data.metadata?.voiceProvider,
        ENV_VOICE_PROVIDER,
      );
      voiceProviderRef.current = storedProvider;
      setActiveVoiceProvider(storedProvider);
      if (shouldShowInterviewBriefing(data.status, isCodingDiscussion, codingEmbed)) {
        setShowBriefing(true);
        return;
      }
      await connectWebSocket(data);
    } catch (error: any) {
      console.error("Error loading interview:", error);
      setError("Failed to load interview. Please allow camera/mic access.");
    } finally {
      setLoading(false);
    }
  };

  const resumeInterview = async () => {
    // Cancel any pending auto-reconnect — this manual tap takes priority.
    if (autoReconnectTimerRef.current) {
      clearTimeout(autoReconnectTimerRef.current);
      autoReconnectTimerRef.current = null;
    }
    setIsResuming(true);
    isResumingRef.current = true;
    if (usesUnifiedVoiceProtocol(voiceProviderRef.current)) {
      geminiResumePayloadRef.current = {
        reconnectResume: true,
        elapsedTimeSec: elapsedTimeRef.current,
      };
    }
    isInterviewActiveRef.current = true;
    setIsInterviewActive(true);
    setIsPreparing(false);
    setIsReconnecting(true);
    setConnectionFailed(false);
    setError("");
    connectionInitiatedRef.current = false;
    // Explicitly close old WS so the server-side handler cleans up its Gemini
    // session rather than staying alive as a zombie pinging every 15s.
    const oldWs = websocketRef.current;
    websocketRef.current = null;
    try { oldWs?.close(1000, "manual_resume"); } catch { /* already closed */ }
    try {
      await connectWebSocket();
      setConnectionFailed(false);
      setError("");
    } catch (err: any) {
      geminiResumePayloadRef.current = null;
      setError(err.message || "Failed to reconnect.");
      setConnectionFailed(true);
      isResumingRef.current = false;
    } finally {
      setIsResuming(false);
    }
  };

  const closeFailedInterview = async () => {
    setIsClosingFailed(true);
    try {
      await interviewApi.closeAsFailed(interviewId);
      if (codingDiscussionHost) {
        notifyCodingDiscussionExit("close");
        return;
      }
      if (
        codingEmbed &&
        typeof globalThis.window !== "undefined" &&
        globalThis.window.parent !== globalThis.window
      ) {
        notifyCodingDiscussionExit("close");
        return;
      }
      if (interview?.metadata?.interviewKind === "coding_practice") {
        await invalidateAfterCodingSessionCompleteFromStorage();
      } else {
        await invalidateAfterAiInterviewSessionFromStorage();
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to close interview.");
    } finally {
      setIsClosingFailed(false);
    }
  };

  const setupMediaStream = async () => {
    // Check if video element exists first
    if (!videoRef.current) {
      console.warn("Video element not found yet, will retry...");
      // Retry after a short delay
      setTimeout(() => {
        if (videoRef.current) {
          setupMediaStream();
        } else {
          console.error("Video element still not found after retry");
          setError("Video element not found. Please refresh the page.");
        }
      }, 500);
      return;
    }

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "getUserMedia is not supported in this browser. Please use a modern browser.",
        );
      }

      // Check if we're on HTTPS (required for production)
      if (
        globalThis.location.protocol !== "https:" &&
        globalThis.location.hostname !== "localhost"
      ) {
        console.warn(
          "⚠️ Camera/microphone access requires HTTPS in production",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1,
        } as MediaTrackConstraints,
      });

      mediaStreamRef.current = stream;
      mediaStreamOwnedRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        try {
          await videoRef.current.play();
          setVideoStreamActive(true);

          videoRef.current.addEventListener("playing", () => {
            setVideoStreamActive(true);
          });
        } catch (playError: any) {
          console.error("Error playing video:", playError);
          setVideoStreamActive(false);
          // Try to get more specific error info
          if (playError.name === "NotAllowedError") {
            setError(
              "Video autoplay was blocked. Please interact with the page first.",
            );
          } else {
            setError(`Video playback error: ${playError.message}`);
          }
        }
      } else {
        console.error("Video element ref is null after getUserMedia (layout may have changed)");
        stream.getTracks().forEach((track) => track.stop());
        setError(
          (prev) =>
            prev || "Video element not found. Please refresh the page.",
        );
      }
    } catch (error: any) {
      console.error("Error accessing media devices:", error);

      // Provide specific error messages
      let errorMessage =
        "Please allow camera and microphone access to continue.";

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Camera and microphone access was denied. Please allow permissions and refresh the page.";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "No camera or microphone found. Please connect a camera and microphone.";
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        errorMessage =
          "Camera or microphone is already in use by another application.";
      } else if (
        error.name === "OverconstrainedError" ||
        error.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage =
          "Camera or microphone doesn't support the required settings.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    }
  };

  const cleanup = () => {
    stopClientWsHeartbeat();
    if (interviewCompleteRevealTimerRef.current) {
      clearTimeout(interviewCompleteRevealTimerRef.current);
      interviewCompleteRevealTimerRef.current = null;
    }
    if (interviewCompleteAutoCloseRef.current) {
      clearTimeout(interviewCompleteAutoCloseRef.current);
      interviewCompleteAutoCloseRef.current = null;
    }
    if (interviewCompleteCountdownRef.current) {
      clearInterval(interviewCompleteCountdownRef.current);
      interviewCompleteCountdownRef.current = null;
    }
    if (autoReconnectTimerRef.current) {
      clearTimeout(autoReconnectTimerRef.current);
      autoReconnectTimerRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (voiceTransportRef.current) {
      voiceTransportRef.current.disconnect();
      voiceTransportRef.current = null;
    } else if (websocketRef.current) {
      websocketRef.current.close();
    }
    websocketRef.current = null;
    if (visibilityResumeHandlerRef.current) {
      document.removeEventListener(
        "visibilitychange",
        visibilityResumeHandlerRef.current,
      );
      visibilityResumeHandlerRef.current = null;
    }
    if (audioProcessorRef.current) audioProcessorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();

    // Stop recording if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping recorder during cleanup:", error);
      }
    }
    // Stop screen capture stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Clean up AI audio destination
    if (aiAudioDestinationRef.current) {
      aiAudioDestinationRef.current.disconnect();
      aiAudioDestinationRef.current = null;
    }
    if (mediaStreamOwnedRef.current && mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    mediaStreamRef.current = null;
    mediaStreamOwnedRef.current = true;
    stopAiPlayback();
    recordedChunksRef.current = [];
    isPlayingAudioRef.current = false;
    isInterviewActiveRef.current = false;
    connectionInitiatedRef.current = false; // Reset for next connection
  };

  const isAiAudioStillPlaying = () => {
    const ctx = audioContextRef.current;
    if (ctx && nextPlayAtRef.current > ctx.currentTime + 0.05) return true;
    if (audioBufferRef.current.length > 0) return true;
    return isPlayingAudioRef.current;
  };

  const clearInterviewCompleteRevealTimer = () => {
    if (interviewCompleteRevealTimerRef.current) {
      clearTimeout(interviewCompleteRevealTimerRef.current);
      interviewCompleteRevealTimerRef.current = null;
    }
  };

  const openInterviewCompleteDialog = () => {
    if (showInterviewCompleteRef.current) return;
    pendingInterviewCompleteRef.current = false;
    showInterviewCompleteRef.current = true;
    clearInterviewCompleteRevealTimer();
    setShowInterviewComplete(true);
    setInterviewCompleteCountdown(15);
    if (interviewCompleteAutoCloseRef.current) {
      clearTimeout(interviewCompleteAutoCloseRef.current);
    }
    if (interviewCompleteCountdownRef.current) {
      clearInterval(interviewCompleteCountdownRef.current);
    }
    interviewCompleteCountdownRef.current = setInterval(() => {
      setInterviewCompleteCountdown((prev) => {
        if (prev <= 1) {
          if (interviewCompleteCountdownRef.current) {
            clearInterval(interviewCompleteCountdownRef.current);
            interviewCompleteCountdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    interviewCompleteAutoCloseRef.current = setTimeout(() => {
      if (interviewCompleteCountdownRef.current) {
        clearInterval(interviewCompleteCountdownRef.current);
        interviewCompleteCountdownRef.current = null;
      }
      interviewCompleteAutoCloseRef.current = null;
      setShowInterviewComplete(false);
      showInterviewCompleteRef.current = false;
      endInterview();
    }, 15000);
  };

  const revealInterviewCompleteIfReady = () => {
    if (!pendingInterviewCompleteRef.current) return;
    if (showInterviewCompleteRef.current) return;
    if (isAiAudioStillPlaying()) {
      const ctx = audioContextRef.current;
      const remainingMs = ctx
        ? Math.max(80, (nextPlayAtRef.current - ctx.currentTime) * 1000 + 80)
        : 200;
      clearInterviewCompleteRevealTimer();
      interviewCompleteRevealTimerRef.current = setTimeout(() => {
        interviewCompleteRevealTimerRef.current = null;
        revealInterviewCompleteIfReady();
      }, remainingMs);
      return;
    }
    openInterviewCompleteDialog();
  };

  const connectWebSocket = async (interviewForWs?: Interview | null) => {
    // Prevent duplicate connections (React Strict Mode can cause double mounting)
    if (connectionInitiatedRef.current) {
      console.warn(
        "⚠️ WebSocket connection already initiated, skipping duplicate",
      );
      return;
    }

    try {
      console.log("🔌 Initiating WebSocket connection");
      connectionInitiatedRef.current = true;

      const userId = localStorage.getItem("clerk-user-id");
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get API URL from environment (e.g., https://interview-core-production.up.railway.app/api)
      // Remove /api suffix and protocol to build WebSocket URL
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
      const baseUrl = apiUrl.replace(/\/api$/, "").replace(/^https?:\/\//, "");

      // Use wss:// for HTTPS sites, ws:// for HTTP (localhost)
      const wsProtocol =
        globalThis.location.protocol === "https:" ? "wss:" : "ws:";
      const ivResolved = interviewForWs ?? interview;
      const provider = resolveVoiceProvider(
        ivResolved?.metadata?.voiceProvider,
        voiceProviderRef.current,
      );
      voiceProviderRef.current = provider;
      const realtimePath = buildRealtimeWsPath(interviewId, provider);
      const durationParam = isCodingDiscussion
        ? (ivResolved?.metadata?.discussionDurationMinutes ?? 60)
        : normalizeInterviewDurationMinutes(
            ivResolved?.metadata?.interviewDuration,
          );
      const sessionPhaseQs = isCodingDiscussion
        ? "&sessionPhase=coding_discussion"
        : "";
      const p = interviewerPersonaRef.current!;
      const voiceQuery = buildVoiceQueryParam(provider, p);
      const personaQuery = `&interviewerName=${encodeURIComponent(p.displayName)}&interviewerTitle=${encodeURIComponent(p.title)}`;
      const wsUrl = `${wsProtocol}//${baseUrl}/api/${realtimePath}?userId=${encodeURIComponent(userId)}&interviewDurationMinutes=${durationParam}${sessionPhaseQs}${voiceQuery}${personaQuery}`;

      console.log("🔌 Connecting to WebSocket:", wsUrl);
      const transport = createVoiceTransport((data) => {
        try {
          if (data.type === "preparing") {
            console.log("⏳ Preparing interview...");
            const resuming =
              isResumingRef.current || elapsedTimeRef.current > 5;
            setLastAIMessage(
              resuming
                ? "Reconnecting AI session..."
                : (typeof data.message === "string" ? data.message : undefined) ||
                  "Preparing your interview...",
            );
            if (resuming) {
              setIsPreparing(false);
              setIsReconnecting(true);
            }
          } else if (data.type === "reconnecting") {
            setIsAIProcessing(true);
            setIsAISpeaking(false);
            setLastAIMessage("Reconnecting AI session...");
            setIsReconnecting(true);
            setReconnectAttemptCount((prev) => prev + 1);
          } else if (data.type === "reconnected") {
            setIsAIProcessing(false);
            setIsPreparing(false);
            setLastAIMessage("AI session resumed. Continue when you're ready.");
            setIsReconnecting(false);
            setConnectionFailed(false);
            setError("");
            setReconnectAttemptCount(0);
            autoReconnectAttemptsRef.current = 0;
            setConnected(true);
          } else if (data.type === "connected") {
            if (
              data.provider === "gemini" ||
              data.provider === "chatgpt" ||
              data.provider === "sarvam"
            ) {
              voiceProviderRef.current = data.provider;
              setActiveVoiceProvider(data.provider);
            }
            setConnected(true);
            setError("");
            if (isResumingRef.current || elapsedTimeRef.current > 5) {
              setIsPreparing(false);
            }
            autoReconnectAttemptsRef.current = 0;
          } else if (data.type === "openai_event") {
            handleOpenAIEvent(data.event);
          } else if (data.type === "audio_response") {
            handleGeminiAudioResponse(
              String(data.audioData ?? ""),
              typeof data.mimeType === "string" ? data.mimeType : undefined,
            );
            setIsAISpeaking(true);
            setIsAIProcessing(false);
            setIsPreparing(false);
            if (shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current)) {
              beginSpeechSyncedCaption();
            }
            if (!timerStartedRef.current && isInterviewActiveRef.current) {
              timerStartedRef.current = true;
              timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
              }, 1000);
            }
          } else if (data.type === "text_response") {
            if (data.text) {
              const text = String(data.text);
              const isComplete =
                data.finished === true || data.isPartial === false;
              console.log(
                `🤖 AI transcript: "${text.substring(0, 50)}..." (finished: ${isComplete})`,
              );
              if (!timerStartedRef.current && isInterviewActiveRef.current) {
                timerStartedRef.current = true;
                timerRef.current = setInterval(() => {
                  setElapsedTime((prev) => prev + 1);
                }, 1000);
              }
              if (
                shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current)
              ) {
                pendingAssistantTextRef.current = text;
                pendingAssistantCompleteRef.current = isComplete;
                if (isPlayingAudioRef.current) {
                  beginSpeechSyncedCaption();
                }
              } else if (isComplete) {
                setIsPreparing(false);
                setIsAIProcessing(false);
                setTranscript((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: text,
                    timestamp: new Date(),
                  },
                ]);
                setLastAIMessage(text);
                setCurrentAssistantTranscript("");
              } else {
                setIsPreparing(false);
                setIsAIProcessing(false);
                setCurrentAssistantTranscript(text);
              }
            }
          } else if (data.type === "interview_complete") {
            pendingInterviewCompleteRef.current = true;
            revealInterviewCompleteIfReady();
          } else if (data.type === "session_ended") {
            // Server's Gemini session has fully closed (normal or manual end).
            stopAiPlayback();
            setIsAISpeaking(false);
            setIsAIProcessing(false);
            setIsReconnecting(false);
          } else if (data.type === "confirm_end_interview") {
            setShowConfirmEndInterview(true);
          } else if (data.type === "turn_complete") {
            // Generation finished. Do not abort playback — resetting
            // isPlayingAudioRef here starts a second stream on the next chunk
            // and sounds like digital noise between sentences.
            setIsAIProcessing(false);
            const ctx = audioContextRef.current;
            const stillPlaying = ctx
              ? nextPlayAtRef.current > ctx.currentTime + 0.05
              : isPlayingAudioRef.current;
            if (
              shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current)
            ) {
              if (!stillPlaying && audioBufferRef.current.length === 0) {
                setIsAISpeaking(false);
              }
              scheduleFinishSpeechSyncedCaption();
            } else {
              setCurrentAssistantTranscript("");
              if (!stillPlaying && audioBufferRef.current.length === 0) {
                setIsAISpeaking(false);
              }
            }
            if (!stillPlaying) {
              revealInterviewCompleteIfReady();
            }
          } else if (data.type === "user_transcript") {
            /* processed server-side */
          } else if (data.type === "interrupted") {
            stopAiPlayback();
            setIsAISpeaking(false);
            setIsAIProcessing(false);
            if (
              shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current) &&
              captionStartedAtRef.current > 0 &&
              pendingAssistantTextRef.current
            ) {
              commitSpeechSyncedCaption();
            } else {
              resetSpeechSyncedCaption();
            }
          } else if (data.type === "ai_processing") {
            setIsAIProcessing(true);
            setIsAISpeaking(false);
            setLastAIMessage("AI is understanding your answer...");
          } else if (data.type === "error") {
            const errMsg =
              typeof data.message === "string"
                ? data.message
                : JSON.stringify(data.message);
            const diag = data.diagnostic;
            console.error("[WS] Server error message:", errMsg, "diagnostic:", diag);
            if (diag != null) {
              console.info(
                "[WS] Server error diagnostic (for Railway/debug):",
                JSON.stringify(diag),
              );
            }
            setError(errMsg || "Something went wrong at server side.");
            setIsReconnecting(false);
            setIsPreparing(false);
            if (isInterviewActiveRef.current) setConnectionFailed(true);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });
      voiceTransportRef.current = transport;

      const ws = await transport.connectControl({
        controlUrl: wsUrl,
        interviewId,
        userId,
      });
      websocketRef.current = ws;

      // Wait for backend "connected" once upstream AI session is ready (Gemini + ChatGPT).
      if (usesUnifiedVoiceProtocol(voiceProviderRef.current)) {
        startClientWsHeartbeat();
      }
      if (isResumingRef.current && isInterviewActiveRef.current) {
        if (usesUnifiedVoiceProtocol(voiceProviderRef.current)) {
          const resumeExtra = geminiResumePayloadRef.current;
          geminiResumePayloadRef.current = null;
          transport.sendControl({
            type: "start_interview",
            interviewDurationMinutes: isCodingDiscussion
              ? (interview?.metadata?.discussionDurationMinutes ?? 60)
              : normalizeInterviewDurationMinutes(
                  interview?.metadata?.interviewDuration,
                ),
            ...(resumeExtra
              ? {
                  reconnectResume: resumeExtra.reconnectResume,
                  elapsedTimeSec: resumeExtra.elapsedTimeSec,
                }
              : {}),
          });
        } else {
          transport.sendControl({ type: "response.create" });
        }
        isResumingRef.current = false;
      }

      ws.onerror = () => {
        console.error("[WS] onerror fired – interview active:", isInterviewActiveRef.current);
        // Reset so a future connectWebSocket() call isn't blocked.
        connectionInitiatedRef.current = false;
        if (isInterviewActiveRef.current) {
          // Treat as a benign transient drop — onclose fires right after onerror
          // and handles auto-reconnect silently. No user-visible message here.
          // If Gemini is truly broken the server sends type:"error" before closing,
          // which correctly sets connectionFailed and shows the popup.
        } else {
          setError("Connection error. Please try again.");
        }
      };

      ws.onclose = (event) => {
        stopClientWsHeartbeat();
        console.error("[WS] onclose – code:", event.code, "reason:", event.reason, "clean:", event.wasClean);
        setConnected(false);
        setIsReconnecting(false);
        // Always reset so a future reconnect attempt can proceed.
        connectionInitiatedRef.current = false;
        voiceTransportRef.current = null;
        websocketRef.current = null;
        // Benign codes: proxy / going away / no status / abnormal (1006) — auto-reconnect.
        const code = event.code;
        const treatAsBenign =
          BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES.has(code) || code === 0;
        if (isInterviewActiveRef.current) {
          if (treatAsBenign) {
            // Auto-reconnect silently — no user-visible message during the gap.
            if (autoReconnectTimerRef.current) {
              clearTimeout(autoReconnectTimerRef.current);
            }
            const attempt = autoReconnectAttemptsRef.current + 1;
            if (attempt > MAX_AUTO_RECONNECT_ATTEMPTS) {
              setIsPreparing(false);
              setLastAIMessage(
                "Connection paused — tap Resume interview to reconnect without losing progress.",
              );
              setConnectionFailed(true);
              return;
            }
            autoReconnectAttemptsRef.current = attempt;
            const delayMs = 2000 * attempt;
            autoReconnectTimerRef.current = setTimeout(() => {
              autoReconnectTimerRef.current = null;
              // Only attempt if still active and not already reconnecting.
              if (!isInterviewActiveRef.current || connectionInitiatedRef.current) return;
              console.log("[WS] Auto-reconnecting after benign close (code:", code, ", attempt:", attempt, ")");
              isResumingRef.current = true;
              setIsPreparing(false);
              setIsReconnecting(true);
              if (usesUnifiedVoiceProtocol(voiceProviderRef.current)) {
                // Use the ref (not the state closure) so the value reflects the
                // elapsed time at reconnect time, not at the time onclose fired.
                geminiResumePayloadRef.current = {
                  reconnectResume: true,
                  elapsedTimeSec: elapsedTimeRef.current,
                };
              }
              connectWebSocket().catch((err) => {
                console.error("[WS] Auto-reconnect failed:", err);
                geminiResumePayloadRef.current = null;
                isResumingRef.current = false;
                if (autoReconnectAttemptsRef.current < MAX_AUTO_RECONNECT_ATTEMPTS) {
                  ws.onclose?.(event);
                  return;
                }
                setIsPreparing(false);
                setLastAIMessage(
                  "Connection paused — tap Resume interview to reconnect without losing progress.",
                );
                setConnectionFailed(true);
              });
            }, delayMs);
          } else {
            setConnectionFailed(true);
            setError("Something went wrong at server side.");
          }
        }
      };
    } catch (error: any) {
      console.error("Error connecting WebSocket:", error);
      setError(error.message || "Failed to connect to interview service.");
    }
  };

  const handleAcceptAndStart = async () => {
    if (acceptingBriefing || launchingInterviewRef.current) return;
    setAcceptingBriefing(true);
    setBriefingAccepted(true);
    try {
      await connectWebSocket(interview);
      if (!websocketRef.current) {
        setBriefingAccepted(false);
        setAcceptingBriefing(false);
      }
    } catch (err: any) {
      setBriefingAccepted(false);
      setAcceptingBriefing(false);
      setError(err.message || "Failed to connect to interview service.");
    }
  };

  useEffect(() => {
    if (!briefingAccepted || !connected || isInterviewActive) return;
    if (openedRecordingAfterBriefingRef.current) return;
    openedRecordingAfterBriefingRef.current = true;
    setShowBriefing(false);
    setAcceptingBriefing(false);
    setShowRecordingOptIn(true);
  }, [briefingAccepted, connected, isInterviewActive]);

  const markPlaybackIdleIfDrained = () => {
    const ctx = audioContextRef.current;
    const stillScheduled = ctx
      ? nextPlayAtRef.current > ctx.currentTime + 0.03
      : false;
    if (
      playbackSourcesRef.current.length === 0 &&
      audioBufferRef.current.length === 0 &&
      !stillScheduled
    ) {
      isPlayingAudioRef.current = false;
      setIsAISpeaking(false);
      if (shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current)) {
        scheduleFinishSpeechSyncedCaption();
      }
      revealInterviewCompleteIfReady();
    }
  };

  /** Schedule PCM on the audio clock so chunk boundaries do not click. */
  const schedulePcmPlayback = (pcm16: Int16Array) => {
    const ctx = audioContextRef.current;
    if (!ctx || pcm16.length === 0) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i]! / 32768;
    }
    const audioBuffer = ctx.createBuffer(1, float32.length, GEMINI_PLAYBACK_RATE);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    if (aiAudioDestinationRef.current) {
      source.connect(aiAudioDestinationRef.current);
    }

    const startAt = Math.max(ctx.currentTime, nextPlayAtRef.current);
    nextPlayAtRef.current = startAt + audioBuffer.duration;
    isPlayingAudioRef.current = true;
    if (shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current)) {
      beginSpeechSyncedCaption();
    }
    playbackSourcesRef.current.push(source);
    source.onended = () => {
      playbackSourcesRef.current = playbackSourcesRef.current.filter(
        (s) => s !== source,
      );
      markPlaybackIdleIfDrained();
    };
    source.start(startAt);
  };

  const flushPlaybackBatch = () => {
    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }
    if (audioBufferRef.current.length === 0) return;

    const totalLength = audioBufferRef.current.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    const combined = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of audioBufferRef.current) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    audioBufferRef.current = [];

    if (isLikelyStaticPcm(combined)) {
      console.warn(
        `[audio] skipped static/thought PCM chunk (${combined.length} samples)`,
      );
      return;
    }
    pushPlaybackSamples(combined, playbackSourceRateRef.current);
  };

  const pushPlaybackSamples = (pcm16: Int16Array, sourceRate: number) => {
    const ctx = audioContextRef.current;
    if (!ctx || pcm16.length === 0) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const node = playbackNodeRef.current;
    if (!node) {
      if (playbackWorkletFailedRef.current) {
        schedulePcmPlayback(pcm16);
      } else {
        pendingPlaybackRef.current.push(pcm16);
      }
      return;
    }
    const samples = resamplePcm16ToFloat32(pcm16, sourceRate, ctx.sampleRate);
    node.port.postMessage({ type: "push", samples }, [samples.buffer]);
    isPlayingAudioRef.current = true;
    setIsAISpeaking(true);
  };

  const enqueuePcm16 = (pcm16: Int16Array) => {
    if (pcm16.length === 0) return;
    if (isLikelyStaticPcm(pcm16)) {
      console.warn(
        `[audio] skipped static/thought PCM chunk (${pcm16.length} samples)`,
      );
      return;
    }
    audioBufferRef.current.push(pcm16);
    const buffered = audioBufferRef.current.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    if (buffered >= PLAYBACK_BATCH_SAMPLES) {
      flushPlaybackBatch();
      return;
    }
    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
    }
    audioBufferTimerRef.current = setTimeout(
      flushPlaybackBatch,
      PLAYBACK_BATCH_IDLE_MS,
    );
  };

  const handleGeminiAudioResponse = (base64Audio: string, mimeType?: string) => {
    if (!base64Audio) return;
    try {
      const pcm16 = decodeBase64Pcm16(base64Audio);
      if (!pcm16) return;
      playbackSourceRateRef.current = pcmRateFromMime(mimeType);
      if (isLikelyStaticPcm(pcm16)) {
        console.warn(
          `[audio] skipped static/thought PCM chunk (${pcm16.length} samples)`,
        );
        return;
      }
      pushPlaybackSamples(pcm16, playbackSourceRateRef.current);
    } catch (err) {
      console.error("Error queueing Gemini audio:", err);
    }
  };

  const handleOpenAIEvent = (event: any) => {
    switch (event.type) {
      case "conversation.item.input_audio_transcription.completed":
        // Intentionally hidden in live UI. Stored and processed server-side.
        break;

      case "input_audio_buffer.speech_started":
        // User started speaking - stop AI audio immediately
        stopAiPlayback();
        // Stop any currently playing audio
        if (audioContextRef.current) {
          audioContextRef.current.suspend();
          setTimeout(() => {
            if (audioContextRef.current?.state === "suspended") {
              audioContextRef.current.resume();
            }
          }, 100);
        }
        break;

      case "input_audio_buffer.speech_stopped":
        // User stopped speaking
        break;

      case "response.created":
        // New response starting - clear current transcript and audio queue
        setCurrentAssistantTranscript(""); // Clear to start fresh
        stopAiPlayback();
        break;

      case "response.cancelled":
        // Response was cancelled (due to interruption)
        stopAiPlayback();
        setCurrentAssistantTranscript("");
        break;

      case "response.audio_transcript.delta":
        if (event.delta) {
          setIsPreparing(false);
          if (!timerStartedRef.current && isInterviewActiveRef.current) {
            timerStartedRef.current = true;
            timerRef.current = setInterval(() => {
              setElapsedTime((prev) => prev + 1);
            }, 1000);
          }
          setCurrentAssistantTranscript((prev) => prev + event.delta);
        }
        break;

      case "response.audio_transcript.done":
        if (event.transcript) {
          setTranscript((prev) => [
            ...prev,
            {
              role: "assistant",
              content: event.transcript,
              timestamp: new Date(),
            },
          ]);
          // Save to lastAIMessage so it stays visible until next message
          setLastAIMessage(event.transcript);
          setCurrentAssistantTranscript("");
        }
        break;

      case "response.audio.done":
        // AI finished speaking
        break;

      case "response.audio.delta":
        // Queue AI audio for sequential playback
        if (event.delta) {
          setIsPreparing(false);
          if (!timerStartedRef.current && isInterviewActiveRef.current) {
            timerStartedRef.current = true;
            timerRef.current = setInterval(() => {
              setElapsedTime((prev) => prev + 1);
            }, 1000);
          }
          try {
            const pcm16 = decodeBase64Pcm16(event.delta);
            if (pcm16) enqueuePcm16(pcm16);
          } catch (error) {
            console.error("Error queueing AI audio:", error);
          }
        }
        break;

      case "response.done":
        // Response complete
        break;

      default:
      // Silently ignore unhandled events
    }
  };

  const setupAudioCapture = () => {
    if (!mediaStreamRef.current) {
      console.error("No media stream available for audio capture");
      return;
    }

    const TARGET_SAMPLE_RATE = 24000;
    /**
     * Google Live API: stream mic PCM in ~20–40ms frames (not per–render-quantum);
     * tiny chunks (~3ms) overload sendRealtimeInput and correlate with unstable WSS.
     * @see https://ai.google.dev/gemini-api/docs/live-api/best-practices#streaming
     */
    const GEMINI_MIC_FRAME_SAMPLES_24K = 720; // ~30ms at 24 kHz

    const pcm16ToBase64 = (pcm16: Int16Array) => {
      const bytes = new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const sendAudioChunk = (base64Audio: string) => {
      // Use isMicOnRef (not state) to avoid stale closure — state captured at
      // setup time never updates when the user toggles mute after setup.
      if (
        !isInterviewActiveRef.current ||
        !isMicOnRef.current ||
        !websocketRef.current ||
        websocketRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }
      const usesUnifiedProtocol = usesUnifiedVoiceProtocol(
        voiceProviderRef.current,
      );
      websocketRef.current.send(
        JSON.stringify(
          usesUnifiedProtocol
            ? { type: "audio", audioData: base64Audio }
            : { type: "audio_chunk", audio: base64Audio },
        ),
      );
    };

    const setupWithScriptProcessor = (
      audioContext: AudioContext,
      output: GainNode,
    ) => {
      const browserSampleRate = audioContext.sampleRate;
      const resampleRatio = TARGET_SAMPLE_RATE / browserSampleRate;
      console.log(`🎵 ScriptProcessor fallback: ${browserSampleRate}Hz → ${TARGET_SAMPLE_RATE}Hz`);

      const source = audioContext.createMediaStreamSource(mediaStreamRef.current!);
      // 1024 samples @ 48kHz = ~21ms → resampled to ~21ms @ 24kHz. We accumulate
      // these into ~30ms frames (GEMINI_MIC_FRAME_SAMPLES_24K) before sending so the
      // fallback matches the AudioWorklet path and Google's 20–40ms guidance —
      // unbatched sub-frame sends correlate with unstable WSS / 1007.
      const processor = audioContext.createScriptProcessor(1024, 1, 1);

      const pendingMicSamples: number[] = [];
      processor.onaudioprocess = (e) => {
        if (!isInterviewActiveRef.current || !isMicOnRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        let resampled = inputData;
        if (browserSampleRate !== TARGET_SAMPLE_RATE) {
          const len = Math.floor(inputData.length * resampleRatio);
          resampled = new Float32Array(len);
          for (let i = 0; i < len; i++) {
            const src = i / resampleRatio;
            const i0 = Math.floor(src);
            const i1 = Math.min(i0 + 1, inputData.length - 1);
            resampled[i] = inputData[i0] * (1 - (src - i0)) + inputData[i1] * (src - i0);
          }
        }
        for (let i = 0; i < resampled.length; i++) {
          const s = Math.max(-1, Math.min(1, resampled[i]));
          pendingMicSamples.push(s < 0 ? s * 0x8000 : s * 0x7fff);
        }
        while (pendingMicSamples.length >= GEMINI_MIC_FRAME_SAMPLES_24K) {
          const frame = new Int16Array(GEMINI_MIC_FRAME_SAMPLES_24K);
          for (let i = 0; i < GEMINI_MIC_FRAME_SAMPLES_24K; i++) {
            frame[i] = pendingMicSamples[i]!;
          }
          pendingMicSamples.splice(0, GEMINI_MIC_FRAME_SAMPLES_24K);
          sendAudioChunk(pcm16ToBase64(frame));
        }
      };

      source.connect(processor);
      processor.connect(output);
      audioProcessorRef.current = processor;
    };

    try {
      const audioContext = new (
        globalThis.AudioContext || (globalThis as any).webkitAudioContext
      )();
      audioContextRef.current = audioContext;
      console.log(`🎵 AudioContext ready: ${audioContext.sampleRate}Hz → ${TARGET_SAMPLE_RATE}Hz`);
      if (audioContext.audioWorklet) {
        audioContext.audioWorklet
          .addModule("/pcm-playback.worklet.js")
          .then(() => {
            if (playbackNodeRef.current) {
              try {
                playbackNodeRef.current.disconnect();
              } catch {
                /* ignore */
              }
            }
            const node = new AudioWorkletNode(audioContext, "pcm-playback");
            node.port.onmessage = (event) => {
              if (event.data?.type === "drained") {
                isPlayingAudioRef.current = false;
                setIsAISpeaking(false);
                if (
                  shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current)
                ) {
                  scheduleFinishSpeechSyncedCaption();
                }
                revealInterviewCompleteIfReady();
              }
            };
            node.connect(audioContext.destination);
            if (aiAudioDestinationRef.current) {
              node.connect(aiAudioDestinationRef.current);
            }
            playbackNodeRef.current = node;
            console.log("🔊 PCM playback worklet ready");
            const pending = pendingPlaybackRef.current;
            pendingPlaybackRef.current = [];
            for (const pcm of pending) {
              const samples = resamplePcm16ToFloat32(
                pcm,
                playbackSourceRateRef.current,
                audioContext.sampleRate,
              );
              node.port.postMessage({ type: "push", samples }, [samples.buffer]);
              isPlayingAudioRef.current = true;
              setIsAISpeaking(true);
              if (
                shouldHoldAssistantCaptionUntilAudio(voiceProviderRef.current)
              ) {
                beginSpeechSyncedCaption();
              }
            }
          })
          .catch((err) => {
            playbackWorkletFailedRef.current = true;
            console.warn("PCM playback worklet failed, using BufferSource:", err);
            const pending = pendingPlaybackRef.current;
            pendingPlaybackRef.current = [];
            for (const pcm of pending) {
              schedulePcmPlayback(pcm);
            }
          });
      }

      // Keep the audio graph alive without routing mic input to speakers.
      const silentOutput = audioContext.createGain();
      silentOutput.gain.value = 0;
      silentOutput.connect(audioContext.destination);

      // Chrome auto-suspends AudioContext when there's no audio OUTPUT (e.g. after
      // the AI greeting finishes playing). When suspended, the AudioWorklet and
      // ScriptProcessorNode stop firing entirely — mic audio is silently dropped.
      // Resume immediately whenever the context suspends to keep capture running.
      audioContext.onstatechange = () => {
        console.log(`🎵 AudioContext state: ${audioContext.state}`);
        if (audioContext.state === "suspended") {
          audioContext.resume().catch((err) =>
            console.warn("AudioContext resume failed:", err)
          );
        }
      };

      // Backgrounding a tab suspends the AudioContext and silences the mic. When
      // the tab is shown again, force a resume so capture reliably restarts. The
      // upstream stays alive during the gap via the backend silence keepalive, so
      // the interview is not aborted while the user is away.
      if (visibilityResumeHandlerRef.current) {
        document.removeEventListener(
          "visibilitychange",
          visibilityResumeHandlerRef.current,
        );
      }
      const onVisibility = () => {
        if (
          document.visibilityState === "visible" &&
          audioContextRef.current &&
          audioContextRef.current.state === "suspended"
        ) {
          audioContextRef.current
            .resume()
            .catch((err) =>
              console.warn("AudioContext resume on focus failed:", err),
            );
        }
      };
      visibilityResumeHandlerRef.current = onVisibility;
      document.addEventListener("visibilitychange", onVisibility);

      // Try AudioWorklet first; fall back to deprecated ScriptProcessorNode
      if (audioContext.audioWorklet) {
        audioContext.audioWorklet
          .addModule("/mic-processor.worklet.js")
          .then(() => {
            const source = audioContext.createMediaStreamSource(mediaStreamRef.current!);
            const workletNode = new AudioWorkletNode(audioContext, "mic-processor", {
              processorOptions: { targetSampleRate: TARGET_SAMPLE_RATE },
            });

            let chunkCount = 0;
            const pendingMicSamples: number[] = [];
            workletNode.port.onmessage = (event) => {
              if (event.data.type === "audio_chunk") {
                chunkCount++;
                if (chunkCount % 50 === 0) {
                  console.log(`🎤 AudioWorklet: ${chunkCount} chunks sent`);
                }
                const chunk = new Int16Array(event.data.pcm16 as ArrayBuffer);
                for (let i = 0; i < chunk.length; i++) {
                  pendingMicSamples.push(chunk[i]);
                }
                while (pendingMicSamples.length >= GEMINI_MIC_FRAME_SAMPLES_24K) {
                  const frame = new Int16Array(GEMINI_MIC_FRAME_SAMPLES_24K);
                  for (let i = 0; i < GEMINI_MIC_FRAME_SAMPLES_24K; i++) {
                    frame[i] = pendingMicSamples[i]!;
                  }
                  pendingMicSamples.splice(0, GEMINI_MIC_FRAME_SAMPLES_24K);
                  sendAudioChunk(pcm16ToBase64(frame));
                }
              }
            };

            source.connect(workletNode);
            workletNode.connect(silentOutput);
            // Store as ref so cleanup can disconnect it
            (audioProcessorRef as any).current = workletNode;
            console.log("🎤 Using AudioWorklet for mic capture");
          })
          .catch((err) => {
            console.warn("AudioWorklet failed, falling back to ScriptProcessor:", err);
            setupWithScriptProcessor(audioContext, silentOutput);
          });
      } else {
        // Browser doesn't support AudioWorklet (e.g. old Safari)
        setupWithScriptProcessor(audioContext, silentOutput);
      }
    } catch (error) {
      console.error("Error setting up audio capture:", error);
    }
  };

  const startInterview = async () => {
    try {
      if (
        !websocketRef.current ||
        websocketRef.current.readyState !== WebSocket.OPEN
      ) {
        setError("WebSocket not connected. Please refresh and try again.");
        return;
      }

      // Start interview on backend (skip for coding discussion — coding phase already ran)
      if (!isCodingDiscussion) {
        await interviewApi.start(interviewId);
      }
      shouldDiscardUnstartedRef.current = false;

      // Set interview as active BEFORE setting up audio capture
      setIsInterviewActive(true);
      isInterviewActiveRef.current = true;
      setIsPreparing(true); // Show preparing state until AI speaks
      setElapsedTime(0);
      // Match server wall clock (start_interview_after_greeting): count from Start click so
      // on-screen minutes align with TIME IS UP / configured 15 or 30 min slot.
      timerStartedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Explicitly start Gemini/Sarvam interview only after user click
      if (usesUnifiedVoiceProtocol(voiceProviderRef.current) && websocketRef.current) {
        const alreadyActive = interview?.status === "active";
        const resumeExtra = alreadyActive
          ? {
              reconnectResume: true,
              elapsedTimeSec: elapsedTimeRef.current,
            }
          : geminiResumePayloadRef.current;
        geminiResumePayloadRef.current = null;
        if (alreadyActive) {
          setIsPreparing(false);
        }
        websocketRef.current.send(
          JSON.stringify({
            type: "start_interview",
            interviewDurationMinutes: isCodingDiscussion
              ? (interview?.metadata?.discussionDurationMinutes ?? 60)
              : normalizeInterviewDurationMinutes(
                  interview?.metadata?.interviewDuration,
                ),
            ...(resumeExtra
              ? {
                  reconnectResume: resumeExtra.reconnectResume,
                  elapsedTimeSec: resumeExtra.elapsedTimeSec,
                }
              : {}),
          }),
        );
      }

      // Setup audio capture (must be after setIsInterviewActive)
      setupAudioCapture();

      // Timer starts when AI is ready (first audio_response or text_response)

      // Request first response only for ChatGPT path
      setTimeout(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          if (!usesUnifiedVoiceProtocol(voiceProviderRef.current)) {
            websocketRef.current.send(
              JSON.stringify({ type: "response.create" }),
            );
          }
        }
      }, 1000);
    } catch (error: any) {
      console.error("Error starting interview:", error);
      setError(error.message || "Failed to start interview.");
    }
  };

  startInterviewLatestRef.current = startInterview;

  /** Parent "Start Discussion" is the user gesture; auto-begin voice when WS + mic are ready. */
  useEffect(() => {
    if (!codingEmbed || !isCodingDiscussion) return;
    if (!connected) return;
    if (isInterviewActive) return;
    if (codingEmbedAutostartStartedRef.current) return;

    let cancelled = false;

    void (async () => {
      setEmbedAutostartPending(true);
      try {
        for (let i = 0; i < 80 && !cancelled; i++) {
          if (
            mediaStreamRef.current &&
            websocketRef.current?.readyState === WebSocket.OPEN
          ) {
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        if (cancelled) return;
        if (
          !mediaStreamRef.current ||
          websocketRef.current?.readyState !== WebSocket.OPEN
        ) {
          console.warn("Coding embed autostart: mic or WebSocket not ready");
          return;
        }
        if (isInterviewActiveRef.current) return;
        if (codingEmbedAutostartStartedRef.current) return;
        codingEmbedAutostartStartedRef.current = true;

        launchingInterviewRef.current = true;
        try {
          try {
            sessionStorage.setItem(
              `${RECORDING_OPT_IN_STORAGE_PREFIX}${interviewId}`,
              "no",
            );
          } catch {
            /* ignore */
          }
          setShowRecordingOptIn(false);
          await startInterviewLatestRef.current?.();
        } catch (e) {
          console.error("Coding embed autostart failed:", e);
          codingEmbedAutostartStartedRef.current = false;
        } finally {
          launchingInterviewRef.current = false;
        }
      } finally {
        if (!cancelled) setEmbedAutostartPending(false);
      }
    })();

    return () => {
      cancelled = true;
      setEmbedAutostartPending(false);
    };
  }, [
    codingEmbed,
    isCodingDiscussion,
    connected,
    isInterviewActive,
    interviewId,
  ]);

  const endInterview = async () => {
    try {
      stopClientWsHeartbeat();
      // Immediately stop screen capture to remove red indicator
      const currentScreenStream = screenStreamRef.current;
      if (currentScreenStream) {
        console.log("🛑 Stopping screen capture immediately...");
        currentScreenStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState === "live") {
            track.stop();
          }
        });
        screenStreamRef.current = null;
      }

      // Stop recording if active
      if (
        isRecording &&
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        console.log("🛑 Stopping recording before ending interview...");
        stopRecording();

        // Wait a bit for recording to stop and upload to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      timerStartedRef.current = false;

      // Close WebSocket (Gemini expects end_session first)
      if (voiceTransportRef.current?.isControlOpen()) {
        if (usesUnifiedVoiceProtocol(voiceProviderRef.current)) {
          voiceTransportRef.current.sendControl({ type: "end_session" });
        } else {
          voiceTransportRef.current.sendControl({ type: "close" });
        }
        voiceTransportRef.current.disconnect();
        voiceTransportRef.current = null;
        websocketRef.current = null;
      } else if (websocketRef.current) {
        if (usesUnifiedVoiceProtocol(voiceProviderRef.current)) {
          websocketRef.current.send(JSON.stringify({ type: "end_session" }));
        } else {
          websocketRef.current.send(JSON.stringify({ type: "close" }));
        }
        websocketRef.current.close();
      }
      // Ensure screen capture is stopped (double check)
      const finalScreenStream = screenStreamRef.current;
      if (finalScreenStream) {
        finalScreenStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState === "live") {
            track.stop();
          }
        });
        screenStreamRef.current = null;
      }

      // Update state
      setIsInterviewActive(false);
      isInterviewActiveRef.current = false;

      const isCodingPractice =
        interview?.metadata?.interviewKind === "coding_practice";

      if (isCodingPractice) {
        try {
          await codingInterviewApi.markDone(interviewId);
        } catch (e) {
          console.warn("codingInterviewApi.markDone:", e);
        }
      } else {
        await interviewApi.complete(interviewId);
      }

      if (codingDiscussionHost) {
        notifyCodingDiscussionExit("done");
        return;
      }
      if (
        codingEmbed &&
        typeof globalThis.window !== "undefined" &&
        globalThis.window.parent !== globalThis.window
      ) {
        notifyCodingDiscussionExit("done");
        return;
      }

      if (isCodingPractice) {
        await invalidateAfterCodingSessionCompleteFromStorage();
        router.push(`/dashboard/interviews/${interviewId}/processing`);
      } else {
        await invalidateAfterAiInterviewSessionFromStorage();
        router.push(`/dashboard/interviews/${interviewId}/feedback`);
      }
    } catch (error: any) {
      console.error("Error ending interview:", error);
      // Use non-blocking toast so the interview isn't interrupted.
      setActiveError(error.message || "Failed to end interview. Please try again.");
    }
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMic = () => {
    const next = !isMicOn;
    isMicOnRef.current = next;
    setIsMicOn(next);
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = next;
      }
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }
    try {
      const canCaptureDisplay = supportsDisplayMediaCapture();
      let screenStream: MediaStream | null = null;
      let videoTrack: MediaStreamTrack;
      let displayType = "unknown";

      if (canCaptureDisplay) {
        // Request screen capture (user will select tab/window/screen)
        // Try to get display media with flexible constraints
        // Include the current tab in the picker using selfBrowserSurface (prevents "hall of mirrors")
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser", // Prefer browser tab
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
          } as MediaTrackConstraints,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            suppressLocalAudioPlayback: false,
          } as MediaTrackConstraints,
          // Allow current tab to appear in the picker (prevents "hall of mirrors" exclusion)
          selfBrowserSurface: "include" as any,
          // Prefer current tab to be pre-selected
          preferCurrentTab: true as any,
        } as any);

        // Log what was selected and check for tab audio
        const selectedVideoTrack = screenStream.getVideoTracks()[0];
        const initialScreenAudioTracks = screenStream.getAudioTracks();

        if (selectedVideoTrack && (selectedVideoTrack as any).getSettings) {
          const settings = (selectedVideoTrack as any).getSettings();
          displayType = settings.displaySurface || "unknown";
          console.log("📺 Screen capture selected:", {
            displaySurface: displayType,
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            hasAudio: initialScreenAudioTracks.length > 0,
          });
        }

        // Check if we have tab audio (required for AI voice via screen capture)
        if (
          initialScreenAudioTracks.length === 0 &&
          displayType !== "browser"
        ) {
          // User selected window or screen, which doesn't support tab audio
          console.warn(
            "⚠️ No tab audio available - tab audio only works when sharing a browser tab",
          );

          // Ask user to cancel and try again with a tab
          const shouldRetry = globalThis.confirm(
            "⚠️ Tab audio is not available.\n\n" +
              "To capture the AI's voice, share THIS browser tab (not window or screen), with tab audio enabled if your browser offers it.\n\n" +
              "Click OK to continue anyway (AI voice may not be captured fully), or Cancel to stop and try recording again.",
          );

          if (!shouldRetry) {
            // User wants to retry - stop the current stream and return
            screenStream.getTracks().forEach((track) => track.stop());
            return;
          }
        } else if (displayType === "browser") {
          console.log(
            "✅ Browser tab selected - perfect! Tab audio should be available.",
          );
        } else if (displayType === "window" || displayType === "monitor") {
          console.log(
            `ℹ️ ${
              displayType === "window" ? "Window" : "Screen"
            } selected - tab audio not available, but AI voice will be captured via AudioContext.`,
          );
        }

        screenStreamRef.current = screenStream;
        videoTrack = screenStream.getVideoTracks()[0];
      } else {
        if (!mediaStreamRef.current) {
          throw new Error(
            "Camera not ready. Please allow camera access and try again.",
          );
        }
        videoTrack = mediaStreamRef.current.getVideoTracks()[0];
        if (!videoTrack || videoTrack.readyState !== "live") {
          throw new Error(
            "Camera not available. Please enable your camera and try again.",
          );
        }
        console.log(
          "📱 Screen capture unavailable — recording camera and audio instead",
        );
      }

      // Use the existing microphone stream from mediaStreamRef (already in use for interview)
      // This avoids requesting a second microphone stream which might fail or be muted
      let micStream: MediaStream | null = null;
      if (mediaStreamRef.current) {
        const existingMicTracks = mediaStreamRef.current.getAudioTracks();
        if (existingMicTracks.length > 0) {
          // Create a new stream with the existing microphone track
          micStream = new MediaStream();
          existingMicTracks.forEach((track) => {
            // Clone the track or use it directly
            micStream!.addTrack(track);
          });
          console.log(
            `🎤 Using existing microphone track for recording (${existingMicTracks.length} track(s))`,
          );
        } else {
          console.warn("No microphone track found in existing media stream");
        }
      }

      // Fallback: Request microphone if not available from existing stream
      if (!micStream || micStream.getAudioTracks().length === 0) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
            } as MediaTrackConstraints,
          });
        } catch (micError) {
          console.warn("Could not get microphone for recording:", micError);
          // Continue without microphone audio
        }
      }

      // Combine video with microphone audio
      if (!videoTrack) {
        throw new Error("No video track available for recording. Please try again.");
      }

      // Verify video track is active
      if (videoTrack.readyState !== "live") {
        throw new Error("Video track is not live. Please try again.");
      }

      const audioTracks: MediaStreamTrack[] = [];

      // Check for tab audio first (PRIMARY source for AI voice - highest quality)
      const screenAudioTracks = screenStream?.getAudioTracks() ?? [];
      const hasTabAudio = screenAudioTracks.length > 0;

      if (hasTabAudio) {
        audioTracks.push(...screenAudioTracks);
      }

      // Create MediaStreamAudioDestination to capture AI audio directly from AudioContext
      // ONLY use this as a fallback if tab audio is not available (to avoid echo)
      if (!hasTabAudio && audioContextRef.current) {
        const aiAudioDestination =
          audioContextRef.current.createMediaStreamDestination();
        aiAudioDestinationRef.current = aiAudioDestination;
        if (playbackNodeRef.current) {
          playbackNodeRef.current.connect(aiAudioDestination);
        }
        console.log(
          "🎙️ Created AI audio capture destination (fallback - no tab audio)",
        );

        // Add AI audio track to recording (only if tab audio is not available)
        const aiAudioTrack = aiAudioDestination.stream.getAudioTracks()[0];
        if (aiAudioTrack) {
          audioTracks.push(aiAudioTrack);
          console.log(
            "✅ AI audio track added to recording (AudioContext fallback)",
          );
        }
      } else if (hasTabAudio && audioContextRef.current) {
        // Still create the destination for playAudioQueue to connect to, but don't add to recording
        // This prevents echo while still allowing AudioContext to work for playback
        const aiAudioDestination =
          audioContextRef.current.createMediaStreamDestination();
        aiAudioDestinationRef.current = aiAudioDestination;
        if (playbackNodeRef.current) {
          playbackNodeRef.current.connect(aiAudioDestination);
        }
        console.log(
          "🎙️ Created AI audio destination (for playback only - tab audio used for recording)",
        );
      } else if (!audioContextRef.current) {
        console.warn(
          "⚠️ AudioContext not available - AI audio capture may not work",
        );
      }

      // Add microphone audio if available (this captures user's voice)
      if (micStream) {
        const micAudioTracks = micStream.getAudioTracks();
        if (micAudioTracks.length > 0) {
          micAudioTracks.forEach((track) => {
            if (!track.enabled) {
              track.enabled = true;
            }
          });
          audioTracks.push(...micAudioTracks);
        } else {
          console.warn("Microphone stream has no audio tracks");
        }
      } else {
        console.warn("No microphone stream available for recording");
      }

      // Mix all audio tracks into a single track using AudioContext
      // MediaRecorder may not properly handle multiple audio tracks, so we mix them
      let finalAudioTrack: MediaStreamTrack | null = null;

      if (audioTracks.length > 0) {
        try {
          // Create a new AudioContext for mixing (separate from the interview AudioContext)
          const mixAudioContext = new (
            globalThis.AudioContext || (globalThis as any).webkitAudioContext
          )();

          // Create a destination node for the mixed audio
          const mixedDestination =
            mixAudioContext.createMediaStreamDestination();

          console.log(
            `🎚️ Mixing ${audioTracks.length} audio tracks into one...`,
          );

          // Connect all audio tracks to the mixer
          audioTracks.forEach((track, index) => {
            try {
              // Create a MediaStream with just this track
              const trackStream = new MediaStream([track]);
              const source =
                mixAudioContext.createMediaStreamSource(trackStream);

              // Connect to the mixer destination
              source.connect(mixedDestination);
            } catch (err) {
              console.warn(`Failed to connect audio track ${index + 1} to mixer:`, err);
            }
          });

          const mixedTracks = mixedDestination.stream.getAudioTracks();
          if (mixedTracks.length > 0) {
            finalAudioTrack = mixedTracks[0];
          } else {
            console.warn("No mixed audio track created");
          }
        } catch (mixError) {
          console.error("Failed to create audio mixer:", mixError);
        }
      }

      // Create combined stream with video and mixed audio
      const combinedStream = new MediaStream();
      combinedStream.addTrack(videoTrack);

      if (finalAudioTrack) {
        combinedStream.addTrack(finalAudioTrack);
      } else if (audioTracks.length > 0) {
        audioTracks.forEach((track) => combinedStream.addTrack(track));
        console.warn(`Added ${audioTracks.length} audio tracks directly (mixing failed)`);
      } else {
        console.warn("No audio track available for recording");
      }

      // Monitor video track for issues (screen share only — camera stays live for the interview)
      if (screenStream) {
        videoTrack.addEventListener("ended", () => {
          console.warn("Screen capture video track ended unexpectedly");
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            stopRecording();
          }
        });

        videoTrack.addEventListener("mute", () => {
          console.warn("Screen capture video track muted");
        });

        // Handle screen share stop (user clicks stop sharing)
        screenStream.getVideoTracks()[0].addEventListener("ended", () => {
          console.log("🛑 Screen sharing stopped by user");
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            stopRecording();
          }
        });
      }


      // Check if MediaRecorder is supported
      const mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Try alternative formats
        const alternatives = [
          "video/webm;codecs=vp9,opus",
          "video/webm",
          "video/mp4",
        ];
        let supportedType = null;
        for (const alt of alternatives) {
          if (MediaRecorder.isTypeSupported(alt)) {
            supportedType = alt;
            break;
          }
        }
        if (!supportedType) {
          throw new Error("No supported video format found in this browser.");
        }
        console.log(`Using alternative format: ${supportedType}`);
      }

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType)
          ? mimeType
          : "video/webm",
        videoBitsPerSecond: 5000000, // 5 Mbps for screen recording
      });

      let totalSize = 0;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          totalSize += event.data.size;
          console.log(
            `📦 Chunk received: ${event.data.size} bytes (total: ${totalSize} bytes)`,
          );
        } else {
          console.warn("Empty data chunk received");
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop screen capture tracks
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          });
        }

        // Clean up AI audio destination
        if (aiAudioDestinationRef.current) {
          // Disconnect all connections
          aiAudioDestinationRef.current.disconnect();
          aiAudioDestinationRef.current = null;
        }

        const totalBytes = recordedChunksRef.current.reduce(
          (sum, chunk) => sum + chunk.size,
          0,
        );
        console.log(
          `📹 Recording stopped. Total size: ${(
            totalBytes /
            1024 /
            1024
          ).toFixed(2)} MB, Chunks: ${recordedChunksRef.current.length}`,
        );

        // Minimum size check - should be at least 100KB for a meaningful recording
        if (totalBytes < 100 * 1024) {
          console.error("Recording too small, likely failed");
          setActiveError(
            "Recording failed — file too small. Try the record button again when you're ready.",
          );
          setIsRecording(false);
          recordedChunksRef.current = [];
          // Clean up screen stream
          if (screenStreamRef.current) {
            screenStreamRef.current
              .getTracks()
              .forEach((track) => track.stop());
            screenStreamRef.current = null;
          }
          return;
        }

        await uploadRecording();
      };

      mediaRecorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event);
        setActiveError(
          `Recording issue: ${event.error?.message || "Unknown error"}. You can keep interviewing or try recording again.`,
        );
        setIsRecording(false);
      };

      // Wait a bit to ensure stream is ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify combined stream is active
      if (!combinedStream || combinedStream.active === false) {
        throw new Error(
          "Screen capture stream is not active. Please try again.",
        );
      }

      const activeVideoTracks = combinedStream
        .getVideoTracks()
        .filter((t) => t.enabled && t.readyState === "live");
      const activeAudioTracks = combinedStream
        .getAudioTracks()
        .filter((t) => t.enabled && t.readyState === "live");

      if (activeVideoTracks.length === 0) {
        throw new Error(
          supportsDisplayMediaCapture()
            ? "No video track available. Please ensure screen sharing is active."
            : "No video track available. Please ensure your camera is enabled.",
        );
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      if (!canCaptureDisplay) {
        toast.success("Recording started — capturing your camera and audio.");
      }
      console.log("🔴 Recording started with MediaRecorder", {
        state: mediaRecorder.state,
        streamActive: combinedStream.active,
        activeVideoTracks: activeVideoTracks.length,
        activeAudioTracks: activeAudioTracks.length,
      });

      // Monitor recording health - check every 5 seconds
      const recordingHealthCheck = setInterval(() => {
        if (!isRecording || !mediaRecorderRef.current) {
          clearInterval(recordingHealthCheck);
          return;
        }

        const currentChunks = recordedChunksRef.current.length;
        const currentSize = recordedChunksRef.current.reduce(
          (sum, chunk) => sum + chunk.size,
          0,
        );

        console.log(
          `📊 Recording health: ${currentChunks} chunks, ${(
            currentSize / 1024
          ).toFixed(2)} KB`,
        );

        // If after 10 seconds we have less than 10KB, something is wrong
        if (currentSize < 10 * 1024 && currentChunks > 10) {
          console.error(
            "❌ Recording appears to be producing very little data",
          );
          setActiveError(
            "Recording may not be working well. You can stop and try the record button again.",
          );
        }
      }, 5000);

      // Clean up health check when recording stops
      mediaRecorder.addEventListener("stop", () => {
        clearInterval(recordingHealthCheck);
      });
    } catch (error: any) {
      console.error("Error starting recording:", error);

      // Cleanup on error
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      const name = error?.name ?? "";
      const isUserDeniedOrCancelled =
        name === "NotAllowedError" ||
        name === "PermissionDeniedError" ||
        name === "AbortError";

      if (requireSessionRecording && isUserDeniedOrCancelled) {
        setError(
          supportsDisplayMediaCapture()
            ? "Screen recording is required for this interview. Please allow screen sharing and use the record button to try again."
            : "Recording is required for this interview. Please allow camera access and use the record button to try again.",
        );
        return;
      }

      if (isUserDeniedOrCancelled) {
        toast.info(
          supportsDisplayMediaCapture()
            ? "Screen recording wasn't started — that's OK. Continue your interview anytime; use the red record button if you want to try again."
            : "Recording wasn't started — that's OK. Continue your interview anytime; use the red record button if you want to try again.",
        );
        return;
      }

      if (name === "NotFoundError" || name === "NotReadableError") {
        if (requireSessionRecording) {
          setError(
            supportsDisplayMediaCapture()
              ? "Could not access the screen for required recording. Close other apps using the display and try again."
              : "Could not access the camera for required recording. Check permissions and try again.",
          );
        } else {
          setActiveError(
            supportsDisplayMediaCapture()
              ? "Couldn't access screen capture. Your interview continues — try the record button again when ready."
              : "Couldn't access the camera for recording. Your interview continues — try the record button again when ready.",
          );
        }
        return;
      }

      if (requireSessionRecording) {
        setError(
          `Failed to start required recording: ${error?.message ?? "Unknown error"}`,
        );
      } else {
        setActiveError(
          `Couldn't start recording: ${error?.message ?? "Unknown error"}. Your interview can continue as normal.`,
        );
      }
    }
  };

  /**
   * After user chooses in the recording dialog: optional screen capture, then start interview.
   * "Yes" awaits startRecording (toast on deny); both paths then call startInterview().
   */
  const resolveRecordingOptIn = async (choice: "yes" | "no") => {
    if (launchingInterviewRef.current) return;
    launchingInterviewRef.current = true;
    recordingOptInResolvedRef.current = true;
    const canCaptureDisplay = supportsDisplayMediaCapture();
    try {
      try {
        sessionStorage.setItem(
          `${RECORDING_OPT_IN_STORAGE_PREFIX}${interviewId}`,
          choice,
        );
      } catch {
        /* ignore quota / private mode */
      }

      // Desktop: capture screen before the interview starts so tab audio is available.
      // Mobile: screen capture is unavailable — start the interview first so AI audio
      // can be routed through AudioContext, then record camera + mic.
      if (choice === "yes" && canCaptureDisplay) {
        await startRecording();
      }

      setShowRecordingOptIn(false);
      if (!codingEmbed) {
        router.replace(`/interview/${interviewId}/realtime`, { scroll: false });
      }

      await startInterview();

      if (choice === "yes" && !canCaptureDisplay) {
        await startRecording();
      }
    } catch (e) {
      console.error("Launch interview failed:", e);
    } finally {
      launchingInterviewRef.current = false;
      recordingOptInResolvedRef.current = false;
    }
  };

  const stopRecording = () => {
    // Immediately stop screen capture to remove the red indicator
    if (screenStreamRef.current) {
      console.log("🛑 Stopping screen capture immediately...");
      screenStreamRef.current.getTracks().forEach((track) => {
        if (track.readyState === "live") {
          track.stop();
        }
      });
      // Don't set to null yet - let MediaRecorder finish first
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      const state = mediaRecorderRef.current.state;
      const chunksCount = recordedChunksRef.current.length;
      const totalSize = recordedChunksRef.current.reduce(
        (sum, chunk) => sum + chunk.size,
        0,
      );

      console.log(
        `⏹️ Stopping MediaRecorder... State: ${state}, Chunks: ${chunksCount}, Size: ${(
          totalSize / 1024
        ).toFixed(2)} KB`,
      );

      // Request final data before stopping
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }

      // Small delay to ensure final data is captured
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);

        // Clean up screen stream reference after MediaRecorder stops
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          });
          screenStreamRef.current = null;
        }
      }, 200);
    } else {
      // If MediaRecorder is not active, just clean up
      setIsRecording(false);
      if (screenStreamRef.current) {
        screenStreamRef.current = null;
      }
    }
  };

  const uploadRecording = async () => {
    if (recordedChunksRef.current.length === 0) {
      console.error("No recording data to upload");
      setActiveError("No recording file to upload. You can record again with the red button if you like.");
      setIsUploadingRecording(false);
      return;
    }

    try {
      setIsUploadingRecording(true);

      // Calculate total size
      const totalSize = recordedChunksRef.current.reduce(
        (sum, chunk) => sum + chunk.size,
        0,
      );

      console.log(
        `📦 Preparing upload: ${recordedChunksRef.current.length} chunks, ${(
          totalSize /
          1024 /
          1024
        ).toFixed(2)} MB`,
      );

      if (totalSize < 100 * 1024) {
        throw new Error(
          "Recording file is too small. Please ensure video and audio are enabled and try recording again.",
        );
      }

      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });

      // Verify blob size matches
      if (blob.size !== totalSize) {
        console.warn(
          `⚠️ Blob size mismatch: blob=${blob.size}, calculated=${totalSize}`,
        );
      }

      console.log(
        `📤 Uploading recording: ${(blob.size / 1024 / 1024).toFixed(2)} MB (${
          blob.size
        } bytes)`,
      );

      const { uploadUrl, s3Key } =
        await interviewApi.getRecordingUploadUrl(interviewId);

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "video/webm",
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`,
        );
      }

      await interviewApi.saveRecordingKey(interviewId, s3Key);

      recordedChunksRef.current = [];
    } catch (error: any) {
      console.error("Error uploading recording:", error);
      setActiveError(
        `Couldn't save recording: ${error.message}. Your interview is unaffected.`,
      );
    } finally {
      setIsUploadingRecording(false);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          codingDiscussionHost
            ? "h-auto min-h-[4.5rem] bg-transparent py-3"
            : "bg-background",
          codingEmbed && !codingDiscussionHost ? "h-full min-h-[12rem]" : "",
          !codingEmbed && !codingDiscussionHost ? "min-h-screen" : "",
          className,
        )}
      >
        <div className="text-center">
          <Loader2
            className={cn(
              "mx-auto mb-3 animate-spin",
              codingDiscussionHost
                ? "h-8 w-8 text-violet-400"
                : "mb-4 h-12 w-12 text-purple-600",
            )}
          />
          <p
            className={
              codingDiscussionHost ? "text-xs text-gray-400" : "text-gray-600"
            }
          >
            Loading interview...
          </p>
        </div>
      </div>
    );
  }

  if (error && !isInterviewActive && !connectionFailed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-4",
          codingDiscussionHost
            ? "h-full min-h-0 bg-transparent"
            : "bg-background",
          codingEmbed && !codingDiscussionHost ? "h-full min-h-0" : "",
          !codingEmbed && !codingDiscussionHost ? "min-h-screen" : "",
          className,
        )}
      >
        {codingDiscussionHost ? (
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card/[0.06] p-4 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <h2 className="mb-2 text-base font-semibold text-white">Error</h2>
            <p className="mb-4 text-sm text-gray-400">{error}</p>
            <Button
              variant="secondary"
              className="w-full border-white/15 bg-card/10 text-white hover:bg-card/15"
              onClick={() =>
                notifyCodingDiscussionExit("close")
              }
            >
              Close
            </Button>
          </div>
        ) : (
          <Card className="w-full max-w-md">
            <CardContent className="p-4 text-center sm:p-5">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-2 text-xl font-bold text-gray-900">Error</h2>
              <p className="mb-4 text-gray-600">{error}</p>
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative text-white",
        !codingDiscussionHost &&
          "bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#0b1220_45%,_#060913_100%)]",
        codingEmbed
          ? codingDiscussionHost
            ? "flex h-auto min-w-0 flex-col overflow-visible"
            : "flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
          : "min-h-svh overflow-x-hidden",
        className,
      )}
    >
      <InterviewBriefingDialog
        open={showBriefing}
        connecting={acceptingBriefing}
        onAccept={() => void handleAcceptAndStart()}
      />

      <AlertDialog
        open={showInterviewComplete}
        onOpenChange={setShowInterviewComplete}
      >
        <AlertDialogContent className="sm:max-w-md border-2 border-green-200 bg-card shadow-xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                Your interview is complete!
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-base text-gray-600">
                Great job! Your report and analysis are being generated — this
                usually takes about a minute.
                {interviewCompleteCountdown > 0 && (
                  <span className="mt-2 block text-sm text-gray-500">
                    Redirecting in {interviewCompleteCountdown}s...
                  </span>
                )}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 sm:justify-center">
            <Button
              size="lg"
              onClick={() => {
                if (interviewCompleteAutoCloseRef.current) {
                  clearTimeout(interviewCompleteAutoCloseRef.current);
                  interviewCompleteAutoCloseRef.current = null;
                }
                if (interviewCompleteCountdownRef.current) {
                  clearInterval(interviewCompleteCountdownRef.current);
                  interviewCompleteCountdownRef.current = null;
                }
                setShowInterviewComplete(false);
                showInterviewCompleteRef.current = false;
                endInterview();
              }}
              className="min-w-[120px] bg-gradient-to-r from-violet-600 to-primary hover:from-violet-700 hover:bg-slate-900 text-white"
            >
              View Report
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={showRecordingOptIn}
        onOpenChange={(open) => {
          if (!open && !recordingOptInResolvedRef.current) {
            void resolveRecordingOptIn("no");
          }
        }}
      >
        <DialogContent className="border border-zinc-700 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              Would you like to record your interview session
            </DialogTitle>
            <DialogDescription className="text-base text-zinc-300">
              Record your interview session for future reference and analysis of
              how you answered each question.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              onClick={() => void resolveRecordingOptIn("no")}
            >
              No
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void resolveRecordingOptIn("yes")}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate-initiated end confirmation dialog */}
      <AlertDialog
        open={showConfirmEndInterview}
        onOpenChange={(open) => {
          if (!open) {
            // Dialog closed without choosing — treat as cancel
            setShowConfirmEndInterview(false);
            websocketRef.current?.send(JSON.stringify({ type: "cancel_end" }));
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md border-2 border-amber-200 bg-card shadow-xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                End the interview?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-base text-gray-600">
                It sounds like you&apos;d like to finish. Would you like to end
                the interview now and generate your report?
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-3 sm:justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setShowConfirmEndInterview(false);
                websocketRef.current?.send(
                  JSON.stringify({ type: "cancel_end" }),
                );
              }}
              className="min-w-[120px]"
            >
              Continue Interview
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setShowConfirmEndInterview(false);
                websocketRef.current?.send(
                  JSON.stringify({ type: "confirm_end" }),
                );
              }}
              className="min-w-[120px] animate-none bg-gradient-to-r from-red-500 to-rose-600 text-white transition-none hover:from-red-600 hover:to-rose-700"
            >
              End Interview
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={showEndInterviewConfirm}
        onOpenChange={setShowEndInterviewConfirm}
      >
        <AlertDialogContent className="sm:max-w-md border-2 border-amber-200 bg-card shadow-xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                You are about to close the interview. Are you sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2 text-gray-600">
                Your interview will be ended and credit will be deducted based on
                your usage. You might see incomplete report of your interview or
                report generation might fail.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowEndInterviewConfirm(false)}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={async () => {
                setShowEndInterviewConfirm(false);
                await endInterview();
              }}
              className="min-w-[120px] animate-none transition-none"
            >
              End Interview
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={connectionFailed} onOpenChange={() => {}}>
        <AlertDialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)] border-2 border-red-200 bg-card shadow-xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="mx-auto h-12 w-12 shrink-0 text-red-500 mb-4" />
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                {isReconnecting ? "Reconnecting..." : "Connection Lost"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2 text-gray-600 break-words">
                {isReconnecting
                  ? "Something went wrong at server side. Attempting to reconnect..."
                  : "Something went wrong at server side. You can try to resume or close this interview without losing credits."}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={closeFailedInterview}
              disabled={isClosingFailed || isReconnecting}
              className="w-full sm:w-auto sm:whitespace-nowrap text-center h-auto py-2 px-4"
            >
              {isClosingFailed ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  Closing...
                </>
              ) : (
                "Close Interview (No credits deducted)"
              )}
            </Button>
            <Button
              size="lg"
              onClick={resumeInterview}
              disabled={isResuming || isReconnecting}
              className="w-full sm:w-auto sm:whitespace-nowrap text-center h-auto py-2 px-4 bg-gradient-to-r from-violet-600 to-primary hover:from-violet-700 hover:bg-slate-900 text-white"
            >
              {isResuming || isReconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                "Resume Interview"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!codingDiscussionHost ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute top-24 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
      ) : null}

      {/* Non-blocking reconnect banner — shown during reconnect before escalation to dialog */}
      {isReconnecting && !connectionFailed && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-yellow-500/95 px-4 py-2 text-sm font-medium text-yellow-950 shadow-md">
          {SHOW_RECONNECT_ATTEMPT_DEBUG
            ? `Reconnecting AI session… (${reconnectAttemptCount}/3 attempts)`
            : "Reconnecting AI session…"}
        </div>
      )}

      {/* Non-blocking recording / soft errors — never replaces full-page Error (camera, WS, etc.) */}
      {activeError && (
        <div className="fixed bottom-4 left-1/2 z-50 max-w-[min(100%-2rem,28rem)] -translate-x-1/2 flex items-center gap-2 rounded-lg bg-amber-950/95 border border-amber-600/40 px-4 py-3 text-sm text-amber-50 shadow-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{activeError}</span>
          <button
            onClick={() => setActiveError("")}
            className="ml-2 rounded-full p-0.5 hover:bg-card/20"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Coding sidebar embed: no header (End lives on main coding page if needed). */}
      {codingEmbed && isCodingDiscussion ? null : (
        <div className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-[#0b1220]/95">
          <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 lg:px-5">
            {!isInterviewActive && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-white/90 hover:bg-card/10 hover:text-white"
                aria-label="Back to interviews"
                onClick={() => {
                  router.push("/dashboard/interviews");
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-xl">
              {interview?.metadata.role || "Interview"}
            </h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "relative z-10 mx-auto max-w-7xl",
          codingEmbed
            ? codingDiscussionHost
              ? "w-full shrink-0 px-0 py-0"
              : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-1 py-1 sm:px-2 sm:py-2"
            : "px-3 py-4 sm:px-4 lg:px-5 lg:py-5",
        )}
      >
        <div
          className={cn(
            "space-y-4",
            codingEmbed
              ? codingDiscussionHost
                ? "mb-0 flex w-full shrink-0 flex-col space-y-2"
                : "mb-0 flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden"
              : "mb-4",
          )}
        >
          <div
            className={cn(
              "grid lg:items-stretch",
              codingEmbed
                ? codingDiscussionHost
                  ? "grid-cols-1 gap-2"
                  : "grid-cols-1 content-start gap-2 lg:grid-cols-1"
                : "grid-cols-1 gap-4 lg:grid-cols-2",
            )}
          >
            {/* Left: profile + live speaking + start — same row height as camera on lg */}
            <Card
              className={cn(
                "flex flex-col overflow-visible border-white/10 bg-card/[0.06] shadow-lg shadow-black/20",
                codingDiscussionHost &&
                  isCodingDiscussion &&
                  "h-auto w-full shrink-0 rounded-xl border-0 bg-card/[0.04] shadow-none",
                codingEmbed && isCodingDiscussion
                  ? codingDiscussionHost
                    ? "relative"
                    : "relative min-h-0 flex-1"
                  : codingEmbed
                    ? "min-h-[180px] flex-1 sm:min-h-[200px]"
                    : "min-h-0 sm:min-h-[280px] lg:h-full lg:min-h-[360px]",
              )}
            >
              {codingEmbed && isCodingDiscussion && !isInterviewActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute z-10 text-white/70 hover:bg-card/10 hover:text-white",
                    codingDiscussionHost
                      ? "right-0.5 top-0.5 h-7 w-7"
                      : "right-1 top-1 h-8 w-8",
                  )}
                  aria-label="Close discussion"
                  onClick={() => notifyCodingDiscussionExit("leave")}
                >
                  <X
                    className={codingDiscussionHost ? "h-3.5 w-3.5" : "h-4 w-4"}
                  />
                </Button>
              ) : null}
              <CardContent
                className={cn(
                  "flex flex-col overflow-visible",
                  codingDiscussionHost && isCodingDiscussion
                    ? "h-auto gap-2 p-2.5"
                    : "min-h-0 flex-1",
                  codingEmbed && isCodingDiscussion && !codingDiscussionHost
                    ? "gap-3 p-3"
                    : codingEmbed && !isCodingDiscussion
                      ? "gap-2 p-2 sm:gap-3 sm:p-3"
                      : !codingEmbed
                        ? "gap-4 p-4 sm:p-5"
                        : "",
                )}
              >
                <div
                  className={cn(
                    "flex items-center overflow-visible",
                    codingEmbed && isCodingDiscussion
                      ? "gap-2.5"
                      : codingEmbed
                        ? "gap-2 sm:gap-3"
                        : "gap-4",
                  )}
                >
                  <AiPersonaAvatar
                    persona={interviewerPersona}
                    isSpeaking={
                      isAISpeaking ||
                      (!!currentAssistantTranscript && isInterviewActive)
                    }
                    isProcessing={isAIProcessing && isInterviewActive}
                    size={
                      codingEmbed && isCodingDiscussion ? "md" : codingEmbed ? "md" : "lg"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <h2
                      className={cn(
                        "font-semibold tracking-tight text-white",
                        codingEmbed ? "text-sm sm:text-base" : "text-base sm:text-xl",
                      )}
                    >
                      {interviewerPersona.displayName}
                    </h2>
                    <p
                      className={cn(
                        "text-violet-200/85",
                        codingEmbed ? "text-[11px] sm:text-xs" : "text-sm",
                      )}
                    >
                      {interviewerPersona.title}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-gray-300/80",
                        codingEmbed && isCodingDiscussion
                          ? "text-xs sm:text-sm"
                          : codingEmbed
                            ? "text-[11px] sm:text-xs"
                            : "text-sm",
                        connected &&
                          codingDiscussionHost &&
                          !isAIProcessing &&
                          !(isAISpeaking || currentAssistantTranscript) &&
                          "text-teal-300/90",
                      )}
                    >
                      {connected
                        ? isAIProcessing
                          ? "Understanding your answer..."
                          : isAISpeaking || currentAssistantTranscript
                            ? "Speaking..."
                            : "Ready"
                        : "Connecting..."}
                    </p>
                  </div>
                </div>

                {isInterviewActive && !(codingEmbed && isCodingDiscussion) ? (
                  <div
                    className={cn(
                      "flex-1 space-y-2 border-t border-white/10",
                      codingEmbed
                        ? "min-h-0 pt-2 sm:min-h-[6rem]"
                        : "min-h-[8rem] pt-3 sm:min-h-[11rem] sm:pt-4 lg:min-h-[12rem]",
                    )}
                  >
                    {isPreparing ? (
                      <div className="flex items-start gap-3 text-primary/70">
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/80"
                          aria-hidden
                        />
                        <div>
                          <p className="text-sm font-semibold">
                            {lastAIMessage || "Preparing for interview..."}
                          </p>
                          <p className="text-xs text-gray-400">
                            AI interviewer is getting ready
                          </p>
                          <p className="mt-1 text-[11px] text-purple-400">
                            Voice model: {providerDisplayLabel(activeVoiceProvider)}
                          </p>
                        </div>
                      </div>
                    ) : isAIProcessing ? (
                      <div className="space-y-2 text-primary/70">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            AI is understanding your answer...
                          </span>
                        </div>
                        <div className="flex gap-1.5 pl-0 text-primary/50/90">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                        </div>
                      </div>
                    ) : isAISpeaking || currentAssistantTranscript ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-purple-300/90">
                          Speaking...
                        </p>
                        <p className="mt-2 text-base leading-relaxed text-white/95">
                          {currentAssistantTranscript || lastAIMessage}
                        </p>
                      </div>
                    ) : lastAIMessage ? (
                      <p className="text-base leading-relaxed text-gray-300">
                        {lastAIMessage}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Listening to your response...
                      </p>
                    )}
                  </div>
                ) : null}

                {!isInterviewActive && (
                  <div
                    className={cn(
                      "border-white/10 text-center",
                      codingDiscussionHost && isCodingDiscussion
                        ? "mt-1 border-t border-white/5 pt-1.5"
                        : cn(
                            "mt-auto border-t border-white/10",
                            codingEmbed && isCodingDiscussion
                              ? "pt-3"
                              : codingEmbed
                                ? "pt-2"
                                : "pt-4",
                          ),
                    )}
                  >
                    {!connected ? (
                      <div
                        className={cn(
                          "flex flex-col items-center",
                          codingDiscussionHost && isCodingDiscussion
                            ? "gap-1"
                            : "gap-2",
                          !(codingEmbed && isCodingDiscussion) && "mb-4",
                          codingDiscussionHost &&
                            isCodingDiscussion &&
                            "mb-0",
                        )}
                      >
                        <span
                          className="h-2 w-2 rounded-full bg-primary/80"
                          aria-hidden
                        />
                        <p
                          className={cn(
                            "text-primary/70",
                            codingDiscussionHost && isCodingDiscussion
                              ? "text-[11px] leading-snug"
                              : "text-sm",
                          )}
                        >
                          AI interviewer is getting ready...
                        </p>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "text-gray-300/80",
                          codingDiscussionHost && isCodingDiscussion
                            ? "text-[11px] leading-snug"
                            : "text-sm",
                          !(codingEmbed && isCodingDiscussion) && "mb-4",
                          codingEmbed &&
                            isCodingDiscussion &&
                            !codingDiscussionHost &&
                            "mb-4",
                        )}
                      >
                        {codingEmbed && isCodingDiscussion
                          ? embedAutostartPending
                            ? "Starting your conversation…"
                            : codingDiscussionHost
                              ? ""
                              : "Ready to start your interview?"
                          : "Ready to start your interview?"}
                      </p>
                    )}
                    {codingEmbed && isCodingDiscussion && embedAutostartPending ? (
                      <Loader2
                        className={cn(
                          "mx-auto animate-spin text-violet-300",
                          codingDiscussionHost
                            ? "mt-1 h-4 w-4"
                            : "mt-2 h-5 w-5",
                        )}
                      />
                    ) : null}
                    {!(codingEmbed && isCodingDiscussion) && !showBriefing ? (
                      <Button
                        onClick={() => setShowRecordingOptIn(true)}
                        disabled={!connected}
                        size={codingEmbed ? "sm" : "default"}
                        className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-primary px-4 hover:from-violet-700 hover:bg-slate-900 sm:w-auto sm:px-6"
                      >
                        {isCodingDiscussion
                          ? "Start discussion"
                          : interview?.status === "active"
                            ? "Resume Interview"
                            : "Start Interview"}
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            {!codingEmbed ? (
              <Card className="flex min-h-0 flex-col overflow-visible border-white/10 bg-card/[0.06] shadow-lg shadow-black/20 lg:h-full">
                <CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                  <div className="relative min-h-[180px] w-full flex-1 overflow-hidden rounded-2xl bg-black sm:min-h-[220px] lg:min-h-0">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      onLoadedMetadata={() => {
                        console.log("Video metadata loaded");
                        setVideoStreamActive(true);
                      }}
                      onPlaying={() => {
                        console.log("Video is playing");
                        setVideoStreamActive(true);
                      }}
                      onError={(e) => {
                        console.error("Video element error:", e);
                        setVideoStreamActive(false);
                      }}
                    />
                    {(!isCameraOn || !videoStreamActive) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95">
                        <VideoOff className="h-12 w-12 text-gray-600 sm:h-16 sm:w-16" />
                        {!videoStreamActive && (
                          <p className="absolute bottom-4 text-sm text-gray-400">
                            Waiting for camera...
                          </p>
                        )}
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/80 px-3 py-1 text-xs text-white/90">
                      Candidate Camera
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
                aria-hidden
                onLoadedMetadata={() => {
                  setVideoStreamActive(true);
                }}
                onPlaying={() => {
                  setVideoStreamActive(true);
                }}
                onError={(e) => {
                  console.error("Video element error:", e);
                  setVideoStreamActive(false);
                }}
              />
            )}
          </div>

          {/* Interview controls — above transcript history */}
          {!(codingEmbed && isCodingDiscussion) ? (
          <Card
            className={cn(
              "rounded-xl border border-white/10 bg-[#0b1220]/95 shadow-lg shadow-black/20 backdrop-blur-md",
              codingEmbed
                ? "shrink-0"
                : "sticky bottom-0 z-20 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:static lg:bg-card/[0.04]",
            )}
          >
            <CardContent
              className={cn(codingEmbed ? "p-2 sm:p-3" : "space-y-3 p-3 sm:space-y-4 sm:p-5")}
            >
              <div className="text-center">
                <h2
                  className={cn(
                    "font-semibold uppercase tracking-wide text-gray-300/90",
                    codingEmbed ? "mb-2 text-[10px]" : "text-xs sm:text-sm",
                  )}
                >
                  {codingEmbed ? "Mic & camera" : "Interview Controls"}
                </h2>
              </div>
              {!codingEmbed ? (
                <div className="space-y-2">
                  <Progress
                    value={Math.min(
                      (elapsedTime / Math.max(targetDurationSec, 1)) * 100,
                      100,
                    )}
                    className="h-2 w-full bg-card/10"
                  />
                  <p className="text-center text-xs tabular-nums text-gray-300/80 sm:text-sm">
                    {formatDuration(elapsedTime)} /{" "}
                    {formatDuration(targetDurationSec)}
                  </p>
                </div>
              ) : null}
              <div
                className={cn(
                  "grid grid-cols-3 items-stretch gap-2",
                  codingEmbed
                    ? "gap-2"
                    : "sm:flex sm:justify-center sm:gap-3",
                )}
              >
                <Button
                  type="button"
                  variant={isMicOn ? "default" : "destructive"}
                  onClick={toggleMic}
                  className={cn(
                    "h-11 min-w-0 rounded-xl px-1.5 text-[11px] sm:w-auto sm:gap-2 sm:px-4 sm:text-sm",
                    codingEmbed
                      ? "h-12"
                      : "h-auto min-h-11 flex-col gap-0.5 py-2 sm:h-11 sm:flex-row sm:py-2",
                  )}
                  title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                >
                  {isMicOn ? (
                    <Mic className="h-4 w-4 shrink-0" />
                  ) : (
                    <MicOff className="h-4 w-4 shrink-0" />
                  )}
                  <span>Mic</span>
                </Button>
                <Button
                  type="button"
                  variant={isCameraOn ? "default" : "destructive"}
                  onClick={toggleCamera}
                  className={cn(
                    "h-11 min-w-0 rounded-xl px-1.5 text-[11px] sm:w-auto sm:gap-2 sm:px-4 sm:text-sm",
                    codingEmbed
                      ? "h-12"
                      : "h-auto min-h-11 flex-col gap-0.5 py-2 sm:h-11 sm:flex-row sm:py-2",
                  )}
                  title={isCameraOn ? "Turn camera off" : "Turn camera on"}
                >
                  {isCameraOn ? (
                    <Video className="h-4 w-4 shrink-0" />
                  ) : (
                    <VideoOff className="h-4 w-4 shrink-0" />
                  )}
                  <span>Camera</span>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!isInterviewActive}
                  onClick={() => setShowEndInterviewConfirm(true)}
                  className={cn(
                    "h-11 min-w-0 whitespace-normal rounded-xl px-1.5 text-center text-[11px] leading-tight animate-none transition-none sm:w-auto sm:gap-2 sm:px-4 sm:text-sm sm:whitespace-nowrap",
                    codingEmbed
                      ? "h-12"
                      : "h-auto min-h-11 flex-col gap-0.5 py-2 sm:h-11 sm:flex-row sm:py-2",
                  )}
                  title="End interview"
                >
                  <PhoneOff className="h-4 w-4 shrink-0" />
                  <span className="text-center">End interview</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          ) : null}

          {/* Full width: completed AI turns (history) */}
          {!(codingEmbed && isCodingDiscussion) ? (
          <Card
            className={cn(
              "animate-none border border-white/10 bg-card/[0.04] shadow-md",
              codingEmbed && "min-h-0 flex-1 overflow-hidden",
            )}
          >
            <CardContent
              className={cn(
                codingEmbed
                  ? "flex min-h-0 flex-1 flex-col p-2 sm:p-3"
                  : "p-4 sm:p-5",
              )}
            >
              <h3
                className={cn(
                  "font-semibold tracking-tight text-white",
                  codingEmbed
                    ? "mb-2 text-xs sm:text-sm"
                    : "mb-3 text-base sm:text-lg",
                )}
              >
                AI questions &amp; responses
              </h3>
              <div
                className={cn(
                  "space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed",
                  codingEmbed ? "max-h-36 flex-1 sm:max-h-40" : "max-h-72",
                )}
              >
                {transcript.length === 0 && !currentAssistantTranscript ? (
                  <p className="text-gray-400">
                    AI responses will appear here as the conversation progresses...
                  </p>
                ) : (
                  <>
                    {transcript
                      .filter((item) => item.role === "assistant")
                      .map((item, index) => (
                        <div
                          key={`transcript-${index}-${
                            item.role
                          }-${item.content.slice(0, 10)}`}
                          className="text-white/90"
                        >
                          <span className="font-semibold text-violet-200">
                            Question {index + 1}:{" "}
                          </span>
                          <span>{item.content}</span>
                        </div>
                      ))}
                    {currentAssistantTranscript ? (
                      <div className="text-white/90">
                        <span className="font-semibold text-violet-200">
                          Question{" "}
                          {transcript.filter((item) => item.role === "assistant")
                            .length + 1}
                          :{" "}
                        </span>
                        <span>{currentAssistantTranscript}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
