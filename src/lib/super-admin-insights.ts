import type { VoiceProvider } from "@/lib/voiceProviders";

export type InsightPeriod = "all" | "today" | "week" | "month" | "custom";

export type InsightInterviewType =
  | "all"
  | "screening"
  | "coding"
  | "systemDesign"
  | "peer";

export type PeriodCounts = {
  total: number;
  today: number;
  week: number;
  month: number;
};

export type InterviewTypeCounts = {
  screening: number;
  coding: number;
  systemDesign: number;
  peer: number;
};

export type InsightDailyPoint = {
  date: string;
  label: string;
  users: number;
  resumes: number;
  screening: number;
  coding: number;
  systemDesign: number;
  peer: number;
  interviews: number;
  institutions: number;
};

export type AdminInsights = {
  users: PeriodCounts & {
    byPlan: { plan: string; count: number }[];
  };
  resumes: PeriodCounts & {
    withPdf: number;
    byTemplate: { templateId: string; count: number }[];
  };
  interviews: PeriodCounts & {
    filtered: number;
    byType: InterviewTypeCounts;
    avgScore: number | null;
    scoredReports: number;
  };
  institutions: PeriodCounts & {
    assignedUsers: number;
    withMembers: number;
    empty: number;
    batches: number;
    top: { name: string; slug: string; userCount: number }[];
  };
  chart: {
    label: string;
    daily: InsightDailyPoint[];
  };
};

export type InsightResumeRow = {
  resumeId: string;
  title: string;
  templateId: string;
  createdAt: string;
  user: { clerkId: string; name: string; email: string };
};

export type InsightInterviewRow = {
  id: string;
  name: string;
  type: Exclude<InsightInterviewType, "all">;
  occurredAt: string;
  score: number | null;
  user: { clerkId: string; name: string; email: string };
  reportHref: string;
};

export const PERIOD_OPTIONS: { value: InsightPeriod; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom" },
];

export const INTERVIEW_TYPE_OPTIONS: {
  value: InsightInterviewType;
  label: string;
}[] = [
  { value: "all", label: "All types" },
  { value: "screening", label: "AI Screening" },
  { value: "coding", label: "Coding Practice" },
  { value: "systemDesign", label: "System Design" },
  { value: "peer", label: "Peer" },
];

export const INTERVIEW_TYPE_LABEL: Record<
  Exclude<InsightInterviewType, "all">,
  string
> = {
  screening: "AI Screening",
  coding: "Coding Practice",
  systemDesign: "System Design",
  peer: "Peer",
};

export function parseInsightPeriod(value: string | null): InsightPeriod {
  if (
    value === "today" ||
    value === "week" ||
    value === "month" ||
    value === "custom"
  ) {
    return value;
  }
  return "all";
}

export function parseInsightInterviewType(
  value: string | null,
): InsightInterviewType {
  if (
    value === "screening" ||
    value === "coding" ||
    value === "systemDesign" ||
    value === "peer"
  ) {
    return value;
  }
  return "all";
}

export function insightSearchParams(opts: {
  period?: InsightPeriod;
  from?: string;
  to?: string;
  type?: InsightInterviewType;
  search?: string;
}): URLSearchParams {
  const q = new URLSearchParams();
  if (opts.period && opts.period !== "all") q.set("period", opts.period);
  if (opts.period === "custom") {
    if (opts.from) q.set("from", opts.from);
    if (opts.to) q.set("to", opts.to);
  }
  if (opts.type && opts.type !== "all") q.set("type", opts.type);
  if (opts.search?.trim()) q.set("search", opts.search.trim());
  return q;
}

export function insightHref(
  path: string,
  opts: {
    period?: InsightPeriod;
    from?: string;
    to?: string;
    type?: InsightInterviewType;
  } = {},
): string {
  const q = insightSearchParams(opts);
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

export function usersInsightsHref(
  period: InsightPeriod = "all",
  from?: string,
  to?: string,
): string {
  return insightHref("/super-admin/users", { period, from, to });
}

export function resumesInsightsHref(
  period: InsightPeriod = "all",
  from?: string,
  to?: string,
): string {
  return insightHref("/super-admin/resumes", { period, from, to });
}

export function interviewsInsightsHref(opts: {
  period?: InsightPeriod;
  from?: string;
  to?: string;
  type?: InsightInterviewType;
} = {}): string {
  return insightHref("/super-admin/interviews", opts);
}

export function institutionsInsightsHref(): string {
  return "/super-admin/institutions";
}

export type VoiceModelUsageRow = {
  provider: VoiceProvider;
  featureKey: string;
  sessions: number;
  completed: number;
  credits: number;
  minutes: number;
  thisMonth: number;
  sessionShare: number;
  creditShare: number;
};

export type VoiceModelUsageInsights = {
  totals: {
    sessions: number;
    completed: number;
    credits: number;
    minutes: number;
    thisMonth: number;
  };
  models: VoiceModelUsageRow[];
};
