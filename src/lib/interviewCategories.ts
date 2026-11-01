import type { EmblemKind } from "@/components/marketing-2026/primitives";

/** Category rounds of the AI interview. Must match interview-core categoryAgents. */
export const INTERVIEW_CATEGORY_IDS = [
  "general_screening",
  "technical_screening",
  "managerial",
  "salary_negotiation",
  "culture_fit_hr",
] as const;

export type InterviewCategoryId = (typeof INTERVIEW_CATEGORY_IDS)[number];

export interface InterviewCategory {
  id: InterviewCategoryId;
  name: string;
  shortDescription: string;
  emblem: string;
  order: number;
  defaultDurationMinutes: number;
  allowedDurations: number[];
  /** Whether this user may start the round (master flag + the round's own flag). */
  accessible: boolean;
}

export interface InterviewCategoryCatalog {
  /** The master flag for this user: when false the picker is hidden. */
  enabled: boolean;
  categories: InterviewCategory[];
}

export const INTERVIEW_CATEGORIES_QUERY_KEY = ["interview-categories"] as const;

const NAMES: Record<InterviewCategoryId, string> = {
  general_screening: "General Screening",
  technical_screening: "Technical Screening",
  managerial: "Managerial",
  salary_negotiation: "Salary Negotiation",
  culture_fit_hr: "Culture Fit / HR",
};

const EMBLEMS: readonly EmblemKind[] = ["voice", "code", "seats", "spark", "peers", "whiteboard", "layers"];

export function isInterviewCategoryId(value: unknown): value is InterviewCategoryId {
  return typeof value === "string" && (INTERVIEW_CATEGORY_IDS as readonly string[]).includes(value);
}

/** Display name for a stored category id (history rows, report header). */
export function interviewCategoryLabel(id: unknown): string | null {
  return isInterviewCategoryId(id) ? NAMES[id] : null;
}

/** The salary call is with a recruiter, whatever the interviewer persona's usual title. */
export function interviewerTitleForCategory(id: unknown): string | null {
  return id === "salary_negotiation" ? "Recruiter" : null;
}

/** The emblem the backend names, or a neutral one if it names something unknown. */
export function interviewCategoryEmblem(c: Pick<InterviewCategory, "emblem">): EmblemKind {
  return (EMBLEMS as readonly string[]).includes(c.emblem) ? (c.emblem as EmblemKind) : "voice";
}

/** Rounds the user can open, in display order; empty when the feature is off for them. */
export function visibleInterviewCategories(catalog: InterviewCategoryCatalog | undefined): InterviewCategory[] {
  if (!catalog?.enabled) return [];
  return catalog.categories.filter((c) => c.accessible).sort((a, b) => a.order - b.order);
}
