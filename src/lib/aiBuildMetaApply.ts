/**
 * Apply "What's left for you" actions to a resume's content: fill a number slot, add a
 * suggested bullet, move a line out. Pure functions on content.
 */
import type { AiBuildMeta, Resume } from "@/lib/api";

type Content = Resume["content"];

export const SLOT_RE = /\[(?:X%?|N|\$X|X [a-z]+|N [a-z]+)\]/;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decode(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();
}

/**
 * A description as one HTML string. Stored descriptions can be an array: one element holding
 * the whole list (["<ul>…</ul>"]), or one element per line.
 */
function asHtml(description: unknown): string {
  if (typeof description === "string") return description;
  if (!Array.isArray(description)) return "";
  const items = description.map((d) => String(d).trim()).filter(Boolean);
  if (items.length === 1 && /<(ul|ol)[\s>]/i.test(items[0])) return items[0];
  return toList(items.map(decode));
}

/** Bullet lines of a description (HTML list or plain lines). */
export function bulletsOf(description: unknown): string[] {
  const d = asHtml(description);
  const lis = d.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (lis) return lis.map((l) => decode(l)).filter(Boolean);
  return d
    .split(/\n+|<br\s*\/?>|<\/p>/i)
    .map((l) => decode(l))
    .filter(Boolean);
}

