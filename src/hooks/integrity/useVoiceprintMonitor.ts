"use client";

import { useEffect, type MutableRefObject } from "react";
import { verifyVoiceprint } from "@/lib/integrity/IntegrityTelemetryClient";
import {
  VOICEPRINT_RMS_MIN,
  VOICEPRINT_SAMPLE_RATE,
  VOICEPRINT_VERIFY_MS,
  blobToBase64,
  encodeWavPcm16,
  pcmRms,
  resampleLinear,
} from "@/lib/integrity/wavCapture";
import type { IntegritySessionKind } from "@/lib/integrity/types";

const VERIFY_GAP_MS = 20_000;

export function useVoiceprintMonitor(opts: {
  enabled: boolean;
  kind: IntegritySessionKind;
  sessionId: string;
  stream: MediaStream | null;
  aiSpeakingRef?: MutableRefObject<boolean>;
  micMutedRef?: MutableRefObject<boolean>;
}) {
  const aiSpeakingRef = opts.aiSpeakingRef;
  const micMutedRef = opts.micMutedRef;

  useEffect(() => {
    if (!opts.enabled || !opts.stream || !opts.sessionId) return;
    const audioTracks = opts.stream
      .getAudioTracks()
      .filter((t) => t.readyState === "live");
    if (audioTracks.length === 0) return;

    let cancelled = false;
    const ctx = new AudioContext();
    const nativeRate = ctx.sampleRate || 48000;
    const source = ctx.createMediaStreamSource(new MediaStream(audioTracks));
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const silent = ctx.createGain();
    silent.gain.value = 0;
    const speech: Float32Array[] = [];
    let speechSamples = 0;
    let lastSent = 0;
    let sending = false;
    const needed = Math.round((VOICEPRINT_VERIFY_MS / 1000) * nativeRate);

    const flush = async () => {
      if (sending || cancelled) return;
      if (speechSamples < needed) return;
      if (Date.now() - lastSent < VERIFY_GAP_MS) return;
      sending = true;
      lastSent = Date.now();
      const merged = new Float32Array(speechSamples);
      let offset = 0;
      for (const chunk of speech) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      speech.length = 0;
      speechSamples = 0;
      const resampled = resampleLinear(merged, nativeRate, VOICEPRINT_SAMPLE_RATE);
      try {
        const wav = encodeWavPcm16(resampled, VOICEPRINT_SAMPLE_RATE);
        await verifyVoiceprint(opts.kind, opts.sessionId, {
          audioWavBase64: await blobToBase64(wav),
        });
      } catch {
        /* live verify is best-effort; enrollment already stored */
      } finally {
        sending = false;
      }
    };

    processor.onaudioprocess = (event) => {
      if (cancelled) return;
      if (aiSpeakingRef?.current || micMutedRef?.current) {
        speech.length = 0;
        speechSamples = 0;
        return;
      }
      const input = event.inputBuffer.getChannelData(0);
      if (pcmRms(input) < VOICEPRINT_RMS_MIN) return;
      speech.push(new Float32Array(input));
      speechSamples += input.length;
      if (speechSamples >= needed) void flush();
    };

    source.connect(processor);
    processor.connect(silent);
    silent.connect(ctx.destination);
    void ctx.resume().catch(() => {});

    return () => {
      cancelled = true;
      source.disconnect();
      processor.disconnect();
      silent.disconnect();
      void ctx.close().catch(() => {});
    };
  }, [opts.enabled, opts.kind, opts.sessionId, opts.stream]);
}
