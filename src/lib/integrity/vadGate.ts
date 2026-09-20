export const VAD_ABS_FLOOR = 0.003;
export const VAD_THRESHOLD_FACTOR = 1.6;
export const VAD_NOISE_EMA = 0.04;
export const VAD_NOISE_FLOOR_INIT = 0.002;
export const VAD_NOISE_FLOOR_MAX = 0.018;
/** Match interview-core: thinking for ~15s is normal; do not flag sooner. */
export const HIGH_TURN_LATENCY_MS = 15_000;
export const TURN_TELEMETRY_SKIP_TURNS = 2;

export function computePcm16Rms(frame: Int16Array): number {
  if (frame.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < frame.length; i += 1) {
    const s = frame[i]! / 32768;
    sumSq += s * s;
  }
  return Math.sqrt(sumSq / frame.length);
}

export function computeAnalyserRms(
  analyser: AnalyserNode,
  buffer: Uint8Array<ArrayBuffer>,
): number {
  analyser.getByteTimeDomainData(buffer);
  let sumSq = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const s = (buffer[i]! - 128) / 128;
    sumSq += s * s;
  }
  return Math.sqrt(sumSq / buffer.length);
}

export function createSpeechOnsetDetector(onSpeechStart: () => void) {
  let noiseFloor = VAD_NOISE_FLOOR_INIT;
  let speaking = false;

  return {
    reset() {
      noiseFloor = VAD_NOISE_FLOOR_INIT;
      speaking = false;
    },
    pushRms(rms: number) {
      const threshold = Math.max(VAD_ABS_FLOOR, noiseFloor * VAD_THRESHOLD_FACTOR);
      if (rms > threshold) {
        if (!speaking) {
          speaking = true;
          onSpeechStart();
        }
        return;
      }
      speaking = false;
      if (rms < threshold * 0.55) {
        noiseFloor = Math.min(
          VAD_NOISE_FLOOR_MAX,
          noiseFloor * (1 - VAD_NOISE_EMA) + rms * VAD_NOISE_EMA,
        );
      }
    },
  };
}

export function shouldFlagTurnLatency(opts: {
  turnIndex: number;
  micMuted: boolean;
  bargeIn: boolean;
  playbackDrained: boolean;
  turnComplete: boolean;
  turnLatencyMs: number;
}): boolean {
  if (opts.turnIndex < TURN_TELEMETRY_SKIP_TURNS) return false;
  if (opts.micMuted || opts.bargeIn) return false;
  if (!opts.playbackDrained || !opts.turnComplete) return false;
  return opts.turnLatencyMs > HIGH_TURN_LATENCY_MS;
}
