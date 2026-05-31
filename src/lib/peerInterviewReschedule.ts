import type { PeerInterviewBooking, PeerReschedulePolicy } from "@/lib/api";

const RESCHEDULE_CUTOFF_HOURS = 2;
const MAX_RESCHEDULES = 2;

export function getPeerReschedulePolicy(
  booking: PeerInterviewBooking
): PeerReschedulePolicy {
  const remaining = Math.max(
    0,
    MAX_RESCHEDULES - (booking.rescheduleCount ?? 0)
  );

  if (
    booking.status !== "pending_assignment" &&
    booking.status !== "confirmed"
  ) {
    return {
      allowed: false,
      reason: "This booking cannot be rescheduled.",
      remaining,
    };
  }

  if (remaining === 0) {
    return {
      allowed: false,
      reason: `You have used all ${MAX_RESCHEDULES} reschedules for this session.`,
      remaining: 0,
    };
  }

  const hoursUntil =
    (new Date(booking.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < RESCHEDULE_CUTOFF_HOURS) {
    return {
      allowed: false,
      reason: `Reschedule at least ${RESCHEDULE_CUTOFF_HOURS} hours before the session.`,
      remaining,
    };
  }

  return { allowed: true, remaining };
}
