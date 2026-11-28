import type { Resume } from "@/lib/api";
import type { TemplateStyleConfig } from "@/configs/resume-templates/template-types";
import { visibleResumeContent, type SectionVisibility } from "@/lib/resume-visible-content";

/**
 * A Word (.docx) copy of the resume: real, editable text (Word, Google Docs, ATS) styled like the
 * chosen design — its font, sizes, colours, header alignment, section-heading style, spacing,
 * margins and one or two columns, plus the user's own Style-panel changes.
 * Only what the resume page shows is included (switched-off sections stay out).
 * The `docx` library is loaded on demand, so it never weighs down normal pages.
 */

type AnyRecord = Record<string, unknown>;
type Run = { text: string; bold?: boolean; italics?: boolean };
/** One line of the document, before it's turned into a docx Paragraph. */
type Col = { column?: "left" | "right" };
export type DocLine =
  | { kind: "name"; text: string }
  | { kind: "contact"; text: string }
  | ({ kind: "heading"; text: string } & Col)
  | ({ kind: "entry"; left: string; right?: string } & Col)
  | ({ kind: "sub"; text: string } & Col)
  | ({ kind: "para"; runs: Run[] } & Col)
  | ({ kind: "bullet"; runs: Run[] } & Col);

/** How the Word file looks: taken from the template and the user's layout changes. */
export type DocxStyle = {
  font: string;
  /** Sizes in half-points (Word's unit): 21 = 10.5pt. */
  size: { name: number; heading: number; body: number; small: number };
  color: { name: string; heading: string; text: string; rule: string; headingFill?: string };
  headerAlign: "center" | "left";
  heading: { rule: "bottom" | "top-bottom" | "fill" | "none"; uppercase: boolean; align: "left" | "center" | "right" };
  /** Space before a section heading, in twips. */
  sectionGap: number;
  /** Page margins in twips. */
  margin: { top: number; bottom: number; left: number; right: number };
  /** Two columns (left/right widths in percent) when the design has them. */
  columns?: { left: number; right: number };
};

const hex = (c: string | undefined, fallback: string) => {
  const m = String(c ?? "").trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return fallback;
  const v = m[1].length === 3 ? m[1].split("").map((x) => x + x).join("") : m[1];
  return v.toUpperCase();
};
/** px (editor) → Word half-points. */
const halfPoints = (px: number) => Math.round(px * 0.75 * 2);
/** mm → twips. */
const twips = (mm: number) => Math.round(mm * 56.7);

