/**
 * Canonical interview lengths (minutes). Must match interview-core utilities.
 * 10 is a category round; anything unknown falls back to 15.
 */
export function normalizeInterviewDurationMinutes(raw: unknown): 10 | 15 | 30 {
  const n = typeof raw === "number" && !Number.isNaN(raw) ? raw : Number(raw);
  if (n === 30) return 30;
  if (n === 10) return 10;
  return 15;
}
