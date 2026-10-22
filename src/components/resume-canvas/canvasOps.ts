/**
 * Pure operations behind on-canvas editing. Paths look like
 * "personalInfo.fullName", "experience.2.company", "profileSummary".
 */

type AnyRecord = Record<string, unknown>;

/** List sections whose entries can be added, moved and deleted on the canvas. */
export const ENTRY_SECTIONS = [
  "experience",
  "education",
  "projects",
  "certificates",
  "awards",
  "achievements",
  "languages",
  "references",
  "publications",
  "courses",
  "organisations",
] as const;
export type EntrySection = (typeof ENTRY_SECTIONS)[number];

export function isEntrySection(value: string): value is EntrySection {
  return (ENTRY_SECTIONS as readonly string[]).includes(value);
}

function parsePath(path: string): Array<string | number> {
  return path
    .split(".")
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

export function getAtPath(root: unknown, path: string): unknown {
  let node: unknown = root;
  for (const key of parsePath(path)) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as AnyRecord)[key as string];
  }
  return node;
}

/** Immutable set: returns a new root with `value` at `path` (copies only the touched branch). */
export function setAtPath<T>(root: T, path: string, value: unknown): T {
  const keys = parsePath(path);
  if (keys.length === 0) return root;
  const write = (node: unknown, index: number): unknown => {
    const key = keys[index];
    const container: AnyRecord | unknown[] =
      Array.isArray(node) ? [...node] : node && typeof node === "object" ? { ...(node as AnyRecord) } : typeof key === "number" ? [] : {};
    const current = (container as AnyRecord)[key as string];
    (container as AnyRecord)[key as string] = index === keys.length - 1 ? value : write(current, index + 1);
    return container;
  };
  return write(root, 0) as T;
}

export function newEntryId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return random;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * A new entry for the canvas. Uses "Sample …" labels on purpose: the sample-data
 * check flags them on download/submit if the user never replaces them.
 */
export function blankEntry(section: EntrySection): AnyRecord {
  const id = newEntryId();
  const month = currentMonth();
  switch (section) {
    case "experience":
      return {
        id,
        position: "Sample Job",
        company: "Sample Company",
        location: "",
        startDate: month,
        endDate: "",
        current: true,
        description: "<ul><li>Sample bullet — describe what you did and the result it had.</li></ul>",
      };
    case "education":
      return { id, degree: "Sample Degree", institution: "Sample University", field: "", location: "", startDate: "", endDate: "", gpa: "" };
    case "projects":
      return { id, name: "Sample Project", description: "<ul><li>Sample — describe what you built and its impact.</li></ul>", technologies: [], link: "" };
    case "certificates":
      return { id, title: "Sample Certificate", issuer: "Sample Organisation", issueDate: month };
    case "awards":
      return { id, title: "Sample Award", issuer: "Sample Organisation", date: month, description: "" };
    case "achievements":
      return { id, title: "Sample Achievement", description: "Sample — describe the achievement and why it mattered." };
    case "languages":
      return { name: "Sample Language", level: 3 };
    case "references":
      return { id, name: "Sample Reference", position: "Sample Job", company: "Sample Company", email: "", phone: "" };
    case "publications":
      return { id, title: "Sample Publication", publisher: "Sample Publisher", date: month, link: "" };
    case "courses":
      return { id, name: "Sample Course", institution: "Sample University", date: month, description: "" };
    case "organisations":
      return { id, name: "Sample Organisation", role: "Sample Job", startDate: month, endDate: "", description: "" };
  }
}

function listOf(content: AnyRecord, section: EntrySection): unknown[] {
  const value = content[section];
  return Array.isArray(value) ? value : [];
}

/** Insert a new entry after `afterIndex` (or at the end). Returns the new content and index. */
export function addEntry<C extends AnyRecord>(
  content: C,
  section: EntrySection,
  afterIndex?: number,
): { content: C; index: number } {
  const list = [...listOf(content, section)];
  const index = afterIndex === undefined ? list.length : Math.min(list.length, afterIndex + 1);
  list.splice(index, 0, blankEntry(section));
  return { content: { ...content, [section]: list }, index };
}

