/**
 * What the resume page (and so the PDF) actually shows. A template can keep a section's data
 * while the section is switched off (Atlantic Blue starts with Projects, Certifications and
 * Interests hidden), and scoring that data flagged sample text the user could not see and
 * counted keywords that were not on the page.
 *
 * Pure and dependency-free: the same file lives in interview-core
 * (src/services/resumeBuilder/visibleResumeContent.ts). Keep them identical.
 */

export type SectionVisibility = { id: string; type: string; visible?: boolean };

type AnyRecord = Record<string, unknown>;

/** Section type → the content key holding its data. */
const SECTION_CONTENT_KEYS: Record<string, string> = {
  profileSummary: "profileSummary",
  experience: "experience",
  education: "education",
  skills: "skills",
  projects: "projects",
  certificates: "certificates",
  awards: "awards",
  achievements: "achievements",
  languages: "languages",
  courses: "courses",
  organisations: "organisations",
  publications: "publications",
  interests: "interests",
  references: "references",
  declaration: "declaration",
};

/**
 * Fields only some designs print. An education description is shown by Royal Indigo alone;
 * elsewhere it isn't on the page (template sample text used to sit there unseen and scored).
 */
const EDUCATION_DESCRIPTION_TEMPLATES = new Set(["royal-indigo"]);

/** Is the summary on the page? Without a section list, yes (as before). */
export function summaryVisible(sectionOrder: readonly SectionVisibility[] | undefined | null): boolean {
  if (!sectionOrder?.length) return true;
  return sectionOrder.some((s) => s.type === "profileSummary" && s.visible !== false);
}

/**
 * The content with every section that is switched off, or missing from the section list,
 * emptied (lists → [], text → ""), and fields the design doesn't print are dropped. Without a
 * section list the content is returned as is, so resumes saved before section lists existed are
 * read exactly as before.
 */
export function visibleResumeContent<T>(
  content: T,
  sectionOrder: readonly SectionVisibility[] | undefined | null,
  templateId?: string,
): T {
  if (!content || typeof content !== "object" || !sectionOrder?.length) return content;
  const shown = sectionOrder.filter((s) => s.visible !== false);
  const shownTypes = new Set(shown.map((s) => s.type));
  const next: AnyRecord = { ...(content as AnyRecord) };
  for (const [type, key] of Object.entries(SECTION_CONTENT_KEYS)) {
    if (shownTypes.has(type) || !(key in next)) continue;
    const value = next[key];
    if (Array.isArray(value)) next[key] = [];
    else if (typeof value === "string") next[key] = "";
    else delete next[key];
  }
  if (templateId && !EDUCATION_DESCRIPTION_TEMPLATES.has(templateId) && Array.isArray(next.education)) {
    next.education = (next.education as AnyRecord[]).map((item) => {
      if (!item || typeof item !== "object" || !("description" in item)) return item;
      const { description: _hidden, ...rest } = item;
      return rest;
    });
  }
  if (Array.isArray(next.customSections)) {
    const shownIds = new Set(shown.filter((s) => s.type === "custom").map((s) => s.id));
    next.customSections = (next.customSections as AnyRecord[]).filter((cs) => typeof cs?.id === "string" && shownIds.has(cs.id));
  }
  return next as T;
}
