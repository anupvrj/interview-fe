import type { Resume } from "@/lib/api";

/** Keys that hold ids/dates, never text a finding could be about. */
const SKIP_KEYS = new Set(["id", "_id", "startDate", "endDate", "date", "issueDate", "expiryDate", "profilePicture", "current"]);

const norm = (value: string) => value.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whitespace-tolerant pattern for the original text; whole-word for single words. */
function patternFor(original: string, wholeWord: boolean): RegExp {
  const body = norm(original).split(" ").map(escapeRegExp).join("[\\s\\u00A0]+");
  return new RegExp(wholeWord ? `(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])` : body, "u");
}

function replacePlain(value: string, original: string, improved: string, wholeWord: boolean): string | null {
  const pattern = patternFor(original, wholeWord);
  return pattern.test(value) ? value.replace(pattern, () => improved) : null;
}

/**
 * Replace inside HTML without flattening it: the change happens in the innermost
 * element (bullet, paragraph…) that contains the text, so other bullets, lists and
 * formatting stay exactly as they were.
 */
function replaceHtml(html: string, original: string, improved: string, wholeWord: boolean): string | null {
  if (typeof DOMParser === "undefined") return replacePlain(html, original, improved, wholeWord);
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const pattern = patternFor(original, wholeWord);

  // 1) Inside a single text node: keeps inline formatting around it.
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    if (pattern.test(text)) {
      node.nodeValue = text.replace(pattern, () => improved);
      return doc.body.innerHTML;
    }
  }

  // 2) Spread over inline tags (e.g. part bold): rewrite only the innermost block holding it.
  const blocks = Array.from(doc.body.querySelectorAll<HTMLElement>("li, p, div, span, strong, em, b, i, u"));
  const holder = blocks
    .filter((el) => pattern.test(el.textContent ?? ""))
    .find((el) => !Array.from(el.querySelectorAll("*")).some((child) => pattern.test(child.textContent ?? "")));
  if (holder) {
    holder.textContent = (holder.textContent ?? "").replace(pattern, () => improved);
    return doc.body.innerHTML;
  }
  return null;
}

function replaceInField(value: string, original: string, improved: string, wholeWord: boolean): string | null {
  if (!norm(original)) return null;
  return value.includes("<")
    ? replaceHtml(value, original, improved, wholeWord)
    : replacePlain(value, original, improved, wholeWord);
}

/** Replaces the FIRST occurrence only (a fix is about one spot, not every repeat). */
function replaceFirst(value: unknown, original: string, improved: string, wholeWord: boolean): { value: unknown; replaced: boolean } {
  if (typeof value === "string") {
    const next = replaceInField(value, original, improved, wholeWord);
    return next === null ? { value, replaced: false } : { value: next, replaced: true };
  }
  if (Array.isArray(value)) {
    const out = [...value];
    for (let i = 0; i < out.length; i++) {
      const result = replaceFirst(out[i], original, improved, wholeWord);
      if (result.replaced) {
        out[i] = result.value;
        return { value: out, replaced: true };
      }
    }
    return { value, replaced: false };
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const [key, nested] of Object.entries(record)) {
      if (SKIP_KEYS.has(key)) continue;
      const result = replaceFirst(nested, original, improved, wholeWord);
      if (result.replaced) return { value: { ...record, [key]: result.value }, replaced: true };
    }
  }
  return { value, replaced: false };
}

/**
 * Apply a suggested fix to the resume: the first place `original` appears (summary
 * included) gets `improved`. Single words are matched as whole words, so fixing "Go"
 * never touches "Google". Returns null when the text isn't on the resume any more.
 */
export function applyAtsIssueFixToResume(resume: Resume, original: string, improved: string): Resume | null {
  const wholeWord = !/\s/.test(norm(original));
  const summary = resume.profileSummary;
  if (typeof summary === "string" && summary) {
    const next = replaceInField(summary, original, improved, wholeWord);
    if (next !== null) {
      const content = resume.content as Resume["content"] & { profileSummary?: string };
      return {
        ...resume,
        profileSummary: next,
        // Some resumes mirror the summary inside content; keep both in step.
        content: (typeof content.profileSummary === "string" ? { ...content, profileSummary: next } : resume.content) as Resume["content"],
      };
    }
  }
  const { value, replaced } = replaceFirst(resume.content, original, improved, wholeWord);
  return replaced ? { ...resume, content: value as Resume["content"] } : null;
}
