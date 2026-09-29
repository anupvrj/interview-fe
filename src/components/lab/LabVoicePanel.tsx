"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { connectVoiceSession } from "@/lib/runtimeApi";

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
  partial?: boolean;
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
  const endTestRef = useRef<() => void>(() => {});

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    timerRef.current = setInterval(() => {
      const started = startedAtRef.current;
      if (!started) return;
      const sec = Math.floor((Date.now() - started) / 1000);
      setElapsedSec(sec);
      if (sec >= LIVE_TEST_CAP_SEC) {
        onStatus("live test cap reached — ending");
        endTestRef.current();
      }
    }, 1000);
  }, [onStatus, stopTimer]);

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

  const cleanup = useCallback(
    (opts?: { showDeployHint?: boolean }) => {
      voiceActiveRef.current = false;
      setActive(false);
      setAiSpeaking(false);
      processorRef.current?.disconnect?.();
      processorRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
      stopTimer();
      setAiPartial("");
      setUserPartial("");
      if (opts?.showDeployHint) {
        setEndedHint(true);
        onEnded?.();
      }
    },
    [onEnded, stopTimer],
  );

  const endTest = useCallback(() => {
    onStatus("live test ended");
    cleanup({ showDeployHint: true });
  }, [cleanup, onStatus]);

  useEffect(() => {
    endTestRef.current = endTest;
  }, [endTest]);

  const setupMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: TARGET_SAMPLE_RATE,
        channelCount: 1,
      } as MediaTrackConstraints,
    });
    mediaStreamRef.current = stream;

    const WK = (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
    const AudioCtx = globalThis.AudioContext || WK;
    const ctx = new AudioCtx!();
    audioContextRef.current = ctx;
    await ctx.resume();

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

  const appendLine = useCallback(
    (role: "ai" | "user", text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      lineIdRef.current += 1;
      const id = `t-${lineIdRef.current}`;
      setLines((prev) => [...prev, { id, role, text: trimmed }]);
      const labeled = role === "ai" ? `[AI] ${trimmed}` : `[You] ${trimmed}`;
      onTranscript?.(labeled);
    },
    [onTranscript],
  );

  const startVoice = useCallback(async () => {
    if (!sessionId) {
      onStatus("Create a session first (Live Test or Render)");
      return;
    }
    cleanup();
    setEndedHint(false);
    setLines([]);
    setAiPartial("");
    setUserPartial("");
    onStatus("connecting voice…");
    voiceActiveRef.current = true;

    const ws = connectVoiceSession(sessionId);
    wsRef.current = ws;

    ws.onopen = () => onStatus("WS open — waiting for Gemini proxy…");
    ws.onerror = () => onStatus("voice WS error");
    ws.onclose = () => {
      if (voiceActiveRef.current) {
        onStatus("voice disconnected");
      }
      voiceActiveRef.current = false;
      setActive(false);
      stopTimer();
    };

    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as Record<string, unknown>;
        const type = String(msg.type ?? "");

        if (type === "proxy_connected") {
          onStatus("proxy ready — starting mic");
          try {
            await setupMic();
            setActive(true);
            startTimer();
            ws.send(JSON.stringify({ type: "response.create" }));
            onStatus("live — speak into your mic");
          } catch (e) {
            onStatus(`mic error: ${e instanceof Error ? e.message : String(e)}`);
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

        // Optional user partials when provider emits them
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
          onStatus(`error: ${JSON.stringify(msg.error ?? msg)}`);
        }
      } catch {
        /* binary */
      }
    };
  }, [
    sessionId,
    cleanup,
    enqueueAudio,
    onStatus,
    setupMic,
    startTimer,
    stopTimer,
    appendLine,
  ]);

  useEffect(() => () => cleanup(), [cleanup]);

  useEffect(() => {
    if (!autoStart || !sessionId) return;
    if (autoStartedForRef.current === sessionId) return;
    autoStartedForRef.current = sessionId;
    void startVoice();
  }, [autoStart, sessionId, startVoice]);

  const remaining = Math.max(0, LIVE_TEST_CAP_SEC - elapsedSec);
  const showTimer = active || endedHint;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!sessionId || active}
          onClick={() => void startVoice()}
        >
          {active ? "Live…" : "Start"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={active ? "destructive" : "outline"}
          disabled={!active && !sessionId}
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
          Multi-turn Lab voice on the runtime session (mic + speaker). Soft cap{" "}
          {LIVE_TEST_CAP_SEC / 60} min — End Test closes WS and mic.
        </p>
      )}
    </div>
  );
}
