"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CalendarClock, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { PeerMeetingJoinButton } from "@/components/peer/PeerMeetingJoinButton";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { instituteSecondaryClass } from "@/components/institute/InstituteChrome";
import { appFilterBar } from "@/lib/app-theme";
import type { PeerBooking, PeerInterviewType } from "@/lib/api";
import { cn } from "@/lib/utils";

export type CandidateBookingStatusFilter =
  | "all"
  | "pending"
  | "payment"
  | "upcoming"
  | "completed"
  | "closed";

const STATUS_FILTER_OPTIONS: { value: CandidateBookingStatusFilter; label: string }[] = [
  { value: "all", label: "All bookings" },
  { value: "pending", label: "Awaiting acceptance" },
  { value: "payment", label: "Payment due" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Declined / cancelled" },
];

function formatSchedule(start: string, timezone: string) {
  return formatPeerSchedule(start, timezone);
}

function matchesStatusFilter(booking: PeerBooking, filter: CandidateBookingStatusFilter) {
  switch (filter) {
    case "pending":
      return booking.status === "pending_acceptance";
    case "payment":
      return booking.status === "accepted_unpaid";
    case "upcoming":
      return booking.status === "paid_confirmed" && new Date(booking.start) >= new Date();
    case "completed":
      return booking.status === "completed";
    case "closed":
      return (
        booking.status === "rejected" ||
        booking.status === "cancelled" ||
        booking.status === "refunded"
      );
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

export function CandidateBookingsTable({
  bookings,
  types,
  typeNames,
  timezone,
  payingId,
  onPay,
}: {
  bookings: PeerBooking[];
  types: PeerInterviewType[];
  typeNames: Record<string, string>;
  timezone: string;
  payingId: string | null;
  onPay: (booking: PeerBooking) => void | Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<CandidateBookingStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => matchesStatusFilter(b, statusFilter))
      .filter((b) => !typeFilter || b.interviewType === typeFilter)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  }, [bookings, statusFilter, typeFilter]);

  const hasActiveFilters = statusFilter !== "all" || Boolean(typeFilter);

  return (
    <>
      <div className={cn(appFilterBar, "mx-5 mt-4 space-y-3")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="candidate-booking-status-filter" className="text-xs font-medium text-muted-foreground">
              Status
            </Label>
            <AppSelect
              id="candidate-booking-status-filter"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as CandidateBookingStatusFilter)}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="candidate-booking-type-filter" className="text-xs font-medium text-muted-foreground">
              Interview round
            </Label>
            <AppSelect
              id="candidate-booking-type-filter"
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
          description="Browse peer interviewers and book a slot to practice with a verified mentor."
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
            const isPaying = payingId === booking.id;

            return (
              <tr
                key={booking.id}
                className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-5 py-3.5 align-top">
                  <p className="truncate text-sm font-semibold text-foreground">{typeLabel}</p>
                  <p className="truncate text-xs text-muted-foreground">Ref {booking.bookingRef}</p>
                  {booking.status === "rejected" && booking.rejectionReason ? (
                    <p className="mt-1 line-clamp-2 text-xs text-red-600">
                      Declined: {booking.rejectionReason}
                    </p>
                  ) : null}
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
                    {booking.status === "accepted_unpaid" ? (
                      <Button
                        size="sm"
                        onClick={() => void onPay(booking)}
                        disabled={isPaying}
                        className="h-8 gap-1 bg-[#7367F0] px-3 text-xs text-white hover:bg-[#6e62e5]"
                      >
                        {isPaying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Pay &amp; confirm
                      </Button>
                    ) : null}
                    {booking.videoLink && booking.status === "paid_confirmed" ? (
                      <PeerMeetingJoinButton
                        videoLink={booking.videoLink}
                        start={booking.start}
                        end={booking.end}
                        timezone={timezone}
                        className={cn(instituteSecondaryClass, "h-8 px-3 text-xs")}
                      />
                    ) : null}
                    <Link href={`/dashboard/peer-interviews/bookings/${booking.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(instituteSecondaryClass, "h-8 gap-1 px-3 text-xs")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View details
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}
    </>
  );
}
