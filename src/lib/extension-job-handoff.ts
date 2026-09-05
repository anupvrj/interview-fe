/**
 * Shared handoff for the InterviewTrix Chrome extension.
 * Must stay in sync with interview-chrome-extension/src/shared.ts
 */

import { trimJobDescriptionForSend } from "@/lib/job-description-limits";

export const PENDING_JOB_STORAGE_KEY = "interviewtrix.pendingJobCapture";

export const MIN_JOB_DESCRIPTION_CHARS = 50;

/** Destinations the extension opens. Keep in sync with interview-chrome-extension/src/shared.ts */
export const FROM_JOB_PATH = "/dashboard/resumes/from-job";
export const PRACTICE_INTERVIEW_PATH = "/dashboard/interviews/new";

/** Drop abandoned captures so a later dashboard visit is not hijacked. */
export const MAX_CAPTURE_AGE_MS = 24 * 60 * 60 * 1000;

export type JobDetails = Record<string, string>;

export type JobCaptureIntent = "resume" | "practice-interview";

export type PendingJobCapture = {
  v: 1;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  jobDescription: string;
  details?: JobDetails;
  capturedAt: string;
  /** Distinguishes tailor-resume vs practice-interview handoff. */
  intent?: JobCaptureIntent;
};

function normalizeIntent(value: unknown): JobCaptureIntent | undefined {
  if (value === "resume" || value === "practice-interview") return value;
  return undefined;
}

export function isPracticeInterviewCapture(
  capture: PendingJobCapture,
): boolean {
  return capture.intent === "practice-interview";
}

/** Tailor-resume handoff, including legacy payloads with no intent. */
export function isResumeHandoffCapture(capture: PendingJobCapture): boolean {
  return capture.intent !== "practice-interview";
}

export function handoffPathForCapture(capture: PendingJobCapture): string {
  return isPracticeInterviewCapture(capture)
    ? PRACTICE_INTERVIEW_PATH
    : FROM_JOB_PATH;
}

export function isExtensionHandoffPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0];
  return path === FROM_JOB_PATH || path === PRACTICE_INTERVIEW_PATH;
}

function isPendingJobCapture(value: unknown): value is PendingJobCapture {
  if (!value || typeof value !== "object") return false;
  const rec = value as Partial<PendingJobCapture>;
  return (
    rec.v === 1 &&
    typeof rec.jobDescription === "string" &&
    rec.jobDescription.trim().length > 0
  );
}

export function isFreshJobCapture(capture: PendingJobCapture): boolean {
  if (!capture.capturedAt) return true;
  const at = Date.parse(capture.capturedAt);
  if (Number.isNaN(at)) return true;
  return Date.now() - at < MAX_CAPTURE_AGE_MS;
}

export function parsePendingJobCapture(raw: string | null): PendingJobCapture | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPendingJobCapture(parsed)) return null;
    return { ...parsed, intent: normalizeIntent(parsed.intent) };
  } catch {
    return null;
  }
}

function readStorageItem(storage: Storage): PendingJobCapture | null {
  try {
    return parsePendingJobCapture(storage.getItem(PENDING_JOB_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStorageItem(storage: Storage, payload: PendingJobCapture): void {
  try {
    storage.setItem(PENDING_JOB_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function removeStorageItem(storage: Storage): void {
  try {
    storage.removeItem(PENDING_JOB_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadPendingJobCapture(): PendingJobCapture | null {
  if (typeof window === "undefined") return null;
  const capture =
    readStorageItem(window.sessionStorage) ?? readStorageItem(window.localStorage);
  if (!capture) return null;
  if (!isFreshJobCapture(capture)) {
    clearPendingJobCapture();
    return null;
  }
  return capture;
}

export function loadPendingJobHandoffPath(): string | null {
  const capture = loadPendingJobCapture();
  return capture ? handoffPathForCapture(capture) : null;
}

export function loadPendingJobCaptureFor(
  kind: JobCaptureIntent,
): PendingJobCapture | null {
  const capture = loadPendingJobCapture();
  if (!capture) return null;
  if (kind === "practice-interview") {
    return isPracticeInterviewCapture(capture) ? capture : null;
  }
  return isResumeHandoffCapture(capture) ? capture : null;
}

export function savePendingJobCapture(payload: PendingJobCapture): void {
  if (typeof window === "undefined") return;
  writeStorageItem(window.sessionStorage, payload);
  writeStorageItem(window.localStorage, payload);
}

export function clearPendingJobCapture(): void {
  if (typeof window === "undefined") return;
  removeStorageItem(window.sessionStorage);
  removeStorageItem(window.localStorage);
}

export function tailoredResumeTitle(title?: string, company?: string): string {
  const role = (title ?? "").trim() || "Resume";
  const org = (company ?? "").trim();
  const base = org ? `${role} · ${org}` : role;
  return base.slice(0, 80);
}

export function normalizeCapturedJob(
  capture: PendingJobCapture,
): PendingJobCapture {
  return {
    ...capture,
    title: capture.title.trim(),
    company: capture.company.trim(),
    location: capture.location.trim(),
    jobDescription: trimJobDescriptionForSend(capture.jobDescription),
    details: capture.details,
    intent: normalizeIntent(capture.intent),
  };
}

export const FROM_JOB_TAILORING_MESSAGES = [
  "Creating a copy of your source resume…",
  "Aligning skills and experience to this role…",
  "Rewriting bullets and your profile summary…",
  "Final checks in progress. Almost done…",
] as const;
