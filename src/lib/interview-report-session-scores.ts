import type { InterviewReport } from "@/lib/api";

/** Mean of discussion aggregate (`overallScore`) and automated coding average — headline “session average”. */
export function sessionAverageScore(report: InterviewReport): number {
  const cs = report.codingSummary;
  if (!cs?.problems.length) {
    return report.overallScore;
  }
  return Math.round((report.overallScore + cs.overallCodingScore) / 2);
}
