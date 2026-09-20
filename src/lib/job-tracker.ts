export const JOB_TRACKER_STATUSES = [
  "saved",
  "applied",
  "interview_scheduled",
  "round_1",
  "round_2",
  "round_3",
  "final_round",
  "salary_negotiation",
  "offer",
  "accepted",
  "rejected",
  "archived",
] as const;

export type JobTrackerStatus = (typeof JOB_TRACKER_STATUSES)[number];

export const JOB_TRACKER_ACTIVE_STATUSES = JOB_TRACKER_STATUSES.filter(
  (status) => status !== "archived",
) as Exclude<JobTrackerStatus, "archived">[];

export type JobTrackerActiveStatus = Exclude<JobTrackerStatus, "archived">;

export const JOB_TRACKER_STATUS_LABELS: Record<JobTrackerStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview_scheduled: "Interview Scheduled",
  round_1: "Round 1",
  round_2: "Round 2",
  round_3: "Round 3",
  final_round: "Final Round",
  salary_negotiation: "Salary Negotiation",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

export const JOB_TRACKER_TYPES = [
  "internship",
  "full_time",
  "part_time",
  "contract",
] as const;

export type JobTrackerJobType = (typeof JOB_TRACKER_TYPES)[number];

export const JOB_TRACKER_TYPE_LABELS: Record<JobTrackerJobType, string> = {
  internship: "Internship",
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
};

export const JOB_TRACKER_WORK_MODES = ["onsite", "remote", "hybrid"] as const;

export type JobTrackerWorkMode = (typeof JOB_TRACKER_WORK_MODES)[number];

export const JOB_TRACKER_WORK_MODE_LABELS: Record<JobTrackerWorkMode, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export const JOB_TRACKER_SOURCES = [
  "linkedin",
  "naukri",
  "indeed",
  "company_website",
  "referral",
  "other",
] as const;

export type JobTrackerSource = (typeof JOB_TRACKER_SOURCES)[number];

export const JOB_TRACKER_SOURCE_LABELS: Record<JobTrackerSource, string> = {
  linkedin: "LinkedIn",
  naukri: "Naukri",
  indeed: "Indeed",
  company_website: "Company Website",
  referral: "Referral",
  other: "Other",
};

export type JobTrackerCard = {
  applicationId: string;
  title: string;
  role: string;
  company: string;
  jobLink?: string;
  source: JobTrackerSource;
  jobType: JobTrackerJobType;
  locationText?: string;
  workMode: JobTrackerWorkMode;
  status: JobTrackerStatus;
  isArchived: boolean;
  isFavorite: boolean;
  appliedAt?: string;
  matchScore?: number;
  documentCount: number;
  practiceInterviewCount: number;
  updatedAt: string;
  createdAt: string;
};

export type JobTrackerCompensation = {
  amount: number;
  unit: "lpa" | "inr";
};

export type JobTrackerDetail = JobTrackerCard & {
  sourceCustom?: string;
  salaryText?: string;
  expectedCtc?: JobTrackerCompensation;
  jobDescription?: string;
  jobSummary?: string;
  statusDates: Record<string, string>;
  notes?: string;
  documents: Array<{
    resumeId: string;
    title: string;
    templateId: string;
    attachedAt: string;
  }>;
  jobMatchSnapshot?: {
    resumeId: string;
    matchScore?: number;
    verdict?: "strong" | "moderate" | "weak";
    headline?: string;
    missingSkills: string[];
    matchedSkills: string[];
    scoredAt: string;
    atsReport?: Record<string, unknown> | null;
    jobMatchFeedback?: Record<string, unknown> | null;
  } | null;
  practiceInterviews: Array<{
    interviewId: string;
    status: string;
    overallScore?: number;
    reportReady: boolean;
    completedAt?: string;
  }>;
};

export type JobTrackerListFilters = {
  q?: string;
  status?: JobTrackerStatus | "";
  jobType?: JobTrackerJobType | "";
  workMode?: JobTrackerWorkMode | "";
  favorite?: boolean;
  archived?: boolean;
  appliedFrom?: string;
  appliedUntil?: string;
};

export type JobTrackerListResponse = {
  items: JobTrackerCard[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type JobTrackerBoardResponse = {
  columns: Record<
    Exclude<JobTrackerStatus, "archived">,
    { count: number; items: JobTrackerCard[] }
  >;
  totals: { active: number; favorites: number };
};

export const EMPTY_JOB_TRACKER_FILTERS: JobTrackerListFilters = {
  q: "",
  status: "",
  jobType: "",
  workMode: "",
  favorite: false,
  archived: false,
  appliedFrom: "",
  appliedUntil: "",
};

export function statusBadgeClass(status: JobTrackerStatus): string {
  if (status === "accepted" || status === "offer") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (status === "rejected" || status === "archived") {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  }
  if (status === "applied" || status === "saved") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-muted text-primary dark:bg-muted/40 dark:text-primary/80";
}

export function hasActiveJobTrackerFilters(
  filters: JobTrackerListFilters,
): boolean {
  return Boolean(
    filters.q?.trim() ||
      filters.status ||
      filters.jobType ||
      filters.workMode ||
      filters.favorite ||
      filters.appliedFrom ||
      filters.appliedUntil,
  );
}

export function jobTrackerFilterChips(
  filters: JobTrackerListFilters,
): Array<{ key: keyof JobTrackerListFilters; label: string }> {
  const chips: Array<{ key: keyof JobTrackerListFilters; label: string }> = [];
  if (filters.q?.trim()) {
    chips.push({ key: "q", label: `Search: ${filters.q.trim()}` });
  }
  if (filters.status) {
    chips.push({
      key: "status",
      label: `Status: ${JOB_TRACKER_STATUS_LABELS[filters.status]}`,
    });
  }
  if (filters.jobType) {
    chips.push({
      key: "jobType",
      label: `Type: ${JOB_TRACKER_TYPE_LABELS[filters.jobType]}`,
    });
  }
  if (filters.workMode) {
    chips.push({
      key: "workMode",
      label: `Location: ${JOB_TRACKER_WORK_MODE_LABELS[filters.workMode]}`,
    });
  }
  if (filters.favorite) {
    chips.push({ key: "favorite", label: "Favorites" });
  }
  if (filters.appliedFrom) {
    chips.push({ key: "appliedFrom", label: `From ${filters.appliedFrom}` });
  }
  if (filters.appliedUntil) {
    chips.push({ key: "appliedUntil", label: `Until ${filters.appliedUntil}` });
  }
  return chips;
}

export function formatJobTrackerDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function sourceLabel(
  source: JobTrackerSource,
  sourceCustom?: string,
): string {
  if (source === "other" && sourceCustom?.trim()) return sourceCustom.trim();
  return JOB_TRACKER_SOURCE_LABELS[source];
}
