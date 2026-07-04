import type { PeerSlot } from "@/lib/api";

export function isPastPeerSlot(slot: PeerSlot) {
  return new Date(slot.end).getTime() < Date.now() || slot.status === "expired";
}

/** True when the slot is tied to a booking request or interview (pending or confirmed). */
export function isPeerSlotReserved(slot: PeerSlot) {
  return slot.status !== "open" || Boolean(slot.bookingId);
}

export function canDeleteInterviewerSlot(slot: PeerSlot) {
  return slot.status === "open" && !isPastPeerSlot(slot) && !slot.bookingId;
}

export function canEditInterviewerSlot(slot: PeerSlot) {
  return canDeleteInterviewerSlot(slot);
}