export function toList(lines: string[]): string {
  return lines.length ? `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : "";
}

/** "experience.2.description.1" → { section, entry, line } */
export function parseLinePath(path: string): { section: "experience" | "projects"; entry: number; line: number } | null {
  const m = /^(experience|projects)\.(\d+)\.description\.(\d+)$/.exec(path);
  return m ? { section: m[1] as "experience" | "projects", entry: Number(m[2]), line: Number(m[3]) } : null;
}

function withLines(content: Content, section: "experience" | "projects", entry: number, edit: (lines: string[]) => string[]): Content {
  const list = [...(((content as Record<string, unknown>)[section] as Array<Record<string, unknown>>) ?? [])];
  const item = list[entry];
  if (!item) return content;
  list[entry] = { ...item, description: toList(edit(bulletsOf(item.description))) };
  return { ...content, [section]: list } as Content;
}

/** Find the line a slot lives on: by path, or (if lines moved) by its original text. */
function locate(content: Content, path: string, text: string): { section: "experience" | "projects"; entry: number; line: number } | null {
  const p = parseLinePath(path);
  if (!p) return null;
  const list = ((content as Record<string, unknown>)[p.section] as Array<Record<string, unknown>>) ?? [];
  const lines = bulletsOf(list[p.entry]?.description);
  if (lines[p.line] === text || (lines[p.line] && SLOT_RE.test(lines[p.line]))) return p;
  const at = lines.findIndex((l) => l === text);
  return at >= 0 ? { ...p, line: at } : null;
}

/** Still on the resume, unchanged since the build? (otherwise the item is stale). */
export function slotStillOpen(content: Content, path: string, text: string): boolean {
  const p = locate(content, path, text);
  if (!p) return false;
  const list = ((content as Record<string, unknown>)[p.section] as Array<Record<string, unknown>>) ?? [];
  return SLOT_RE.test(bulletsOf(list[p.entry]?.description)[p.line] ?? "");
}

/** Edit one line in place in the raw description (keeps its markup); rebuild the list only if needed. */
function editLine(content: Content, p: { section: "experience" | "projects"; entry: number; line: number }, next: string | null): Content {
  const list = [...(((content as Record<string, unknown>)[p.section] as Array<Record<string, unknown>>) ?? [])];
  const item = list[p.entry];
  if (!item) return content;
  const raw = asHtml(item.description);
  const lines = bulletsOf(raw);
  const old = lines[p.line];
  if (old !== undefined) {
    const li = raw.match(/<li[^>]*>[\s\S]*?<\/li>/gi)?.find((l) => decode(l) === old);
    if (li) {
      const replaced = next === null ? raw.replace(li, "") : raw.replace(li, li.replace(/(<li[^>]*>)[\s\S]*(<\/li>)/i, `$1${esc(next)}$2`));
      list[p.entry] = { ...item, description: replaced };
      return { ...content, [p.section]: list } as Content;
    }
  }
  return withLines(content, p.section, p.entry, (ls) => (next === null ? ls.filter((_, i) => i !== p.line) : ls.map((l, i) => (i === p.line ? next : l))));
}

export function fillSlot(content: Content, path: string, text: string, value: string): Content | null {
  const p = locate(content, path, text);
  const v = value.trim();
  if (!p || !v) return null;
  const list = ((content as Record<string, unknown>)[p.section] as Array<Record<string, unknown>>) ?? [];
  const line = bulletsOf(list[p.entry]?.description)[p.line];
  if (!line || !SLOT_RE.test(line)) return null;
  return editLine(content, p, line.replace(SLOT_RE, v));
}

export function addBullet(content: Content, roleIndex: number, text: string): Content {
  return addLine(content, "experience", roleIndex, text);
}

/** Append one line to a job's or project's description (keeps its markup). */
export function addLine(content: Content, section: "experience" | "projects", index: number, text: string): Content {
  const list = [...(((content as Record<string, unknown>)[section] as Array<Record<string, unknown>>) ?? [])];
  const item = list[index];
  if (!item) return content;
  const raw = asHtml(item.description);
  if (/<\/ul>/i.test(raw)) {
    list[index] = { ...item, description: raw.replace(/<\/ul>(?![\s\S]*<\/ul>)/i, `<li>${esc(text)}</li></ul>`) };
    return { ...content, [section]: list } as Content;
  }
  return withLines(content, section, index, (lines) => [...lines, text]);
}

export function removeLine(content: Content, path: string, text: string): Content | null {
  const p = locate(content, path, text);
  return p ? editLine(content, p, null) : null;
}

export type WhatsLeftItem =
  | { kind: "contact"; key: string; field: "email" | "phone" | "linkedin"; label: string }
  | { kind: "slot"; key: string; path: string; text: string }
  | { kind: "skill"; key: string; skill: string }
  | { kind: "suggestion"; key: string; roleIndex: number; role: string; text: string }
  | { kind: "length"; key: string; path: string; text: string }
  | { kind: "personal"; key: string; fields: string[]; label: string; region: string }
  | { kind: "timeline"; key: string; role: string; tool: string; released: number; roleEnded: number }
  | { kind: "functional"; key: string };

/** Details recruiters in these regions usually don't expect (and some screen out for bias). */
export const SENSITIVE_PERSONAL: { field: string; label: string }[] = [
  { field: "profilePicture", label: "photo" },
  { field: "dateOfBirth", label: "date of birth" },
  { field: "maritalStatus", label: "marital status" },
  { field: "gender", label: "gender" },
  { field: "nationality", label: "nationality" },
  { field: "passportNo", label: "passport details" },
];
const PASSPORT_FIELDS = ["passport", "passportNo", "passportPlaceOfIssue", "passportDateOfIssue", "passportDateOfExpiry"];
const REGION_NAMES: Record<string, string> = { us: "the US", uk: "the UK", india: "India" };

/** Fields to clear for one "personal" item (passport covers all its parts). */
export function personalFieldsToClear(fields: string[]): string[] {
  return fields.flatMap((f) => (f === "passportNo" ? PASSPORT_FIELDS : [f]));
}

/** Everything still open, minus what the user dealt with. */
export function whatsLeft(content: Content, meta: AiBuildMeta | undefined | null): WhatsLeftItem[] {
  const dismissed = new Set(meta?.dismissed ?? []);
  const items: WhatsLeftItem[] = [];
  const pi = (content.personalInfo ?? {}) as Record<string, string | undefined>;
  const contact: [WhatsLeftItem & { kind: "contact" }][] = [];
  if (!pi.email?.trim()) contact.push([{ kind: "contact", key: "contact:email", field: "email", label: "Add your email" }]);
  if (!pi.phone?.trim()) contact.push([{ kind: "contact", key: "contact:phone", field: "phone", label: "Add your phone number" }]);
  if (!pi.linkedin?.trim()) contact.push([{ kind: "contact", key: "contact:linkedin", field: "linkedin", label: "Add your LinkedIn profile" }]);
  if (meta) items.push(...contact.map(([c]) => c));
  for (const s of meta?.slots ?? []) {
    const key = `slot:${s.path}`;
    if (!dismissed.has(key) && slotStillOpen(content, s.path, s.text)) items.push({ kind: "slot", key, path: s.path, text: s.text });
  }
  for (const skill of meta?.skillsToConfirm ?? []) {
    const key = `skill:${skill.toLowerCase()}`;
    if (!dismissed.has(key)) items.push({ kind: "skill", key, skill });
  }
  (meta?.suggestions ?? []).forEach((s, i) => {
    const key = `suggestion:${s.roleIndex}:${i}`;
    if (!dismissed.has(key)) items.push({ kind: "suggestion", key, roleIndex: s.roleIndex, role: s.role, text: s.text });
  });
  for (const l of meta?.lengthSuggestions ?? []) {
    const key = `length:${l.path}`;
    if (!dismissed.has(key) && locate(content, l.path, l.text)) items.push({ kind: "length", key, path: l.path, text: l.text });
  }
  if (meta?.functionalLayout && !dismissed.has("functional:layout")) items.push({ kind: "functional", key: "functional:layout" });
  for (const f of meta?.timelineFlags ?? []) {
    const key = `timeline:${f.roleIndex}:${f.tool}`;
    if (!dismissed.has(key)) items.push({ kind: "timeline", key, role: f.role, tool: f.tool, released: f.released, roleEnded: f.roleEnded });
  }
  const region = String((meta?.brief as { region?: string } | undefined)?.region ?? "");
  if (REGION_NAMES[region] && !dismissed.has("personal:details")) {
    const shown = SENSITIVE_PERSONAL.filter(({ field }) =>
      field === "passportNo" ? PASSPORT_FIELDS.some((f) => String(pi[f] ?? "").trim()) : String(pi[field] ?? "").trim(),
    );
    if (shown.length) {
      items.push({
        kind: "personal",
        key: "personal:details",
        fields: shown.map((s) => s.field),
        label: shown.map((s) => s.label).join(", "),
        region: REGION_NAMES[region],
      });
    }
  }
  return items.filter((it) => !dismissed.has(it.key));
}
