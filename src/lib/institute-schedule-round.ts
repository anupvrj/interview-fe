export type InstituteScheduleRoundType =
  | "ai_mock"
  | "coding_practice"
  | "system_design";

export const INSTITUTE_SCHEDULE_ROUND_OPTIONS: {
  value: InstituteScheduleRoundType;
  label: string;
  description: string;
}[] = [
  {
    value: "ai_mock",
    label: "AI mock interview",
    description: "Voice AI interview — add your own question list for the AI to follow.",
  },
  {
    value: "coding_practice",
    label: "Coding round",
    description: "Candidate solves the coding problems you select from the bank.",
  },
  {
    value: "system_design",
    label: "System design",
    description: "One system design problem from the catalog.",
  },
];

export function instituteScheduleRoundLabel(
  roundType?: InstituteScheduleRoundType | string | null,
): string {
  const found = INSTITUTE_SCHEDULE_ROUND_OPTIONS.find((o) => o.value === roundType);
  return found?.label ?? "AI mock interview";
}

export type StartScheduledInterviewPayload = {
  roundType?: InstituteScheduleRoundType;
  interviewId?: string;
  systemDesignSessionId?: string;
};

export function validateInstituteScheduleRound(
  roundType: InstituteScheduleRoundType,
  codingProblemIds: string[],
  systemDesignProblemId: string,
): string | null {
  if (roundType === "coding_practice" && codingProblemIds.length === 0) {
    return "Select at least one coding problem.";
  }
  if (roundType === "system_design" && !systemDesignProblemId.trim()) {
    return "Select a system design problem.";
  }
  return null;
}

export function buildInstituteScheduleRoundApiFields(
  roundType: InstituteScheduleRoundType,
  opts: {
    customQuestions?: string[];
    codingProblemIds?: string[];
    systemDesignProblemId?: string;
  },
): {
  roundType: InstituteScheduleRoundType;
  customQuestions?: string[];
  codingProblemIds?: string[];
  systemDesignProblemId?: string;
} {
  return {
    roundType,
    ...(roundType === "ai_mock" && opts.customQuestions?.length
      ? { customQuestions: opts.customQuestions }
      : {}),
    ...(roundType === "coding_practice" && opts.codingProblemIds?.length
      ? { codingProblemIds: opts.codingProblemIds }
      : {}),
    ...(roundType === "system_design" && opts.systemDesignProblemId?.trim()
      ? { systemDesignProblemId: opts.systemDesignProblemId.trim() }
      : {}),
  };
}

export function routeAfterScheduledStart(
  payload: StartScheduledInterviewPayload,
): string | null {
  const round = payload.roundType ?? "ai_mock";
  if (round === "system_design" && payload.systemDesignSessionId) {
    return `/dashboard/system-design/${payload.systemDesignSessionId}`;
  }
  if (payload.interviewId) {
    if (round === "coding_practice") {
      return `/dashboard/coding-interviews/${payload.interviewId}`;
    }
    return `/interview/${payload.interviewId}/realtime`;
  }
  return null;
}
