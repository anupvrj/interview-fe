"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AiPersonaAvatar } from "@/components/interview/AiPersonaAvatar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { pickRandomPersona } from "@/lib/aiPersonas";
import type { AIInterviewerPersona } from "@/lib/aiPersonas";

const TARGET_SAMPLE_RATE = 24000;
const GEMINI_MIC_FRAME_SAMPLES_24K = 720;

export type SystemDesignVoiceDiagramBridge = {
  /** Sends canvas PNG into the **active** Live session (after mic + start_interview only). */
  sendDiagramSnapshot(imageBase64: string, mimeType?: string): boolean;
  /** Liveness ping for whiteboard edits — resets the backend silence monitor (throttled). */
  sendWhiteboardActivity(): void;
};

// ── Client voice-activity detection (energy-based) ──────────────────────────
/** Absolute normalized RMS floor; nothing below this counts as speech. */
const VAD_ABS_FLOOR = 0.003;
/** Speech requires RMS above adaptive noise floor × this factor. */
const VAD_THRESHOLD_FACTOR = 1.6;
/** Audio buffered before onset so word beginnings aren't clipped. */
const VAD_PREROLL_MS = 300;
/** Keep streaming this long after RMS drops so word tails aren't clipped. */
const VAD_HANGOVER_MS = 600;
/** Adaptation rate of the noise floor during quiet frames. */
const VAD_NOISE_EMA = 0.04;
/** Starting noise-floor estimate before calibration (very quiet room). */
const VAD_NOISE_FLOOR_INIT = 0.002;
/** Upper bound so a noisy environment can't fully suppress speech detection. */
const VAD_NOISE_FLOOR_MAX = 0.018;
/** Throttle for liveness pings (speech onset / whiteboard). */
const ACTIVITY_SIGNAL_THROTTLE_MS = 2000;

/** Imperative API — e.g. flush transcript to Mongo before POST finalize. */
export type SystemDesignVoiceSessionHandle = {
  flushAndDisconnect: () => Promise<void>;
};

type Props = {
  sessionId: string;
  disabled?: boolean;
  className?: string;
  /** Tighter layout for narrow sidebars (avatar scale, padding). */
  compact?: boolean;
  diagramBridgeRef?: MutableRefObject<SystemDesignVoiceDiagramBridge | null>;
  /** When set, Gemini mic uses this stream's audio tracks (avoid second getUserMedia) — pair with coding-style camera+acquire. */
  reuseMicStreamRef?: MutableRefObject<MediaStream | null>;
  /** True after Start New Session succeeds (socket + mic + greeting; canvas uses same Live session only). */
  onDiagramChannelReady?: (ready: boolean) => void;
  /** Begin voice automatically once enabled (e.g. right after screen recording + backend phase starts). */
  autoStartVoice?: boolean;
  /** Subtitle while disabled before interview ends (otherwise shows “Interview ended”). */
  disabledHint?: string;
  /** Backend force-ended the interview (e.g. candidate inactivity) — parent finalizes + navigates. */
  onForceEnd?: (reason: string) => void;
};

export const SystemDesignVoiceClient = forwardRef<
  SystemDesignVoiceSessionHandle,
  Props
