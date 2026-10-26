import type { HackathonMe, HackathonPublic, ParticipantStatus } from "./api";

const INACTIVE: ReadonlySet<ParticipantStatus> = new Set(["withdrawn", "disqualified", "suspended"]);

/** True only when the user has an active hackathon participant row. */
export function isHackathonRegistered(me: HackathonMe | undefined | null): boolean {
  if (!me?.registered || !me.participant) return false;
  return !INACTIVE.has(me.participant.status);
}

/**
 * New hackathon signup (profile + POST /register) is not allowed — use launch-event RSVP instead.
 * True when admin turned registration off or the hackathon phase is over.
 */
export function isHackathonSignupClosedForNewParticipants(
  pub: Pick<HackathonPublic, "registrationOpen" | "phase"> | undefined,
  alreadyRegistered: boolean,
): boolean {
  if (alreadyRegistered) return false;
  if (!pub) return false;
  if (pub.phase === "ended") return true;
  if (pub.registrationOpen === false) return true;
  return false;
}
