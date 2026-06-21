import type { ATSCheckId, ATSIssue } from "@/types/atsReport";

function normalizeIssueExcerptKey(excerpt?: string): string {
  return (excerpt || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function issueDedupeKey(checkId: ATSCheckId, issue: ATSIssue): string {
  if (checkId === "quantifyingImpact") {
    return (
      normalizeIssueExcerptKey(issue.excerpt) ||
      normalizeIssueExcerptKey(issue.rewriteSuggestion) ||
      issue.title.toLowerCase()
    );
  }

  if (checkId === "repetition") {
    return issue.title.toLowerCase();
  }

  return `${issue.title}|${issue.excerpt || ""}`;
}

function mergeDuplicateIssues(
  checkId: ATSCheckId,
  left: ATSIssue,
  right: ATSIssue,
): ATSIssue {
  if (checkId === "quantifyingImpact") {
    return {
      ...left,
      ...right,
      excerpt: left.excerpt || right.excerpt,
      rewriteSuggestion: left.rewriteSuggestion || right.rewriteSuggestion,
      suggestion: left.suggestion || right.suggestion,
    };
  }

  return { ...left, ...right };
}

export function dedupeIssuesForCheck(
  checkId: ATSCheckId,
  issues: ATSIssue[],
): ATSIssue[] {
  const byKey = new Map<string, ATSIssue>();

  for (const issue of issues) {
    const key = issueDedupeKey(checkId, issue);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, issue);
      continue;
    }
    byKey.set(key, mergeDuplicateIssues(checkId, existing, issue));
  }

  return [...byKey.values()];
}

export function dedupeQuantifyingIssues(issues: ATSIssue[]): ATSIssue[] {
  return dedupeIssuesForCheck("quantifyingImpact", issues).filter(
    (issue) => issue.excerpt || issue.rewriteSuggestion,
  );
}
