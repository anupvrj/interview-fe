"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Circle,
  Square,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { interviewApi, Interview } from "@/lib/api";
import { normalizeInterviewDurationMinutes } from "@/lib/interviewDuration";
import { formatDuration } from "@/lib/utils";
import { BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES } from "@/lib/interviewWebSocketPolicy";
import { pickRandomPersona } from "@/lib/aiPersonas";
import type { AIInterviewerPersona } from "@/lib/aiPersonas";
import { AiPersonaAvatar } from "@/components/interview/AiPersonaAvatar";
import { toast } from "sonner";

/** Hard fallback minutes added on top of target (used if AI never sends interview_complete). */
const EXTRA_BUFFER_MINUTES = 5;

/** Reconnect attempt counter (e.g. 1/3) in the yellow banner — production candidates see a generic message only. */
const SHOW_RECONNECT_ATTEMPT_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_APP_ENV === "staging";

/** Voice provider for realtime: "gemini" (default) or "chatgpt". Set via NEXT_PUBLIC_VOICE_PROVIDER. */
const VOICE_PROVIDER: "chatgpt" | "gemini" =
  (process.env.NEXT_PUBLIC_VOICE_PROVIDER as "chatgpt" | "gemini") || "gemini";

const RECORDING_OPT_IN_STORAGE_PREFIX = "interviewRecordingOptIn_";

