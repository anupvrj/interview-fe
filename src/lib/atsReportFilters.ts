import type { ATSCheckId, ATSCheckResult, ATSReportV3 } from "@/types/atsReport";
import { CATEGORY_ORDER } from "@/types/atsReport";

function softSuppressCheck(check: ATSCheckResult): ATSCheckResult {
  return {
    ...check,
    status: "pass",
    issueCount: 0,
    issues: [],
    summary: {
      headline: "Addressed by AI resume improvement",
      badge: "Improved",
    },
  };
}

/** Hide issues for improved checks while keeping the saved category and headline scores. */
export function filterSuppressedChecks(
  report: ATSReportV3,
  suppressedCheckIds: ATSCheckId[],
): ATSReportV3 {
  if (suppressedCheckIds.length === 0) return report;

  const suppressed = new Set(suppressedCheckIds);
  const categories = { ...report.categories };
  let totalIssueCount = 0;

  for (const catId of CATEGORY_ORDER) {
    const cat = categories[catId];
    if (!cat) continue;

    const checks = cat.checks.map((c) =>
      suppressed.has(c.id) ? softSuppressCheck(c) : c,
    );
    const activeChecks = checks.filter((c) => c.status !== "skipped");
    const categoryIssueCount = activeChecks.reduce(
      (s, c) => s + c.issueCount,
      0,
    );
    totalIssueCount += categoryIssueCount;

    categories[catId] = {
      ...cat,
      checks,
      issueCount: categoryIssueCount,
    };
  }

  return {
    ...report,
    issueCount: totalIssueCount,
    categories,
  };
}
