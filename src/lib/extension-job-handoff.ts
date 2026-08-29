/**
 * Shared handoff for the InterviewTrix Chrome extension.
 * Must stay in sync with interview-chrome-extension/src/shared.ts
 */

import { trimJobDescriptionForSend } from "@/lib/job-description-limits";

export const PENDING_JOB_STORAGE_KEY = "interviewtrix.pendingJobCapture";

export const MIN_JOB_DESCRIPTION_CHARS = 50;

export type JobDetails = Record<string, string>;

export type PendingJobCapture = {
  v: 1;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  jobDescription: string;
  details?: JobDetails;
  capturedAt: string;
};

function isPendingJobCapture(value: unknown): value is PendingJobCapture {
  if (!value || typeof value !== "object") return false;
  const rec = value as Partial<PendingJobCapture>;
  return (
    rec.v === 1 &&
    typeof rec.jobDescription === "string" &&
    rec.jobDescription.trim().length > 0
  );
}

export function parsePendingJobCapture(raw: string | null): PendingJobCapture | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPendingJobCapture(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadPendingJobCapture(): PendingJobCapture | null {
  if (typeof window === "undefined") return null;
  return parsePendingJobCapture(sessionStorage.getItem(PENDING_JOB_STORAGE_KEY));
}

export function savePendingJobCapture(payload: PendingJobCapture): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_JOB_STORAGE_KEY, JSON.stringify(payload));
}

export function clearPendingJobCapture(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_JOB_STORAGE_KEY);
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
  };
}

export const FROM_JOB_TAILORING_MESSAGES = [
  "Creating a copy of your source resume…",
  "Aligning skills and experience to this role…",
  "Rewriting bullets and your profile summary…",
  "Final checks in progress. Almost done…",
] as const;
