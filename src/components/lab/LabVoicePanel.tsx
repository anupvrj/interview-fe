"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { connectVoiceSession, getRuntimeApiUrl, getRuntimeWsUrl } from "@/lib/runtimeApi";

const TARGET_SAMPLE_RATE = 24000;
const MIC_FRAME_SAMPLES = 720;
/** Soft Lab live-test cap (5 minutes). */
const LIVE_TEST_CAP_SEC = 5 * 60;

function pcm16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function formatTimer(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type TranscriptLine = {
  id: string;
  role: "ai" | "user";
  text: string;
};

type Props = {
  sessionId: string | null;
  onStatus: (status: string) => void;
  onTranscript?: (line: string) => void;
  /** When true, auto-start voice as soon as sessionId is set (Live Test one-click). */
  autoStart?: boolean;
  onEnded?: () => void;
};

export function LabVoicePanel({
  sessionId,
  onStatus,
  onTranscript,
  autoStart = false,
  onEnded,
}: Props) {
  const [active, setActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [endedHint, setEndedHint] = useState(false);
  const [aiPartial, setAiPartial] = useState("");
  const [userPartial, setUserPartial] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const playingRef = useRef(false);
  const voiceActiveRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartedForRef = useRef<string | null>(null);
  const lineIdRef = useRef(0);
  /** Bumps on every start/end so stale WS handlers cannot reopen mic. */
  const connGenRef = useRef(0);
  const onStatusRef = useRef(onStatus);
  const onEndedRef = useRef(onEnded);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hardStopAudio = useCallback(() => {
    audioQueueRef.current = [];
    playingRef.current = false;
    setAiSpeaking(false);
    processorRef.current?.disconnect?.();
    processorRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx) {
      void ctx.close().catch(() => undefined);
    }
  }, []);

  const closeWs = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (!ws) return;
    ws.onopen = null;
    ws.onerror = null;
    ws.onclose = null;
    ws.onmessage = null;
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const teardown = useCallback(
    (opts?: { showDeployHint?: boolean; status?: string }) => {
      connGenRef.current += 1;
      voiceActiveRef.current = false;
      setActive(false);
      setConnecting(false);
      hardStopAudio();
      closeWs();
      stopTimer();
      setAiPartial("");
      setUserPartial("");
      if (opts?.status) onStatusRef.current(opts.status);
      if (opts?.showDeployHint) {
        setEndedHint(true);
        onEndedRef.current?.();
      }
    },
    [closeWs, hardStopAudio, stopTimer],
  );

  const startTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    const gen = connGenRef.current;
    timerRef.current = setInterval(() => {
      if (connGenRef.current !== gen) return;
      const started = startedAtRef.current;
      if (!started) return;
      const sec = Math.floor((Date.now() - started) / 1000);
      setElapsedSec(sec);
      if (sec >= LIVE_TEST_CAP_SEC) {
        onStatusRef.current("live test cap reached — ending");
        teardown({ showDeployHint: true, status: "live test ended" });
      }
    }, 1000);
  }, [stopTimer, teardown]);

  const playNext = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (!ctx || audioQueueRef.current.length === 0) {
      playingRef.current = false;
      setAiSpeaking(false);
      return;
    }
    playingRef.current = true;
    setAiSpeaking(true);
    const pcm16 = audioQueueRef.current.shift()!;
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i]! / 32768;
    const buffer = ctx.createBuffer(1, float32.length, TARGET_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => void playNext();
    source.start();
  }, []);

  const enqueueAudio = useCallback(
    (base64: string) => {
      if (!voiceActiveRef.current) return;
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < bytes.length; i++) bytes[i] = binary.codePointAt(i) ?? 0;
        if (bytes.length === 0) return;
        audioQueueRef.current.push(new Int16Array(bytes.buffer));
        if (!playingRef.current) void playNext();
      } catch {
        /* ignore */
      }
    },
    [playNext],
  );

  const setupMic = useCallback(async (gen: number) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: TARGET_SAMPLE_RATE,
        channelCount: 1,
      } as MediaTrackConstraints,
    });
    if (connGenRef.current !== gen) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    mediaStreamRef.current = stream;

    const WK = (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
    const AudioCtx = globalThis.AudioContext || WK;
    const ctx = new AudioCtx!();
    audioContextRef.current = ctx;
    await ctx.resume();
    if (connGenRef.current !== gen) {
      void ctx.close().catch(() => undefined);
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    const source = ctx.createMediaStreamSource(stream);
    const pending: number[] = [];

    const flushFrame = (ws: WebSocket) => {
      if (pending.length < MIC_FRAME_SAMPLES) return;
      const frame = new Int16Array(MIC_FRAME_SAMPLES);
      for (let i = 0; i < MIC_FRAME_SAMPLES; i++) frame[i] = pending[i]!;
      pending.splice(0, MIC_FRAME_SAMPLES);
      if (ws.readyState === WebSocket.OPEN && voiceActiveRef.current) {
        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: pcm16ToBase64(frame),
          }),
        );
      }
    };

    if (ctx.audioWorklet) {
      try {
        await ctx.audioWorklet.addModule("/mic-processor.worklet.js");
        if (connGenRef.current !== gen) return;
        const worklet = new AudioWorkletNode(ctx, "mic-processor", {
          processorOptions: { targetSampleRate: TARGET_SAMPLE_RATE },
        });
        worklet.port.onmessage = (ev) => {
          if (ev.data.type !== "audio_chunk" || !voiceActiveRef.current) return;
          const chunk = new Int16Array(ev.data.pcm16 as ArrayBuffer);
          for (let i = 0; i < chunk.length; i++) pending.push(chunk[i]!);
          const ws = wsRef.current;
          if (ws) while (pending.length >= MIC_FRAME_SAMPLES) flushFrame(ws);
        };
        source.connect(worklet);
        worklet.connect(ctx.destination);
        processorRef.current = worklet;
        return;
      } catch {
        /* fall through */
      }
    }

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!voiceActiveRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        pending.push(Math.max(-32768, Math.min(32767, input[i]! * 32768)));
      }
      const ws = wsRef.current;
      if (ws) while (pending.length >= MIC_FRAME_SAMPLES) flushFrame(ws);
    };
    source.connect(processor);
    processor.connect(ctx.destination);
    processorRef.current = processor;
  }, []);

  const appendLine = useCallback((role: "ai" | "user", text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    lineIdRef.current += 1;
    const id = `t-${lineIdRef.current}`;
    setLines((prev) => [...prev, { id, role, text: trimmed }]);
    const labeled = role === "ai" ? `[AI] ${trimmed}` : `[You] ${trimmed}`;
    onTranscriptRef.current?.(labeled);
  }, []);

  const startVoice = useCallback(async () => {
    if (!sessionId) {
      onStatusRef.current("Create a session first (Live Test or Render)");
      return;
    }

    teardown();
    const gen = connGenRef.current;
    setEndedHint(false);
    setLines([]);
    setAiPartial("");
    setUserPartial("");
    setConnecting(true);
    voiceActiveRef.current = true;
    onStatusRef.current(
      `connecting voice… (${getRuntimeWsUrl().replace(/^wss?:\/\//, "")})`,
    );

    const ws = connectVoiceSession(sessionId);
    if (connGenRef.current !== gen) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (connGenRef.current !== gen) return;
      onStatusRef.current("WS open — waiting for Gemini proxy…");
    };
    ws.onerror = () => {
      if (connGenRef.current !== gen) return;
      onStatusRef.current("voice WS error");
    };
    ws.onclose = () => {
      if (connGenRef.current !== gen) return;
      if (voiceActiveRef.current) {
        onStatusRef.current("voice disconnected");
      }
      voiceActiveRef.current = false;
      setActive(false);
      setConnecting(false);
      stopTimer();
    };

    ws.onmessage = async (ev) => {
      if (connGenRef.current !== gen || !voiceActiveRef.current) return;
      try {
        const msg = JSON.parse(ev.data as string) as Record<string, unknown>;
        const type = String(msg.type ?? "");

        if (type === "proxy_connected") {
          onStatusRef.current("proxy ready — starting mic");
          try {
            await setupMic(gen);
            if (connGenRef.current !== gen) return;
            setConnecting(false);
            setActive(true);
            startTimer();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "response.create" }));
            }
            onStatusRef.current(
              `live on ${getRuntimeApiUrl().replace(/^https?:\/\//, "")} — speak`,
            );
          } catch (e) {
            onStatusRef.current(
              `mic error: ${e instanceof Error ? e.message : String(e)}`,
            );
            teardown({ status: "mic error" });
          }
          return;
        }

        if (type === "response.audio.delta" && typeof msg.delta === "string") {
          enqueueAudio(msg.delta);
          return;
        }

        if (type === "response.audio_transcript.delta" && typeof msg.delta === "string") {
          setAiPartial((prev) => prev + msg.delta);
          return;
        }

        if (type === "response.audio_transcript.done" && typeof msg.transcript === "string") {
          appendLine("ai", msg.transcript);
          setAiPartial("");
          return;
        }

        if (
          type === "conversation.item.input_audio_transcription.delta" &&
          typeof msg.delta === "string"
        ) {
          setUserPartial((prev) => prev + msg.delta);
          return;
        }

        if (
          type === "conversation.item.input_audio_transcription.completed" &&
          typeof msg.transcript === "string"
        ) {
          appendLine("user", msg.transcript);
          setUserPartial("");
          return;
        }

        if (type === "error") {
          onStatusRef.current(`error: ${JSON.stringify(msg.error ?? msg)}`);
        }
      } catch {
        /* binary */
      }
    };
  }, [sessionId, teardown, setupMic, startTimer, stopTimer, enqueueAudio, appendLine]);

  const endTest = useCallback(() => {
    teardown({ showDeployHint: true, status: "live test ended" });
  }, [teardown]);

  // Unmount only — do not depend on teardown identity (avoids closing live WS on re-render).
  useEffect(() => {
    return () => {
      connGenRef.current += 1;
      voiceActiveRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      audioQueueRef.current = [];
      playingRef.current = false;
      processorRef.current?.disconnect?.();
      processorRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      if (ctx) void ctx.close().catch(() => undefined);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onopen = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.onmessage = null;
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!autoStart || !sessionId) return;
    if (autoStartedForRef.current === sessionId) return;
    autoStartedForRef.current = sessionId;
    void startVoice();
  }, [autoStart, sessionId, startVoice]);

  const remaining = Math.max(0, LIVE_TEST_CAP_SEC - elapsedSec);
  const showTimer = active || endedHint || connecting;
  const canEnd = active || connecting || !!sessionId;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!sessionId || active || connecting}
          onClick={() => void startVoice()}
        >
          {active || connecting ? "Live…" : "Start"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={active || connecting ? "destructive" : "outline"}
          disabled={!canEnd}
          onClick={endTest}
        >
          End Test
        </Button>
        {showTimer ? (
          <span className="font-mono text-xs text-muted-foreground">
            {formatTimer(elapsedSec)}
            {active ? ` · ${formatTimer(remaining)} left` : null}
          </span>
        ) : null}
        {aiSpeaking ? (
          <span className="text-xs text-muted-foreground">AI speaking…</span>
        ) : active ? (
          <span className="text-xs text-muted-foreground">Listening…</span>
        ) : connecting ? (
          <span className="text-xs text-muted-foreground">Connecting…</span>
        ) : null}
      </div>

      {endedHint ? (
        <p className="mb-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-900 dark:text-emerald-100">
          Ready to Deploy? Switch to the Deploy tab to promote this agent — Live
          Test does not auto-promote.
        </p>
      ) : null}

      {lines.length > 0 || aiPartial || userPartial ? (
        <div className="max-h-48 space-y-1.5 overflow-auto rounded-md border border-border/40 bg-background/40 p-2 text-xs">
          {lines.map((line) => (
            <p
              key={line.id}
              className={
                line.role === "ai"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              <span className="font-medium">
                {line.role === "ai" ? "AI" : "You"}:{" "}
              </span>
              {line.text}
            </p>
          ))}
          {aiPartial ? (
            <p className="italic text-muted-foreground">
              <span className="font-medium not-italic">AI: </span>
              {aiPartial}
            </p>
          ) : null}
          {userPartial ? (
            <p className="italic text-muted-foreground">
              <span className="font-medium not-italic">You: </span>
              {userPartial}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Multi-turn Lab voice via runtime WS (
          {getRuntimeWsUrl().replace(/^wss?:\/\//, "")}
          ). Soft cap {LIVE_TEST_CAP_SEC / 60} min — End Test closes WS and mic.
        </p>
      )}
    </div>
  );
}
