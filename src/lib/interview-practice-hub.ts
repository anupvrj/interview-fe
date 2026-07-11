import type { Interview } from "@/lib/api";
import { isCodingPracticeInterview } from "@/lib/interview-kind";

/** List landing for the practice product (not a live session URL). */
export function practiceHubHref(inv: Interview | null): string {
  if (isCodingPracticeInterview(inv)) {
    return "/dashboard/coding-interviews";
  }
  return "/dashboard/interviews";
}

export function practiceHubLabel(inv: Interview | null): string {
  if (isCodingPracticeInterview(inv)) {
    return "Back to Practice Coding Round";
  }
  return "Back to practice interviews";
}
