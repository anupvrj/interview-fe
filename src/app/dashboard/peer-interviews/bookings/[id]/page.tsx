"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  IndianRupee,
  Info,
  Loader2,
  Star,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BookingStatusBadge } from "@/components/peer/BookingStatusBadge";
import { PeerBookingInterviewerCard } from "@/components/peer/PeerBookingInterviewerCard";
import { PeerEarningCard } from "@/components/peer/PeerEarningCard";
import { PeerMeetingJoinButton } from "@/components/peer/PeerMeetingJoinButton";
import { RescheduleBookingDialog } from "@/components/peer/RescheduleBookingDialog";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking, type PeerInterviewType } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RESCHEDULE_ONCE_NOTE =
  "Please note that you can only reschedule peer interview only once.";

const RESCHEDULE_ELIGIBLE_STATUSES = [
  "pending_acceptance",
  "accepted_unpaid",
  "paid_confirmed",
] as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { timezone, timezoneLabel } = usePeerTimezone();

  const [booking, setBooking] = useState<PeerBooking | null>(null);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [paying, setPaying] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const isInterviewer = booking?.viewerRole === "interviewer";
  const isCandidate = !isInterviewer;

  const load = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        peerApi.getBooking(id),
        peerApi.listInterviewTypes(),
      ]);
      setBooking(b);
      setTypes(t);

      const feedback = b.viewerRole === "interviewer" ? b.interviewerFeedback : b.candidateFeedback;
      if (feedback) {
        setRating(feedback.rating);
        setComments(feedback.comments || "");
      } else {
        setRating(0);
        setComments("");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitFeedback = async () => {
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await peerApi.submitFeedback(id, { rating, comments });
      toast.success("Feedback submitted");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const markDone = async () => {
    setSubmitting(true);
    try {
      await peerApi.markDone(id);
      toast.success("Marked as done");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not mark done");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!booking) return;
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment is still loading, please try again.");
      return;
    }
    setPaying(true);
    try {
      const { order } = await peerApi.payBooking(booking.id);
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Interview Trix",
        description: `Peer interview — ${booking.bookingRef}`,
        theme: { color: "#7367F0" },
        handler: async (resp: any) => {
          try {
            await peerApi.verifyBookingPayment(booking.id, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success("Payment confirmed! Your interview is booked.");
            await load();
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Payment verification failed");
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not start payment");
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    const policy = booking?.cancelPolicy;
    try {
      await peerApi.cancelBooking(id, cancelReason.trim() || undefined);
      if (policy?.refundType === "full") {
        toast.success("Booking cancelled. Your full refund is being processed.");
      } else if (policy?.refundType === "partial") {
        toast.success(`Booking cancelled. A 50% refund (₹${policy.refundAmount}) is being processed.`);
      } else if (booking?.status === "paid_confirmed") {
        toast.success("Booking cancelled. No refund applies for this timing.");
      } else {
        toast.success("Booking cancelled");
      }
      setCancelOpen(false);
      setCancelReason("");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not cancel booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await peerApi.acceptBooking(id);
      toast.success("Booking accepted");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not accept booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    setSubmitting(true);
    try {
      await peerApi.rejectBooking(id, rejectReason.trim());
      toast.success("Booking declined");
      setDeclineOpen(false);
      setRejectReason("");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not decline booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!booking) return <p className="text-muted-foreground">Booking not found.</p>;

  const interviewLabel = typeNames[booking.interviewType] || booking.interviewType;
  const scheduleLabel = formatPeerSchedule(booking.start, timezone);
  const endTime = new Date(booking.end).toLocaleTimeString("en-IN", {
    timeZone: timezone,
    timeStyle: "short",
  });

  const canCancel =
    isCandidate &&
    ["pending_acceptance", "accepted_unpaid", "paid_confirmed"].includes(booking.status);
  const canReschedule = isCandidate && !!booking.canReschedule;
  const showRescheduleNote =
    isCandidate &&
    RESCHEDULE_ELIGIBLE_STATUSES.includes(
      booking.status as (typeof RESCHEDULE_ELIGIBLE_STATUSES)[number],
    );
  const hasUsedReschedule = (booking.rescheduleCount ?? 0) >= 1;
  const canPay = isCandidate && booking.status === "accepted_unpaid";
  const canRespond = isInterviewer && booking.status === "pending_acceptance";
  const canInteract = booking.status === "paid_confirmed" || booking.status === "completed";
  const interviewerCanMarkDone =
    isInterviewer && new Date(booking.end).getTime() <= Date.now();
  const markedDone = isInterviewer ? booking.interviewerMarkedDone : booking.candidateMarkedDone;
  const existingFeedback = isInterviewer ? booking.interviewerFeedback : booking.candidateFeedback;
  const backHref = isInterviewer
    ? "/dashboard/peer-interviews/interviewer/bookings"
    : "/dashboard/peer-interviews/bookings";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <Button variant="ghost" asChild className="w-fit">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to bookings
        </Link>
      </Button>

      <div className={cn(appCard, "space-y-4 p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Booking
            </p>
            <h1 className="text-xl font-semibold">{interviewLabel}</h1>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Booking ref" value={booking.bookingRef} />
          <DetailRow label="Amount" value={`₹${booking.amount}`} />
          <DetailRow label="When" value={`${scheduleLabel} – ${endTime}`} />
          <DetailRow label="Your role" value={isInterviewer ? "Interviewer" : "Candidate"} />
        </div>

        {booking.status === "pending_acceptance" && isCandidate ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Waiting for the interviewer to accept your request.
          </p>
        ) : null}

        {booking.status === "accepted_unpaid" && isCandidate ? (
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
            Your booking was accepted. Pay to confirm and unlock the video link.
          </p>
        ) : null}

        {booking.status === "accepted_unpaid" && isInterviewer ? (
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
            Waiting for the candidate to pay and confirm this session.
          </p>
        ) : null}

        {booking.status === "rejected" && booking.rejectionReason ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            Declined: {booking.rejectionReason}
          </p>
        ) : null}

        {booking.status === "cancelled" && booking.cancellationReason ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Cancellation reason: {booking.cancellationReason}
          </p>
        ) : null}

        {booking.status === "refunded" ? (
          <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            This booking was refunded{booking.refund?.amount ? ` (₹${booking.refund.amount})` : ""}.
          </p>
        ) : null}

        {isCandidate && booking.status === "paid_confirmed" && booking.cancelPolicy ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <Info className="h-4 w-4 text-[#7367F0]" />
              Cancellation & refund policy
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>More than 12 hours before: full refund</li>
              <li>4–12 hours before: 50% refund only</li>
              <li>Within 4 hours: no refund</li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Reschedule is available more than 24 hours before the interview, once per booking.
            </p>
          </div>
        ) : null}

        {showRescheduleNote ? (
          <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
            {RESCHEDULE_ONCE_NOTE}
            {hasUsedReschedule ? (
              <span className="mt-1 block font-medium text-foreground">
                You have already used your one reschedule for this booking.
              </span>
            ) : booking.rescheduleBlockedReason ? (
              <span className="mt-1 block text-foreground">{booking.rescheduleBlockedReason}</span>
            ) : null}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          {canPay ? (
            <Button
              onClick={() => void handlePay()}
              disabled={paying || submitting}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}
              Pay & confirm
            </Button>
          ) : null}

          {canReschedule ? (
            <Button variant="outline" onClick={() => setRescheduleOpen(true)} disabled={submitting}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Reschedule
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              disabled={submitting}
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel booking
            </Button>
          ) : null}

          {canRespond ? (
            <>
              <Button
                onClick={() => void handleAccept()}
                disabled={submitting}
                className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accept request
              </Button>
              <Button variant="outline" onClick={() => setDeclineOpen(true)} disabled={submitting}>
                Decline
              </Button>
            </>
          ) : null}

          {booking.videoLink && booking.status === "paid_confirmed" ? (
            <PeerMeetingJoinButton
              videoLink={booking.videoLink}
              start={booking.start}
              end={booking.end}
              timezone={timezone}
              size="default"
              variant="default"
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            />
          ) : null}
        </div>
      </div>

      {isCandidate && booking.interviewer ? (
        <PeerBookingInterviewerCard
          interviewerId={booking.interviewerId}
          interviewer={booking.interviewer}
        />
      ) : null}

      {isInterviewer && booking.candidate ? (
        <div className={cn(appCard, "space-y-4 p-6")}>
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-[#7367F0]" />
            <h2 className="text-lg font-semibold">Candidate</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Name" value={booking.candidate.name} />
            {booking.candidate.email ? (
              <DetailRow label="Email" value={booking.candidate.email} />
            ) : null}
            {booking.candidate.role ? (
              <DetailRow label="Role" value={booking.candidate.role} />
            ) : null}
            {typeof booking.candidate.experienceYears === "number" ? (
              <DetailRow
                label="Experience"
                value={`${booking.candidate.experienceYears} year${booking.candidate.experienceYears === 1 ? "" : "s"}`}
              />
            ) : null}
          </div>
          {booking.candidate.resume ? (
            <a
              href={booking.candidate.resume.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download resume
              </Button>
            </a>
          ) : null}
        </div>
      ) : null}

      {isInterviewer && booking.earning ? (
        <div className={cn(appCard, "p-6")}>
          <PeerEarningCard earning={booking.earning} />
        </div>
      ) : null}

      {isInterviewer &&
      !booking.earning &&
      canInteract &&
      new Date(booking.end).getTime() <= Date.now() &&
      !booking.interviewerMarkedDone ? (
        <p className={cn(appCard, "p-4 text-sm text-muted-foreground")}>
          Mark this interview done to record your earning (15% platform fee applies to the gross
          amount).
        </p>
      ) : null}

      {isInterviewer &&
      !booking.earning &&
      canInteract &&
      new Date(booking.end).getTime() > Date.now() ? (
        <p className={cn(appCard, "p-4 text-sm text-muted-foreground")}>
          You can mark this interview done and record your earning after the scheduled end time.
        </p>
      ) : null}

      {canInteract ? (
        <div className={cn(appCard, "space-y-4 p-6")}>
          <h2 className="text-lg font-semibold">
            {isInterviewer ? "Interviewer feedback" : "Your feedback"}
          </h2>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={
              isInterviewer
                ? "Share notes on how the candidate performed…"
                : "Share how the interview went…"
            }
            rows={4}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void submitFeedback()}
              disabled={submitting}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {existingFeedback ? "Update feedback" : "Submit feedback"}
            </Button>
            {!markedDone ? (
              <Button
                variant="outline"
                onClick={() => void markDone()}
                disabled={submitting || (isInterviewer && !interviewerCanMarkDone)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark interview done
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> You marked this done
              </span>
            )}
          </div>
        </div>
      ) : null}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking?</DialogTitle>
            <DialogDescription>
              This will free the slot for other candidates. You can book another interviewer anytime.
            </DialogDescription>
          </DialogHeader>
          {booking.cancelPolicy && booking.status === "paid_confirmed" ? (
            <p
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                booking.cancelPolicy.refundType === "none"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : booking.cancelPolicy.refundType === "partial"
                    ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
              )}
            >
              {booking.cancelPolicy.message}
            </p>
          ) : null}
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Optional reason for cancellation…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={submitting}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {booking ? (
        <RescheduleBookingDialog
          booking={booking}
          timezone={timezone}
          timezoneLabel={timezoneLabel}
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          onRescheduled={load}
        />
      ) : null}

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline booking request?</DialogTitle>
            <DialogDescription>
              The candidate will be notified. Please share a brief reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for declining…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)} disabled={submitting}>
              Go back
            </Button>
            <Button variant="destructive" onClick={() => void handleDecline()} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Decline request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
