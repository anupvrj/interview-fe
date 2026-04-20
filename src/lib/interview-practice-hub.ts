import type { Interview } from "@/lib/api";

/** List landing for the practice product (not a live session URL). */
export function practiceHubHref(inv: Interview | null): string {
  if (inv?.metadata?.interviewKind === "coding_practice") {
    return "/dashboard/coding-interviews";
  }
  return "/dashboard/interviews";
}

export function practiceHubLabel(inv: Interview | null): string {
  if (inv?.metadata?.interviewKind === "coding_practice") {
    return "Back to Practice Coding Round";
  }
  return "Back to practice interviews";
}
