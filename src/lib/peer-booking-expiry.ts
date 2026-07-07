const UNPAID_PEER_BOOKING_STATUSES = ["pending_acceptance", "accepted_unpaid"] as const;

export type UnpaidPeerBookingStatus = (typeof UNPAID_PEER_BOOKING_STATUSES)[number];

export function isUnpaidPeerBookingStatus(status: string): boolean {
  return UNPAID_PEER_BOOKING_STATUSES.includes(status as UnpaidPeerBookingStatus);
}

/** True when the scheduled interview time has passed and payment was never completed. */
export function isPeerInterviewExpired(booking: {
  start: string;
  status: string;
}): boolean {
  return (
    isUnpaidPeerBookingStatus(booking.status) &&
    new Date(booking.start).getTime() < Date.now()
  );
}
