import type { Resume } from "@/lib/api";

/**
 * Putting an AI / ATS suggestion into the resume, safely.
 *
 * - A suggestion is about ONE bullet (or line). It is found by location (field path +
 *   bullet index) when we know it, otherwise by its text — matched loosely, because the AI
 *   quotes bullets loosely ("…platform." for "…platform, enhancing …").
 * - A rewritten sentence replaces the whole bullet; a short phrase replaces just itself.
 * - It never replaces a whole multi-bullet field (that's how bullets were lost before).
 * - It says where it changed, so the page can scroll there and highlight it.
 */

export type SuggestionAt = {
  /** "@profileSummary" or a content path such as "experience.1.description". */
  path: string;
  /** Which bullet / line inside the field (null: the field is a single line). */
  index: number | null;
};

export type SuggestionResult = { resume: Resume; at: SuggestionAt };

/** Keys that hold ids/dates, never text a suggestion could be about. */
const SKIP_KEYS = new Set(["id", "_id", "startDate", "endDate", "date", "issueDate", "expiryDate", "profilePicture", "current", "link", "url"]);

/** Comparable form: lower-case words only (punctuation, quotes and spacing ignored). */
export function looseText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}{}%+#]+/gu, " ")
    .trim();
}

const words = (value: string) => looseText(value).split(" ").filter(Boolean);

/** A full rewritten sentence (vs. a word or phrase to swap in place). */
function isSentence(text: string): boolean {
  const t = text.trim();
  return words(t).length >= 6 || /[.!?]$/.test(t);
}

/**
 * Does `quote` refer to this block? Exact (loose) containment, or the quote is the
 * beginning of the block (the AI often quotes just the first part of a bullet).
 */
function quoteMatches(blockText: string, quote: string): boolean {
  const block = looseText(blockText);
  const q = looseText(quote);
  if (!q || !block) return false;
  if (block.includes(q)) return true;
  const qw = q.split(" ");
  if (qw.length < 5) return false;
  // Leading words agree (allows a paraphrased tail).
  const head = qw.slice(0, Math.min(qw.length, 8)).join(" ");
  return block.startsWith(head);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Text-node-safe replacement of a phrase inside a block, tolerant of punctuation/spacing. */
function replacePhrase(text: string, quote: string, improved: string): string | null {
  const parts = quote.trim().replace(/[.,;:!?]+$/, "").split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(parts.map(esc).join("[\\s\\u00A0,;:]+"), "iu");
  return pattern.test(text) ? text.replace(pattern, () => improved.trim()) : null;
}

type Blocks = { doc: Document | null; els: Element[]; plain: string[] | null };

/** The bullets / lines of an HTML (or plain) field. */
function blocksOf(value: string): Blocks {
  if (value.includes("<") && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(`<body>${value}</body>`, "text/html");
    const lis = Array.from(doc.body.querySelectorAll("li"));
    const els = lis.length ? lis : Array.from(doc.body.querySelectorAll("p"));
    return { doc, els: els.length ? els : [doc.body], plain: null };
  }
  return { doc: null, els: [], plain: value.split(/\n/) };
}

/** Replace inside one block of a field. Returns the new field value, or null. */
function replaceInBlock(value: string, index: number, quote: string, improved: string, wholeBlock: boolean): string | null {
  const { doc, els, plain } = blocksOf(value);
  if (doc) {
    const el = els[index];
    if (!el) return null;
    const current = el.textContent ?? "";
    if (wholeBlock || !quote) {
      el.textContent = improved.trim();
    } else {
      const next = replacePhrase(current, quote, improved);
      if (next === null) {
        // The phrase moved or was reworded: a sentence still replaces the bullet.
        if (!isSentence(improved)) return null;
        el.textContent = improved.trim();
      } else {
        el.textContent = next;
      }
    }
    // The field itself was a single block of text (e.g. "<p>…</p>" or plain body).
    return els[0] === doc.body ? escapeHtml(doc.body.textContent ?? "") : doc.body.innerHTML;
  }
  const lines = plain ?? [];
  if (!lines[index] && lines.length > 1) return null;
  const line = lines[index] ?? value;
  const nextLine = wholeBlock || !quote ? improved.trim() : replacePhrase(line, quote, improved);
  if (nextLine === null) return null;
  const out = [...lines];
  out[index] = nextLine;
  return out.join("\n");
}

function getAt(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined), root);
}

function setAt<T>(root: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const copy = (node: unknown): unknown => (Array.isArray(node) ? [...node] : { ...(node as Record<string, unknown>) });
  const out = copy(root) as Record<string, unknown>;
  let cur: Record<string, unknown> = out;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) cur[key] = value;
    else {
      cur[key] = copy(cur[key]);
      cur = cur[key] as Record<string, unknown>;
    }
  });
  return out as T;
}

