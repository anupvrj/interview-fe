import type {
  CandidateStatus,
  HiringStatus,
  RecruiterStatus,
} from "@/lib/api";
import {
  CANDIDATE_STATUS_LABELS,
  HIRING_STATUS_LABELS,
  RECRUITER_STATUS_LABELS,
} from "@/lib/recruiter";
import { cn } from "@/lib/utils";

const PILL =
  "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium";

const HIRING_TONES: Record<HiringStatus, string> = {
  shortlisted:
    "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  interviewing:
    "bg-[#7367F0]/10 text-[#7367F0] dark:bg-[#7367F0]/20 dark:text-[#b7aeff]",
  on_hold:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  hired:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
};

const CANDIDATE_TONES: Record<CandidateStatus, string> = {
  actively_looking:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  skilling_up:
    "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  hired: "bg-muted text-muted-foreground",
};

const RECRUITER_TONES: Record<RecruiterStatus, string> = {
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  approved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  suspended:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  blocked: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function HiringStatusBadge({
  status,
  className,
}: Readonly<{ status: HiringStatus; className?: string }>) {
  return (
    <span className={cn(PILL, HIRING_TONES[status], className)}>
      {HIRING_STATUS_LABELS[status]}
    </span>
  );
}

export function CandidateStatusBadge({
  status,
  className,
}: Readonly<{ status: CandidateStatus | null | undefined; className?: string }>) {
  if (!status) {
    return (
      <span className={cn(PILL, "bg-muted text-muted-foreground", className)}>
        Not set
      </span>
    );
  }
  return (
    <span className={cn(PILL, CANDIDATE_TONES[status], className)}>
      {CANDIDATE_STATUS_LABELS[status]}
    </span>
  );
}

export function RecruiterStatusBadge({
  status,
  className,
}: Readonly<{ status: RecruiterStatus; className?: string }>) {
  return (
    <span className={cn(PILL, RECRUITER_TONES[status], className)}>
      {RECRUITER_STATUS_LABELS[status]}
    </span>
  );
}
