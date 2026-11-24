import type { AtsHistoryEntry } from "@/lib/api";

export type AtsProgress = {
  /** Oldest → newest, for the trend line. */
  series: { score: number; at: string }[];
  first: AtsHistoryEntry;
  latest: AtsHistoryEntry;
  previous?: AtsHistoryEntry;
  /** Points since the first check, and since the one before the latest. */
  sinceFirst: number;
  sinceLast?: number;
  /** Check ids that went from fail/warn to pass (or lost all their issues) since the previous check. */
  fixedSinceLast: string[];
  /** Check ids that newly have problems since the previous check. */
  newSinceLast: string[];
};

const hasProblem = (c: { status: string; issueCount: number }) => c.status !== "pass" || c.issueCount > 0;

/** Progress from a resume's history (newest first, as the API returns it). Null with fewer than 2 checks. */
export function atsProgress(history: AtsHistoryEntry[]): AtsProgress | null {
  if (history.length < 2) return null;
  const chronological = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const first = chronological[0];
  const latest = chronological[chronological.length - 1];
  const previous = chronological[chronological.length - 2];
  const before = new Map(previous.checks.map((c) => [c.id, c]));
  const fixedSinceLast: string[] = [];
  const newSinceLast: string[] = [];
  for (const check of latest.checks) {
    const was = before.get(check.id);
    if (!was) continue;
    if (hasProblem(was) && !hasProblem(check)) fixedSinceLast.push(check.id);
    if (!hasProblem(was) && hasProblem(check)) newSinceLast.push(check.id);
  }
  return {
    series: chronological.map((e) => ({ score: e.score, at: e.createdAt })),
    first,
    latest,
    previous,
    sinceFirst: latest.score - first.score,
    sinceLast: latest.score - previous.score,
    fixedSinceLast,
    newSinceLast,
  };
}