/**
 * Descriptions are also stored as string arrays (["<ul>…</ul>"], or one line each). The page
 * shows and edits them as one field (see descriptionToEditorHtml), so read them the same way;
 * writing back stores the HTML string, as typing on the page does.
 */
function fieldText(key: string, value: unknown): string | null {
  if (typeof value === "string") return value;
  if (key !== "description" || !Array.isArray(value) || !value.every((v) => typeof v === "string")) return null;
  const items = value.map((v) => v.trim()).filter(Boolean);
  if (items.length === 1 && /<(ul|ol)[\s>]/i.test(items[0])) return items[0];
  return items.map((item) => `<p>${item}</p>`).join("");
}

function readField(resume: Resume, path: string): string | null {
  if (path === "@profileSummary") return typeof resume.profileSummary === "string" ? resume.profileSummary : null;
  return fieldText(path.split(".").pop() ?? "", getAt(resume.content, path));
}

function writeField(resume: Resume, path: string, value: string): Resume {
  if (path === "@profileSummary") {
    const content = resume.content as Resume["content"] & { profileSummary?: string };
    return {
      ...resume,
      profileSummary: value,
      // Some resumes mirror the summary inside content; keep both in step.
      content: (typeof content.profileSummary === "string" ? { ...content, profileSummary: value } : resume.content) as Resume["content"],
    };
  }
  return { ...resume, content: setAt(resume.content, path, value) };
}

/** Every text field, summary first, in reading order: [path, value]. */
function textFields(resume: Resume): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (typeof resume.profileSummary === "string" && resume.profileSummary.trim()) out.push(["@profileSummary", resume.profileSummary]);
  const walk = (node: unknown, path: string) => {
    const asField = path ? fieldText(path.split(".").pop() ?? "", node) : null;
    if (asField !== null) {
      out.push([path, asField]);
    } else if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, path ? `${path}.${i}` : String(i)));
    } else if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        if (SKIP_KEYS.has(key)) continue;
        walk(child, path ? `${path}.${key}` : key);
      }
    }
  };
  walk(resume.content, "");
  return out;
}

/** The text at a spot now (one bullet, or the whole field), or null if it's gone. */
export function textAtLocation(resume: Resume, at: SuggestionAt): string | null {
  const value = readField(resume, at.path);
  if (value === null) return null;
  const { els, plain } = blocksOf(value);
  const raw = els.length ? (at.index === null ? els.map((el) => el.textContent ?? "").join(" ") : els[at.index]?.textContent) : plain?.[at.index ?? 0];
  const text = raw?.replace(/\s+/g, " ").trim();
  return text ? text : null;
}

/**
 * Put `improved` into the resume in place of `original`.
 * `at`: the bullet we already know it belongs to (AI Coach target, or the spot a previous
 * apply returned) — used first, so repeats of the same sentence in other jobs are left alone.
 */
export function applySuggestion(
  resume: Resume,
  {
    original,
    improved,
    at,
    occurrence = 1,
  }: {
    original: string;
    improved: string;
    at?: SuggestionAt | null;
    /** Found by text and the sentence repeats (same bullet in two jobs): which copy, 1 = first. */
    occurrence?: number;
  },
): SuggestionResult | null {
  const replacement = improved.trim();
  if (!replacement) return null;
  const wholeBlock = isSentence(replacement) && (!original || isSentence(original) || words(original).length >= 4);

  if (at) {
    const value = readField(resume, at.path);
    if (value !== null) {
      const index = at.index ?? 0;
      const { els, plain } = blocksOf(value);
      const blockText = els.length ? els[index]?.textContent ?? "" : plain?.[index] ?? value;
      // The spot still holds what we expect (or we were told to replace it outright).
      if (blockText && (!original || quoteMatches(blockText, original) || wholeBlock)) {
        const next = replaceInBlock(value, index, original, replacement, wholeBlock);
        if (next !== null) return { resume: writeField(resume, at.path, next), at: { path: at.path, index: at.index } };
      }
    }
  }

  if (!original.trim()) return null;
  // Every copy in reading order; take the requested one (or the last, if there are fewer now).
  const matches: Array<{ path: string; value: string; index: number; many: boolean }> = [];
  for (const [path, value] of textFields(resume)) {
    const { els, plain } = blocksOf(value);
    const texts = els.length ? els.map((el) => el.textContent ?? "") : plain ?? [];
    texts.forEach((text, index) => {
      if (quoteMatches(text, original)) matches.push({ path, value, index, many: texts.length > 1 });
    });
  }
  const wanted = Math.min(Math.max(1, occurrence), matches.length) - 1;
  for (const m of [matches[wanted], ...matches].filter(Boolean)) {
    const next = replaceInBlock(m.value, m.index, original, replacement, wholeBlock);
    if (next === null) continue;
    return { resume: writeField(resume, m.path, next), at: { path: m.path, index: m.many ? m.index : null } };
  }
  return null;
}
