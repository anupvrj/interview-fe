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

/**
 * Drop abandoned captures so a later dashboard visit is not hijacked.
 * Keep this short: the extension bridge re-writes chrome.storage into
 * localStorage on every InterviewTrix page load.
 */
export const MAX_CAPTURE_AGE_MS = 45 * 60 * 1000;

/** Fingerprint of a capture the web app already applied or dismissed. */
export const CONSUMED_JOB_CAPTURE_KEY = "interviewtrix.pendingJobCapture.consumed";

export type JobDetails = Record<string, string>;

export type JobCaptureIntent = "resume" | "practice-interview";

export type JobMatchHandoffInsights = {
  resumeId?: string;
  matchScore?: number;
  verdict?: string;
  summary?: string;
  matchedSkills: string[];
  missingSkills: string[];
  unlistedSkills: string[];
  strengths: string[];
  gaps: string[];
  matrices: Array<{
    id: string;
    label: string;
    score: number;
    matched: string[];
    missing: string[];
    unlisted: string[];
  }>;
};

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
  sourceResumeId?: string;
  matchInsights?: JobMatchHandoffInsights;
  /** Job tracker application to sync the practice interview back to. */
  jobApplicationId?: string;
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
  return (
    path === FROM_JOB_PATH ||
    path === PRACTICE_INTERVIEW_PATH ||
    path === "/dashboard/resumes/new"
  );
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
  if (!capture.capturedAt) return false;
  const at = Date.parse(capture.capturedAt);
  if (Number.isNaN(at)) return false;
  return Date.now() - at < MAX_CAPTURE_AGE_MS;
}

export function captureFingerprint(capture: PendingJobCapture): string {
  return [
    capture.capturedAt,
    capture.intent ?? "resume",
    capture.sourceUrl,
    capture.jobDescription.slice(0, 80),
  ].join("|");
}

function readConsumedFingerprint(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CONSUMED_JOB_CAPTURE_KEY);
  } catch {
    return null;
  }
}

function markCaptureConsumed(capture: PendingJobCapture): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CONSUMED_JOB_CAPTURE_KEY,
      captureFingerprint(capture),
    );
  } catch {
    /* quota / private mode */
  }
}

function isConsumedJobCapture(capture: PendingJobCapture): boolean {
  return readConsumedFingerprint() === captureFingerprint(capture);
}

function asStringList(value: unknown, max = 16): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 80))
    .slice(0, max);
}

function parseMatchInsights(value: unknown): JobMatchHandoffInsights | undefined {
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  const matrices = Array.isArray(rec.matrices)
    ? rec.matrices
        .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
        .slice(0, 8)
        .map((row) => ({
          id: typeof row.id === "string" ? row.id : "",
          label: typeof row.label === "string" ? row.label : "",
          score: typeof row.score === "number" ? row.score : 0,
          matched: asStringList(row.matched, 12),
          missing: asStringList(row.missing, 12),
          unlisted: asStringList(row.unlisted, 12),
        }))
        .filter((row) => row.id && row.label)
    : [];
  const insights: JobMatchHandoffInsights = {
    resumeId: typeof rec.resumeId === "string" ? rec.resumeId : undefined,
    matchScore: typeof rec.matchScore === "number" ? rec.matchScore : undefined,
    verdict: typeof rec.verdict === "string" ? rec.verdict : undefined,
    summary: typeof rec.summary === "string" ? rec.summary : undefined,
    matchedSkills: asStringList(rec.matchedSkills),
    missingSkills: asStringList(rec.missingSkills),
    unlistedSkills: asStringList(rec.unlistedSkills),
    strengths: asStringList(rec.strengths, 8),
    gaps: asStringList(rec.gaps, 8),
    matrices,
  };
  if (
    !insights.matchedSkills.length &&
    !insights.missingSkills.length &&
    !insights.unlistedSkills.length &&
    !insights.summary &&
    !insights.matrices.length
  ) {
    return undefined;
  }
  return insights;
}

export function parsePendingJobCapture(raw: string | null): PendingJobCapture | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPendingJobCapture(parsed)) return null;
    const sourceResumeId =
      typeof parsed.sourceResumeId === "string" && parsed.sourceResumeId.trim()
        ? parsed.sourceResumeId.trim()
        : undefined;
    const jobApplicationId =
      typeof parsed.jobApplicationId === "string" &&
      parsed.jobApplicationId.trim()
        ? parsed.jobApplicationId.trim()
        : undefined;
    return {
      ...parsed,
      intent: normalizeIntent(parsed.intent),
      sourceResumeId,
      jobApplicationId,
      matchInsights: parseMatchInsights(
        (parsed as PendingJobCapture).matchInsights,
      ),
    };
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
  if (!isFreshJobCapture(capture) || isConsumedJobCapture(capture)) {
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
  const capture =
    readStorageItem(window.sessionStorage) ?? readStorageItem(window.localStorage);
  if (capture) markCaptureConsumed(capture);
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
    sourceResumeId: capture.sourceResumeId,
    jobApplicationId: capture.jobApplicationId,
    matchInsights: capture.matchInsights,
  };
}

export const FROM_JOB_TAILORING_MESSAGES = [
  "Creating a copy of your source resume…",
  "Applying job-match findings to close skill gaps…",
  "Rewriting bullets and your profile summary…",
  "Rechecking the ATS score against this job…",
] as const;
