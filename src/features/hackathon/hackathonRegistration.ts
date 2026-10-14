import type { HackathonMe, ParticipantStatus } from "./api";

const INACTIVE: ReadonlySet<ParticipantStatus> = new Set(["withdrawn", "disqualified", "suspended"]);

/** True only when the user has an active hackathon participant row. */
export function isHackathonRegistered(me: HackathonMe | undefined | null): boolean {
  if (!me?.registered || !me.participant) return false;
  return !INACTIVE.has(me.participant.status);
}
