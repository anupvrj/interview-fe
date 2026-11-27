/**
 * Why each AI change was made, in plain words: pairs every rewritten line with the line it
 * replaced and describes the actual difference (job keywords it now uses, a stronger opening,
 * shorter or more specific, numbers kept). Computed from the text, never claimed by the model.
 */
import { bulletsOf } from "@/lib/aiBuildMetaApply";

export type AiChange = { path: string; before?: string; after: string; reason: string };

type Line = { path: string; text: string };

function plain(html: unknown): string {
  return String(html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function linesOf(content: Record<string, unknown> | undefined, summary?: string): Line[] {
  const out: Line[] = [];
  const s = plain(summary ?? content?.profileSummary);
  if (s) out.push({ path: "profileSummary", text: s });
  for (const section of ["experience", "projects"] as const) {
    const list = (content?.[section] as Array<{ description?: unknown }>) ?? [];
    list.forEach((item, i) => bulletsOf(item?.description).forEach((text, j) => out.push({ path: `${section}.${i}.description.${j}`, text })));
  }
  return out;
}

const words = (t: string) => t.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? [];
const STOP = new Set("the and for with from into that this our your their was were are has have had will its using use used across over".split(" "));

function overlap(a: string, b: string): number {
  const wa = new Set(words(a)), wb = new Set(words(b));
  const shared = [...wa].filter((w) => wb.has(w)).length;
  return shared / Math.max(1, Math.min(wa.size, wb.size));
}

export function reasonFor(before: string | undefined, after: string, jobDescription = ""): string {
  if (!before) return "New line written from what is already in your resume.";
  const parts: string[] = [];
  const jd = new Set(words(jobDescription).filter((w) => w.length > 2 && !STOP.has(w)));
  const had = new Set(words(before));
  const added = [...new Set(words(after))].filter((w) => jd.has(w) && !had.has(w) && !STOP.has(w));
  if (added.length) parts.push(`uses the job's words: ${added.slice(0, 4).join(", ")}`);
  const v0 = words(before)[0], v1 = words(after)[0];
  if (v0 && v1 && v0 !== v1 && /^(responsible|worked|helped|involved|handled|assisted|tasked)$/.test(v0)) parts.push(`opens with "${after.split(/\s+/)[0]}" instead of "${before.split(/\s+/)[0]}"`);
  const n0 = before.split(/\s+/).length, n1 = after.split(/\s+/).length;
  if (n1 <= n0 - 5) parts.push(`tighter (${n0} → ${n1} words)`);
  else if (n1 >= n0 + 6) parts.push(`more specific (${n0} → ${n1} words)`);
  const nums = before.match(/\d+(?:[.,]\d+)*%?/g) ?? [];
  if (nums.length && nums.every((n) => after.includes(n))) parts.push("keeps your numbers");
  if (!parts.length) parts.push("reworded to lead with what this job looks for");
  const text = parts.join("; ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

/** Every changed line after an AI rewrite, with the line it replaced and why. */
export function explainChanges(
  before: { content?: Record<string, unknown>; profileSummary?: string },
  after: { content?: Record<string, unknown>; profileSummary?: string },
  jobDescription = "",
  limit = 60,
): AiChange[] {
  const old = linesOf(before.content, before.profileSummary);
  const oldTexts = new Set(old.map((l) => l.text.toLowerCase()));
  const used = new Set<number>();
  const out: AiChange[] = [];
  for (const line of linesOf(after.content, after.profileSummary)) {
    if (oldTexts.has(line.text.toLowerCase())) continue;
    const entry = line.path.replace(/\.description\.\d+$/, "");
    // Same spot first, else the most similar unused line in the same entry.
    let idx = old.findIndex((l, i) => !used.has(i) && l.path === line.path && overlap(l.text, line.text) >= 0.25);
    if (idx < 0) {
      let best = 0.3;
      old.forEach((l, i) => {
        if (used.has(i) || !l.path.startsWith(entry)) return;
        const o = overlap(l.text, line.text);
        if (o > best) {
          best = o;
          idx = i;
        }
      });
    }
    if (idx >= 0) used.add(idx);
    const prev = idx >= 0 ? old[idx].text : undefined;
    out.push({ path: line.path, before: prev, after: line.text, reason: reasonFor(prev, line.text, jobDescription) });
    if (out.length >= limit) break;
  }
  return out;
}
