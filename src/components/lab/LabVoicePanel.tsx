"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectVoiceSession } from "@/lib/runtimeApi";

const TARGET_SAMPLE_RATE = 24000;
const MIC_FRAME_SAMPLES = 720;

function pcm16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

type Props = {
  sessionId: string | null;
  onStatus: (status: string) => void;
  onTranscript?: (line: string) => void;
};

export function LabVoicePanel({ sessionId, onStatus, onTranscript }: Props) {
  const [active, setActive] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const playingRef = useRef(false);
  const voiceActiveRef = useRef(false);

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
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.codePointAt(i) ?? 0;
        if (bytes.length === 0) return;
        audioQueueRef.current.push(new Int16Array(bytes.buffer));
        if (!playingRef.current) void playNext();
      } catch {
        /* ignore */
      }
    },
    [playNext],
  );

  const cleanup = useCallback(() => {
    voiceActiveRef.current = false;
    setActive(false);
    setAiSpeaking(false);
    processorRef.current?.disconnect?.();
    processorRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

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

  const startVoice = useCallback(async () => {
    if (!sessionId) {
      onStatus("Create a session first (Render prompt or Start voice)");
      return;
    }
    cleanup();
    onStatus("connecting voice…");
    voiceActiveRef.current = true;

    const ws = connectVoiceSession(sessionId);
    wsRef.current = ws;

    ws.onopen = () => onStatus("WS open — waiting for Gemini proxy…");
    ws.onerror = () => onStatus("voice WS error");
    ws.onclose = () => {
      onStatus("voice disconnected");
      voiceActiveRef.current = false;
      setActive(false);
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
          setTranscript((prev) => {
            const next = prev + msg.delta;
            onTranscript?.(next);
            return next;
          });
          return;
        }

        if (type === "response.audio_transcript.done" && typeof msg.transcript === "string") {
          const line = `[AI] ${msg.transcript}`;
          setTranscript((prev) => `${prev}\n${line}\n`);
          onTranscript?.(line);
        }

        if (type === "error") {
          onStatus(`error: ${JSON.stringify(msg.error ?? msg)}`);
        }
      } catch {
        /* binary */
      }
    };
  }, [sessionId, cleanup, enqueueAudio, onStatus, onTranscript, setupMic]);

  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!sessionId}
          onClick={() => void startVoice()}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {active ? "Restart voice" : "Start live voice (mic)"}
        </button>
        <button
          type="button"
          onClick={cleanup}
          className="rounded border border-border px-3 py-1.5 text-sm"
        >
          Stop
        </button>
        {aiSpeaking ? (
          <span className="text-xs text-muted-foreground">AI speaking…</span>
        ) : active ? (
          <span className="text-xs text-muted-foreground">Listening…</span>
        ) : null}
      </div>
      {transcript ? (
        <pre className="max-h-32 overflow-auto text-xs whitespace-pre-wrap text-muted-foreground">
          {transcript}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">
          Uses runtime Gemini proxy with browser mic + speaker (same wire format as
          production voice).
        </p>
      )}
    </div>
  );
}
