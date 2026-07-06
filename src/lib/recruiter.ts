import type { CandidateStatus, HiringStatus, RecruiterStatus } from "@/lib/api";

export const HIRING_STATUS_LABELS: Record<HiringStatus, string> = {
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  on_hold: "On-Hold",
  hired: "Hired",
};

export const HIRING_STATUS_ORDER: HiringStatus[] = [
  "shortlisted",
  "interviewing",
  "on_hold",
  "hired",
];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  actively_looking: "Actively Looking",
  skilling_up: "Skilling Up",
  hired: "Hired",
};

export const CANDIDATE_STATUS_ORDER: CandidateStatus[] = [
  "actively_looking",
  "skilling_up",
  "hired",
];

export const RECRUITER_STATUS_LABELS: Record<RecruiterStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  blocked: "Blocked",
};

/** Color band for an iX Score value (0-100). */
export function ixScoreTone(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-[#7367F0]";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
