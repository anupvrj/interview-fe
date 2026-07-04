"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CalendarClock, Eye, IndianRupee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { PeerMeetingJoinButton } from "@/components/peer/PeerMeetingJoinButton";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { instituteSecondaryClass } from "@/components/institute/InstituteChrome";
import type { PeerBooking, PeerInterviewType } from "@/lib/api";
import { isPeerInterviewExpired } from "@/lib/peer-booking-expiry";
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

function formatOverallScore(booking: PeerBooking): string {
  const score = booking.interviewerCandidateScore?.overall;
  if (score == null) return "—";
  return `${score}/100`;
}

function OverallScoreCell({ booking }: { booking: PeerBooking }) {
  const score = booking.interviewerCandidateScore?.overall;
  if (score == null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <span className="text-sm font-semibold tabular-nums text-[#7367F0]">
      {score}
      <span className="font-normal text-muted-foreground">/100</span>
    </span>
  );
}

function matchesStatusFilter(booking: PeerBooking, filter: CandidateBookingStatusFilter) {
  const expired = isPeerInterviewExpired(booking);

  switch (filter) {
    case "pending":
      return booking.status === "pending_acceptance" && !expired;
    case "payment":
      return booking.status === "accepted_unpaid" && !expired;
    case "upcoming":
      return booking.status === "paid_confirmed" && new Date(booking.start) >= new Date();
    case "completed":
      return booking.status === "completed";
    case "closed":
      return (
        booking.status === "rejected" ||
        booking.status === "cancelled" ||
        booking.status === "refunded" ||
        expired
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
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-0 border-collapse text-left" style={{ minWidth }}>
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
    <div className="px-4 py-12 text-center sm:px-5">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#7367F0]/10">
        <CalendarClock className="h-7 w-7 text-[#7367F0]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function BookingActions({
  booking,
  timezone,
  payingId,
  onPay,
  stacked = false,
  iconOnly = false,
}: {
  booking: PeerBooking;
  timezone: string;
  payingId: string | null;
  onPay: (booking: PeerBooking) => void | Promise<void>;
  stacked?: boolean;
  iconOnly?: boolean;
}) {
  const isPaying = payingId === booking.id;
  const expired = isPeerInterviewExpired(booking);

  return (
    <div
      className={cn(
        "flex gap-2",
        iconOnly
          ? "items-center justify-end"
          : stacked
            ? "flex-col [&_a]:block [&_button]:w-full"
            : "flex-wrap items-center",
      )}
    >
      {booking.status === "accepted_unpaid" && !expired ? (
        <Button
          size={iconOnly ? "icon" : "sm"}
          onClick={() => void onPay(booking)}
          disabled={isPaying}
          aria-label="Pay and confirm"
          title="Pay and confirm"
          className={cn(
            iconOnly
              ? "h-9 w-9 bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              : "h-9 gap-1 bg-[#7367F0] px-3 text-xs text-white hover:bg-[#6e62e5]",
          )}
        >
          {isPaying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IndianRupee className={iconOnly ? "h-4 w-4" : "h-3.5 w-3.5"} />
          )}
          {iconOnly ? null : "Pay & confirm"}
        </Button>
      ) : null}
      {booking.videoLink && booking.status === "paid_confirmed" ? (
        <PeerMeetingJoinButton
          bookingId={booking.id}
          videoLink={booking.videoLink}
          start={booking.start}
          end={booking.end}
          timezone={timezone}
          iconOnly={iconOnly}
          className={cn(
            instituteSecondaryClass,
            iconOnly ? "h-9 w-9" : stacked ? "h-9 w-full px-3 text-xs" : "h-8 px-3 text-xs",
          )}
        />
      ) : null}
      <Link href={`/dashboard/peer-interviews/bookings/${booking.id}`} className={stacked && !iconOnly ? "block" : undefined}>
        <Button
          size={iconOnly ? "icon" : "sm"}
          variant="outline"
          aria-label="View details"
          title="View details"
          className={cn(
            instituteSecondaryClass,
            iconOnly ? "h-9 w-9" : stacked ? "h-9 w-full gap-1 px-3 text-xs" : "h-8 gap-1 px-3 text-xs",
          )}
        >
          <Eye className={iconOnly ? "h-4 w-4" : "h-3.5 w-3.5"} />
          {iconOnly ? null : "View details"}
        </Button>
      </Link>
    </div>
  );
}

function MobileBookingCards({
  bookings,
  typeNames,
  timezone,
  payingId,
  onPay,
}: {
  bookings: PeerBooking[];
  typeNames: Record<string, string>;
  timezone: string;
  payingId: string | null;
  onPay: (booking: PeerBooking) => void | Promise<void>;
}) {
  return (
    <div className="divide-y divide-border/60 lg:hidden">
      {bookings.map((booking) => {
        const typeLabel = typeNames[booking.interviewType] || booking.interviewType;

        return (
          <div key={booking.id} className="space-y-3 p-4">
            <div className="min-w-0 space-y-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{typeLabel}</p>
                <p className="text-xs text-muted-foreground">Ref {booking.bookingRef}</p>
              </div>
              <BookingStatusBadge status={booking.status} start={booking.start} className="w-fit" />
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Schedule
                </p>
                <p className="mt-0.5 break-words font-medium text-foreground">
                  {formatSchedule(booking.start, timezone)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Amount
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                  ₹{booking.amount}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Overall score
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                  {formatOverallScore(booking)}
                </p>
              </div>
            </div>

            {booking.status === "rejected" && booking.rejectionReason ? (
              <p className="text-xs text-red-600">Declined: {booking.rejectionReason}</p>
            ) : null}

            <BookingActions
              booking={booking}
              timezone={timezone}
              payingId={payingId}
              onPay={onPay}
              iconOnly
            />
          </div>
        );
      })}
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
    <div className="min-w-0 max-w-full overflow-hidden">
      <div className="space-y-3 border-b border-border/60 px-3 py-4 sm:px-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
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
          <div className="flex min-w-0 flex-col gap-2">
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
        <>
          <MobileBookingCards
            bookings={filteredBookings}
            typeNames={typeNames}
            timezone={timezone}
            payingId={payingId}
            onPay={onPay}
          />
          <div className="hidden max-w-full overflow-hidden lg:block">
            <TableShell
              headers={["Interview", "Schedule", "Amount", "Overall score", "Status", "Actions"]}
              minWidth="880px"
            >
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
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        ₹{booking.amount}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <OverallScoreCell booking={booking} />
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <BookingStatusBadge status={booking.status} start={booking.start} />
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <BookingActions
                          booking={booking}
                          timezone={timezone}
                          payingId={payingId}
                          onPay={onPay}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </TableShell>
          </div>
        </>
      )}
    </div>
  );
}
