import type { InterviewOptIns, IxCategoryKey } from "@/lib/api";

export type { InterviewOptIns, IxCategoryKey };

export const DEFAULT_INTERVIEW_OPT_INS: InterviewOptIns = {
  screening: true,
  coding: false,
  systemDesign: false,
  peer: false,
};

export const IX_CATEGORY_META: Record<
  IxCategoryKey,
  { label: string; description: string; hubHref: string }
> = {
  screening: {
    label: "Screening Round — AI Interview",
    description: "Voice mock interviews with AI feedback",
    hubHref: "/dashboard/interviews",
  },
  coding: {
    label: "Coding Round",
    description: "Live coding practice with discussion",
    hubHref: "/dashboard/coding-interviews",
  },
  systemDesign: {
    label: "System Design",
    description: "Architecture whiteboard sessions",
    hubHref: "/dashboard/system-design",
  },
  peer: {
    label: "Peer Interview",
    description: "Live mock interviews with verified interviewers",
    hubHref: "/dashboard/peer-interviews",
  },
};

export const IX_CATEGORY_KEYS: IxCategoryKey[] = [
  "screening",
  "coding",
  "systemDesign",
  "peer",
];

export function normalizeInterviewOptIns(
  input?: Partial<InterviewOptIns> | null,
): InterviewOptIns {
  return {
    screening: input?.screening ?? DEFAULT_INTERVIEW_OPT_INS.screening,
    coding: input?.coding ?? DEFAULT_INTERVIEW_OPT_INS.coding,
    systemDesign: input?.systemDesign ?? DEFAULT_INTERVIEW_OPT_INS.systemDesign,
    peer: input?.peer ?? DEFAULT_INTERVIEW_OPT_INS.peer,
  };
}

export function countOptedCategories(optIns: InterviewOptIns): number {
  return IX_CATEGORY_KEYS.filter((k) => optIns[k]).length;
}

export function hasAllInterviewOptIns(optIns: InterviewOptIns): boolean {
  return countOptedCategories(optIns) >= IX_CATEGORY_KEYS.length;
}

export function getNonOptedInterviewLabels(optIns: InterviewOptIns): string[] {
  return IX_CATEGORY_KEYS.filter((k) => !optIns[k]).map(
    (k) => IX_CATEGORY_META[k].label,
  );
}

/** e.g. "Coding Round", "A and B", "A, B, and C" */
export function formatInterviewList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
