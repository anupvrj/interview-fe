import type { InterviewReport } from "@/lib/api";

/** Coach-style narrative for practice coding reports (Pass 2 summary or deterministic fallback). */
export function buildOverallExperienceParagraph(
  report: InterviewReport,
): string {
  const raw = report.pass2Analysis?.overallSummary?.trim();
  if (raw && raw.toLowerCase() !== "analysis unavailable.") {
    return raw;
  }
  const parts: string[] = [];
  const cs = report.codingSummary;
  if (cs?.problems?.length) {
    parts.push(
      `Across ${cs.problems.length} coding problems, your average automated score was ${cs.overallCodingScore}/100.`,
    );
  }
  parts.push(
    `Including the discussion portion, your overall score was ${report.overallScore}/100 across the scored categories.`,
  );
  if (report.strengths?.[0]) {
    parts.push(`A highlight from the session: ${report.strengths[0]}`);
  }
  return parts.join(" ");
}
