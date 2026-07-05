import type { Interview } from "@/lib/api";

type CodingRoundShape = {
  status?: string;
  assignedProblemIds?: string[];
  submissions?: unknown[];
};

function hasMeaningfulCodingRound(codingRound: unknown): boolean {
  if (!codingRound || typeof codingRound !== "object") return false;
  const round = codingRound as CodingRoundShape;
  if (round.status) return true;
  if ((round.assignedProblemIds?.length ?? 0) > 0) return true;
  if ((round.submissions?.length ?? 0) > 0) return true;
  return false;
}

/** True when session belongs to Coding Round (not AI Screening). */
export function isCodingPracticeInterview(
  interview: Pick<Interview, "metadata" | "codingRound"> | null | undefined,
): boolean {
  if (!interview) return false;
  if (interview.metadata?.interviewKind === "coding_practice") return true;
  return hasMeaningfulCodingRound(interview.codingRound);
}

export function isScreeningInterview(
  interview: Pick<Interview, "metadata" | "codingRound"> | null | undefined,
): boolean {
  return !isCodingPracticeInterview(interview);
}

export function interviewRoundLabel(
  interview: Pick<Interview, "metadata" | "codingRound">,
): "Coding Round" | "Screening Round" {
  return isCodingPracticeInterview(interview)
    ? "Coding Round"
    : "Screening Round";
}

export type InterviewTypeFilter = "all" | "screening" | "coding";

export function filterInterviewsByType(
  interviews: Interview[],
  filter: InterviewTypeFilter,
): Interview[] {
  if (filter === "all") return interviews;
  if (filter === "coding") {
    return interviews.filter((i) => isCodingPracticeInterview(i));
  }
  return interviews.filter((i) => isScreeningInterview(i));
}
