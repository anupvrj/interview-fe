import { cn } from "@/lib/utils";
import type { PeerBookingStatus } from "@/lib/api";
import { isPeerInterviewExpired } from "@/lib/peer-booking-expiry";

const MAP: Record<PeerBookingStatus, { label: string; className: string }> = {
  pending_acceptance: {
    label: "Awaiting acceptance",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  accepted_unpaid: {
    label: "Accepted - Payment Pending",
    className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  paid_confirmed: {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  completed: {
    label: "Completed",
    className: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
  refunded: {
    label: "Refunded",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
};

export function BookingStatusBadge({
  status,
  start,
  className,
}: {
  status: PeerBookingStatus;
  start?: string;
  className?: string;
}) {
  if (start && isPeerInterviewExpired({ start, status })) {
    return (
      <span
        className={cn(
          "inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-snug sm:text-xs",
          "bg-muted text-muted-foreground",
          className,
        )}
      >
        Interview expired
      </span>
    );
  }

  const cfg = MAP[status] ?? MAP.pending_acceptance;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-snug sm:text-xs",
        cfg.className,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
