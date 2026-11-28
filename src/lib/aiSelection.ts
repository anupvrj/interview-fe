/**
 * "AI" on part of a bullet: which span of the line was selected, and how to put a reworded
 * span back. Offsets are in the line's normalised text (spaces collapsed, trimmed), the same
 * form the AI Coach shows and textAtLocation returns.
 */

export type AiSelection = {
  /** The selected words (normalised). */
  text: string;
  /** Where they start in the normalised line. */
  start: number;
};

export function normaliseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * The selected span of `line`, given the raw text before the selection and the raw selected
 * text. Null when nothing (or the whole line) is selected: then the whole line is the target.
 */
export function selectionInLine(line: string, rawBefore: string, rawSelected: string): AiSelection | null {
  const full = normaliseSpaces(line);
  const text = normaliseSpaces(rawSelected);
  if (text.length < 2 || text === full) return null;
  // The prefix as it reads in the normalised line ("  Led   12" → "Led 12").
  const prefix = rawBefore.replace(/\s+/g, " ").replace(/^ /, "");
  const guess = Math.min(prefix.length, full.length);
  const start = nearestIndex(full, text, guess);
  return start < 0 ? null : { text, start };
}

/** Index of `needle` in `hay` closest to `near` (-1: not there). */
function nearestIndex(hay: string, needle: string, near: number): number {
  let best = -1;
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) {
    if (best < 0 || Math.abs(i - near) < Math.abs(best - near)) best = i;
  }
  return best;
}

/**
 * `line` with the selected span replaced by `replacement`. A model often answers a phrase as
 * a sentence ("Grew leads 38%."): the full stop goes when the span had none, and a capital
 * goes mid-sentence. Null when the span is no longer in the line.
 */
export function spliceSelection(line: string, sel: AiSelection, replacement: string): { text: string; selection: AiSelection } | null {
  const full = normaliseSpaces(line);
  const start = nearestIndex(full, sel.text, sel.start);
  if (start < 0) return null;
  let next = normaliseSpaces(replacement);
  if (!next) return null;
  if (!/[.!?]$/.test(sel.text)) next = next.replace(/[.!?]+$/, "");
  const midSentence = start > 0 && !/[.!?]\s*$/.test(full.slice(0, start));
  if (midSentence && /^[a-z]/.test(sel.text) && /^[A-Z][a-z]+(?=[\s,;:)-]|$)/.test(next)) next = next[0].toLowerCase() + next.slice(1);
  const text = normaliseSpaces(full.slice(0, start) + next + full.slice(start + sel.text.length));
  return { text, selection: { text: next, start: Math.min(start, text.length) } };
}
