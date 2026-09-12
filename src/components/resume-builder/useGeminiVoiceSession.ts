"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildResumeVoiceWsUrl,
  type ChatCollectedProfile,
} from "@/lib/api";

const TARGET_SAMPLE_RATE = 24000;
const GEMINI_MIC_FRAME_SAMPLES_24K = 720;

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "listening"
  | "speaking"
  | "wrapping"
  | "building"
  | "ended"
  | "error";

export interface VoiceTranscriptMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
  finished: boolean;
  createdAt: string;
}

interface UseGeminiVoiceSessionOptions {
  sessionId: string | null;
  /** Gemini prebuilt voice name (optional; backend falls back to env default). */
  geminiVoice?: string;
  onReady: (profile: ChatCollectedProfile) => void;
}

interface UseGeminiVoiceSessionResult {
  status: VoiceStatus;
  error: string | null;
  muted: boolean;
  aiSpeaking: boolean;
  building: boolean;
  messages: VoiceTranscriptMessage[];
  start: () => void;
  sendText: (text: string) => void;
  toggleMute: () => void;
  skipAndBuild: () => void;
  endAndBuild: () => void;
  disconnect: () => void;
}

/**
 * Encapsulates the Resume Builder Gemini Live voice session: WSS connect, mic
 * capture (24 kHz PCM via the shared worklet), 24 kHz playback, live transcript
 * accumulation, and the text / mute / skip / end controls. Keeps the panel thin.
 */
