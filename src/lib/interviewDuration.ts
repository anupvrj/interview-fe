/**
 * Canonical interview lengths (minutes). Must match interview-core utilities.
 */
export function normalizeInterviewDurationMinutes(raw: unknown): 15 | 30 {
  const n = typeof raw === "number" && !Number.isNaN(raw) ? raw : Number(raw);
  if (n === 30) return 30;
  return 15;
}
