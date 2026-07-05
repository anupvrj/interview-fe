"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import {
  candidateScoreFormToPayload,
  type PeerCandidateScoreFormValues,
} from "@/components/peer/PeerInterviewerCandidateScoreForm";
import {
  getInterviewerCompletionNeeds,
  initialScoreFormValues,
  PeerInterviewerCompletionDialog,
  validateInterviewerCompletionInput,
  zeroScoreFormValues,
} from "@/components/peer/PeerInterviewerCompletionDialog";
import { peerApi, type PeerBooking } from "@/lib/api";

type MarkDonePhase = "confirm" | "completion";

export function PeerInterviewerMarkDoneFlow({
  booking,
  open,
  onOpenChange,
  timezone,
  interviewLabel,
  onSuccess,
}: {
  booking: PeerBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timezone: string;
  interviewLabel?: string;
  onSuccess?: (booking: PeerBooking) => void;
}) {
  const [phase, setPhase] = useState<MarkDonePhase>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [scoreValues, setScoreValues] = useState<PeerCandidateScoreFormValues>(
    initialScoreFormValues(),
  );
  const [scoreSkipped, setScoreSkipped] = useState(false);

  useEffect(() => {
    if (!open || !booking) return;
    setPhase("confirm");
    setScoreValues(initialScoreFormValues(booking));
    setScoreSkipped(false);
    setRating(booking.interviewerFeedback?.rating ?? 0);
    setComments(booking.interviewerFeedback?.comments ?? "");
  }, [open, booking?.id, booking]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPhase("confirm");
    }
    onOpenChange(next);
  };

  const proceedFromConfirm = () => {
    if (!booking) return;
    const { canMarkDoneDirectly } = getInterviewerCompletionNeeds(booking);
    if (canMarkDoneDirectly) {
      void executeMarkDone();
      return;
    }
    setPhase("completion");
  };

  const executeMarkDone = async () => {
    if (!booking) return;
    setSubmitting(true);
    try {
      await peerApi.markDone(booking.id);
      toast.success("Interview marked done");
      handleOpenChange(false);
      const updated = await peerApi.getBooking(booking.id);
      onSuccess?.(updated);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not mark done");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScoreChange = (values: PeerCandidateScoreFormValues) => {
    setScoreValues(values);
    setScoreSkipped(false);
  };

  const skipScores = () => {
    setScoreValues(zeroScoreFormValues());
    setScoreSkipped(true);
  };

  const submitCompletion = async () => {
    if (!booking) return;
    const { needsScore, needsFeedback } = getInterviewerCompletionNeeds(booking);
    const valuesForValidation = scoreSkipped ? zeroScoreFormValues() : scoreValues;
    const validationError = validateInterviewerCompletionInput(
      needsScore,
      needsFeedback,
      valuesForValidation,
      rating,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (needsScore) {
        const payload = scoreSkipped
          ? { technical: 0, behaviour: 0, communication: 0 }
          : candidateScoreFormToPayload(scoreValues);
        await peerApi.submitInterviewerCandidateScore(booking.id, payload);
      }
      if (needsFeedback) {
        await peerApi.submitFeedback(booking.id, { rating, comments });
      }
      await peerApi.markDone(booking.id);
      toast.success("Interview marked done");
      handleOpenChange(false);
      const updated = await peerApi.getBooking(booking.id);
      onSuccess?.(updated);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not complete interview");
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  const label = interviewLabel ?? booking.interviewType;
  const scheduleLabel = formatPeerSchedule(booking.start, timezone);
  const { needsScore, needsFeedback, canMarkDoneDirectly } =
    getInterviewerCompletionNeeds(booking);

  return (
    <>
      <Dialog open={open && phase === "confirm"} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <DialogTitle>Mark interview done?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-1 text-left text-sm text-muted-foreground">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-foreground">
                  <p className="font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ref {booking.bookingRef} · {scheduleLabel}
                  </p>
                  <p className="mt-2 text-sm font-medium tabular-nums">
                    Gross ₹{booking.amount} · Est. net ₹
                    {Math.round(booking.amount * 0.85)} after 15% platform fee
                  </p>
                </div>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Your earning will be recorded and sent for admin review.</li>
                  <li>You will no longer be able to join this meeting from bookings.</li>
                  <li>The booking will be marked complete for you and the candidate.</li>
                  {!canMarkDoneDirectly ? (
                    <li>
                      Next you&apos;ll score the candidate (or skip to submit zeros) and leave a
                      required star rating.
                    </li>
                  ) : null}
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void proceedFromConfirm()}
              disabled={submitting}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking done…
                </>
              ) : canMarkDoneDirectly ? (
                "Mark done"
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PeerInterviewerCompletionDialog
        open={open && phase === "completion"}
        onOpenChange={(next) => {
          if (!next) handleOpenChange(false);
        }}
        needsScore={needsScore}
        needsFeedback={needsFeedback}
        scoreValues={scoreValues}
        onScoreChange={handleScoreChange}
        scoreSkipped={scoreSkipped}
        onSkipScores={needsScore ? skipScores : undefined}
        rating={rating}
        onRatingChange={setRating}
        comments={comments}
        onCommentsChange={setComments}
        submitting={submitting}
        onSubmit={() => void submitCompletion()}
      />
    </>
  );
}