export function useGeminiVoiceSession({
  sessionId,
  geminiVoice,
  onReady,
}: UseGeminiVoiceSessionOptions): UseGeminiVoiceSessionResult {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [building, setBuilding] = useState(false);
  const [messages, setMessages] = useState<VoiceTranscriptMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const connectionInitiated = useRef(false);
  const startedRef = useRef(false);
  const mutedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<AudioNode | null>(null);

  const audioQueueRef = useRef<Int16Array[]>([]);
  const audioBufferRef = useRef<Int16Array[]>([]);
  const audioBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const idCounterRef = useRef(0);
  const streamingAssistantIdRef = useRef<number | null>(null);
  const streamingUserIdRef = useRef<number | null>(null);

  /** Set when the agent signals it's done; auto-build once its audio finishes. */
  const pendingAutoBuildRef = useRef(false);
  const buildingRef = useRef(false);
  const maybeAutoBuildRef = useRef<() => void>(() => {});

  // ── Transcript accumulation ────────────────────────────────────────────────
  const upsertStreamingMessage = useCallback(
    (role: "assistant" | "user", text: string, finished: boolean) => {
      const clean = text.trim();
      const streamRef =
        role === "assistant" ? streamingAssistantIdRef : streamingUserIdRef;

      setMessages((prev) => {
        const currentId = streamRef.current;
        if (currentId !== null) {
          const next = prev.map((m) =>
            m.id === currentId ? { ...m, content: clean, finished } : m,
          );
          return clean ? next : prev.filter((m) => m.id !== currentId);
        }
        if (!clean) return prev;
        const id = ++idCounterRef.current;
        streamRef.current = finished ? null : id;
        return [
          ...prev,
          {
            id,
            role,
            content: clean,
            finished,
            createdAt: new Date().toISOString(),
          },
        ];
      });

      if (finished) streamRef.current = null;
    },
    [],
  );

  const pushFinalMessage = useCallback(
    (role: "assistant" | "user", text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const id = ++idCounterRef.current;
      setMessages((prev) => [
        ...prev,
        {
          id,
          role,
          content: clean,
          finished: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  // ── Playback (24 kHz PCM) ───────────────────────────────────────────────────
  const ensurePlaybackContext = useCallback(() => {
    if (typeof globalThis.window === "undefined") return null;
    try {
      let ctx = audioContextRef.current;
      const WK = (
        globalThis as typeof globalThis & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
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

  const playNext = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (!ctx || audioQueueRef.current.length === 0) {
      playingRef.current = false;
      maybeAutoBuildRef.current();
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
        for (let i = 0; i < binary.length; i++)
          bytes[i] = binary.codePointAt(i) ?? 0;
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
          if (!playingRef.current && audioQueueRef.current.length)
            void playNext();
        }, 20);
      } catch {
        /* ignore */
      }
    },
    [playNext],
  );

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
    setAiSpeaking(false);
  }, []);

  // ── Mic capture (24 kHz PCM frames) ─────────────────────────────────────────
  const setupAudioCapture = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    const pcm16ToBase64 = (arr: Int16Array) => {
      const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++)
        binary += String.fromCharCode(bytes[i]!);
      return btoa(binary);
    };

    const sendFrame = (frame: Int16Array) => {
      if (mutedRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({ type: "audio", audioData: pcm16ToBase64(frame) }),
      );
    };

    const setupWithScriptProcessor = (ctx: AudioContext) => {
      const sr = ctx.sampleRate;
      const ratio = TARGET_SAMPLE_RATE / sr;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (e) => {
        if (mutedRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        let resampled = input;
        if (sr !== TARGET_SAMPLE_RATE) {
          const len = Math.floor(input.length * ratio);
          resampled = new Float32Array(len);
          for (let i = 0; i < len; i++) {
            const src = i / ratio;
            const i0 = Math.floor(src);
            const i1 = Math.min(i0 + 1, input.length - 1);
            resampled[i] =
              input[i0]! * (1 - (src - i0)) + input[i1]! * (src - i0);
          }
        }
        const pcm16 = new Int16Array(resampled.length);
        for (let i = 0; i < resampled.length; i++) {
          const s = Math.max(-1, Math.min(1, resampled[i]!));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        sendFrame(pcm16);
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      audioProcessorRef.current = processor;
    };

    try {
      const WK = (
        globalThis as typeof globalThis & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
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
              if (mutedRef.current) return;
              const chunk = new Int16Array(ev.data.pcm16 as ArrayBuffer);
              for (let i = 0; i < chunk.length; i++) pending.push(chunk[i]!);
              while (pending.length >= GEMINI_MIC_FRAME_SAMPLES_24K) {
                const frame = new Int16Array(GEMINI_MIC_FRAME_SAMPLES_24K);
                for (let i = 0; i < GEMINI_MIC_FRAME_SAMPLES_24K; i++)
                  frame[i] = pending[i]!;
                pending.splice(0, GEMINI_MIC_FRAME_SAMPLES_24K);
                sendFrame(frame);
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
      console.error("[RB Voice] setupAudioCapture:", e);
    }
  }, []);

  // ── Teardown ────────────────────────────────────────────────────────────────
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const releaseAudio = useCallback(() => {
    if (audioProcessorRef.current) {
      try {
        audioProcessorRef.current.disconnect();
      } catch {
        /* ignore */
      }
      audioProcessorRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
    mediaStreamRef.current = null;
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
  }, []);

  const disconnect = useCallback(() => {
    stopHeartbeat();
    releaseAudio();
    const ws = wsRef.current;
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    wsRef.current = null;
    connectionInitiated.current = false;
    startedRef.current = false;
  }, [releaseAudio, stopHeartbeat]);

  // ── WebSocket ───────────────────────────────────────────────────────────────
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

  const beginMicAndStart = useCallback(async () => {
    if (startedRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      startedRef.current = true;
      setupAudioCapture();
      wsRef.current?.send(JSON.stringify({ type: "start" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone permission denied.");
      setStatus("error");
    }
  }, [setupAudioCapture]);

  const handleMessage = useCallback(
    (data: Record<string, unknown>) => {
      const type = data.type as string;
      if (type === "pong" || type === "server_ping") return;

      if (type === "connected" || type === "reconnected") {
        void ensurePlaybackContext();
        setStatus("ready");
        setError(null);
        void beginMicAndStart();
      } else if (type === "preparing") {
        setStatus("ready");
      } else if (type === "audio_response" && typeof data.audioData === "string") {
        setAiSpeaking(true);
        setStatus("speaking");
        handleGeminiAudio(data.audioData);
      } else if (type === "text_response" && typeof data.text === "string") {
        upsertStreamingMessage("assistant", data.text, data.finished === true);
      } else if (type === "user_transcript" && typeof data.text === "string") {
        if (data.finished === true) {
          // Typed answers arrive already-final; freeze any streaming voice bubble.
          if (streamingUserIdRef.current !== null) {
            upsertStreamingMessage("user", data.text, true);
          } else {
            pushFinalMessage("user", data.text);
          }
        } else {
          upsertStreamingMessage("user", data.text, false);
        }
      } else if (type === "turn_complete") {
        streamingAssistantIdRef.current = null;
        streamingUserIdRef.current = null;
        if (!playingRef.current) {
          setAiSpeaking(false);
          if (!pendingAutoBuildRef.current && !buildingRef.current) {
            setStatus("listening");
          }
        }
        maybeAutoBuildRef.current();
      } else if (type === "agent_complete") {
        // Agent finished its closing turn — build automatically once it stops
        // speaking so the candidate doesn't have to press a button.
        pendingAutoBuildRef.current = true;
        if (!buildingRef.current) setStatus("wrapping");
        maybeAutoBuildRef.current();
      } else if (type === "interrupted") {
        stopAiPlayback();
        streamingAssistantIdRef.current = null;
      } else if (type === "building") {
        setBuilding(true);
        setStatus("building");
      } else if (type === "session_ready") {
        buildingRef.current = false;
        setBuilding(false);
        setStatus("ended");
        const profile = (data.collectedProfile ?? {}) as ChatCollectedProfile;
        onReadyRef.current(profile);
      } else if (type === "session_ended") {
        setStatus("ended");
      } else if (type === "error") {
        setError(typeof data.message === "string" ? data.message : "Voice error");
        setStatus("error");
        buildingRef.current = false;
        pendingAutoBuildRef.current = false;
        setBuilding(false);
      }
    },
    [
      beginMicAndStart,
      ensurePlaybackContext,
      handleGeminiAudio,
      pushFinalMessage,
      stopAiPlayback,
      upsertStreamingMessage,
    ],
  );

  const start = useCallback(() => {
    if (!sessionId || connectionInitiated.current) return;
    const userId =
      typeof globalThis.window !== "undefined"
        ? localStorage.getItem("clerk-user-id")
        : null;
    if (!userId) {
      setError("Sign in required for voice.");
      setStatus("error");
      return;
    }

    connectionInitiated.current = true;
    setStatus("connecting");
    setError(null);

    try {
      const ws = new WebSocket(
        buildResumeVoiceWsUrl(sessionId, userId, geminiVoice),
      );
      wsRef.current = ws;
      ws.onopen = () => startHeartbeat();
      ws.onmessage = (ev) => {
        try {
          handleMessage(JSON.parse(ev.data as string));
        } catch {
          /* ignore */
        }
      };
      ws.onerror = () => {
        if (status !== "ended" && status !== "building") {
          setError("Connection error");
        }
      };
      ws.onclose = () => {
        stopHeartbeat();
        connectionInitiated.current = false;
        wsRef.current = null;
      };
    } catch (e) {
      connectionInitiated.current = false;
      setError(e instanceof Error ? e.message : "Connection failed");
      setStatus("error");
    }
  }, [geminiVoice, handleMessage, sessionId, startHeartbeat, status, stopHeartbeat]);

  const triggerBuild = useCallback((kind: "skip_and_build" | "end_session") => {
    const ws = wsRef.current;
    if (buildingRef.current || ws?.readyState !== WebSocket.OPEN) return;
    buildingRef.current = true;
    pendingAutoBuildRef.current = false;
    setBuilding(true);
    setStatus("building");
    ws.send(JSON.stringify({ type: kind }));
  }, []);

  const maybeAutoBuild = useCallback(() => {
    if (
      pendingAutoBuildRef.current &&
      !buildingRef.current &&
      !playingRef.current
    ) {
      triggerBuild("end_session");
    }
  }, [triggerBuild]);
  useEffect(() => {
    maybeAutoBuildRef.current = maybeAutoBuild;
  }, [maybeAutoBuild]);

  const sendText = useCallback((text: string) => {
    const clean = text.trim();
    const ws = wsRef.current;
    if (!clean || ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "text", text: clean }));
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      return next;
    });
  }, []);

  const skipAndBuild = useCallback(
    () => triggerBuild("skip_and_build"),
    [triggerBuild],
  );

  const endAndBuild = useCallback(
    () => triggerBuild("end_session"),
    [triggerBuild],
  );

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    status,
    error,
    muted,
    aiSpeaking,
    building,
    messages,
    start,
    sendText,
    toggleMute,
    skipAndBuild,
    endAndBuild,
    disconnect,
  };
}