export function moveEntry<C extends AnyRecord>(content: C, section: EntrySection, index: number, delta: -1 | 1): C {
  const list = [...listOf(content, section)];
  const target = index + delta;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return content;
  [list[index], list[target]] = [list[target], list[index]];
  return { ...content, [section]: list };
}

export function deleteEntry<C extends AnyRecord>(content: C, section: EntrySection, index: number): C {
  const list = listOf(content, section);
  if (index < 0 || index >= list.length) return content;
  return { ...content, [section]: list.filter((_, i) => i !== index) };
}

export function duplicateEntry<C extends AnyRecord>(content: C, section: EntrySection, index: number): C {
  const list = [...listOf(content, section)];
  const source = list[index];
  if (!source || typeof source !== "object") return content;
  const copy = { ...(source as AnyRecord) };
  if ("id" in copy) copy.id = newEntryId();
  list.splice(index + 1, 0, copy);
  return { ...content, [section]: list };
}

/** Allow-list sanitiser for rich text typed on the canvas (bullets, summary). */
const ALLOWED_TAGS = new Set(["UL", "OL", "LI", "P", "BR", "B", "STRONG", "I", "EM", "U", "A", "SPAN"]);

export function sanitizeRichHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  const clean = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (el.tagName === "DIV") {
          // Browsers wrap new lines in <div> while editing; keep them as paragraphs.
          const p = document.createElement("p");
          p.innerHTML = el.innerHTML;
          el.replaceWith(p);
          clean(p);
          continue;
        }
        if (!ALLOWED_TAGS.has(el.tagName)) {
          el.replaceWith(...Array.from(el.childNodes));
          clean(node);
          return;
        }
        for (const attr of Array.from(el.attributes)) {
          const keep = el.tagName === "A" && attr.name === "href" && /^(https?:|mailto:)/i.test(attr.value);
          if (!keep) el.removeAttribute(attr.name);
        }
        clean(el);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    }
  };
  clean(template.content);
  // Drop empty list items/paragraphs left behind by deleting text.
  template.content.querySelectorAll("li, p").forEach((el) => {
    if (!el.textContent?.trim()) el.remove();
  });
  template.content.querySelectorAll("ul, ol").forEach((el) => {
    if (!el.children.length) el.remove();
  });
  return template.innerHTML.trim();
}

/** Single-line field text from contenteditable (no markup, collapsed whitespace). */
export function plainFieldText(text: string): string {
  return text.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

export function escapeHtmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Text lines of a value: plain strings as-is, HTML split on list items / paragraphs / line breaks. */
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function textLines(value: string): string[] {
  if (!/<[a-z][\s\S]*>/i.test(value)) return [decodeEntities(value)];
  return value.split(/<\/(?:li|p|div|h\d)>|<br\s*\/?>/i).map((part) => decodeEntities(part.replace(/<[^>]+>/g, " ")));
}

function collectLines(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    for (const line of textLines(value)) {
      const clean = line.replace(/\s+/g, " ").trim();
      if (clean.length > 1) out.push(clean);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectLines(v, out));
  } else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (key === "id") continue;
      collectLines(v, out);
    }
  }
}

/**
 * Lines that are new or reworded in `after` compared with `before` — what an AI
 * edit changed, so it can be highlighted on the page for review.
 */
export function changedTextLines(before: unknown, after: unknown, limit = 60): string[] {
  const old: string[] = [];
  collectLines(before, old);
  const seen = new Set(old.map((l) => l.toLowerCase()));
  const next: string[] = [];
  collectLines(after, next);
  const changed: string[] = [];
  for (const line of next) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    changed.push(line);
    if (changed.length >= limit) break;
  }
  return changed;
}
