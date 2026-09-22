export const BURST_CHAR_THRESHOLD = 5;
export const BURST_DELTA_MS = 10;

export type ContentChangeSource =
  | "keyboard"
  | "ime"
  | "autocomplete"
  | "undo"
  | "redo"
  | "format"
  | "flush"
  | "snippet"
  | "unknown";

export interface ContentChange {
  insertedText: string;
  deltaMs: number;
  matchingKeydowns: number;
  source: ContentChangeSource;
}

export function detectBurstInsertion(change: ContentChange): {
  isBurst: boolean;
  deltaMs: number;
  charCount: number;
} {
  const charCount = change.insertedText.length;
  if (charCount <= BURST_CHAR_THRESHOLD) {
    return { isBurst: false, deltaMs: change.deltaMs, charCount };
  }
  if (
    change.source === "ime" ||
    change.source === "autocomplete" ||
    change.source === "undo" ||
    change.source === "redo" ||
    change.source === "format" ||
    change.source === "flush" ||
    change.source === "snippet"
  ) {
    return { isBurst: false, deltaMs: change.deltaMs, charCount };
  }
  const noKeydowns = change.matchingKeydowns === 0;
  const tooFast = change.deltaMs < BURST_DELTA_MS;
  return {
    isBurst: noKeydowns && tooFast,
    deltaMs: change.deltaMs,
    charCount,
  };
}

export function monacoSourceFromFlags(flags: {
  isFlushing?: boolean;
  isUndoing?: boolean;
  isRedoing?: boolean;
  isEolChange?: boolean;
  composing?: boolean;
}): ContentChangeSource {
  if (flags.composing) return "ime";
  if (flags.isFlushing) return "flush";
  if (flags.isUndoing) return "undo";
  if (flags.isRedoing) return "redo";
  if (flags.isEolChange) return "format";
  return "unknown";
}
