/**
 * What the scan screen shows back while the check runs: facts read from the person's own
 * resume, so they can see it was read properly before any score arrives.
 */

export type ScanFacts = {
  roles: number;
  /** For students and career changers, projects stand in for roles. */
  projects: number;
  /** First year in their experience and the last ("now" when a role is current). */
  years?: { from: number; to: number | "now" };
  skills: string[];
  /** Section titles as read, in order (Summary, Experience, Talks, …). */
  sections: string[];
  bullets: number;
  bulletsWithNumbers: number;
};

const SECTION_LABELS: Record<string, string> = {
  profileSummary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certificates: "Certificates",
  certifications: "Certificates",
  awards: "Awards",
  languages: "Languages",
  publications: "Publications",
  volunteering: "Volunteering",
  interests: "Interests",
  references: "References",
};

const stripTags = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function hasContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return stripTags(value).length > 0;
  return Boolean(value && typeof value === "object" && Object.keys(value).length);
}

function skillNames(value: unknown): string[] {
  if (typeof value === "string") {
    return stripTags(value.replace(/<\/(li|p)>/g, "|"))
      .split(/[|,•·;\n]/)
      .map((s) => s.replace(/^[^:]{1,30}:\s*/, "").trim())
      .filter((s) => s.length > 1 && s.length <= 40);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return skillNames(item);
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        if (Array.isArray(rec.skills) || typeof rec.skills === "string") return skillNames(rec.skills);
        const name = rec.name ?? rec.skill ?? rec.title;
        return typeof name === "string" ? skillNames(name) : [];
      }
      return [];
    });
  }
  return [];
}

function yearOf(date: unknown): number | null {
  const match = typeof date === "string" ? /(19|20)\d{2}/.exec(date) : null;
  return match ? Number(match[0]) : null;
}

/** Bullets as plain lines: list items when there are any, otherwise non-empty lines. */
function bulletsOf(description: unknown): string[] {
  const html = Array.isArray(description) ? description.join("\n") : typeof description === "string" ? description : "";
  const items = html.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
  const lines = items ?? html.split(/\n|<br\s*\/?>/i);
  return lines.map(stripTags).filter((line) => line.length > 3);
}

export function scanFactsFromContent(content: Record<string, unknown>, sectionOrder?: unknown[]): ScanFacts {
  const experience = Array.isArray(content.experience) ? (content.experience as Record<string, unknown>[]) : [];
  const starts = experience.map((e) => yearOf(e.startDate)).filter((y): y is number => y !== null);
  const current = experience.some((e) => e.current === true || /present|current/i.test(String(e.endDate ?? "")));
  const ends = experience.map((e) => yearOf(e.endDate)).filter((y): y is number => y !== null);
  const years = starts.length
    ? { from: Math.min(...starts), to: current ? ("now" as const) : Math.max(...ends, ...starts) }
    : undefined;

  const projects = Array.isArray(content.projects) ? (content.projects as Record<string, unknown>[]) : [];
  const bullets = [...experience, ...projects].flatMap((e) => bulletsOf(e.description ?? e.highlights));
  const custom = Array.isArray(content.customSections) ? (content.customSections as { title?: string }[]) : [];

  // In the order they'll appear, when we know it; otherwise the usual order.
  const orderedTypes = (sectionOrder ?? [])
    .map((s) => (s && typeof s === "object" ? String((s as { type?: unknown }).type ?? "") : ""))
    .filter(Boolean);
  const types = orderedTypes.length ? orderedTypes : Object.keys(SECTION_LABELS);
  const sections = [...new Set(types)]
    .filter((type) => type !== "custom" && SECTION_LABELS[type] && hasContent(content[type]))
    .map((type) => SECTION_LABELS[type]);
  for (const section of custom) {
    const title = section.title?.trim();
    // "TALKS" as printed reads as shouting here.
    if (title) sections.push(title === title.toUpperCase() ? title.charAt(0) + title.slice(1).toLowerCase() : title);
  }

  return {
    roles: experience.length,
    projects: projects.length,
    years,
    skills: [...new Set(skillNames(content.skills))],
    sections: [...new Set(sections)],
    bullets: bullets.length,
    bulletsWithNumbers: bullets.filter((line) => /\d/.test(line)).length,
  };
}
