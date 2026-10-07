import type { HackathonPhase } from "./api";

/** Live event first, otherwise the upcoming event that starts soonest. */
export function pickDashboardHackathon<T extends { phase: HackathonPhase; startsAt: string | null }>(
  events: T[],
): T | null {
  const live = events.find((event) => event.phase === "live");
  if (live) return live;
  const upcoming = events
    .filter((event) => event.phase === "upcoming")
    .slice()
    .sort((a, b) => {
      const aStart = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
      const bStart = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
      return aStart - bStart;
    });
  return upcoming[0] ?? null;
}
