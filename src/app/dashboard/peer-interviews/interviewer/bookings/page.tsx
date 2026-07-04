"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Star,
  BarChart3,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { InterviewerBookingsTable } from "@/components/peer/InterviewerDashboardBookingLists";
import { PeerMeetingJoinButton } from "@/components/peer/PeerMeetingJoinButton";
import { initialScoreFormValues } from "@/components/peer/PeerInterviewerCompletionDialog";
import { PeerInterviewerMarkDoneFlow } from "@/components/peer/PeerInterviewerMarkDoneFlow";
import {
  candidateScoreFormToPayload,
  PeerInterviewerCandidateScoreForm,
  validateCandidateScoreForm,
  type PeerCandidateScoreFormValues,
} from "@/components/peer/PeerInterviewerCandidateScoreForm";
import { PeerTimezoneBadge, PeerTimezoneSelect } from "@/components/peer/PeerTimezoneSelect";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { appCard } from "@/lib/app-theme";
import { isPeerInterviewExpired } from "@/lib/peer-booking-expiry";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking, type PeerInterviewType } from "@/lib/api";

function computeStats(bookings: PeerBooking[]) {
  const now = Date.now();
  let pending = 0;
  let upcoming = 0;
  let completed = 0;

  for (const b of bookings) {
    if (
      (b.status === "pending_acceptance" || b.status === "accepted_unpaid") &&
      !isPeerInterviewExpired(b)
    ) {
      pending += 1;
    }
    if (b.status === "paid_confirmed" && new Date(b.start).getTime() >= now) upcoming += 1;
    if (b.status === "completed") completed += 1;
  }

  return {
    total: bookings.length,
    pending,
    upcoming,
    completed,
  };
}

