export const INTEGRITY_EVENT_TYPES = [
  "CLIPBOARD_ATTEMPT",
  "BURST_KEYSTROKE_INJECTION",
  "TAB_BLUR",
  "HIGH_TURN_LATENCY",
  "CANDIDATE_ABSENT",
  "MULTIPLE_FACES_DETECTED",
  "CAMERA_UNAVAILABLE",
  "SPEECH_WITHOUT_MOUTH_MOVEMENT",
  "LIPSYNC_MISMATCH",
  "VOICEPRINT_MISMATCH",
  "FACE_IDENTITY_MISMATCH",
] as const;

export type IntegrityEventType = (typeof INTEGRITY_EVENT_TYPES)[number];

export type IntegritySeverity = "LOW" | "MEDIUM" | "HIGH";

export type IntegrityClassification =
  | "VERIFIED_AUTHENTIC"
  | "SUSPICIOUS_REVIEW_REQUIRED"
  | "INTEGRITY_BREACH_SUSPECTED";

export type ClipboardAction = "PASTE" | "COPY" | "CUT";

export interface IntegrityEventBase {
  type: IntegrityEventType;
  timestamp: number;
  severity?: IntegritySeverity;
}

export interface ClipboardAttemptEvent extends IntegrityEventBase {
  type: "CLIPBOARD_ATTEMPT";
  action: ClipboardAction;
}

export interface BurstKeystrokeEvent extends IntegrityEventBase {
  type: "BURST_KEYSTROKE_INJECTION";
  deltaMs: number;
  charCount?: number;
}

export interface TabBlurEvent extends IntegrityEventBase {
  type: "TAB_BLUR";
  durationMs: number;
}

export interface HighTurnLatencyEvent extends IntegrityEventBase {
  type: "HIGH_TURN_LATENCY";
  turnLatencyMs: number;
  turnId: string;
}

export interface CandidateAbsentEvent extends IntegrityEventBase {
  type: "CANDIDATE_ABSENT";
  absentMs?: number;
}

export interface MultipleFacesEvent extends IntegrityEventBase {
  type: "MULTIPLE_FACES_DETECTED";
  faceCount: number;
}

export interface CameraUnavailableEvent extends IntegrityEventBase {
  type: "CAMERA_UNAVAILABLE";
  reason?: string;
}

export interface SpeechWithoutMouthEvent extends IntegrityEventBase {
  type: "SPEECH_WITHOUT_MOUTH_MOVEMENT";
  durationMs: number;
}

export type LipSyncMismatchReason = "uncorrelated" | "audio_follow";

export interface LipSyncMismatchEvent extends IntegrityEventBase {
  type: "LIPSYNC_MISMATCH";
  durationMs: number;
  reason: LipSyncMismatchReason;
  correlation?: number;
  lagMs?: number;
}

export interface VoiceprintMismatchEvent extends IntegrityEventBase {
  type: "VOICEPRINT_MISMATCH";
  durationMs: number;
  similarity: number;
  turnId?: string;
}

export interface FaceIdentityMismatchEvent extends IntegrityEventBase {
  type: "FACE_IDENTITY_MISMATCH";
  durationMs: number;
  similarity: number;
}

export type IntegrityEvent =
  | ClipboardAttemptEvent
  | BurstKeystrokeEvent
  | TabBlurEvent
  | HighTurnLatencyEvent
  | CandidateAbsentEvent
  | MultipleFacesEvent
  | CameraUnavailableEvent
  | SpeechWithoutMouthEvent
  | LipSyncMismatchEvent
  | VoiceprintMismatchEvent
  | FaceIdentityMismatchEvent;

export interface IntegrityViolation {
  type: IntegrityEventType;
  timestamp: number;
  penalty: number;
  summary: string;
  durationMs?: number;
  turnId?: string;
  faceCount?: number;
  evidenceS3Key?: string;
}

export interface IntegrityReport {
  score: number;
  classification: IntegrityClassification;
  eventCount: number;
  deductedPoints: number;
  timeline: IntegrityViolation[];
  integrityStatus?: "scored" | "missing" | "processing";
}

export type IntegritySessionKind = "interview" | "system_design";

export const HIGH_FLUSH_TYPES: ReadonlySet<IntegrityEventType> = new Set([
  "CLIPBOARD_ATTEMPT",
  "BURST_KEYSTROKE_INJECTION",
  "HIGH_TURN_LATENCY",
  "MULTIPLE_FACES_DETECTED",
  "CANDIDATE_ABSENT",
  "CAMERA_UNAVAILABLE",
  "SPEECH_WITHOUT_MOUTH_MOVEMENT",
  "VOICEPRINT_MISMATCH",
  "FACE_IDENTITY_MISMATCH",
]);

export const CLIPBOARD_WARNING =
  "External clipboard operations are disabled during this assessment.";
