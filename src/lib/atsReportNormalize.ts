import type {
  ATSCategoryId,
  ATSCheckId,
  ATSCheckResult,
  ATSIssue,
  ATSReportV3,
} from "@/types/atsReport";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CHECK_LABELS,
  CHECKS_BY_CATEGORY,
} from "@/types/atsReport";

function countActionableIssues(issues: ATSIssue[]): number {
  return issues.filter(
    (i) =>
      i.kind !== "positive" &&
      i.kind !== "credibility_positive" &&
      i.kind !== "skill_present",
  ).length;
}

/** Repair stale reports that counted positive findings as issues (e.g. essential sections). */
function normalizeStoredCheck(check: ATSCheckResult): ATSCheckResult {
  const actionable = countActionableIssues(check.issues);
  const detectedSections = check.meta?.detectedSections ?? [];
  const isCompleteEssential =
    check.id === "essentialSections" &&
    (check.summary?.badge === "Complete" ||
      detectedSections.length >= 3 ||
      (actionable === 0 &&
        check.issues.length > 0 &&
        check.issues.every((i) => i.kind === "positive")));

  let issueCount = actionable;
  let score = check.score;
  let status = check.status;

  if (isCompleteEssential && actionable === 0) {
    issueCount = 0;
    score = Math.max(score, 100);
    status = "pass";
  } else if (actionable !== check.issueCount) {
    issueCount = actionable;
    if (actionable === 0 && status !== "skipped") {
      score = Math.max(score, 80);
      if (status === "fail") status = "pass";
    }
  }

  const meta =
    isCompleteEssential && detectedSections.length === 0
      ? {
          ...check.meta,
          detectedSections: check.issues
            .filter((i) => i.kind === "positive")
            .map((i) => i.title),
        }
      : check.meta;

  return {
    ...check,
    issueCount,
    score,
    status,
    meta,
    issues: isCompleteEssential && actionable === 0 ? [] : check.issues,
  };
}

function missingStoredCheck(id: ATSCheckId): ATSCheckResult {
  return {
    id,
    label: CHECK_LABELS[id],
    description: "Run ATS analysis again to populate this check.",
    status: "skipped",
    score: 0,
    issueCount: 0,
    issues: [],
  };
}

function computeCategoryScore(checks: ATSCheckResult[]): number {
  const active = checks.filter((c) => c.status !== "skipped");
  if (active.length === 0) return 0;
  return Math.round(active.reduce((sum, c) => sum + c.score, 0) / active.length);
}

/** Job Match is only available when a job description was used (tailored mode). */
export function reportHasJobMatch(report: ATSReportV3): boolean {
  return report.mode === "tailored" && Boolean(report.categories.jobMatch);
}

/**
 * Ensures every V3 category/check appears in the report (same structure as ATS checker).
 * Job Match is omitted unless the report was run with a job description.
 */
export function normalizeATSReportV3(report: ATSReportV3): ATSReportV3 {
  const includeJobMatch = reportHasJobMatch(report);
  const categoryOrder: ATSCategoryId[] = includeJobMatch
    ? CATEGORY_ORDER
    : CATEGORY_ORDER.filter((id) => id !== "jobMatch");

  let categories = { ...report.categories };
  if (!includeJobMatch) {
    categories = Object.fromEntries(
      Object.entries(categories).filter(([key]) => key !== "jobMatch"),
    ) as typeof categories;
  }

  let totalIssueCount = 0;

  for (const catId of categoryOrder) {
    const expectedIds = CHECKS_BY_CATEGORY[catId as ATSCategoryId];
    if (!expectedIds?.length) continue;

    const existing = categories[catId];
    const byId = new Map((existing?.checks ?? []).map((c) => [c.id, c]));
    const checks = expectedIds
      .map((id) => byId.get(id) ?? missingStoredCheck(id))
      .map(normalizeStoredCheck);
    const activeChecks = checks.filter((c) => c.status !== "skipped");
    const categoryIssueCount = activeChecks.reduce((s, c) => s + c.issueCount, 0);
    totalIssueCount += categoryIssueCount;

    categories[catId] = {
      id: catId,
      label: existing?.label ?? CATEGORY_LABELS[catId],
      score: computeCategoryScore(checks),
      issueCount: categoryIssueCount,
      checks,
    };
  }

  return {
    ...report,
    jobMatch: includeJobMatch ? report.jobMatch : undefined,
    issueCount: totalIssueCount,
    categories,
  };
}
