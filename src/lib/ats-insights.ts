import type { ATSReportV3 } from "@/types/atsReport";
import type { JobMatchHandoffInsights } from "@/lib/extension-job-handoff";

const JOB_MATCH_CHECK_IDS = new Set([
  "experienceMatch",
  "mustHaveSkillsMatch",
  "preferredSkillsMatch",
  "educationMatch",
  "certificationMatch",
  "responsibilitiesMatch",
]);

const QUALITATIVE_CHECK_IDS = new Set([
  "quantifyingImpact",
  "actionVerbs",
  "titleMatch",
  "hardSkillsMatch",
  "softSkillsMatch",
  "skillEvidence",
]);

function uniqueSkills(values: string[] | undefined, max = 16): string[] {
  if (!values?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of values) {
    const trimmed = item.trim().slice(0, 80);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

/** Map an ATS V3 report into the insights payload tailor-to-jd expects. */
export function insightsFromAtsReport(
  report: ATSReportV3,
): JobMatchHandoffInsights | undefined {
  const jobMatchChecks = report.categories.jobMatch?.checks ?? [];
  const matrices: JobMatchHandoffInsights["matrices"] = [];
  const unlisted: string[] = [];

  for (const check of jobMatchChecks) {
    if (check.status === "skipped") continue;
    if (!JOB_MATCH_CHECK_IDS.has(check.id)) continue;
    matrices.push({
      id: check.id,
      label: check.label,
      score: check.score,
      matched: uniqueSkills(check.meta?.matched, 12),
      missing: uniqueSkills(check.meta?.missing, 12),
      unlisted: uniqueSkills(check.meta?.partial, 12),
    });
    unlisted.push(...(check.meta?.partial ?? []));
  }

  const must = jobMatchChecks.find((check) => check.id === "mustHaveSkillsMatch");
  const gaps: string[] = [...(report.weaknesses ?? [])];
  for (const category of Object.values(report.categories)) {
    for (const check of category.checks) {
      if (!QUALITATIVE_CHECK_IDS.has(check.id)) continue;
      if (check.status === "skipped" || check.status === "pass") continue;
      const issue = check.issues[0];
      const detail = issue?.title || issue?.suggestion || check.summary?.headline;
      gaps.push(detail ? `${check.label}: ${detail}` : check.label);
      if (gaps.length >= 8) break;
    }
    if (gaps.length >= 8) break;
  }

  const summaryParts = [
    report.jobMatch
      ? `${report.jobMatch.overallMatch}% ${report.jobMatch.verdict} job match`
      : "",
    report.jobMatch?.jobTitle ? `Target: ${report.jobMatch.jobTitle}` : "",
    must?.meta?.missing?.length
      ? `Missing must-haves: ${must.meta.missing.slice(0, 8).join(", ")}`
      : "",
  ].filter(Boolean);

  if (
    !must?.meta?.matched?.length &&
    !must?.meta?.missing?.length &&
    !unlisted.length &&
    !summaryParts.length &&
    !matrices.length &&
    !gaps.length
  ) {
    return undefined;
  }

  return {
    matchScore: report.jobMatch?.overallMatch ?? report.score,
    verdict: report.jobMatch?.verdict,
    summary: summaryParts.join(". ").slice(0, 600) || undefined,
    matchedSkills: uniqueSkills(must?.meta?.matched),
    missingSkills: uniqueSkills(must?.meta?.missing),
    unlistedSkills: uniqueSkills(unlisted),
    strengths: uniqueSkills(report.strengths, 8),
    gaps: uniqueSkills(gaps, 8),
    matrices,
  };
}