>(function SystemDesignVoiceClient(
  {
    sessionId,
    disabled = false,
    className,
    compact = false,
    diagramBridgeRef,
    onDiagramChannelReady,
    reuseMicStreamRef,
    autoStartVoice = false,
    disabledHint,
    onForceEnd,
  }: Props,
  ref,
) {
  const personaRef = useRef<AIInterviewerPersona | null>(null);
  if (!personaRef.current) personaRef.current = pickRandomPersona();
  const persona = personaRef.current!;

  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  /** Spinner on Start New Session until mic + greeting are live */
  const [startupInFlight, setStartupInFlight] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  /** Resolves pending `flushAndDisconnect` when server sends session_ended or socket closes. */
  const flushWaitSettleRef = useRef<(() => void) | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionInitiated = useRef(false);
  /** After user clicks Start New Session: connect then auto-run mic + greeting. */
  const pendingConnectThenStartRef = useRef(false);
  const voiceActiveRef = useRef(false);
  /** Latest onForceEnd — kept in a ref so the WS handler never sees a stale closure. */
  const onForceEndRef = useRef<Props["onForceEnd"]>(onForceEnd);
  useEffect(() => {
    onForceEndRef.current = onForceEnd;
  }, [onForceEnd]);
  /** Last time we emitted a liveness ping (speech onset). */
  const lastActivitySentRef = useRef(0);
  /** Last time we emitted a whiteboard liveness ping. */
  const lastWhiteboardActivitySentRef = useRef(0);
  /** True while the AI turn is active (server streaming or local playback). */
  const aiSpeakingForVadRef = useRef(false);
  /** Reset VAD calibration (called when an AI turn finishes). */
  const vadResetRef = useRef<(() => void) | null>(null);

  const sendLivenessSignal = useCallback(
    (type: "user_activity" | "whiteboard_activity") => {
      const ws = wsRef.current;
      if (ws?.readyState !== WebSocket.OPEN || !voiceActiveRef.current) return;
      try {
        ws.send(JSON.stringify({ type }));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<AudioNode | ScriptProcessorNode | null>(null);

  const audioQueueRef = useRef<Int16Array[]>([]);
  const audioBufferRef = useRef<Int16Array[]>([]);
  const audioBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  /** Active AI playback node — stopped immediately on barge-in. */
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  /** Stop local AI audio immediately (barge-in / server interrupted). */
  const stopAiPlayback = useCallback(() => {
    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }
    audioQueueRef.current = [];
    audioBufferRef.current = [];
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.onended = null;
        playbackSourceRef.current.stop();
      } catch {
        /* already stopped */
      }
      playbackSourceRef.current = null;
    }
    playingRef.current = false;
    aiSpeakingForVadRef.current = false;
    setAiSpeaking(false);
  }, []);
  const stopAiPlaybackRef = useRef(stopAiPlayback);
  useEffect(() => {
    stopAiPlaybackRef.current = stopAiPlayback;
  }, [stopAiPlayback]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "client_ping", t: Date.now() }));
        } catch {
          /* ignore */
        }
      }
    }, 10_000);
  }, [stopHeartbeat]);

  const playNext = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (!ctx || audioQueueRef.current.length === 0) {
      playingRef.current = false;
      aiSpeakingForVadRef.current = false;
      vadResetRef.current?.();
      return;
    }
    playingRef.current = true;
    const pcm16 = audioQueueRef.current.shift()!;
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i]! / 32768;

    const buffer = ctx.createBuffer(1, float32.length, TARGET_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    playbackSourceRef.current = source;
    source.onended = () => {
      if (playbackSourceRef.current === source) playbackSourceRef.current = null;
      void playNext();
    };
    source.start();
  }, []);

  const handleGeminiAudio = useCallback(
    (base64: string) => {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.codePointAt(i) ?? 0;
        if (bytes.length === 0) return;
        const pcm16 = new Int16Array(bytes.buffer);

        audioBufferRef.current.push(pcm16);
        if (audioBufferTimerRef.current) clearTimeout(audioBufferTimerRef.current);
        audioBufferTimerRef.current = setTimeout(() => {
          audioBufferTimerRef.current = null;
          if (!audioBufferRef.current.length) return;
          let total = 0;
          for (const c of audioBufferRef.current) total += c.length;
          const combined = new Int16Array(total);
          let o = 0;
          for (const c of audioBufferRef.current) {
            combined.set(c, o);
            o += c.length;
          }
          audioBufferRef.current = [];
          audioQueueRef.current.push(combined);
          if (!playingRef.current && audioQueueRef.current.length) void playNext();
        }, 20);
      } catch {
        /* ignore */
      }
    },
    [playNext],
  );

  const cleanupAudioCapture = () => {
    if (audioProcessorRef.current && "disconnect" in audioProcessorRef.current) {
      try {
        (audioProcessorRef.current as AudioNode).disconnect();
      } catch {
        /* ignore */
      }
    }
    audioProcessorRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
    mediaStreamRef.current = null;
  };

  /** Ends WS + voice pipeline without stopping mic tracks (shared with screen recording). */
  const releaseVoiceCodecResourcesFlushPreserveMic = () => {
    stopHeartbeat();
    if (audioProcessorRef.current && "disconnect" in audioProcessorRef.current) {
      try {
        (audioProcessorRef.current as AudioNode).disconnect();
      } catch {
        /* ignore */
      }
    }
    audioProcessorRef.current = null;

    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }
    audioQueueRef.current = [];
    audioBufferRef.current = [];
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.onended = null;
        playbackSourceRef.current.stop();
      } catch {
        /* ignore */
      }
      playbackSourceRef.current = null;
    }
    playingRef.current = false;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  };

  const releaseVoiceCodecResources = () => {
    stopHeartbeat();
    cleanupAudioCapture();
    vadResetRef.current = null;
    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }
    audioQueueRef.current = [];
    audioBufferRef.current = [];
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.onended = null;
        playbackSourceRef.current.stop();
      } catch {
        /* ignore */
      }
      playbackSourceRef.current = null;
    }
    playingRef.current = false;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  };

  const cleanupAll = () => {
    releaseVoiceCodecResources();
    const ws = wsRef.current;
    if (ws) {
      try {
        ws.send(JSON.stringify({ type: "end_session" }));
      } catch {
        /* ignore */
      }
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    wsRef.current = null;
    connectionInitiated.current = false;
    voiceActiveRef.current = false;
  };

  useImperativeHandle(ref, () => ({
    flushAndDisconnect: async () => {
      voiceActiveRef.current = false;

      await new Promise<void>((resolve) => {
        let settled = false;
        let timerId: number | undefined;
        const settle = () => {
          if (settled) return;
          settled = true;
          if (timerId !== undefined) window.clearTimeout(timerId);
          flushWaitSettleRef.current = null;
          resolve();
        };

        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          settle();
          return;
        }

        flushWaitSettleRef.current = settle;
        timerId = window.setTimeout(settle, 10_000);
        try {
          ws.send(JSON.stringify({ type: "end_session" }));
        } catch {
          settle();
        }
      });

      releaseVoiceCodecResourcesFlushPreserveMic();
      const ws = wsRef.current;
      if (
        ws &&
        ws.readyState !== WebSocket.CLOSING &&
        ws.readyState !== WebSocket.CLOSED
      ) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      }
      wsRef.current = null;
      connectionInitiated.current = false;
      voiceActiveRef.current = false;
      setVoiceActive(false);
      setConnected(false);
      setPreparing(false);
      setAiSpeaking(false);
      setStartupInFlight(false);
    },
  }));

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  const ensurePlaybackContext = useCallback(() => {
    if (typeof globalThis.window === "undefined") return null;
    try {
      let ctx = audioContextRef.current;
      const WK = (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const AudioCtor = globalThis.AudioContext ?? WK;
      if (!AudioCtor) return null;
      if (!ctx || ctx.state === "closed") {
        const next = new AudioCtor();
        audioContextRef.current = next;
        next.onstatechange = () => {
          if (next.state === "suspended") void next.resume().catch(() => {});
        };
        ctx = next;
      }
      void ctx.resume().catch(() => {});
      return ctx;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!diagramBridgeRef) return undefined;
    const bridge: SystemDesignVoiceDiagramBridge = {
      sendDiagramSnapshot(imageBase64: string, mimeType = "image/png") {
        const ws = wsRef.current;
        if (
          ws?.readyState !== WebSocket.OPEN ||
          !voiceActiveRef.current ||
          disabled
        ) {
          return false;
        }
        ensurePlaybackContext();
        const clean = imageBase64.replace(/\s+/g, "").trim();
        if (!clean) return false;
        try {
          ws.send(
            JSON.stringify({
              type: "diagram_snapshot",
              mimeType,
              imageData: clean,
            }),
          );
          return true;
        } catch {
          return false;
        }
      },
      sendWhiteboardActivity() {
        if (disabled || !voiceActiveRef.current) return;
        const now = Date.now();
        if (now - lastWhiteboardActivitySentRef.current < ACTIVITY_SIGNAL_THROTTLE_MS) {
          return;
        }
        lastWhiteboardActivitySentRef.current = now;
        sendLivenessSignal("whiteboard_activity");
      },
    };
    if (!disabled) {
      diagramBridgeRef.current = bridge;
    } else {
      diagramBridgeRef.current = null;
    }
    return () => {
      if (diagramBridgeRef.current === bridge) {
        diagramBridgeRef.current = null;
      }
    };
  }, [diagramBridgeRef, disabled, ensurePlaybackContext, sendLivenessSignal]);

  const setupAudioCapture = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    const pcm16ToBase64 = (arr: Int16Array) => {
      const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
      return btoa(binary);
    };

    const sendAudioChunk = (b64: string) => {
      if (
        !voiceActiveRef.current ||
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        return;
      }
      wsRef.current!.send(JSON.stringify({ type: "audio", audioData: b64 }));
    };

    const emitSpeechOnsetActivity = () => {
      const now = Date.now();
      if (now - lastActivitySentRef.current < ACTIVITY_SIGNAL_THROTTLE_MS) return;
      lastActivitySentRef.current = now;
      sendLivenessSignal("user_activity");
    };

    /**
     * Energy-based voice-activity gate: streams only detected speech (with a short
     * pre-roll + hangover so word edges aren't clipped), keeping steady background
     * noise (fans, hum) off the socket. Frames are 24 kHz Int16 PCM.
     */
    const createVadGate = () => {
      let noiseFloor = VAD_NOISE_FLOOR_INIT;
      let speaking = false;
      let hangoverUntil = 0;
      const preroll: Int16Array[] = [];
      let prerollSamples = 0;
      const maxPrerollSamples = Math.floor(
        (TARGET_SAMPLE_RATE * VAD_PREROLL_MS) / 1000,
      );

      const reset = () => {
        noiseFloor = VAD_NOISE_FLOOR_INIT;
        speaking = false;
        hangoverUntil = 0;
        preroll.length = 0;
        prerollSamples = 0;
      };

      const process = (frame: Int16Array) => {
        if (frame.length === 0) return;

        const aiPlaying = aiSpeakingForVadRef.current || playingRef.current;

        // While the AI is speaking: stream mic audio WITHOUT VAD (same as the
        // pre-silence-monitor RealtimeInterviewClient path). Gemini detects
        // barge-in server-side. Client-side VAD + stopAiPlayback here caused
        // speaker bleed to falsely interrupt and leave the AI stuck mid-turn.
        if (aiPlaying) {
          sendAudioChunk(pcm16ToBase64(frame));
          return;
        }

        let sumSq = 0;
        for (let i = 0; i < frame.length; i++) {
          const s = frame[i]! / 32768;
          sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / frame.length);
        const now = Date.now();
        const threshold = Math.max(VAD_ABS_FLOOR, noiseFloor * VAD_THRESHOLD_FACTOR);

        if (rms > threshold) {
          if (!speaking) {
            speaking = true;
            emitSpeechOnsetActivity();
            for (const pf of preroll) sendAudioChunk(pcm16ToBase64(pf));
            preroll.length = 0;
            prerollSamples = 0;
          }
          hangoverUntil = now + VAD_HANGOVER_MS;
          sendAudioChunk(pcm16ToBase64(frame));
          return;
        }

        if (speaking && now < hangoverUntil) {
          sendAudioChunk(pcm16ToBase64(frame));
          return;
        }
        speaking = false;

        if (rms < threshold * 0.55) {
          noiseFloor = Math.min(
            VAD_NOISE_FLOOR_MAX,
            noiseFloor * (1 - VAD_NOISE_EMA) + rms * VAD_NOISE_EMA,
          );
        }
        preroll.push(frame);
        prerollSamples += frame.length;
        while (prerollSamples > maxPrerollSamples && preroll.length > 0) {
          prerollSamples -= preroll[0]!.length;
          preroll.shift();
        }
      };

      return { process, reset };
    };

    const vadGate = createVadGate();
    vadResetRef.current = vadGate.reset;

    const setupWithScriptProcessor = (ctx: AudioContext) => {
      const sr = ctx.sampleRate;
      const ratio = TARGET_SAMPLE_RATE / sr;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!voiceActiveRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        let resampled = input;
        if (sr !== TARGET_SAMPLE_RATE) {
          const len = Math.floor(input.length * ratio);
          resampled = new Float32Array(len);
          for (let i = 0; i < len; i++) {
            const src = i / ratio;
            const i0 = Math.floor(src);
            const i1 = Math.min(i0 + 1, input.length - 1);
            resampled[i] = input[i0]! * (1 - (src - i0)) + input[i1]! * (src - i0);
          }
        }
        const pcm16 = new Int16Array(resampled.length);
        for (let i = 0; i < resampled.length; i++) {
          const s = Math.max(-1, Math.min(1, resampled[i]!));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        vadGate.process(pcm16);
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      audioProcessorRef.current = processor;
    };

    try {
      const WK = (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const AudioCtx = globalThis.AudioContext || WK;
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === "closed") {
        const next = new AudioCtx!();
        audioContextRef.current = next;
        next.onstatechange = () => {
          if (next.state === "suspended") void next.resume().catch(() => {});
        };
        ctx = next;
      }
      void ctx.resume().catch(() => {});

      if (ctx.audioWorklet) {
        ctx.audioWorklet
          .addModule("/mic-processor.worklet.js")
          .then(() => {
            const source = ctx.createMediaStreamSource(stream);
            const worklet = new AudioWorkletNode(ctx, "mic-processor", {
              processorOptions: { targetSampleRate: TARGET_SAMPLE_RATE },
            });
            const pending: number[] = [];
            worklet.port.onmessage = (ev) => {
              if (ev.data.type !== "audio_chunk") return;
              if (!voiceActiveRef.current) return;
              const chunk = new Int16Array(ev.data.pcm16 as ArrayBuffer);
              for (let i = 0; i < chunk.length; i++) pending.push(chunk[i]!);
              while (pending.length >= GEMINI_MIC_FRAME_SAMPLES_24K) {
                const frame = new Int16Array(GEMINI_MIC_FRAME_SAMPLES_24K);
                for (let i = 0; i < GEMINI_MIC_FRAME_SAMPLES_24K; i++) frame[i] = pending[i]!;
                pending.splice(0, GEMINI_MIC_FRAME_SAMPLES_24K);
                vadGate.process(frame);
              }
            };
            source.connect(worklet);
            worklet.connect(ctx.destination);
            audioProcessorRef.current = worklet;
          })
          .catch(() => setupWithScriptProcessor(ctx));
      } else {
        setupWithScriptProcessor(ctx);
      }
    } catch (e) {
      console.error("[SD Voice] setupAudioCapture:", e);
    }
  }, [sendLivenessSignal]);

  const startVoiceInterview = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setStartupInFlight(false);
      pendingConnectThenStartRef.current = false;
      setError("Not connected yet. Wait a moment and try again.");
      return;
    }
    try {
      const reused = reuseMicStreamRef?.current;
      const reusedAudio =
        reused
          ?.getAudioTracks()
          .filter((t) => t.readyState === "live") ?? [];
      const stream =
        reusedAudio.length > 0
          ? new MediaStream([reusedAudio[0]!])
          : await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      voiceActiveRef.current = true;
      setVoiceActive(true);
      setPreparing(true);

      wsRef.current.send(
        JSON.stringify({
          type: "start_interview",
          interviewDurationMinutes: 45,
        }),
      );

      setupAudioCapture();
    } catch (e) {
      setStartupInFlight(false);
      pendingConnectThenStartRef.current = false;
      setError(e instanceof Error ? e.message : "Microphone permission denied.");
    }
  };

  const connectWebSocket = () => {
    if (connectionInitiated.current || disabled) return;
    connectionInitiated.current = true;
    setConnecting(true);
    setError(null);

    const userId =
      typeof globalThis.window !== "undefined"
        ? localStorage.getItem("clerk-user-id")
        : null;
    if (!userId) {
      connectionInitiated.current = false;
      setConnecting(false);
      pendingConnectThenStartRef.current = false;
      setStartupInFlight(false);
      setError("Sign in required for voice.");
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
    const baseHost = apiUrl.replace(/\/api$/, "").replace(/^https?:\/\//, "");
    const wsProtocol = globalThis.location.protocol === "https:" ? "wss:" : "ws:";
    const voice = persona.geminiVoice;
    const wsUrl =
      `${wsProtocol}//${baseHost}/api/system-design/sessions/${encodeURIComponent(sessionId)}/realtime/gemini?` +
      `userId=${encodeURIComponent(userId)}&geminiVoice=${encodeURIComponent(voice)}&interviewDurationMinutes=45`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => startHeartbeat();

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string);

          if (data.type === "pong") return;

          if (data.type === "connected") {
            void ensurePlaybackContext();
            setConnected(true);
            setConnecting(false);
            if (pendingConnectThenStartRef.current) {
              pendingConnectThenStartRef.current = false;
              void startVoiceInterview();
            }
          } else if (data.type === "reconnected") {
            void ensurePlaybackContext();
            setConnected(true);
            setStatusLine("Voice session resumed");
          } else if (data.type === "reconnecting") {
            setStatusLine("Reconnecting…");
          } else if (data.type === "preparing") {
            setPreparing(true);
            setStatusLine(data.message ?? "Getting ready…");
          } else if (data.type === "audio_response" && data.audioData) {
            aiSpeakingForVadRef.current = true;
            setAiSpeaking(true);
            setPreparing(false);
            setStatusLine(null);
            handleGeminiAudio(data.audioData);
          } else if (data.type === "text_response" && typeof data.text === "string") {
            if (data.finished) {
              setAiSpeaking(false);
              setPreparing(false);
              setStatusLine(null);
            }
          } else if (data.type === "turn_complete") {
            if (!playingRef.current) {
              aiSpeakingForVadRef.current = false;
              vadResetRef.current?.();
            }
            setAiSpeaking(false);
            setPreparing(false);
            setStatusLine(null);
          } else if (data.type === "interrupted") {
            stopAiPlaybackRef.current?.();
            vadResetRef.current?.();
            setPreparing(false);
            setStatusLine(null);
          } else if (data.type === "error") {
            pendingConnectThenStartRef.current = false;
            setStartupInFlight(false);
            setError(typeof data.message === "string" ? data.message : "Voice error");
            setConnecting(false);
          } else if (data.type === "session_ended") {
            flushWaitSettleRef.current?.();
            setStatusLine("Voice session ended");
            setVoiceActive(false);
            voiceActiveRef.current = false;
            setStartupInFlight(false);
          } else if (data.type === "interview_ended") {
            // Backend force-ended (e.g. inactivity). Stop streaming and let the
            // parent finalize + navigate; avoid the reconnect/error path on close.
            flushWaitSettleRef.current?.();
            voiceActiveRef.current = false;
            setVoiceActive(false);
            setStartupInFlight(false);
            setStatusLine(
              typeof data.message === "string" ? data.message : "Interview ended",
            );
            const reason =
              typeof data.reason === "string" ? data.reason : "ended";
            onForceEndRef.current?.(reason);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onerror = () => {
        pendingConnectThenStartRef.current = false;
        setConnecting(false);
        if (!voiceActiveRef.current) {
          setError("WebSocket error");
          setStartupInFlight(false);
        }
      };

      ws.onclose = () => {
        flushWaitSettleRef.current?.();
        stopHeartbeat();
        setConnected(false);
        connectionInitiated.current = false;
        wsRef.current = null;
        pendingConnectThenStartRef.current = false;
        if (!voiceActiveRef.current) setStartupInFlight(false);
      };
    } catch (e) {
      connectionInitiated.current = false;
      setConnecting(false);
      pendingConnectThenStartRef.current = false;
      setStartupInFlight(false);
      setError(e instanceof Error ? e.message : "Connection failed");
    }
  };

  const beginVoiceSessionRef = useRef<() => void>(() => {});

  /** One action: establish realtime socket (if needed) + mic + greeting. */
  const beginVoiceSession = () => {
    if (disabled || voiceActive || startupInFlight) return;
    setError(null);
    setStartupInFlight(true);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      pendingConnectThenStartRef.current = false;
      void startVoiceInterview();
      return;
    }

    pendingConnectThenStartRef.current = true;
    connectWebSocket();
  };
  beginVoiceSessionRef.current = beginVoiceSession;

  const autoVoiceKickoffRef = useRef(false);
  useEffect(() => {
    if (!autoStartVoice || disabled) {
      autoVoiceKickoffRef.current = false;
      return;
    }
    if (voiceActive || startupInFlight || connecting) return;
    if (autoVoiceKickoffRef.current) return;
    autoVoiceKickoffRef.current = true;
    queueMicrotask(() => beginVoiceSessionRef.current());
  }, [autoStartVoice, disabled, voiceActive, startupInFlight, connecting]);
  useEffect(() => {
    onDiagramChannelReady?.(connected && voiceActive && !disabled);
  }, [connected, voiceActive, disabled, onDiagramChannelReady]);

  useEffect(() => {
    if (disabled) {
      cleanupAll();
      setConnecting(false);
      setConnected(false);
      setVoiceActive(false);
      setPreparing(false);
      setError(null);
      setStartupInFlight(false);
      pendingConnectThenStartRef.current = false;
      return;
    }
    return () => cleanupAll();
  }, [disabled, sessionId]);

  useEffect(() => {
    if (voiceActive) setStartupInFlight(false);
  }, [voiceActive]);

  const statusSubtitle = disabled
    ? (disabledHint ?? "Interview ended")
    : (error ??
      (!connected
        ? connecting || startupInFlight
          ? "Connecting…"
          : ""
        : !voiceActive
          ? startupInFlight
            ? "Starting microphone…"
            : statusLine ?? ""
          : preparing && voiceActive
            ? (statusLine ?? "Getting ready…")
            : aiSpeaking && voiceActive
              ? "Speaking…"
              : voiceActive
                ? (statusLine ?? "Ready")
                : (statusLine ?? "Ready")));

  return (
    <Card
      className={cn(
        "relative flex min-h-0 w-full flex-col overflow-visible rounded-xl border-0 bg-transparent shadow-none",
        className,
      )}
    >
      <CardContent
        className={cn(
          compact
            ? "flex min-h-0 flex-1 flex-col gap-1 p-1.5"
            : "h-auto gap-2 p-2.5",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center overflow-visible text-center",
            compact ? "gap-0.5" : "gap-2",
          )}
        >
          <div className="shrink-0">
            <AiPersonaAvatar
              persona={persona}
              isSpeaking={Boolean(voiceActive && aiSpeaking)}
              isProcessing={Boolean(voiceActive && preparing)}
              size="lg"
              className={cn(compact && "scale-[0.78] origin-top")}
            />
          </div>
          <div className="min-w-0 w-full">
            <h2
              className={cn(
                "font-semibold tracking-tight text-white",
                compact ? "text-xs sm:text-sm" : "text-sm sm:text-base",
              )}
            >
              {persona.displayName}
            </h2>
            <p
              className={cn(
                "text-violet-200/85",
                compact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs",
              )}
            >
              {persona.title}
            </p>
            {statusSubtitle ? (
              <p
                className={cn(
                  "mt-0.5 text-gray-300/80",
                  compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm",
                  Boolean(error) && "text-red-400/90",
                  Boolean(
                    connected && !preparing && !aiSpeaking && voiceActive,
                  ) && "text-teal-300/90",
                )}
              >
                {statusSubtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            (!voiceActive &&
              !disabled &&
              (!autoStartVoice || Boolean(error))) ||
              (voiceActive && preparing && !disabled)
              ? "border-t border-white/5"
              : null,
            compact ? "mt-auto shrink-0 pt-1" : "mt-1 pt-1.5",
          )}
        >
          <div
            className={cn(
              "flex flex-wrap items-center justify-center",
              compact ? "gap-1.5" : "gap-2",
            )}
          >
            {!voiceActive &&
            !disabled &&
            (!autoStartVoice || Boolean(error)) ? (
              <Button
                type="button"
                size="sm"
                className={cn(
                  "rounded-xl bg-gradient-to-r from-violet-600 to-primary text-white hover:from-violet-700 hover:bg-slate-900",
                  compact ? "h-7 px-3 text-[11px]" : "h-8 px-4 text-xs",
                )}
                disabled={startupInFlight}
                onClick={beginVoiceSession}
              >
                {startupInFlight ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Start New Session
              </Button>
            ) : null}

            {voiceActive && preparing && !disabled ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-gray-400",
                  compact ? "text-[10px]" : "text-[11px]",
                )}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Preparing…
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
SystemDesignVoiceClient.displayName = "SystemDesignVoiceClient";
