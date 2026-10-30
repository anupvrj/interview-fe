import { HACKATHON_LAUNCH } from "../../lib/hackathon-2026-content";

/** Launch RSVP closes when the live event starts (31 Oct 2026, 7 PM IST). */
const LAUNCH_RSVP_CLOSES_AT_MS = new Date(HACKATHON_LAUNCH.startISO).getTime();

export function isLaunchEventRegistrationOpen(nowMs = Date.now()): boolean {
  return nowMs < LAUNCH_RSVP_CLOSES_AT_MS;
}
