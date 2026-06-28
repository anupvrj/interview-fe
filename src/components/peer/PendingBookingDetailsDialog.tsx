"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Download,
  IndianRupee,
  Loader2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { DEFAULT_PEER_TIMEZONE, formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { peerApi, type PeerBooking } from "@/lib/api";

function formatScheduleRange(start: string, end: string, timezone: string) {
  const startLabel = formatPeerSchedule(start, timezone);
  const endTime = new Date(end).toLocaleTimeString("en-IN", {
    timeZone: timezone,
    timeStyle: "short",
  });
  return `${startLabel} – ${endTime}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function PendingBookingDetailsDialog({
  bookingId,
  typeLabel,
  timezone = DEFAULT_PEER_TIMEZONE,
  open,
  onOpenChange,
  busyBookingId,
  onAccept,
  onDecline,
}: {
  bookingId: string | null;
  typeLabel?: string;
  timezone?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busyBookingId?: string | null;
  onAccept?: (bookingId: string) => void | Promise<void>;
  onDecline?: (bookingId: string, reason: string) => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<PeerBooking | null>(null);
  const [declineConfirm, setDeclineConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!open || !bookingId) {
      setBooking(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void peerApi
      .getBooking(bookingId)
      .then((data) => {
        if (!cancelled) setBooking(data);
      })
      .catch((e: any) => {
        if (!cancelled) {
          toast.error(e?.response?.data?.message || "Could not load booking details");
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, bookingId, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setDeclineConfirm(false);
      setRejectReason("");
    }
  }, [open]);

  const candidate = booking?.candidate;
  const interviewLabel = typeLabel || booking?.interviewType || "Interview";
  const canRespond = booking?.status === "pending_acceptance";
  const busy = !!bookingId && busyBookingId === bookingId;

  const handleAccept = () => {
    if (!bookingId || !onAccept) return;
    void onAccept(bookingId);
  };

  const handleConfirmDecline = () => {
    if (!bookingId || !onDecline) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    void onDecline(bookingId, rejectReason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 to-transparent px-6 py-5 text-center">
          <DialogHeader className="space-y-0 text-center sm:text-center">
            <DialogTitle className="text-center text-xl font-semibold sm:text-2xl">
              Booking request details
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
            </div>
          ) : booking ? (
            declineConfirm ? (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Confirm decline</p>
                    <p className="text-xs text-muted-foreground">
                      Provide a reason for the candidate before declining this request.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for declining…"
                    rows={4}
                    className="bg-card"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Frequent declines may affect your standing on the platform.
                  </p>
                </div>
              </section>
            ) : (
              <>
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Candidate</p>
                      <p className="text-xs text-muted-foreground">Profile shared for this booking</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-base font-semibold text-foreground">
                      {candidate?.name || "Candidate"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {candidate?.role ? <span>{candidate.role}</span> : null}
                      {candidate?.role && candidate.experienceYears != null ? (
                        <span aria-hidden>·</span>
                      ) : null}
                      {candidate.experienceYears != null ? (
                        <span>
                          {candidate.experienceYears}{" "}
                          {candidate.experienceYears === 1 ? "year" : "years"} experience
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 border-t border-border/60 pt-4">
                      {candidate?.resume ? (
                        <Button
                          asChild
                          className="h-9 w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:w-auto"
                        >
                          <a
                            href={candidate.resume.url}
                            target="_blank"
                            rel="noreferrer"
                            download={candidate.resume.filename}
                          >
                            <Download className="h-4 w-4" />
                            Download Resume
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">No resume available</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Interview details</p>
                      <p className="text-xs text-muted-foreground">Session timing and booking info</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Interview round" value={interviewLabel} />
                      <DetailRow label="Booking ref" value={booking.bookingRef} />
                      <DetailRow
                        label="Schedule"
                        value={formatScheduleRange(booking.start, booking.end, timezone)}
                      />
                      <DetailRow label="Fee" value={`₹${booking.amount}`} />
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                      <span className="text-xs font-medium text-muted-foreground">Status</span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>
                </section>

                {canRespond ? (
                  <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                    <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-[#7367F0]" />
                    <span>
                      After you accept, the candidate pays to confirm the session. You can join from
                      your bookings page once payment is complete.
                    </span>
                  </div>
                ) : null}
              </>
            )
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
          {declineConfirm ? (
            <>
              <Button variant="outline" onClick={() => setDeclineConfirm(false)} disabled={busy}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleConfirmDecline} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm decline
              </Button>
            </>
          ) : canRespond && onAccept && onDecline ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeclineConfirm(true)}
                disabled={busy}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                disabled={busy}
                className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accept
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
