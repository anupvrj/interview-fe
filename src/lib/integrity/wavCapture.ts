export const VOICEPRINT_SAMPLE_RATE = 16_000;
export const VOICEPRINT_ENROLL_MS = 5000;
export const VOICEPRINT_VERIFY_MS = 2500;
export const VOICEPRINT_RMS_MIN = 0.015;

export function pcmRms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i]!;
    sumSq += s * s;
  }
  return Math.sqrt(sumSq / samples.length);
}

export function resampleLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return input;
  if (fromRate <= 0 || toRate <= 0 || input.length === 0) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = input[i0]! * (1 - t) + input[i1]! * t;
  }
  return out;
}

export function encodeWavPcm16(samples: Float32Array, sampleRate: number): Blob {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeStr = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataBytes, true);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function recordWavFromStream(
  stream: MediaStream,
  durationMs: number,
  onRms?: (rms: number) => void,
): Promise<{ base64: string; rms: number }> {
  const audioTracks = stream.getAudioTracks().filter((t) => t.readyState === "live");
  if (audioTracks.length === 0) {
    throw new Error("Microphone is not available");
  }
  const ctx = new AudioContext();
  const nativeRate = ctx.sampleRate || 48000;
  const source = ctx.createMediaStreamSource(new MediaStream(audioTracks));
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const silent = ctx.createGain();
  silent.gain.value = 0;
  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(input));
    onRms?.(pcmRms(input));
  };
  source.connect(processor);
  processor.connect(silent);
  silent.connect(ctx.destination);
  await ctx.resume();
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  source.disconnect();
  processor.disconnect();
  silent.disconnect();
  await ctx.close();

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const resampled = resampleLinear(merged, nativeRate, VOICEPRINT_SAMPLE_RATE);
  const rms = pcmRms(resampled);
  const wav = encodeWavPcm16(resampled, VOICEPRINT_SAMPLE_RATE);
  return { base64: await blobToBase64(wav), rms };
}
