import type { Resume } from "@/lib/api";
import { visibleResumeContent, type SectionVisibility } from "@/lib/resume-visible-content";

/**
 * A Word (.docx) copy of the resume, built from its content (not from the page design), so
 * it's a clean, single-column, ATS-friendly document people can edit in Word or Google Docs.
 * Only what the resume page shows is included (switched-off sections stay out).
 * The `docx` library is loaded on demand, so it never weighs down normal pages.
 */

type AnyRecord = Record<string, unknown>;
type Run = { text: string; bold?: boolean; italics?: boolean };
/** One line of the document, before it's turned into a docx Paragraph. */
export type DocLine =
  | { kind: "name"; text: string }
  | { kind: "contact"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "entry"; left: string; right?: string }
  | { kind: "sub"; text: string }
  | { kind: "para"; runs: Run[] }
  | { kind: "bullet"; runs: Run[] };

const DEFAULT_TITLES: Record<string, string> = {
  profileSummary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certificates: "Certifications",
  awards: "Awards",
  achievements: "Achievements",
  languages: "Languages",
  courses: "Courses",
  organisations: "Organisations",
  publications: "Publications",
  interests: "Interests",
  references: "References",
  declaration: "Declaration",
};

const DEFAULT_ORDER = ["profileSummary", "experience", "education", "skills", "projects", "certificates", "awards", "achievements", "languages", "publications", "interests"];

const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

/** HTML (or plain text) from the editor → paragraphs and bullets, keeping bold and italics. */
export function htmlToLines(html: unknown): DocLine[] {
  const source = Array.isArray(html) ? html.filter((x) => typeof x === "string").join("") : str(html);
  if (!source) return [];
  if (!/<[a-z][\s\S]*>/i.test(source)) {
    return source.split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t) => ({ kind: "para", runs: [{ text: t }] }));
  }
  const doc = new DOMParser().parseFromString(`<div>${source}</div>`, "text/html");
  const lines: DocLine[] = [];
  const runsOf = (node: Node, style: { bold?: boolean; italics?: boolean } = {}): Run[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ");
      return text ? [{ text, ...style }] : [];
    }
    if (!(node instanceof Element)) return [];
    const tag = node.tagName.toLowerCase();
    const next = { bold: style.bold || tag === "strong" || tag === "b", italics: style.italics || tag === "em" || tag === "i" };
    if (tag === "br") return [{ text: " " }];
    return Array.from(node.childNodes).flatMap((child) => runsOf(child, next));
  };
  const tidy = (runs: Run[]) => {
    const out = runs.filter((r) => r.text);
    if (out.length) {
      out[0] = { ...out[0], text: out[0].text.replace(/^\s+/, "") };
      out[out.length - 1] = { ...out[out.length - 1], text: out[out.length - 1].text.replace(/\s+$/, "") };
    }
    return out.filter((r) => r.text);
  };
  const walk = (el: Element) => {
    for (const child of Array.from(el.childNodes)) {
      if (child instanceof Element) {
        const tag = child.tagName.toLowerCase();
        if (tag === "ul" || tag === "ol") {
          for (const li of Array.from(child.children)) {
            const runs = tidy(runsOf(li));
            if (runs.length) lines.push({ kind: "bullet", runs });
          }
          continue;
        }
        if (tag === "p" || tag === "div" || /^h[1-6]$/.test(tag)) {
          if (child.querySelector("ul,ol")) {
            walk(child);
            continue;
          }
          const runs = tidy(runsOf(child));
          if (runs.length) lines.push({ kind: "para", runs });
          continue;
        }
      }
      const runs = tidy(runsOf(child));
      if (runs.length) lines.push({ kind: "para", runs });
    }
  };
  walk(doc.body.firstElementChild as Element);
  return lines;
}

const dateRange = (item: AnyRecord) => {
  const start = str(item.startDate);
  const end = item.current ? "Present" : str(item.endDate);
  return [start, end].filter(Boolean).join(" – ");
};

const joinParts = (...parts: unknown[]) => parts.map(str).filter(Boolean).join(", ");

function skillLines(skills: unknown): DocLine[] {
  if (Array.isArray(skills)) {
    const names = skills
      .map((s) => (typeof s === "string" ? s : s && typeof s === "object" ? str((s as AnyRecord).name ?? (s as AnyRecord).title) : ""))
      .filter(Boolean);
    return names.length ? [{ kind: "para", runs: [{ text: names.join(", ") }] }] : [];
  }
  return htmlToLines(skills);
}

