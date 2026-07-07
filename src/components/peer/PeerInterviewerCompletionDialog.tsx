"use client";

import { Loader2, Star } from "lucide-react";
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
import {
  PeerInterviewerCandidateScoreForm,
  validateCandidateScoreForm,
  type PeerCandidateScoreFormValues,
} from "@/components/peer/PeerInterviewerCandidateScoreForm";
import { cn } from "@/lib/utils";
import type { PeerBooking } from "@/lib/api";

export function getInterviewerCompletionNeeds(booking: PeerBooking) {
  const needsScore = !booking.interviewerCandidateScore;
  const needsFeedback = !booking.interviewerFeedback;
  return {
    needsScore,
    needsFeedback,
    canMarkDoneDirectly: !needsScore && !needsFeedback,
  };
}

export function initialScoreFormValues(
  booking?: PeerBooking | null,
): PeerCandidateScoreFormValues {
  const score = booking?.interviewerCandidateScore;
  return {
    technical: score != null ? String(score.technical) : "",
    behaviour: score != null ? String(score.behaviour) : "",
    communication: score != null ? String(score.communication) : "",
    comments: score?.comments || "",
  };
}

export function zeroScoreFormValues(): PeerCandidateScoreFormValues {
  return {
    technical: "0",
    behaviour: "0",
    communication: "0",
    comments: "",
  };
}

export function PeerInterviewerCompletionDialog({
  open,
  onOpenChange,
  needsScore,
  needsFeedback,
  scoreValues,
  onScoreChange,
  scoreSkipped,
  onSkipScores,
  rating,
  onRatingChange,
  comments,
  onCommentsChange,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  needsScore: boolean;
  needsFeedback: boolean;
  scoreValues: PeerCandidateScoreFormValues;
  onScoreChange: (values: PeerCandidateScoreFormValues) => void;
  scoreSkipped?: boolean;
  onSkipScores?: () => void;
  rating: number;
  onRatingChange: (rating: number) => void;
  comments: string;
  onCommentsChange: (comments: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const title =
    needsScore && needsFeedback
      ? "Score & rate the candidate"
      : needsScore
        ? "Score the candidate"
        : "Rate the candidate";

  const description =
    needsScore && needsFeedback
      ? "Rate each skill area out of 100, or skip scores to submit zeros. A star rating is required before marking this interview complete."
      : needsScore
        ? "Rate each skill area out of 100, or skip scores to submit zeros before marking this interview complete."
        : "Share your star rating before marking this interview complete.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-1">
          {needsScore ? (
            <div className="space-y-3">
              {scoreSkipped ? (
                <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Scores will be submitted as 0 for all skill areas. Adjust the sliders below or
                  keep the skip.
                </p>
              ) : null}
              <PeerInterviewerCandidateScoreForm
                values={scoreValues}
                onChange={onScoreChange}
                disabled={submitting}
              />
              {onSkipScores ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSkipScores}
                  disabled={submitting}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  Skip scores (submit as 0)
                </Button>
              ) : null}
            </div>
          ) : null}

          {needsFeedback ? (
            <div className="space-y-3">
              {needsScore ? (
                <p className="text-sm font-medium text-foreground">Community rating (1–5 stars)</p>
              ) : null}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onRatingChange(n)}
                    aria-label={`${n} star`}
                    disabled={submitting}
                  >
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
                onChange={(e) => onCommentsChange(e.target.value)}
                placeholder="How did the candidate perform?"
                rows={3}
                disabled={submitting}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || (needsFeedback && rating < 1)}
            className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Submit & mark done"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function validateInterviewerCompletionInput(
  needsScore: boolean,
  needsFeedback: boolean,
  scoreValues: PeerCandidateScoreFormValues,
  rating: number,
): string | null {
  if (needsScore) {
    const scoreError = validateCandidateScoreForm(scoreValues);
    if (scoreError) return scoreError;
  }
  if (needsFeedback && rating < 1) {
    return "Please select a star rating";
  }
  return null;
}
