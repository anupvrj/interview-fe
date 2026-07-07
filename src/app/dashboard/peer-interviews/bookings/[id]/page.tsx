"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  IndianRupee,
  Info,
  Loader2,
  Star,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
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
import { PeerBookingCandidateCard } from "@/components/peer/PeerBookingCandidateCard";
import {
  PeerBookingInlineNote,
  PeerBookingCardShell,
} from "@/components/peer/PeerBookingCardShell";
import {
  PeerBookingSessionDetailsCard,
  PeerCandidateBookingTimelineCard,
  PeerCandidatePrepareCard,
  PeerCandidateSessionProgressCard,
  PeerBookingProgressStepper,
} from "@/components/peer/PeerBookingCandidateExtras";
import { PeerBookingInterviewerCard } from "@/components/peer/PeerBookingInterviewerCard";
import { PeerEarningCard } from "@/components/peer/PeerEarningCard";
import { PeerMeetingJoinButton } from "@/components/peer/PeerMeetingJoinButton";
import { PeerPartnerRatingCard } from "@/components/peer/PeerPartnerRatingCard";
import { PeerCandidateScoreCard } from "@/components/peer/PeerCandidateScoreCard";
import {
  candidateScoreFormToPayload,
  PeerInterviewerCandidateScoreForm,
  validateCandidateScoreForm,
  type PeerCandidateScoreFormValues,
} from "@/components/peer/PeerInterviewerCandidateScoreForm";
import {
  initialScoreFormValues,
} from "@/components/peer/PeerInterviewerCompletionDialog";
import { PeerInterviewerMarkDoneFlow } from "@/components/peer/PeerInterviewerMarkDoneFlow";
import { PeerBookingReportButton } from "@/components/peer/PeerBookingReportButton";
import { PeerMeetRecordingButton } from "@/components/peer/PeerMeetRecordingCard";
import { RescheduleBookingDialog } from "@/components/peer/RescheduleBookingDialog";
import { PeerBookingChatHistoryCard } from "@/components/peer/PeerBookingChatHistoryCard";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { appCard } from "@/lib/app-theme";
import { isPeerInterviewExpired } from "@/lib/peer-booking-expiry";
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

