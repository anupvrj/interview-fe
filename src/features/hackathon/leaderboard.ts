import type { LeaderboardEntry } from "./api";

/** First four letters of the mailbox, then a mask, then the real domain. */
export function maskLeaderboardEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "******";
  return `${trimmed.slice(0, at).slice(0, 4)}******${trimmed.slice(at)}`;
}

export function formatLeaderboardScore(score: number): string {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Case-insensitive match on name or email. Blank query returns every row. */
export function filterLeaderboardEntries(entries: LeaderboardEntry[], query: string): LeaderboardEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const maskedQuery = q.includes("@") ? maskLeaderboardEmail(q) : "";
  return entries.filter((entry) => {
    const email = entry.email.toLowerCase();
    return entry.name.toLowerCase().includes(q) || email.includes(q) || (maskedQuery !== "" && email === maskedQuery);
  });
}
