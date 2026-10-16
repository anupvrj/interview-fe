import type { HackathonChallenge, HackathonChallengeKind } from "../api";

export function resolveChallengeKind(challenge: HackathonChallenge): HackathonChallengeKind | undefined {
  if (challenge.kind) return challenge.kind;
  if (challenge.key === "resume_submission") return "resume";
  if (challenge.key === "social_share") return "social";
  if (challenge.key === "mock_interviews") return "screening";
  return undefined;
}

export function resolveChallengeId(challenge: HackathonChallenge): string | undefined {
  return challenge.challengeId?.trim() || undefined;
}
