export type PeerAvailabilityWindow = "any" | "today" | "week" | "month";

/** Local calendar bounds for open-slot filtering (sent to API as ISO timestamps). */
export function peerAvailabilityWindowBounds(
  window: PeerAvailabilityWindow,
  ref = new Date(),
): { slotFrom?: string; slotTo?: string } {
  if (window === "any") return {};

  const now = ref;
  let from = new Date(ref);
  from.setHours(0, 0, 0, 0);
  let to: Date;

  if (window === "today") {
    to = new Date(from);
    to.setHours(23, 59, 59, 999);
  } else if (window === "week") {
    const day = from.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    from = new Date(from);
    from.setDate(from.getDate() + mondayOffset);
    from.setHours(0, 0, 0, 0);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    to = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const effectiveFrom = from.getTime() < now.getTime() ? now : from;
  return { slotFrom: effectiveFrom.toISOString(), slotTo: to.toISOString() };
}
