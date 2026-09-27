export const CREDENTIAL_TARGET_MS = 15_000;
export const CREDENTIAL_MAX_WALL_MS = 35_000;
export const CREDENTIAL_MIN_BYTES = 20_000;
export const CREDENTIAL_AUDIO_RMS_MIN = 0.015;
export const FACE_MIN_AREA = 0.05;
export const FACE_MIN_SCORE = 0.65;

export const CREDENTIAL_SENTENCES = [
  "I am recording this clip so Interview Trix can confirm it is me speaking in a natural voice.",
  "Please look at the camera and say this second sentence clearly without reading from another device.",
  "I am not getting help from anyone else, and I am looking straight at the camera.",
  "This is my own face and voice, and I am taking this interview myself.",
] as const;

export function activeCredentialLineIndex(wallMs: number) {
  const slotMs = CREDENTIAL_TARGET_MS / CREDENTIAL_SENTENCES.length;
  return Math.min(
    CREDENTIAL_SENTENCES.length - 1,
    Math.max(0, Math.floor(wallMs / slotMs)),
  );
}

export function accumulateGoodMs(
  prevMs: number,
  faceOk: boolean,
  audioOk: boolean,
  dtMs: number,
): number {
  if (dtMs <= 0) return prevMs;
  if (faceOk && audioOk) return prevMs + dtMs;
  return prevMs;
}

export function canUploadCredential(goodMs: number, blobBytes: number): boolean {
  return goodMs >= CREDENTIAL_TARGET_MS && blobBytes >= CREDENTIAL_MIN_BYTES;
}
