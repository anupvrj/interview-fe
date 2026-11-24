import type { ATSReportV3 } from "@/types/atsReport";

/** All text values of a resume, one line per field / bullet, markup removed (case kept). */
export function resumePlainText(value: unknown): string {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return out
    .join("\n")
    .replace(/<\/(li|p|div)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

/** Lower-cased resume text for keyword checks that follow live edits. */
export function resumeSearchText(value: unknown): string {
  return resumePlainText(value).toLowerCase();
}

/** Is a job keyword on the resume now? ("REST or gRPC" counts if either is there.) */
export function keywordOnResume(keyword: string, text: string): boolean {
  return keyword
    .split(/\s+or\s+|\s*\/\s*/i)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
    .some((k) => new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(text));
}

/** How many times a keyword (or any of its "A or B" forms) appears in lower-cased text. */
export function keywordCount(keyword: string, text: string): number {
  return keyword
    .split(/\s+or\s+|\s*\/\s*/i)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
    .reduce((sum, k) => {
      const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^a-z0-9]|$)`, "g");
      return sum + (text.match(re)?.length ?? 0);
    }, 0);
}

/** Job requirements the ATS check found only partly ("Kafka"): shown with the job's keywords. */
export function partialJobKeywords(report: ATSReportV3 | null | undefined): string[] {
  const check = Object.values(report?.categories ?? {})
    .flatMap((c) => c?.checks ?? [])
    .find((c) => c.id === "mustHaveSkillsMatch");
  return ((check?.meta ?? {}) as { partial?: string[] }).partial ?? [];
}

export type KeywordGroup = { found: string[]; missing: string[]; partial: string[] };
export type JobKeywordGroups = { required: KeywordGroup | null; preferred: KeywordGroup | null; total: number; foundCount: number };

/**
 * The job's keywords from a tailored report: required (must-have) and preferred skills, each
 * split into found / missing / partly there. With `liveText` (the resume as it is now, lower-
 * cased), a keyword added since the check moves to found. Null when the report has no job.
 */
export function jobKeywordGroups(report: ATSReportV3 | null | undefined, liveText?: string): JobKeywordGroups | null {
  const checks = Object.values(report?.categories ?? {}).flatMap((c) => c?.checks ?? []);
  const group = (id: string): KeywordGroup | null => {
    const check = checks.find((c) => c.id === id);
    if (!check || check.status === "skipped") return null;
    const meta = (check.meta ?? {}) as { matched?: string[]; missing?: string[]; partial?: string[] };
    const uniq = (xs: string[] = []) => Array.from(new Set(xs.map((x) => x.trim()).filter(Boolean)));
    let found = uniq(meta.matched);
    let missing = uniq(meta.missing);
    let partial = uniq(meta.partial).filter((k) => !found.includes(k) && !missing.includes(k));
    if (liveText) {
      const nowThere = (k: string) => keywordOnResume(k, liveText);
      found = [...found, ...missing.filter(nowThere), ...partial.filter(nowThere)];
      missing = missing.filter((k) => !nowThere(k));
      partial = partial.filter((k) => !nowThere(k));
    }
    if (!found.length && !missing.length && !partial.length) return null;
    return { found, missing, partial };
  };
  const required = group("mustHaveSkillsMatch");
  const preferred = group("preferredSkillsMatch");
  if (!required && !preferred) return null;
  const all = [required, preferred].filter(Boolean) as KeywordGroup[];
  return {
    required,
    preferred,
    total: all.reduce((n, g) => n + g.found.length + g.missing.length + g.partial.length, 0),
    foundCount: all.reduce((n, g) => n + g.found.length, 0),
  };
}
