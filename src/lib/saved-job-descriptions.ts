import type { SavedJobDescription } from "@/lib/api";

const squash = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/** The saved post the text currently matches (spacing and case aside), if any. */
export function matchSavedJobDescription(
  saved: readonly SavedJobDescription[],
  text: string,
): SavedJobDescription | undefined {
  const key = squash(text);
  return key ? saved.find((s) => squash(s.text) === key) : undefined;
}

/** "Backend Engineer · Razorpay", falling back to the post's first line. */
export function savedJobDescriptionTitle(s: SavedJobDescription): string {
  const head = [s.role, s.company].filter(Boolean).join(" · ");
  if (head) return head;
  const firstLine = s.text.split("\n").find((l) => l.trim())?.trim() ?? "Job post";
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
}

/** The post flattened to one short line for its card. */
export function savedJobDescriptionPreview(s: SavedJobDescription, max = 110): string {
  const flat = s.text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/**
 * The saved post to pre-select: the one the last interview used, else the newest one for
 * the same company (or role). None otherwise, so an unrelated post is never attached quietly.
 */
export function defaultJobDescription(
  saved: readonly SavedJobDescription[],
  context: { lastUsedId?: string; company?: string; role?: string },
): SavedJobDescription | undefined {
  const used = context.lastUsedId ? saved.find((s) => s.id === context.lastUsedId) : undefined;
  if (used) return used;
  const company = squash(context.company ?? "");
  if (company) {
    const sameCompany = saved.find((s) => squash(s.company ?? "") === company);
    if (sameCompany) return sameCompany;
  }
  const role = squash(context.role ?? "");
  return role ? saved.find((s) => squash(s.role ?? "") === role) : undefined;
}