export default function RealtimeInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  // Target duration in seconds — from interview metadata (set when the interview was created).
  const targetDurationSec =
    normalizeInterviewDurationMinutes(interview?.metadata?.interviewDuration) * 60;
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
  // Candidate-initiated end-interview confirmation dialog
  const [showConfirmEndInterview, setShowConfirmEndInterview] = useState(false);
  /** Recording consent before interview starts (after "Start Interview"). */
  const [showRecordingOptIn, setShowRecordingOptIn] = useState(false);
  const launchingInterviewRef = useRef(false);
  /** Avoid double-handling when Radix fires onOpenChange after Yes/No. */
  const recordingOptInResolvedRef = useRef(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartedRef = useRef(false);
  // AudioWorkletNode is the primary processor; ScriptProcessorNode used as fallback only.
  const audioProcessorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const audioBufferRef = useRef<Int16Array[]>([]);
  const audioBufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingAudioRef = useRef(false);
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
  const voiceProviderRef = useRef<"chatgpt" | "gemini">(VOICE_PROVIDER);
  // Ref mirror for isMicOn — avoids stale closure in sendAudioChunk / onaudioprocess
  const isMicOnRef = useRef(true);
  /** Application-level WS keepalive for Gemini path (reduces proxy idle closes). */
  const clientWsHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  /** Pending auto-reconnect timer after a benign WS drop during an active interview. */
  const autoReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref mirror of elapsedTime so setTimeout/onclose closures always read the current
  // value, not the stale value captured at the time connectWebSocket() was called.
  const elapsedTimeRef = useRef(0);

  const stopClientWsHeartbeat = () => {
    if (clientWsHeartbeatRef.current) {
      clearInterval(clientWsHeartbeatRef.current);
      clientWsHeartbeatRef.current = null;
    }
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
        voiceProviderRef.current === "gemini"
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
    interviewerPersonaRef.current = pickRandomPersona();
  }
  const interviewerPersona = interviewerPersonaRef.current;

  /** When true (e.g. institute policy), denying screen capture may use blocking error UI. */
  const requireSessionRecording =
    interview?.metadata?.requireSessionRecording === true;

  useEffect(() => {
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
      if (videoRef.current && !mediaStreamRef.current) {
        void setupMediaStream();
      } else if (!videoRef.current) {
        pollId = setTimeout(checkVideoElement, 100);
      }
    };

    const timeoutId = setTimeout(checkVideoElement, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (pollId) clearTimeout(pollId);
    };
  }, [loading, error, isInterviewActive, connectionFailed]);

  useEffect(() => {
    if (isInterviewActive && elapsedTime >= maxDurationSec) {
      endInterview();
    }
  }, [elapsedTime, isInterviewActive]);

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

  const loadInterview = async () => {
    try {
      const data = await interviewApi.get(interviewId);
      setInterview(data);
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
    if (voiceProviderRef.current === "gemini") {
      geminiResumePayloadRef.current = {
        reconnectResume: true,
        elapsedTimeSec: elapsedTimeRef.current,
      };
    }
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
    if (autoReconnectTimerRef.current) {
      clearTimeout(autoReconnectTimerRef.current);
      autoReconnectTimerRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (websocketRef.current) websocketRef.current.close();
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
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioQueueRef.current = [];
    audioBufferRef.current = [];
    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }
    recordedChunksRef.current = [];
    isPlayingAudioRef.current = false;
    isInterviewActiveRef.current = false;
    connectionInitiatedRef.current = false; // Reset for next connection
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
      // Set NEXT_PUBLIC_GEMINI_SIMPLE_ROUTE=true to use the lightweight
      // no-RAG / no-embedding route (better for long interviews).
      const useSimpleRoute =
        process.env.NEXT_PUBLIC_GEMINI_SIMPLE_ROUTE === "true";
      const realtimePath =
        VOICE_PROVIDER === "gemini"
          ? useSimpleRoute
            ? `interviews/${interviewId}/realtime/gemini-simple`
            : `interviews/${interviewId}/realtime/gemini`
          : `interviews/${interviewId}/realtime`;
      const iv = interviewForWs ?? interview;
      const durationParam = normalizeInterviewDurationMinutes(
        iv?.metadata?.interviewDuration,
      );
      const p = interviewerPersonaRef.current!;
      const voiceQuery =
        VOICE_PROVIDER === "gemini"
          ? `&geminiVoice=${encodeURIComponent(p.geminiVoice)}`
          : `&openaiVoice=${encodeURIComponent(p.openaiVoice)}`;
      const personaQuery = `&interviewerName=${encodeURIComponent(p.displayName)}&interviewerTitle=${encodeURIComponent(p.title)}`;
      const wsUrl = `${wsProtocol}//${baseUrl}/api/${realtimePath}?userId=${encodeURIComponent(userId)}&interviewDurationMinutes=${durationParam}${voiceQuery}${personaQuery}`;

      console.log("🔌 Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        // For Gemini, wait for the backend "connected" message (Gemini session ready)
        // before enabling the Start button. For ChatGPT, enable immediately on WS open.
        if (voiceProviderRef.current !== "gemini") {
          setConnected(true);
        } else {
          // App-level keepalive from first byte of session (covers long AI prep on Railway).
          startClientWsHeartbeat();
        }
        if (isResumingRef.current && isInterviewActiveRef.current) {
          if (voiceProviderRef.current === "gemini") {
            const resumeExtra = geminiResumePayloadRef.current;
            geminiResumePayloadRef.current = null;
            ws.send(
              JSON.stringify({
                type: "start_interview",
                interviewDurationMinutes: normalizeInterviewDurationMinutes(
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
          } else {
            ws.send(JSON.stringify({ type: "response.create" }));
          }
          isResumingRef.current = false;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "preparing") {
            console.log("⏳ Preparing interview...");
            // Show preparing state in UI
            setLastAIMessage(data.message || "Preparing your interview...");
          } else if (data.type === "reconnecting") {
            setIsAIProcessing(true);
            setIsAISpeaking(false);
            setLastAIMessage("Reconnecting AI session...");
            setIsReconnecting(true);
            // Do not set connectionFailed here: backend may try up to ~12 Gemini reconnects.
            // Blocking "Connection Lost" after 3 banners was a false positive in production.
            setReconnectAttemptCount((prev) => prev + 1);
          } else if (data.type === "reconnected") {
            setIsAIProcessing(false);
            setLastAIMessage("AI session resumed.");
            setIsReconnecting(false);
            setConnectionFailed(false);
            setError("");
            setReconnectAttemptCount(0);
            setConnected(true);
          } else if (data.type === "connected") {
            if (data.provider) voiceProviderRef.current = data.provider;
            // Gemini session is ready — enable the Start Interview button
            setConnected(true);
          } else if (data.type === "openai_event") {
            handleOpenAIEvent(data.event);
          } else if (data.type === "audio_response") {
            handleGeminiAudioResponse(data.audioData);
            setIsAISpeaking(true); // AI is sending audio, so it's speaking
            setIsAIProcessing(false);
            setIsPreparing(false); // AI has started speaking, no longer preparing
            // Start timer when AI is ready (first response)
            if (!timerStartedRef.current && isInterviewActiveRef.current) {
              timerStartedRef.current = true;
              timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
              }, 1000);
            }
          } else if (data.type === "text_response") {
            // AI transcript - show partials in real-time, add complete to history
            if (data.text) {
              const isComplete = data.finished === true;
              console.log(
                `🤖 AI transcript: "${data.text.substring(0, 50)}..." (finished: ${isComplete})`,
              );
              
              // Clear preparing state when AI starts responding
              setIsPreparing(false);
              setIsAIProcessing(false);
              // Start timer when AI is ready (first response)
              if (!timerStartedRef.current && isInterviewActiveRef.current) {
                timerStartedRef.current = true;
                timerRef.current = setInterval(() => {
                  setElapsedTime((prev) => prev + 1);
                }, 1000);
              }

              if (isComplete) {
                setTranscript((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: data.text,
                    timestamp: new Date(),
                  },
                ]);
                setLastAIMessage(data.text);
                setCurrentAssistantTranscript(""); // Clear partial
              } else {
                // Partial transcript - show in "speaking..." area for real-time display
                setCurrentAssistantTranscript(data.text);
              }
            }
          } else if (data.type === "interview_complete") {
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
              endInterview();
            }, 15000);
          } else if (data.type === "session_ended") {
            // Server's Gemini session has fully closed (normal or manual end).
            // Flush any stale AI audio so it doesn't play after the session is over.
            audioQueueRef.current = [];
            audioBufferRef.current = [];
            if (audioBufferTimerRef.current) {
              clearTimeout(audioBufferTimerRef.current);
              audioBufferTimerRef.current = null;
            }
            isPlayingAudioRef.current = false;
            setIsAISpeaking(false);
            setIsAIProcessing(false);
            setIsReconnecting(false);
          } else if (data.type === "confirm_end_interview") {
            // Candidate said they want to end — show confirmation dialog.
            setShowConfirmEndInterview(true);
          } else if (data.type === "turn_complete") {
            // AI finished speaking - clear the "speaking..." indicator
            setIsAISpeaking(false);
            setIsAIProcessing(false);
            setCurrentAssistantTranscript("");
            isPlayingAudioRef.current = false;
          } else if (data.type === "user_transcript") {
            // Intentionally not shown live; transcript is processed asynchronously
            // and persisted server-side for analysis/dashboard.
          } else if (data.type === "interrupted") {
            audioQueueRef.current = [];
            audioBufferRef.current = [];
            if (audioBufferTimerRef.current) {
              clearTimeout(audioBufferTimerRef.current);
              audioBufferTimerRef.current = null;
            }
            isPlayingAudioRef.current = false;
            setIsAISpeaking(false); // Clear AI speaking state
            setIsAIProcessing(false);
            setCurrentAssistantTranscript("");
          } else if (data.type === "ai_processing") {
            // User finished speaking, AI is now processing
            setIsAIProcessing(true);
            setIsAISpeaking(false);
            setLastAIMessage("AI is understanding your answer...");
          } else if (data.type === "error") {
            const errMsg = typeof data.message === "string" ? data.message : JSON.stringify(data.message);
            const diag = (data as { diagnostic?: unknown }).diagnostic;
            console.error("[WS] Server error message:", errMsg, "diagnostic:", diag);
            if (diag != null) {
              console.info("[WS] Server error diagnostic (for Railway/debug):", JSON.stringify(diag));
            }
            setError(errMsg || "Something went wrong at server side.");
            setIsReconnecting(false);
            if (isInterviewActiveRef.current) setConnectionFailed(true);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

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
            autoReconnectTimerRef.current = setTimeout(() => {
              autoReconnectTimerRef.current = null;
              // Only attempt if still active and not already reconnecting.
              if (!isInterviewActiveRef.current || connectionInitiatedRef.current) return;
              console.log("[WS] Auto-reconnecting after benign close (code:", code, ")");
              isResumingRef.current = true;
              if (voiceProviderRef.current === "gemini") {
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
                // Only show the manual-resume banner if auto-reconnect actually failed.
                setLastAIMessage(
                  "Connection paused — tap Resume interview to reconnect without losing progress.",
                );
              });
            }, 2000);
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

  const playAudioQueue = async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      return;
    }

    isPlayingAudioRef.current = true;
    const pcm16Chunk = audioQueueRef.current.shift()!;

    // Convert PCM16 to Float32
    const float32 = new Float32Array(pcm16Chunk.length);
    for (let i = 0; i < pcm16Chunk.length; i++) {
      float32[i] = pcm16Chunk[i] / 32768;
    }

    // Create and play audio buffer
    const audioBuffer = audioContextRef.current.createBuffer(
      1,
      float32.length,
      24000, // 24kHz sample rate for OpenAI audio
    );
    audioBuffer.copyToChannel(float32, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;

    // Connect to speakers for playback
    source.connect(audioContextRef.current.destination);

    // Also connect to recording destination if it exists (for capturing AI voice)
    if (aiAudioDestinationRef.current) {
      source.connect(aiAudioDestinationRef.current);
    }

    // When this chunk finishes, play the next one
    source.onended = () => {
      if (audioQueueRef.current.length > 0) {
        playAudioQueue();
      } else {
        isPlayingAudioRef.current = false;
      }
    };

    source.start();
  };

  /** Decode Gemini audio_response (base64 PCM 24kHz) and batch for smooth playback. */
  const handleGeminiAudioResponse = (base64Audio: string) => {
    if (!base64Audio) return;
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.codePointAt(i) ?? 0;
      }

      // Skip empty audio chunks (0 bytes) to prevent stuttering
      if (bytes.length === 0) return;

      const pcm16 = new Int16Array(bytes.buffer);

      // Add to buffer for batching
      audioBufferRef.current.push(pcm16);

      // Clear existing timer
      if (audioBufferTimerRef.current) {
        clearTimeout(audioBufferTimerRef.current);
      }

      // Flush buffer after 20ms of no new chunks (batches small chunks together, low latency)
      audioBufferTimerRef.current = setTimeout(() => {
        if (audioBufferRef.current.length > 0) {
          // Concatenate all buffered chunks into one
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

          // Add combined chunk to playback queue
          audioQueueRef.current.push(combined);
          audioBufferRef.current = [];

          // Start playing if not already playing
          if (!isPlayingAudioRef.current) {
            playAudioQueue();
          }
        }
      }, 20);
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
        audioQueueRef.current = [];
        audioBufferRef.current = [];
        if (audioBufferTimerRef.current) {
          clearTimeout(audioBufferTimerRef.current);
          audioBufferTimerRef.current = null;
        }
        isPlayingAudioRef.current = false;
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
        audioQueueRef.current = [];
        audioBufferRef.current = [];
        if (audioBufferTimerRef.current) {
          clearTimeout(audioBufferTimerRef.current);
          audioBufferTimerRef.current = null;
        }
        isPlayingAudioRef.current = false;
        break;

      case "response.cancelled":
        // Response was cancelled (due to interruption)
        audioQueueRef.current = [];
        audioBufferRef.current = [];
        if (audioBufferTimerRef.current) {
          clearTimeout(audioBufferTimerRef.current);
          audioBufferTimerRef.current = null;
        }
        isPlayingAudioRef.current = false;
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
            // Decode base64 to PCM16
            const binaryString = atob(event.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.codePointAt(i) ?? 0;
            }
            const pcm16 = new Int16Array(bytes.buffer);

            // Add to queue
            audioQueueRef.current.push(pcm16);

            // Start playing if not already playing
            if (!isPlayingAudioRef.current) {
              playAudioQueue();
            }
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
      const isGemini = voiceProviderRef.current === "gemini";
      websocketRef.current.send(
        JSON.stringify(
          isGemini
            ? { type: "audio", audioData: base64Audio }
            : { type: "audio_chunk", audio: base64Audio },
        ),
      );
    };

    const setupWithScriptProcessor = (audioContext: AudioContext) => {
      const browserSampleRate = audioContext.sampleRate;
      const resampleRatio = TARGET_SAMPLE_RATE / browserSampleRate;
      console.log(`🎵 ScriptProcessor fallback: ${browserSampleRate}Hz → ${TARGET_SAMPLE_RATE}Hz`);

      const source = audioContext.createMediaStreamSource(mediaStreamRef.current!);
      // 1024 samples @ 48kHz = ~21ms → resampled to ~21ms @ 24kHz, within Live API 20–40ms limit.
      // Previous 2048 (42ms) slightly exceeded the 40ms max and could trigger 1007.
      const processor = audioContext.createScriptProcessor(1024, 1, 1);

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
        const pcm16 = new Int16Array(resampled.length);
        for (let i = 0; i < resampled.length; i++) {
          const s = Math.max(-1, Math.min(1, resampled[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCodePoint(bytes[i]);
        sendAudioChunk(btoa(binary));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      audioProcessorRef.current = processor;
    };

    try {
      const audioContext = new (
        globalThis.AudioContext || (globalThis as any).webkitAudioContext
      )();
      audioContextRef.current = audioContext;
      console.log(`🎵 AudioContext ready: ${audioContext.sampleRate}Hz → ${TARGET_SAMPLE_RATE}Hz`);

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
            workletNode.connect(audioContext.destination);
            // Store as ref so cleanup can disconnect it
            (audioProcessorRef as any).current = workletNode;
            console.log("🎤 Using AudioWorklet for mic capture");
          })
          .catch((err) => {
            console.warn("AudioWorklet failed, falling back to ScriptProcessor:", err);
            setupWithScriptProcessor(audioContext);
          });
      } else {
        // Browser doesn't support AudioWorklet (e.g. old Safari)
        setupWithScriptProcessor(audioContext);
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

      // Start interview on backend
      await interviewApi.start(interviewId);

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

      // Explicitly start Gemini interview only after user click
      if (voiceProviderRef.current === "gemini" && websocketRef.current) {
        websocketRef.current.send(
          JSON.stringify({
            type: "start_interview",
            interviewDurationMinutes: normalizeInterviewDurationMinutes(
              interview?.metadata?.interviewDuration,
            ),
          }),
        );
      }

      // Setup audio capture (must be after setIsInterviewActive)
      setupAudioCapture();

      // Timer starts when AI is ready (first audio_response or text_response)

      // Request first response only for ChatGPT path
      setTimeout(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          if (voiceProviderRef.current !== "gemini") {
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
      if (websocketRef.current) {
        if (voiceProviderRef.current === "gemini") {
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

      // Complete interview
      await interviewApi.complete(interviewId);

      // Collect quick feedback, then processing/report flow
      router.push(`/dashboard/interviews/${interviewId}/feedback`);
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
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const next = !isMicOn;
        audioTrack.enabled = next;
        isMicOnRef.current = next; // keep ref in sync for audio capture closure
        setIsMicOn(next);
      }
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }
    try {
      // Request screen capture (user will select tab/window/screen)
      // Try to get display media with flexible constraints
      // Include the current tab in the picker using selfBrowserSurface (prevents "hall of mirrors")
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
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
      let displayType = "unknown";

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
      if (initialScreenAudioTracks.length === 0 && displayType !== "browser") {
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

      // Combine screen video with microphone audio
      const videoTrack = screenStream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error("No video track in screen capture. Please try again.");
      }

      // Verify video track is active
      if (videoTrack.readyState !== "live") {
        throw new Error(
          "Screen capture video track is not live. Please try again.",
        );
      }

      const audioTracks: MediaStreamTrack[] = [];

      // Check for tab audio first (PRIMARY source for AI voice - highest quality)
      const screenAudioTracks = screenStream.getAudioTracks();
      let hasTabAudio = screenAudioTracks.length > 0;

      if (hasTabAudio) {
        audioTracks.push(...screenAudioTracks);
      }

      // Create MediaStreamAudioDestination to capture AI audio directly from AudioContext
      // ONLY use this as a fallback if tab audio is not available (to avoid echo)
      if (!hasTabAudio && audioContextRef.current) {
        const aiAudioDestination =
          audioContextRef.current.createMediaStreamDestination();
        aiAudioDestinationRef.current = aiAudioDestination;
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

      // Monitor video track for issues
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
          "No video track available. Please ensure screen sharing is active.",
        );
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
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
          "Screen recording is required for this interview. Please allow screen sharing and use the record button to try again.",
        );
        return;
      }

      if (isUserDeniedOrCancelled) {
        toast.info(
          "Screen recording wasn't started — that's OK. Continue your interview anytime; use the red record button if you want to try again.",
        );
        return;
      }

      if (name === "NotFoundError" || name === "NotReadableError") {
        if (requireSessionRecording) {
          setError(
            "Could not access the screen for required recording. Close other apps using the display and try again.",
          );
        } else {
          setActiveError(
            "Couldn't access screen capture. Your interview continues — try the record button again when ready.",
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
    try {
      try {
        sessionStorage.setItem(
          `${RECORDING_OPT_IN_STORAGE_PREFIX}${interviewId}`,
          choice,
        );
      } catch {
        /* ignore quota / private mode */
      }

      if (choice === "yes") {
        await startRecording();
      }

      setShowRecordingOptIn(false);
      router.replace(`/interview/${interviewId}/realtime`, { scroll: false });

      await startInterview();
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error && !isInterviewActive && !connectionFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-4 text-center sm:p-5">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#0b1220_45%,_#060913_100%)] text-white">
      <AlertDialog
        open={showInterviewComplete}
        onOpenChange={setShowInterviewComplete}
      >
        <AlertDialogContent className="sm:max-w-md border-2 border-green-200 bg-white shadow-xl">
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
                endInterview();
              }}
              className="min-w-[120px] bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
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
        <AlertDialogContent className="sm:max-w-md border-2 border-amber-200 bg-white shadow-xl">
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
        <AlertDialogContent className="sm:max-w-md border-2 border-amber-200 bg-white shadow-xl">
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
        <AlertDialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)] border-2 border-red-200 bg-white shadow-xl">
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
              className="w-full sm:w-auto sm:whitespace-nowrap text-center h-auto py-2 px-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute top-24 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

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
            className="ml-2 rounded-full p-0.5 hover:bg-white/20"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header — solid bg (no backdrop-blur) to avoid GPU flicker with content below */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220]/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-4 sm:py-0 lg:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 sm:py-3">
            {!isInterviewActive && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-white/90 hover:bg-white/10 hover:text-white"
                aria-label="Back to interviews"
                onClick={() => router.push("/dashboard/interviews")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">
                {interview?.metadata.role || "Interview"}
              </h1>
              <p className="text-sm text-gray-300/80">
                {formatDuration(elapsedTime)} /{" "}
                {formatDuration(targetDurationSec)}
              </p>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-row items-center gap-2 sm:w-auto sm:gap-3">
            <Progress
              value={Math.min((elapsedTime / targetDurationSec) * 100, 100)}
              className="h-2 min-w-0 flex-1 bg-white/10 sm:w-40 sm:flex-none"
            />
            {isInterviewActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowEndInterviewConfirm(true)}
                className="shrink-0 rounded-xl animate-none transition-none sm:ml-2"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Interview
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:px-5 lg:py-5">
        <div className="mb-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            {/* Left: profile + live speaking + start — same row height as camera on lg */}
            <Card className="flex min-h-[300px] flex-col overflow-visible border-white/10 bg-white/[0.06] shadow-lg shadow-black/20 sm:min-h-[320px] lg:h-full lg:min-h-[360px]">
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-visible p-4 sm:p-5">
                <div className="flex items-center gap-4 overflow-visible">
                  <AiPersonaAvatar
                    persona={interviewerPersona}
                    isSpeaking={
                      isAISpeaking ||
                      (!!currentAssistantTranscript && isInterviewActive)
                    }
                    isProcessing={isAIProcessing && isInterviewActive}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold tracking-tight text-white">
                      {interviewerPersona.displayName}
                    </h2>
                    <p className="text-sm text-violet-200/85">
                      {interviewerPersona.title}
                    </p>
                    <p className="text-sm text-gray-300/80 mt-1">
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

                {isInterviewActive && (
                  <div className="min-h-[11rem] flex-1 space-y-2 border-t border-white/10 pt-4 sm:min-h-[12rem]">
                    {isPreparing ? (
                      <div className="flex items-start gap-3 text-blue-400">
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400"
                          aria-hidden
                        />
                        <div>
                          <p className="text-sm font-semibold">
                            {lastAIMessage || "Preparing for interview..."}
                          </p>
                          <p className="text-xs text-gray-400">
                            AI interviewer is getting ready
                          </p>
                        </div>
                      </div>
                    ) : isAIProcessing ? (
                      <div className="space-y-2 text-blue-400">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            AI is understanding your answer...
                          </span>
                        </div>
                        <div className="flex gap-1.5 pl-0 text-blue-300/90">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
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
                )}

                {!isInterviewActive && (
                  <div className="mt-auto border-t border-white/10 pt-4 text-center">
                    {!connected ? (
                      <div className="mb-4 flex flex-col items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full bg-blue-400"
                          aria-hidden
                        />
                        <p className="text-sm text-blue-400">
                          AI interviewer is getting ready...
                        </p>
                      </div>
                    ) : (
                      <p className="mb-4 text-gray-300/80">
                        Ready to start your interview?
                      </p>
                    )}
                    <Button
                      onClick={() => setShowRecordingOptIn(true)}
                      disabled={!connected}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 hover:from-violet-700 hover:to-blue-700"
                    >
                      Start Interview
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex min-h-0 flex-col overflow-visible border-white/10 bg-white/[0.06] shadow-lg shadow-black/20 lg:h-full">
              <CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                <div className="relative min-h-[200px] w-full flex-1 overflow-hidden rounded-2xl bg-black lg:min-h-0">
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
                      <VideoOff className="h-16 w-16 text-gray-600" />
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
          </div>

          {/* Interview controls — above transcript history */}
          <Card className="rounded-xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 backdrop-blur-md">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-4 text-center">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300/90">
                  Interview Controls
                </h4>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant={isMicOn ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleMic}
                  className="h-16 w-16 rounded-2xl"
                  title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                >
                  {isMicOn ? (
                    <Mic className="w-6 h-6" />
                  ) : (
                    <MicOff className="w-6 h-6" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant={isCameraOn ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleCamera}
                  className="h-16 w-16 rounded-2xl"
                  title={isCameraOn ? "Turn camera off" : "Turn camera on"}
                >
                  {isCameraOn ? (
                    <Video className="w-6 h-6" />
                  ) : (
                    <VideoOff className="w-6 h-6" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isUploadingRecording || !mediaStreamRef.current}
                  className="h-16 w-16 rounded-2xl"
                  title={
                    isUploadingRecording
                      ? "Uploading recording…"
                      : isRecording
                        ? "Stop recording"
                        : !mediaStreamRef.current
                          ? "Waiting for camera and microphone"
                          : "Record session — share this browser tab for best audio"
                  }
                >
                  {isUploadingRecording ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isRecording ? (
                    <Square className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6 fill-red-500 text-red-500" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Full width: completed AI turns (history) */}
          <Card className="animate-none border border-white/10 bg-white/[0.04] shadow-md">
            <CardContent className="p-4 sm:p-5">
              <h3 className="mb-3 text-lg font-semibold tracking-tight text-white">
                AI Live Responses
              </h3>
              <div className="max-h-72 space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed">
                {transcript.length === 0 && !currentAssistantTranscript ? (
                  <p className="text-gray-400">
                    AI responses will appear here as the conversation progresses...
                  </p>
                ) : (
                  transcript
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
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