/** The Word look for a template, with the user's font/size/margin/column changes on top. */
export function docxStyleFrom(
  style: TemplateStyleConfig,
  layout?: {
    type?: "single" | "double";
    columnWidths?: { left: number; right: number };
    padding?: { top: number; bottom: number; left: number; right: number };
    fontSize?: { heading?: number; subheading?: number; body?: number; small?: number; sectionHeader?: number };
    fontFamily?: string;
  } | null,
): DocxStyle {
  const fs = { ...style.fontSize, ...(layout?.fontSize ?? {}) };
  const sectionHeaderPx = layout?.fontSize?.sectionHeader ?? style.sectionHeader?.fontSize ?? fs.subheading;
  const font = String(layout?.fontFamily ?? style.fontFamily ?? "Calibri").split(",")[0].trim().replace(/^['"]|['"]$/g, "") || "Calibri";
  const pad = layout?.padding ?? style.padding ?? { top: 15, bottom: 15, left: 15, right: 15 };
  const sh = style.sectionHeader ?? { style: "border-bottom", textAlign: "left", fontSize: 14, fontWeight: "bold" };
  const primary = hex(style.colors?.primary, "000000");
  const rule = sh.style === "border-top-bottom" ? "top-bottom" : sh.style === "background" ? "fill" : sh.style === "none" ? "none" : "bottom";
  return {
    font,
    size: { name: halfPoints(fs.heading), heading: halfPoints(sectionHeaderPx), body: halfPoints(fs.body), small: halfPoints(fs.small ?? fs.body - 1) },
    color: {
      name: primary,
      heading: hex(sh.style === "background" ? style.colors?.text : style.colors?.primary, primary),
      text: hex(style.colors?.text, "000000"),
      rule: hex(sh.borderColor ?? style.colors?.accent ?? style.colors?.primary, "999999"),
      headingFill: sh.style === "background" ? hex(sh.backgroundColor ?? style.colors?.sectionHeaderBg, "EEEEEE") : undefined,
    },
    headerAlign: style.headerStyle === "centered" ? "center" : "left",
    heading: { rule, uppercase: (sh.textTransform ?? "uppercase") === "uppercase", align: sh.textAlign ?? "left" },
    sectionGap: Math.round(Math.max(4, Math.min(30, style.sectionSpacing ?? 10)) * 15),
    // Full-bleed designs use 0 page padding (their sidebar fills the edge); Word pages need a printable margin.
    margin: { top: twips(Math.max(8, pad.top)), bottom: twips(Math.max(8, pad.bottom)), left: twips(Math.max(8, pad.left)), right: twips(Math.max(8, pad.right)) },
    columns: layout?.type === "double" ? { left: layout.columnWidths?.left ?? 60, right: layout.columnWidths?.right ?? 40 } : undefined,
  };
}

/** The look used before a template was known: plain and ATS-safe. */
export const DEFAULT_DOCX_STYLE: DocxStyle = {
  font: "Calibri",
  size: { name: 36, heading: 22, body: 21, small: 19 },
  color: { name: "000000", heading: "000000", text: "000000", rule: "999999" },
  headerAlign: "center",
  heading: { rule: "bottom", uppercase: true, align: "left" },
  sectionGap: 200,
  margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
};

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

/** Mark the lines a section added with its column (two-column designs). */
function tagColumn(lines: DocLine[], from: number, section: { column?: "left" | "right" }) {
  if (!section.column) return;
  for (let i = from; i < lines.length; i++) {
    const l = lines[i];
    if (l.kind !== "name" && l.kind !== "contact") (l as Col).column = section.column;
  }
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
    const start = lines.length;
    const done = () => tagColumn(lines, start, section as { column?: "left" | "right" });
    const title = str((section as { title?: string }).title) || DEFAULT_TITLES[section.type] || "";
    if (section.type === "personalInfo") continue;
    if (section.type === "custom") {
      const custom = customs.find((c) => c.id === section.id);
      const body = custom ? htmlToLines(custom.content) : [];
      if (custom && body.length) lines.push({ kind: "heading", text: str(custom.title) || title }, ...body);
      done();
      continue;
    }
    if (section.type === "profileSummary") {
      const body = htmlToLines(content.profileSummary);
      if (body.length) lines.push({ kind: "heading", text: title || "Summary" }, ...body);
      done();
      continue;
    }
    if (section.type === "skills") {
      const body = skillLines(content.skills);
      if (body.length) lines.push({ kind: "heading", text: title || "Skills" }, ...body);
      done();
      continue;
    }
    const value = content[section.type];
    if (Array.isArray(value)) {
      const body = (value as AnyRecord[]).flatMap((item) => (item && typeof item === "object" ? entryLines(section.type, item) : []));
      if (body.length) lines.push({ kind: "heading", text: title || section.type }, ...body);
    } else if (typeof value === "string" && value.trim()) {
      lines.push({ kind: "heading", text: title || section.type }, ...htmlToLines(value));
    }
    done();
  }
  return lines;
}

/** The .docx file, styled like the chosen design (falls back to a plain ATS-safe look). */
export async function buildResumeDocx(
  resume: Pick<Resume, "content" | "sectionOrder" | "templateId">,
  look: DocxStyle = DEFAULT_DOCX_STYLE,
): Promise<Blob> {
  const { AlignmentType, BorderStyle, Document, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TabStopType, TextRun, WidthType } = await import("docx");
  const { font, size, color } = look;
  const run = (text: string, o: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? size.body, font, color: o.color ?? color.text });
  const runs = (rs: Run[]) => rs.map((r) => run(r.text, { bold: r.bold, italics: r.italics }));
  const align = (a: "left" | "center" | "right") => (a === "center" ? AlignmentType.CENTER : a === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT);
  const pageWidth = 11906 - look.margin.left - look.margin.right; // A4 width in twips minus margins
  const rule = { style: BorderStyle.SINGLE, size: 6, color: color.rule, space: 2 };

  const toParagraph = (line: DocLine, width: number) => {
    switch (line.kind) {
      case "name":
        return new Paragraph({ alignment: align(look.headerAlign), spacing: { after: 60 }, children: [run(line.text, { bold: true, size: size.name, color: color.name })] });
      case "contact":
        return new Paragraph({ alignment: align(look.headerAlign), spacing: { after: 160 }, children: [run(line.text, { size: size.small })] });
      case "heading":
        return new Paragraph({
          alignment: align(look.heading.align),
          spacing: { before: look.sectionGap, after: 80 },
          border: look.heading.rule === "bottom" ? { bottom: rule } : look.heading.rule === "top-bottom" ? { top: rule, bottom: rule } : undefined,
          shading: look.heading.rule === "fill" && color.headingFill ? { type: ShadingType.CLEAR, color: "auto", fill: color.headingFill } : undefined,
          children: [run(look.heading.uppercase ? line.text.toUpperCase() : line.text, { bold: true, size: size.heading, color: color.heading })],
        });
      case "entry":
        return new Paragraph({
          spacing: { before: 100, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: Math.max(2000, width - 100) }],
          children: [run(line.left, { bold: true }), ...(line.right ? [run(`\t${line.right}`, { size: size.small })] : [])],
        });
      case "sub":
        return new Paragraph({ spacing: { after: 20 }, children: [run(line.text, { italics: true, size: size.small })] });
      case "bullet":
        return new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: runs(line.runs) });
      default:
        return new Paragraph({ spacing: { after: 60 }, children: runs(line.runs) });
    }
  };

  const lines = resumeDocLines(resume);
  const header = lines.filter((l) => l.kind === "name" || l.kind === "contact");
  const body = lines.filter((l) => l.kind !== "name" && l.kind !== "contact");
  let children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[];
  if (look.columns) {
    // Two columns as a borderless table: the text stays real and in reading order per column.
    const leftW = Math.round((pageWidth * look.columns.left) / (look.columns.left + look.columns.right));
    const rightW = pageWidth - leftW;
    const side = (col: "left" | "right", w: number) => {
      const ps = body.filter((l) => ((l as Col).column ?? "left") === col).map((l) => toParagraph(l, w - 200));
      return ps.length ? ps : [new Paragraph({ children: [] })];
    };
    const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    children = [
      ...header.map((l) => toParagraph(l, pageWidth)),
      new Table({
        width: { size: pageWidth, type: WidthType.DXA },
        columnWidths: [leftW, rightW],
        borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: leftW, type: WidthType.DXA }, margins: { right: 200 }, children: side("left", leftW) }),
              new TableCell({ width: { size: rightW, type: WidthType.DXA }, margins: { left: 200 }, children: side("right", rightW) }),
            ],
          }),
        ],
      }),
    ];
  } else {
    children = lines.map((l) => toParagraph(l, pageWidth));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font, size: size.body, color: color.text } } } },
    sections: [{ properties: { page: { margin: look.margin } }, children }],
  });
  return Packer.toBlob(doc);
}
