/**
 * Per-section designs people pick on the page ("Skills as a table, as commas, as tags…").
 * Stored in `layout.sectionDesigns` ({ [sectionId]: designId }); no choice = the template's
 * own look. Content never changes, only how a list is laid out, so switching is safe and
 * survives a template switch.
 */

export type ListDesignId = "columns-3" | "columns-2" | "bullets" | "comma" | "dot" | "tags";

export const LIST_DESIGNS: { id: ListDesignId; label: string; hint: string }[] = [
  { id: "columns-3", label: "Table, 3 columns", hint: "Neat rows, easy to scan" },
  { id: "columns-2", label: "Table, 2 columns", hint: "For longer items" },
  { id: "bullets", label: "Bullet list", hint: "Two columns of bullets" },
  { id: "comma", label: "Comma separated", hint: "Most compact, saves space" },
  { id: "dot", label: "Separated by dots", hint: "Compact, one flowing line" },
  { id: "tags", label: "Tags", hint: "Boxed labels" },
];

/** Sections whose content is a plain list of words, so any list design fits them. */
const LIST_SECTION_TYPES = new Set(["skills", "interests"]);

/** Templates whose block for this section also carries other sections (a design would drop them). */
const COMBINED_BLOCKS: Record<string, Set<string>> = {
  skills: new Set(["royal-indigo"]),
  interests: new Set(["amber-edge", "meridian"]),
};

export function supportsListDesigns(sectionType: string, templateId?: string | null): boolean {
  if (!LIST_SECTION_TYPES.has(sectionType)) return false;
  return !(templateId && COMBINED_BLOCKS[sectionType]?.has(templateId));
}

const IDS = new Set<string>(LIST_DESIGNS.map((d) => d.id));

type LayoutLike = { sectionDesigns?: Record<string, string> | null } & Record<string, unknown>;

export function sectionDesignOf(layout: unknown, sectionId: string): ListDesignId | null {
  const designs = (layout as LayoutLike | null | undefined)?.sectionDesigns;
  const id = designs && typeof designs === "object" ? designs[sectionId] : undefined;
  return typeof id === "string" && IDS.has(id) ? (id as ListDesignId) : null;
}

/** A copy of `layout` with `sectionId` set to `design` (null = back to the template's look). */
export function withSectionDesign<T extends object>(layout: T | null | undefined, sectionId: string, design: ListDesignId | null): T {
  const base = (layout ?? {}) as T & LayoutLike;
  const next = { ...(base.sectionDesigns ?? {}) } as Record<string, string>;
  if (design) next[sectionId] = design;
  else delete next[sectionId];
  return { ...base, sectionDesigns: next } as T;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split free text on , | ; • and new lines, but not inside brackets ("AWS (Lambda, SQS)" stays one). */
function splitList(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(" || ch === "[") depth++;
    else if ((ch === ")" || ch === "]") && depth > 0) depth--;
    if (depth === 0 && /[,|\n;•]/.test(ch)) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur);
  return parts.map((t) => t.trim()).filter(Boolean);
}

/**
 * Every word of a list section, whatever shape it's stored in: an array (strings or
 * { name }), HTML with list items, comma / pipe / line separated text, or groups
 * ({ Technical: [...], Soft: [...] }).
 */
export function listItemsFrom(value: unknown): string[] {
  const out: string[] = [];
  const whole = (t: string) => {
    const clean = stripTags(t); // also decodes &amp; and friends
    if (clean) out.push(clean);
  };
  const add = (v: unknown, inList: boolean) => {
    if (v == null) return;
    if (Array.isArray(v)) return v.forEach((x) => add(x, true));
    if (typeof v === "object") {
      const rec = v as Record<string, unknown>;
      const name = rec.name ?? rec.title ?? rec.skill;
      if (typeof name === "string") return whole(name);
      return Object.values(rec).forEach((x) => add(x, false));
    }
    const text = String(v);
    if (/<li[\s>]/i.test(text)) {
      for (const m of text.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) whole(m[1]);
      return;
    }
    // One entry of a list is one item, even with a comma in it.
    if (inList) return whole(text);
    const plain = /<[a-z][\s\S]*>/i.test(text) ? stripTags(text.replace(/<\/(p|div)>|<br\s*\/?>/gi, "\n")) : text;
    splitList(plain).forEach(whole);
  };
  add(value, false);
  const seen = new Set<string>();
  return out.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
