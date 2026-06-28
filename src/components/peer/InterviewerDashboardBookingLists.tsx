"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { PendingBookingDetailsDialog } from "@/components/peer/PendingBookingDetailsDialog";
import { instituteSecondaryClass } from "@/components/institute/InstituteChrome";
import { appFilterBar } from "@/lib/app-theme";
import type { PeerBooking, PeerInterviewType } from "@/lib/api";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { cn } from "@/lib/utils";

export type InterviewerBookingStatusFilter =
  | "all"
  | "pending"
  | "upcoming"
  | "completed"
  | "closed";

const STATUS_FILTER_OPTIONS: { value: InterviewerBookingStatusFilter; label: string }[] = [
  { value: "all", label: "All bookings" },
  { value: "pending", label: "Pending" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Declined / cancelled" },
];

function formatSchedule(start: string, timezone: string) {
  return formatPeerSchedule(start, timezone);
}

function matchesStatusFilter(booking: PeerBooking, filter: InterviewerBookingStatusFilter) {
  switch (filter) {
    case "pending":
      return booking.status === "pending_acceptance" || booking.status === "accepted_unpaid";
    case "upcoming":
      return booking.status === "paid_confirmed" && new Date(booking.start) >= new Date();
    case "completed":
      return booking.status === "completed";
    case "closed":
      return booking.status === "rejected" || booking.status === "cancelled" || booking.status === "refunded";
    default:
      return true;
  }
}

function TableShell({
  headers,
  children,
  minWidth = "760px",
}: {
  headers: readonly string[];
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-border/70">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#7367F0]/10">
        <CalendarClock className="h-7 w-7 text-[#7367F0]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function InterviewerBookingsTable({
  bookings,
  types,
  typeNames,
  timezone,
  busyBookingId,
  onAccept,
  onDecline,
}: {
  bookings: PeerBooking[];
  types: PeerInterviewType[];
  typeNames: Record<string, string>;
  timezone: string;
  busyBookingId: string | null;
  onAccept: (bookingId: string) => void | Promise<void>;
  onDecline: (bookingId: string, reason: string) => void | Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<InterviewerBookingStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [detailsBookingId, setDetailsBookingId] = useState<string | null>(null);
  const [detailsTypeLabel, setDetailsTypeLabel] = useState<string | undefined>();

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => matchesStatusFilter(b, statusFilter))
      .filter((b) => !typeFilter || b.interviewType === typeFilter)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  }, [bookings, statusFilter, typeFilter]);

  const openDetails = (booking: PeerBooking) => {
    setDetailsTypeLabel(typeNames[booking.interviewType] || booking.interviewType);
    setDetailsBookingId(booking.id);
  };

  const handleAccept = async (bookingId: string) => {
    try {
      await onAccept(bookingId);
      setDetailsBookingId(null);
      setDetailsTypeLabel(undefined);
    } catch {
      /* keep dialog open on error */
    }
  };

  const handleDecline = async (bookingId: string, reason: string) => {
    try {
      await onDecline(bookingId, reason);
      setDetailsBookingId(null);
      setDetailsTypeLabel(undefined);
    } catch {
      /* keep dialog open on error */
    }
  };

  const hasActiveFilters = statusFilter !== "all" || Boolean(typeFilter);

  return (
    <>
      <div className={cn(appFilterBar, "mx-5 mt-4 space-y-3")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="booking-status-filter" className="text-xs font-medium text-muted-foreground">
              Status
            </Label>
            <AppSelect
              id="booking-status-filter"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as InterviewerBookingStatusFilter)}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="booking-type-filter" className="text-xs font-medium text-muted-foreground">
              Interview round
            </Label>
            <AppSelect
              id="booking-type-filter"
              value={typeFilter}
              onChange={setTypeFilter}
              allowEmpty
              emptyLabel="All rounds"
              options={types.map((t) => ({ value: t.key, label: t.name }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing {filteredBookings.length} of {bookings.length} booking
            {bookings.length === 1 ? "" : "s"}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("");
              }}
              className="font-medium text-[#7367F0] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="When candidates book your slots, they will appear here."
        />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="No bookings match your filters"
          description="Try a different status or interview round, or clear filters to see all bookings."
        />
      ) : (
        <TableShell headers={["Interview", "Schedule", "Amount", "Status", "Actions"]}>
          {filteredBookings.map((booking) => {
            const typeLabel = typeNames[booking.interviewType] || booking.interviewType;

            return (
              <tr
                key={booking.id}
                className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-5 py-3.5 align-top">
                  <p className="truncate text-sm font-semibold text-foreground">{typeLabel}</p>
                  <p className="truncate text-xs text-muted-foreground">Ref {booking.bookingRef}</p>
                </td>
                <td className="px-5 py-3.5 align-top">
                  <p className="text-sm font-medium text-foreground">
                    {formatSchedule(booking.start, timezone)}
                  </p>
                </td>
                <td className="px-5 py-3.5 align-top">
                  <p className="text-sm font-semibold tabular-nums text-foreground">₹{booking.amount}</p>
                </td>
                <td className="px-5 py-3.5 align-top">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="px-5 py-3.5 align-top">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className={cn(instituteSecondaryClass, "h-8 gap-1 px-3 text-xs")}
                    >
                      <Link href={`/dashboard/peer-interviews/bookings/${booking.id}`}>
                        <CalendarClock className="h-3.5 w-3.5" />
                        Open booking
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetails(booking)}
                      className={cn(instituteSecondaryClass, "h-8 gap-1 px-3 text-xs")}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Quick view
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}

      <PendingBookingDetailsDialog
        bookingId={detailsBookingId}
        typeLabel={detailsTypeLabel}
        timezone={timezone}
        open={!!detailsBookingId}
        busyBookingId={busyBookingId}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsBookingId(null);
            setDetailsTypeLabel(undefined);
          }
        }}
      />
    </>
  );
}