function StatusBanner({
  tone,
  children,
}: {
  tone: "amber" | "blue" | "red" | "muted" | "orange" | "emerald";
  children: ReactNode;
}) {
  const toneClass = {
    amber:
      "border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
    blue: "border-blue-200/80 bg-blue-50/80 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200",
    red: "border-red-200/80 bg-red-50/80 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300",
    muted: "border-border/60 bg-muted/40 text-muted-foreground",
    orange:
      "border-orange-200/80 bg-orange-50/80 text-orange-800 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300",
    emerald:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed", toneClass)}>
      {children}
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const { timezone, timezoneLabel } = usePeerTimezone();
  const { user } = useUser();

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [markDoneFlowOpen, setMarkDoneFlowOpen] = useState(false);
  const [scoreValues, setScoreValues] = useState<PeerCandidateScoreFormValues>(
    initialScoreFormValues(),
  );
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
      if (b.viewerRole === "interviewer") {
        setScoreValues(initialScoreFormValues(b));
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

  useEffect(() => {
    if (searchParams.get("feedback") === "1" && booking?.interviewerMarkedDone) {
      setFeedbackOpen(true);
      router.replace(`/dashboard/peer-interviews/bookings/${id}`, { scroll: false });
    }
  }, [searchParams, id, router, booking?.interviewerMarkedDone]);

  const submitFeedback = async () => {
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await peerApi.submitFeedback(id, { rating, comments });
      const hadFeedback =
        booking?.viewerRole === "interviewer"
          ? !!booking.interviewerFeedback
          : !!booking?.candidateFeedback;
      toast.success(hadFeedback ? "Feedback updated" : "Feedback submitted");
      setFeedbackOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const submitCandidateScore = async () => {
    const validationError = validateCandidateScoreForm(scoreValues);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await peerApi.submitInterviewerCandidateScore(id, candidateScoreFormToPayload(scoreValues));
      toast.success(booking?.interviewerCandidateScore ? "Scores updated" : "Scores submitted");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save scores");
    } finally {
      setSubmitting(false);
    }
  };

  const requestMarkDone = () => {
    setMarkDoneFlowOpen(true);
  };

  const handlePay = async () => {
    if (!booking) return;
    if (isPeerInterviewExpired(booking)) {
      toast.error("This interview has expired.");
      return;
    }
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
      <div className={cn(appCard, "flex h-64 items-center justify-center")}>
        <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={cn(appCard, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
        <p className="text-lg font-semibold">Booking not found</p>
        <p className="text-sm text-muted-foreground">
          This booking may have been removed or you don&apos;t have access.
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/peer-interviews/bookings">Back to bookings</Link>
        </Button>
      </div>
    );
  }

  const interviewLabel = typeNames[booking.interviewType] || booking.interviewType;
  const scheduleLabel = formatPeerSchedule(booking.start, timezone);
  const endTime = new Date(booking.end).toLocaleTimeString("en-IN", {
    timeZone: timezone,
    timeStyle: "short",
  });

  const interviewExpired = isPeerInterviewExpired(booking);

  const canCancel =
    !interviewExpired &&
    isCandidate &&
    ["pending_acceptance", "accepted_unpaid", "paid_confirmed"].includes(booking.status);
  const hasUsedReschedule = (booking.rescheduleCount ?? 0) >= 1;
  const isRescheduleEligibleStatus = RESCHEDULE_ELIGIBLE_STATUSES.includes(
    booking.status as (typeof RESCHEDULE_ELIGIBLE_STATUSES)[number],
  );
  const interviewUpcoming = new Date(booking.start).getTime() > Date.now();
  const showRescheduleButton =
    !interviewExpired && isCandidate && isRescheduleEligibleStatus && interviewUpcoming;
  const rescheduleButtonDisabled =
    submitting || hasUsedReschedule || !booking.canReschedule;
  const showRescheduleNote = isCandidate && isRescheduleEligibleStatus && !interviewExpired;
  const canPay = !interviewExpired && isCandidate && booking.status === "accepted_unpaid";
  const canRespond =
    !interviewExpired && isInterviewer && booking.status === "pending_acceptance";
  const canInteract = booking.status === "paid_confirmed" || booking.status === "completed";
  const interviewerMarkedDone = booking.interviewerMarkedDone;
  const canCandidateSubmitReview =
    isCandidate && canInteract && interviewerMarkedDone;
  const canInterviewerSubmitFeedback = isInterviewer && canInteract;
  const canShowFeedbackForm = canCandidateSubmitReview || canInterviewerSubmitFeedback;
  const markedDone = isInterviewer && interviewerMarkedDone;
  const existingFeedback = isInterviewer ? booking.interviewerFeedback : booking.candidateFeedback;
  const partnerFeedback = isInterviewer ? booking.candidateFeedback : booking.interviewerFeedback;
  const partnerName = isInterviewer
    ? booking.candidate?.name || "The candidate"
    : booking.interviewer?.name || "The interviewer";
  const backHref = isInterviewer
    ? "/dashboard/peer-interviews/interviewer/bookings"
    : "/dashboard/peer-interviews/bookings";
  const durationMins = Math.round(
    (new Date(booking.end).getTime() - new Date(booking.start).getTime()) / 60_000,
  );
  const canJoin =
    !!booking.videoLink &&
    booking.status === "paid_confirmed" &&
    !(isInterviewer && booking.interviewerMarkedDone);
  const statusDisplayValue = interviewExpired
    ? "Interview expired"
    : booking.status === "completed"
      ? "Completed"
      : interviewerMarkedDone
        ? "Done"
        : ({
            pending_acceptance: "Pending",
            accepted_unpaid: "Payment due",
            paid_confirmed: "Confirmed",
            completed: "Completed",
            rejected: "Declined",
            cancelled: "Cancelled",
            refunded: "Refunded",
          }[booking.status] ?? booking.status);

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canJoin ? (
        <PeerMeetingJoinButton
          bookingId={booking.id}
          videoLink={booking.videoLink!}
          start={booking.start}
          end={booking.end}
          timezone={timezone}
          label="Join meeting room"
          size="default"
          variant="default"
          className="bg-[#7367F0] text-white hover:bg-[#6e62e5] disabled:opacity-60"
        />
      ) : null}
      {canPay ? (
        <Button
          onClick={() => void handlePay()}
          disabled={paying || submitting}
          className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
        >
          {paying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IndianRupee className="mr-2 h-4 w-4" />
          )}
          Pay &amp; confirm
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
      {showRescheduleButton ? (
        <Button
          variant="outline"
          onClick={() => setRescheduleOpen(true)}
          disabled={rescheduleButtonDisabled}
          title={
            hasUsedReschedule
              ? "You have already rescheduled this booking once"
              : booking.rescheduleBlockedReason || undefined
          }
        >
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
      {canCandidateSubmitReview && !existingFeedback ? (
        <Button
          onClick={() => setFeedbackOpen(true)}
          disabled={submitting}
          className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
        >
          <Star className="mr-2 h-4 w-4" />
          Leave a review
        </Button>
      ) : null}
      {isInterviewer && canInteract && !interviewerMarkedDone ? (
        <Button variant="outline" onClick={requestMarkDone} disabled={submitting}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark done
        </Button>
      ) : null}
      <PeerBookingReportButton
        booking={booking}
        canInteract={canInteract}
        onUpdated={load}
        timezone={timezone}
        interviewLabel={interviewLabel}
      />
      <PeerMeetRecordingButton booking={booking} />
    </div>
  );

  return (
    <div className="space-y-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <Link href={backHref}>
        <Button variant="ghost" size="sm" className="h-9 w-fit px-2 sm:h-10 sm:px-4">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Back to bookings</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </Link>

      <div className="hidden lg:block">
        <PageHeader
          title={interviewLabel}
          badge={isCandidate ? "My booking" : undefined}
          actions={headerActions}
        />
      </div>

      <div className="min-w-0 space-y-3 overflow-hidden lg:hidden">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {isCandidate ? (
              <span className="inline-flex max-w-full w-fit items-center rounded-md bg-info-muted px-2.5 py-0.5 text-xs font-medium text-primary">
                My booking
              </span>
            ) : null}
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
              {interviewLabel}
            </h1>
          </div>
          {canPay ? (
            <Button
              onClick={() => void handlePay()}
              disabled={paying || submitting}
              className="h-9 shrink-0 bg-[#7367F0] px-3 text-sm text-white hover:bg-[#6e62e5]"
            >
              {paying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <IndianRupee className="mr-1.5 h-4 w-4" />
                  Pay
                </>
              )}
            </Button>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {canJoin ? (
            <PeerMeetingJoinButton
              bookingId={booking.id}
              videoLink={booking.videoLink!}
              start={booking.start}
              end={booking.end}
              timezone={timezone}
              label="Join meeting room"
              size="default"
              variant="default"
              className="h-9 w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] disabled:opacity-60"
            />
          ) : null}
          {canRespond ? (
            <>
              <Button
                onClick={() => void handleAccept()}
                disabled={submitting}
                className="h-9 flex-1 bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accept request
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeclineOpen(true)}
                disabled={submitting}
                className="h-9 flex-1"
              >
                Decline
              </Button>
            </>
          ) : null}
          {showRescheduleButton ? (
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(true)}
              disabled={rescheduleButtonDisabled}
              title={
                hasUsedReschedule
                  ? "You have already rescheduled this booking once"
                  : booking.rescheduleBlockedReason || undefined
              }
              className="h-9 flex-1"
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Reschedule
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              disabled={submitting}
              className="h-9 flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel booking
            </Button>
          ) : null}
          {canCandidateSubmitReview && !existingFeedback ? (
            <Button
              onClick={() => setFeedbackOpen(true)}
              disabled={submitting}
              className="h-9 w-full bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              <Star className="mr-2 h-4 w-4" />
              Leave a review
            </Button>
          ) : null}
          {isInterviewer && canInteract && !interviewerMarkedDone ? (
            <Button
              variant="outline"
              onClick={requestMarkDone}
              disabled={submitting}
              className="h-9"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark done
            </Button>
          ) : null}
          <PeerBookingReportButton
            booking={booking}
            canInteract={canInteract}
            onUpdated={load}
            timezone={timezone}
            interviewLabel={interviewLabel}
          />
          <PeerMeetRecordingButton booking={booking} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <DashboardStatCard
          theme="purple"
          label="Amount"
          value={`₹${booking.amount}`}
          icon={IndianRupee}
        />
        <DashboardStatCard
          theme="amber"
          label="Scheduled"
          value={scheduleLabel.split(",")[0] ?? scheduleLabel}
          icon={CalendarClock}
          hint={
            <>
              <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>
                {endTime} · {durationMins}m · {timezoneLabel}
              </span>
            </>
          }
        />
        <DashboardStatCard
          theme="emerald"
          label="Status"
          value={statusDisplayValue}
          icon={CheckCircle2}
        />
      </div>

      <div className="space-y-3">
        {interviewExpired ? (
          <StatusBanner tone="muted">
            Interview expired — payment and actions are no longer available.
          </StatusBanner>
        ) : null}
        {!interviewExpired && booking.status === "pending_acceptance" && isCandidate ? (
          <StatusBanner tone="amber">Waiting for interviewer acceptance.</StatusBanner>
        ) : null}
        {!interviewExpired && booking.status === "accepted_unpaid" && isCandidate ? (
          <StatusBanner tone="blue">Accepted — pay to confirm and unlock the meeting room.</StatusBanner>
        ) : null}
        {!interviewExpired && booking.status === "accepted_unpaid" && isInterviewer ? (
          <StatusBanner tone="blue">Waiting for candidate payment.</StatusBanner>
        ) : null}
        {booking.status === "rejected" && booking.rejectionReason ? (
          <StatusBanner tone="red">Declined: {booking.rejectionReason}</StatusBanner>
        ) : null}
        {booking.status === "cancelled" && booking.cancellationReason ? (
          <StatusBanner tone="muted">
            Cancellation reason: {booking.cancellationReason}
          </StatusBanner>
        ) : null}
        {booking.status === "refunded" ? (
          <StatusBanner tone="orange">
            This booking was refunded{booking.refund?.amount ? ` (₹${booking.refund.amount})` : ""}.
          </StatusBanner>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isCandidate ? (
            <>
              <PeerBookingSessionDetailsCard
                booking={booking}
                interviewLabel={interviewLabel}
                scheduleLabel={scheduleLabel}
                endTime={endTime}
                durationMins={durationMins}
              />
              {booking.status === "paid_confirmed" ? (
                <PeerCandidatePrepareCard canJoin={canJoin} />
              ) : null}
              {canInteract ? (
                <PeerCandidateSessionProgressCard booking={booking} />
              ) : null}
              {interviewerMarkedDone ? (
                <PeerCandidateScoreCard score={booking.interviewerCandidateScore} />
              ) : null}
              {booking.interviewer ? (
                <PeerBookingInterviewerCard
                  interviewerId={booking.interviewerId}
                  interviewer={booking.interviewer}
                />
              ) : null}
            </>
          ) : null}

          {isInterviewer && booking.candidate ? (
            <PeerBookingCandidateCard candidate={booking.candidate} />
          ) : null}

          {isInterviewer &&
          !["rejected", "cancelled", "refunded"].includes(booking.status) ? (
            <PeerBookingCardShell title="Booking progress" icon={Hash}>
              <PeerBookingProgressStepper status={booking.status} />
            </PeerBookingCardShell>
          ) : null}

          {canInterviewerSubmitFeedback ? (
            <PeerBookingCardShell title="Candidate scores" icon={BarChart3}>
              <div className="space-y-4">
                <PeerInterviewerCandidateScoreForm
                  values={scoreValues}
                  onChange={setScoreValues}
                  disabled={submitting}
                  showComments
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => void submitCandidateScore()}
                    disabled={submitting}
                    size="sm"
                    className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
                  >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {booking.interviewerCandidateScore ? "Update" : "Submit"}
                  </Button>
                  {markedDone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Marked done
                    </span>
                  ) : null}
                </div>
              </div>
            </PeerBookingCardShell>
          ) : null}

          {isInterviewer && booking.earning ? (
            <PeerEarningCard earning={booking.earning} showBookingRef={false} />
          ) : null}

          {isInterviewer && !booking.earning && canInteract && !booking.interviewerMarkedDone ? (
            <PeerBookingInlineNote icon={Info}>
              Mark done to record your earning (15% platform fee on gross).
            </PeerBookingInlineNote>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {isCandidate && !canInteract ? (
            <PeerCandidateBookingTimelineCard status={booking.status} />
          ) : null}

          {canInteract ? (
            <PeerBookingChatHistoryCard
              bookingId={booking.id}
              viewerClerkId={user?.id}
              viewerRole={booking.viewerRole}
            />
          ) : null}

          {canShowFeedbackForm || (canInteract && partnerFeedback) ? (
            <PeerPartnerRatingCard
              title={isInterviewer ? "Candidate rated you" : "Interviewer rated you"}
              feedback={partnerFeedback}
              emptyMessage={`No rating from ${partnerName} yet.`}
            />
          ) : null}

          {canShowFeedbackForm ? (
            <PeerBookingCardShell
              title={isInterviewer ? "Your feedback" : "Rate interviewer"}
              icon={Star}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} star`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
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
                      ? "Notes on candidate performance…"
                      : "How did the interview go?"
                  }
                  rows={3}
                  className="resize-none"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => void submitFeedback()}
                    disabled={submitting}
                    size="sm"
                    className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
                  >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {existingFeedback ? "Update" : "Submit"}
                  </Button>
                  {isInterviewer && markedDone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Marked done
                    </span>
                  ) : null}
                  {isCandidate && interviewerMarkedDone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Session complete
                    </span>
                  ) : null}
                </div>
              </div>
            </PeerBookingCardShell>
          ) : isCandidate && canInteract && !interviewerMarkedDone ? (
            <PeerBookingInlineNote icon={Info}>
              Review unlocks after your interviewer marks this session done.
            </PeerBookingInlineNote>
          ) : null}

          {isCandidate && booking.status === "paid_confirmed" && booking.cancelPolicy ? (
            <PeerBookingCardShell title="Cancellation" icon={XCircle}>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-2 py-2.5 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    12h+
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">Full refund</p>
                </div>
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-2 py-2.5 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    4–12h
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">50% refund</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-2 py-2.5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    &lt;4h
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">No refund</p>
                </div>
              </div>
            </PeerBookingCardShell>
          ) : null}

          {showRescheduleNote ? (
            <PeerBookingInlineNote icon={CalendarClock}>
              {RESCHEDULE_ONCE_NOTE}
              {hasUsedReschedule ? (
                <span className="mt-1 block font-medium text-foreground">
                  Reschedule already used for this booking.
                </span>
              ) : booking.rescheduleBlockedReason ? (
                <span className="mt-1 block text-foreground">{booking.rescheduleBlockedReason}</span>
              ) : null}
            </PeerBookingInlineNote>
          ) : null}

          {isInterviewer &&
          (booking.peerReportId ||
            booking.reportStatus === "processing" ||
            booking.reportStatus === "completed") ? (
            <PeerBookingCardShell title="Interview report" icon={FileText}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">AI report from Meet transcript</p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                    booking.reportStatus === "completed"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : booking.reportStatus === "processing"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {booking.reportStatus || "none"}
                </span>
              </div>
            </PeerBookingCardShell>
          ) : null}
        </div>
      </div>

      {booking ? (
        <PeerInterviewerMarkDoneFlow
          booking={booking}
          open={markDoneFlowOpen}
          onOpenChange={setMarkDoneFlowOpen}
          timezone={timezone}
          interviewLabel={interviewLabel}
          onSuccess={() => void load()}
        />
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

      <Dialog
        open={feedbackOpen}
        onOpenChange={(open) => {
          setFeedbackOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How was the interview?</DialogTitle>
            <DialogDescription>
              Share quick feedback for your interviewer. This helps improve the peer interview
              community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-1 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Optional comments…"
            rows={4}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              Later
            </Button>
            <Button
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              disabled={submitting || rating < 1}
              onClick={() => void submitFeedback()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
