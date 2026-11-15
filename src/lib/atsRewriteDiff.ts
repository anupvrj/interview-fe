import type { ATSReportV3 } from "@/types/atsReport";

/**
 * What the AI rewrite actually changed, finding by finding: a finding is about a line it
 * quotes, and if that line is gone from the rewrite, the rewrite dealt with it. Findings
 * without a quote (format, missing sections) aren't something a rewrite of the words fixes.
 */
export type RewriteCheckResult = {
  id: string;
  label: string;
  /** Quoted lines the rewrite changed / all quoted lines that were in their resume. */
  changed: number;
  total: number;
  status: "fixed" | "partly" | "editor" | "locked";
  /** Findings in this check that don't quote a line. */
  unquoted: number;
};

const words = (text: string) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .trim()
    .toLowerCase();

/** All the words of a resume's content, for "is this line still there?". */
export function contentText(content: unknown): string {
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") parts.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(content);
  return ` ${words(parts.join(" \n "))} `;
}

export function rewriteChanges(report: ATSReportV3, original: unknown, rewritten: unknown): RewriteCheckResult[] {
  const before = contentText(original);
  const after = contentText(rewritten);
  const rows: RewriteCheckResult[] = [];
  for (const category of Object.values(report.categories ?? {})) {
    for (const check of category?.checks ?? []) {
      if (check.status === "skipped" || check.issueCount <= 0) continue;
      if (check.locked) {
        rows.push({ id: check.id, label: check.label, changed: 0, total: 0, status: "locked", unquoted: 0 });
        continue;
      }
      let changed = 0;
      let total = 0;
      let unquoted = 0;
      for (const issue of check.issues) {
        const quote = words(issue.excerpt ?? "");
        // Too short to recognise, or not a line of theirs (an AI paraphrase): can't tell.
        if (quote.split(" ").length < 3 || !before.includes(` ${quote} `)) {
          unquoted++;
          continue;
        }
        total++;
        if (!after.includes(` ${quote} `)) changed++;
      }
      const status = total === 0 ? "editor" : changed === total ? "fixed" : changed > 0 ? "partly" : "editor";
      rows.push({ id: check.id, label: check.label, changed, total, status, unquoted });
    }
  }
  const order = { fixed: 0, partly: 1, editor: 2, locked: 3 } as const;
  return rows.sort((a, b) => order[a.status] - order[b.status]);
}