export default function InterviewerBookingsPage() {
  const {
    timezone,
    setTimezone,
    saving: savingTimezone,
    timezoneLabel,
    loading: tzLoading,
  } = usePeerTimezone();
  const searchParams = useSearchParams();
  const showPendingOnly = searchParams.get("filter") === "pending";

  const [bookings, setBookings] = useState<PeerBooking[]>([]);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [feedbackFor, setFeedbackFor] = useState<PeerBooking | null>(null);
  const [scoreFor, setScoreFor] = useState<PeerBooking | null>(null);
  const [markDoneFlowBooking, setMarkDoneFlowBooking] = useState<PeerBooking | null>(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [scoreValues, setScoreValues] = useState<PeerCandidateScoreFormValues>(
    initialScoreFormValues(),
  );

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const stats = useMemo(() => computeStats(bookings), [bookings]);

  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter(
        (b) =>
          b.status === "paid_confirmed" &&
          !b.interviewerMarkedDone &&
          new Date(b.start).getTime() >= now,
      )
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  }, [bookings]);

  const load = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        peerApi.listInterviewerBookings(),
        peerApi.listInterviewTypes(),
      ]);
      setBookings(b);
      setTypes(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const acceptBooking = async (bookingId: string) => {
    setBusyId(bookingId);
    try {
      await peerApi.acceptBooking(bookingId);
      toast.success("Booking accepted. The candidate can now pay.");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not accept");
      throw e;
    } finally {
      setBusyId(null);
    }
  };

  const declineBooking = async (bookingId: string, reason: string) => {
    setBusyId(bookingId);
    try {
      await peerApi.rejectBooking(bookingId, reason);
      toast.success("Booking rejected");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not reject");
      throw e;
    } finally {
      setBusyId(null);
    }
  };

  const openFeedback = (b: PeerBooking) => {
    setFeedbackFor(b);
    setRating(b.interviewerFeedback?.rating || 0);
    setComments(b.interviewerFeedback?.comments || "");
  };

  const openCandidateScore = (b: PeerBooking) => {
    setScoreFor(b);
    setScoreValues(initialScoreFormValues(b));
  };

  const submitCandidateScore = async () => {
    if (!scoreFor) return;
    const validationError = validateCandidateScoreForm(scoreValues);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setBusyId(scoreFor.id);
    try {
      await peerApi.submitInterviewerCandidateScore(
        scoreFor.id,
        candidateScoreFormToPayload(scoreValues),
      );
      toast.success(scoreFor.interviewerCandidateScore ? "Scores updated" : "Scores submitted");
      setScoreFor(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save scores");
    } finally {
      setBusyId(null);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackFor || rating < 1) {
      toast.error("Select a rating");
      return;
    }
    setBusyId(feedbackFor.id);
    try {
      await peerApi.submitFeedback(feedbackFor.id, { rating, comments });
      toast.success("Feedback submitted");
      setFeedbackFor(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not submit feedback");
    } finally {
      setBusyId(null);
    }
  };

  const requestMarkDone = (b: PeerBooking) => {
    setMarkDoneFlowBooking(b);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={showPendingOnly ? "Pending bookings" : "Booking requests"}
        badge="Interviewer"
        description={
          showPendingOnly
            ? "Requests awaiting your acceptance or candidate payment."
            : "Accept or decline requests, run interviews, leave feedback, and mark sessions done."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {showPendingOnly ? (
              <Link href="/dashboard/peer-interviews/interviewer/bookings">
                <Button variant="outline">View all bookings</Button>
              </Link>
            ) : (
              <Link href="/dashboard/peer-interviews/interviewer/bookings?filter=pending">
                <Button variant="outline">
                  <Clock className="mr-2 h-4 w-4" /> Pending only
                </Button>
              </Link>
            )}
            <Link href="/dashboard/peer-interviews/interviewer">
              <Button variant="outline">Interviewer dashboard</Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className={cn(appCard, "flex h-64 items-center justify-center")}>
          <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
        </div>
      ) : bookings.length === 0 ? (
        <div className={cn(appCard, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
            <CalendarClock className="h-8 w-8" />
          </span>
          <p className="text-lg font-semibold">No bookings yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            When candidates book your slots, requests will appear here for you to accept or decline.
          </p>
          <Link href="/dashboard/peer-interviews/interviewer/slots">
            <Button className="bg-[#7367F0] text-white hover:bg-[#6e62e5]">Manage availability</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className={cn(appCard, "p-4")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <PeerTimezoneSelect
                timezone={timezone}
                onChange={setTimezone}
                disabled={tzLoading || savingTimezone}
                className="max-w-md flex-1"
              />
              <PeerTimezoneBadge label={timezoneLabel} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <DashboardStatCard
              theme="purple"
              label="Total bookings"
              value={stats.total}
              icon={CalendarClock}
              hint={
                <>
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>All interview requests</span>
                </>
              }
            />
            <DashboardStatCard
              theme="amber"
              label="Pending"
              value={stats.pending}
              icon={Clock}
              hint={
                <>
                  <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Awaiting acceptance or payment</span>
                </>
              }
            />
            <DashboardStatCard
              theme="emerald"
              label="Upcoming"
              value={stats.upcoming}
              icon={Video}
              hint={
                <>
                  <Video className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Confirmed &amp; scheduled</span>
                </>
              }
            />
            <DashboardStatCard
              theme="violet"
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              hint={
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Finished sessions</span>
                </>
              }
            />
          </div>

          {nextUpcoming ? (
            <div
              className={cn(
                appCard,
                "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7367F0]">
                  Next interview
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {typeNames[nextUpcoming.interviewType] || nextUpcoming.interviewType}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPeerSchedule(nextUpcoming.start, timezone)} · Ref {nextUpcoming.bookingRef}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {nextUpcoming.videoLink ? (
                  <PeerMeetingJoinButton
                    bookingId={nextUpcoming.id}
                    videoLink={nextUpcoming.videoLink}
                    start={nextUpcoming.start}
                    end={nextUpcoming.end}
                    timezone={timezone}
                    label="Join meeting room"
                    size="default"
                    variant="default"
                    className="bg-[#7367F0] text-white hover:bg-[#6e62e5] disabled:opacity-60"
                  />
                ) : null}
                <Link href={`/dashboard/peer-interviews/bookings/${nextUpcoming.id}`}>
                  <Button variant="outline">
                    <Clock className="mr-2 h-4 w-4" /> View details
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Bookings</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Filter by status or interview round. Accept pending requests, join confirmed
                  interviews from the meeting room, then leave feedback and mark done.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <InterviewerBookingsTable
                bookings={bookings}
                types={types}
                typeNames={typeNames}
                timezone={timezone}
                busyBookingId={busyId}
                onAccept={acceptBooking}
                onDecline={declineBooking}
                onOpenFeedback={openFeedback}
                onOpenCandidateScore={openCandidateScore}
                onMarkDone={requestMarkDone}
                initialStatusFilter={showPendingOnly ? "pending" : "all"}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={!!feedbackFor}
        onOpenChange={(o) => {
          if (!o) setFeedbackFor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview feedback</DialogTitle>
            <DialogDescription>
              Share a star rating for this candidate. Dimensional scores are submitted when you mark
              the interview done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star
                  className={cn(
                    "h-7 w-7",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="How did the candidate perform?"
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFeedbackFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitFeedback()}
              disabled={busyId === feedbackFor?.id}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              {busyId === feedbackFor?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!scoreFor}
        onOpenChange={(o) => {
          if (!o) setScoreFor(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {scoreFor?.interviewerCandidateScore ? "Update candidate scores" : "Score the candidate"}
            </DialogTitle>
            <DialogDescription>
              Rate technical skills, behaviour, and communication out of 100 each.
            </DialogDescription>
          </DialogHeader>
          <PeerInterviewerCandidateScoreForm
            values={scoreValues}
            onChange={setScoreValues}
            disabled={busyId === scoreFor?.id}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setScoreFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitCandidateScore()}
              disabled={busyId === scoreFor?.id}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              {busyId === scoreFor?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : scoreFor?.interviewerCandidateScore ? (
                "Update"
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {markDoneFlowBooking ? (
        <PeerInterviewerMarkDoneFlow
          booking={markDoneFlowBooking}
          open={!!markDoneFlowBooking}
          onOpenChange={(open) => {
            if (!open) setMarkDoneFlowBooking(null);
          }}
          timezone={timezone}
          interviewLabel={
            typeNames[markDoneFlowBooking.interviewType] || markDoneFlowBooking.interviewType
          }
          onSuccess={() => void load()}
        />
      ) : null}
    </div>
  );
}
