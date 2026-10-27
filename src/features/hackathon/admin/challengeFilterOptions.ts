import type { AdminHackathonOverview } from "../api";
import { resolveChallengeId, resolveChallengeKind } from "./challengeMeta";

export function buildChallengeFilterOptions(
  hackathon: AdminHackathonOverview | undefined,
): { challengeId: string; label: string }[] {
  if (!hackathon?.challenges?.length) return [];
  return hackathon.challenges
    .map((c, index) => {
      const challengeId = resolveChallengeId(c);
      if (!challengeId) return null;
      const kind = resolveChallengeKind(c);
      const title = c.title?.trim() || kind || "Challenge";
      return { challengeId, label: `Challenge ${index + 1} · ${title}` };
    })
    .filter(
      (row): row is { challengeId: string; label: string } => row !== null,
    );
}
