export const FACE_SAMPLE_MS = 2000;
export const FACE_ABSENT_EMIT_MS = 8000;
export const FACE_ABSENT_SCORE_MS = 15_000;
export const SPEECH_MOUTH_SAMPLE_MS = 150;
export const SPEECH_WITHOUT_MOUTH_EMIT_MS = 2500;
export const SPEECH_WITHOUT_MOUTH_DEDUP_MS = 12_000;
export const SPEECH_RMS_MIN = 0.02;
export const MOUTH_OPEN_MIN = 0.08;
export const FACE_MIN_SCORE = 0.65;
export const FACE_MIN_AREA_RATIO = 0.05;
export const FACE_SECOND_MIN_RELATIVE = 0.5;
export const MULTI_FACE_HOLD_MS = 2500;
export const MULTI_FACE_DEDUP_MS = 15_000;
/** Lag-hunting RMS vs jawOpen is not a real lip-sync model. Keep off. */
export const LIPSYNC_DETECTION_ENABLED = false;
export const LIPSYNC_WINDOW = 16;
export const LIPSYNC_MAX_LAG = 5;
export const LIPSYNC_UNCORR_MAX = 0.22;
export const LIPSYNC_FOLLOW_MIN_R = 0.35;
export const LIPSYNC_FOLLOW_MIN_LAG_MS = 600;
export const LIPSYNC_MOUTH_VAR_MIN = 0.00035;
export const LIPSYNC_DEDUP_MS = 12_000;

export type LipSyncMismatchReason = "uncorrelated" | "audio_follow";

export type FaceHit = {
  score: number;
  areaRatio: number;
};

export function countValidFaces(hits: readonly FaceHit[]): number {
  const valid = hits.filter(
    (hit) => hit.score >= FACE_MIN_SCORE && hit.areaRatio >= FACE_MIN_AREA_RATIO,
  );
  if (valid.length <= 1) return valid.length;
  const largest = Math.max(...valid.map((hit) => hit.areaRatio));
  return valid.filter((hit) => hit.areaRatio >= largest * FACE_SECOND_MIN_RELATIVE)
    .length;
}

export function shouldEmitMultipleFaces(opts: {
  faceCount: number;
  heldMs: number;
  sinceLastEmitMs: number;
}): boolean {
  return (
    opts.faceCount >= 2 &&
    opts.heldMs >= MULTI_FACE_HOLD_MS &&
    opts.sinceLastEmitMs >= MULTI_FACE_DEDUP_MS
  );
}

export function shouldEmitAbsence(
  absentMs: number,
  alreadyEmitted: boolean,
): boolean {
  return !alreadyEmitted && absentMs >= FACE_ABSENT_EMIT_MS;
}

export function absenceSeverity(
  absentMs: number,
): "MEDIUM" | "HIGH" {
  return absentMs > FACE_ABSENT_SCORE_MS ? "HIGH" : "MEDIUM";
}

export function shouldFlagSpeechWithoutMouth(opts: {
  aiSpeaking: boolean;
  micMuted: boolean;
  faceCount: number;
  mouthOpen: number | null;
  speechRms: number;
  closedMouthSpeechMs: number;
}): boolean {
  if (opts.aiSpeaking || opts.micMuted) return false;
  if (opts.faceCount !== 1) return false;
  if (opts.mouthOpen == null) return false;
  if (opts.speechRms < SPEECH_RMS_MIN) return false;
  if (opts.mouthOpen >= MOUTH_OPEN_MIN) return false;
  return opts.closedMouthSpeechMs >= SPEECH_WITHOUT_MOUTH_EMIT_MS;
}

export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 8) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i += 1) {
    const x = xs[i]!;
    const y = ys[i]!;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const cov = sxy - (sx * sy) / n;
  const vx = sxx - (sx * sx) / n;
  const vy = syy - (sy * sy) / n;
  if (vx <= 1e-12 || vy <= 1e-12) return null;
  return cov / Math.sqrt(vx * vy);
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return (
    values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / values.length
  );
}

export function bestLaggedCorrelation(
  rms: number[],
  mouth: number[],
  maxLag = LIPSYNC_MAX_LAG,
): { lag: number; r: number } | null {
  const n = Math.min(rms.length, mouth.length);
  let best: { lag: number; r: number } | null = null;
  for (let lag = 0; lag <= maxLag; lag += 1) {
    if (n - lag < 8) break;
    const r = pearsonCorrelation(rms.slice(0, n - lag), mouth.slice(lag));
    if (r == null) continue;
    if (!best || r > best.r) best = { lag, r };
  }
  return best;
}

export function shouldFlagLipSyncMismatch(opts: {
  aiSpeaking: boolean;
  micMuted: boolean;
  rms: number[];
  mouth: number[];
  sampleMs: number;
}): { reason: LipSyncMismatchReason; correlation: number; lagMs: number } | null {
  if (!LIPSYNC_DETECTION_ENABLED) return null;
  if (opts.aiSpeaking || opts.micMuted) return null;
  if (opts.rms.length < LIPSYNC_WINDOW || opts.mouth.length < LIPSYNC_WINDOW) {
    return null;
  }
  const rms = opts.rms.slice(-LIPSYNC_WINDOW);
  const mouth = opts.mouth.slice(-LIPSYNC_WINDOW);
  if (variance(rms) < SPEECH_RMS_MIN * SPEECH_RMS_MIN * 0.25) return null;
  if (variance(mouth) < LIPSYNC_MOUTH_VAR_MIN) return null;
  const best = bestLaggedCorrelation(rms, mouth);
  if (!best) return null;
  const lagMs = best.lag * opts.sampleMs;
  if (best.r < LIPSYNC_UNCORR_MAX) {
    return { reason: "uncorrelated", correlation: best.r, lagMs };
  }
  if (best.r >= LIPSYNC_FOLLOW_MIN_R && lagMs >= LIPSYNC_FOLLOW_MIN_LAG_MS) {
    return { reason: "audio_follow", correlation: best.r, lagMs };
  }
  return null;
}