function entryLines(type: string, item: AnyRecord): DocLine[] {
  const lines: DocLine[] = [];
  switch (type) {
    case "experience":
      lines.push({ kind: "entry", left: [str(item.position), str(item.company)].filter(Boolean).join(" — "), right: dateRange(item) });
      if (str(item.location)) lines.push({ kind: "sub", text: str(item.location) });
      lines.push(...htmlToLines(item.description));
      break;
    case "education":
      lines.push({ kind: "entry", left: [joinParts(item.degree, item.field), str(item.institution)].filter(Boolean).join(" — "), right: dateRange(item) });
      if (str(item.gpa) || str(item.percentage) || str(item.location)) {
        lines.push({ kind: "sub", text: joinParts(item.location, item.gpa ? `GPA ${str(item.gpa)}` : "", item.percentage ? `${str(item.percentage)}` : "") });
      }
      lines.push(...htmlToLines(item.description));
      break;
    case "projects": {
      lines.push({ kind: "entry", left: str(item.name), right: dateRange(item) });
      const tech = Array.isArray(item.technologies) ? item.technologies.join(", ") : str(item.technologies);
      if (tech) lines.push({ kind: "sub", text: tech });
      lines.push(...htmlToLines(item.description));
      if (str(item.link)) lines.push({ kind: "sub", text: str(item.link) });
      break;
    }
    case "certificates":
      lines.push({ kind: "entry", left: [str(item.title ?? item.name), str(item.issuer)].filter(Boolean).join(" — "), right: str(item.issueDate ?? item.date) });
      break;
    default: {
      // awards, achievements, publications, courses, languages, …: title + issuer/date + text
      const title = str(item.title ?? item.name ?? item.language ?? item.degree);
      const right = str(item.date ?? item.issueDate ?? item.level ?? item.proficiency);
      if (title) lines.push({ kind: "entry", left: [title, str(item.issuer ?? item.publisher ?? item.institution)].filter(Boolean).join(" — "), right });
      lines.push(...htmlToLines(item.description));
    }
  }
  return lines;
}

/** The resume as document lines (pure; tested without the docx library). */
export function resumeDocLines(resume: Pick<Resume, "content" | "sectionOrder" | "templateId">): DocLine[] {
  const sections = (resume.sectionOrder ?? []) as unknown as (SectionVisibility & { title?: string })[];
  const content = visibleResumeContent(resume.content as unknown as AnyRecord, sections, resume.templateId);
  const info = (content.personalInfo ?? {}) as AnyRecord;
  const lines: DocLine[] = [];
  if (str(info.fullName)) lines.push({ kind: "name", text: str(info.fullName) });
  const contact = [info.location, info.phone, info.email, info.linkedin, info.github, info.portfolio ?? info.website].map(str).filter(Boolean);
  if (contact.length) lines.push({ kind: "contact", text: contact.join("  ·  ") });

  const order = sections.length ? sections.filter((s) => s.visible !== false) : DEFAULT_ORDER.map((type) => ({ id: type, type }));
  const customs = (Array.isArray(content.customSections) ? content.customSections : []) as AnyRecord[];
  for (const section of order) {
    const title = str((section as { title?: string }).title) || DEFAULT_TITLES[section.type] || "";
    if (section.type === "personalInfo") continue;
    if (section.type === "custom") {
      const custom = customs.find((c) => c.id === section.id);
      const body = custom ? htmlToLines(custom.content) : [];
      if (custom && body.length) lines.push({ kind: "heading", text: str(custom.title) || title }, ...body);
      continue;
    }
    if (section.type === "profileSummary") {
      const body = htmlToLines(content.profileSummary);
      if (body.length) lines.push({ kind: "heading", text: title || "Summary" }, ...body);
      continue;
    }
    if (section.type === "skills") {
      const body = skillLines(content.skills);
      if (body.length) lines.push({ kind: "heading", text: title || "Skills" }, ...body);
      continue;
    }
    const value = content[section.type];
    if (Array.isArray(value)) {
      const body = (value as AnyRecord[]).flatMap((item) => (item && typeof item === "object" ? entryLines(section.type, item) : []));
      if (body.length) lines.push({ kind: "heading", text: title || section.type }, ...body);
    } else if (typeof value === "string" && value.trim()) {
      lines.push({ kind: "heading", text: title || section.type }, ...htmlToLines(value));
    }
  }
  return lines;
}

/** The .docx file. */
export async function buildResumeDocx(resume: Pick<Resume, "content" | "sectionOrder" | "templateId">): Promise<Blob> {
  const { AlignmentType, BorderStyle, Document, Packer, Paragraph, TabStopType, TextRun } = await import("docx");
  const FONT = "Calibri";
  const text = (runs: Run[], size = 21) => runs.map((r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italics, size, font: FONT }));
  const RIGHT_TAB = 10200; // twips, near the right margin of A4 with 0.75" margins
  const children = resumeDocLines(resume).map((line) => {
    switch (line.kind) {
      case "name":
        return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: line.text, bold: true, size: 36, font: FONT })] });
      case "contact":
        return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: line.text, size: 19, font: FONT })] });
      case "heading":
        return new Paragraph({
          spacing: { before: 200, after: 80 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 2 } },
          children: [new TextRun({ text: line.text.toUpperCase(), bold: true, size: 22, font: FONT })],
        });
      case "entry":
        return new Paragraph({
          spacing: { before: 100, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
          children: [
            new TextRun({ text: line.left, bold: true, size: 21, font: FONT }),
            ...(line.right ? [new TextRun({ text: `\t${line.right}`, size: 20, font: FONT })] : []),
          ],
        });
      case "sub":
        return new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: line.text, italics: true, size: 20, font: FONT })] });
      case "bullet":
        return new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: text(line.runs) });
      default:
        return new Paragraph({ spacing: { after: 60 }, children: text(line.runs) });
    }
  });
  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children }],
  });
  return Packer.toBlob(doc);
}
