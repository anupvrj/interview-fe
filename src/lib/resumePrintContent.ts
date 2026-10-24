import type { Resume } from "@/lib/api";

/**
 * What prints (PDF, preview, thumbnail, ATS read): the resume without blank entries and
 * empty text. An "Add item" row left blank, or a cleared editor saved as "<p></p>", made
 * every design print the section heading with nothing under it (and "[object Object]" for
 * a nameless language in some designs). The editor keeps them so they can be filled in.
 */

/** Fields that don't make an entry worth printing on their own. */
const NOT_CONTENT = new Set([
  "id",
  "_id",
  "startDate",
  "endDate",
  "date",
  "issueDate",
  "expiryDate",
  "current",
  "level",
  "proficiency",
  "rating",
  "column",
]);

export function hasPrintableText(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").trim().length > 0;
  }
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.some(hasPrintableText);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, v]) => !NOT_CONTENT.has(key) && hasPrintableText(v));
  }
  return false;
}

const blankToEmpty = (value: unknown) => (typeof value === "string" && !hasPrintableText(value) ? "" : value);

export function resumeForPrint<R extends Pick<Resume, "content"> & { profileSummary?: string }>(resume: R): R {
  const content = (resume.content ?? {}) as unknown as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(content)) {
    if (key === "personalInfo") {
      next[key] = value;
    } else if (key === "customSections" && Array.isArray(value)) {
      next[key] = value.filter((cs) => cs && hasPrintableText((cs as { content?: unknown }).content));
    } else if (Array.isArray(value)) {
      next[key] = value.filter(hasPrintableText);
    } else if (key === "skills" && value && typeof value === "object") {
      // { skills: [...] } / groups: keep only groups with something in them.
      const kept = Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, v]) => hasPrintableText(v)));
      next[key] = Object.keys(kept).length ? kept : [];
    } else {
      next[key] = blankToEmpty(value);
    }
  }
  return {
    ...resume,
    content: next as unknown as R["content"],
    ...(resume.profileSummary !== undefined ? { profileSummary: blankToEmpty(resume.profileSummary) as string } : {}),
  };
}
