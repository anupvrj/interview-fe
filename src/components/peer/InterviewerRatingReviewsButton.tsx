"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PeerBooking, PeerFeedback } from "@/lib/api";

export type InterviewerCandidateReview = {
  id: string;
  bookingRef: string;
  interviewType: string;
  interviewLabel: string;
  start: string;
  feedback: PeerFeedback;
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            starClass,
            n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}

export function buildInterviewerCandidateReviews(
  bookings: PeerBooking[],
  typeNames: Record<string, string>,
): InterviewerCandidateReview[] {
  return bookings
    .filter((b): b is PeerBooking & { candidateFeedback: PeerFeedback } => Boolean(b.candidateFeedback))
    .map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      interviewType: b.interviewType,
      interviewLabel: typeNames[b.interviewType] || b.interviewType,
      start: b.start,
      feedback: b.candidateFeedback,
    }))
    .sort(
      (a, b) =>
        new Date(b.feedback.at || b.start).getTime() -
        new Date(a.feedback.at || a.start).getTime(),
    );
}

export function InterviewerRatingReviewsButton({
  ratingAvg,
  ratingCount,
  reviews,
  className,
}: {
  ratingAvg: number;
  ratingCount: number;
  reviews: InterviewerCandidateReview[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ratingLabel = useMemo(
    () => (ratingCount > 0 ? ratingAvg.toFixed(1) : "New"),
    [ratingAvg, ratingCount],
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "h-10 gap-2 px-3 font-semibold shadow-sm",
          ratingCount > 0 && "border-amber-200/80 hover:border-amber-300 dark:border-amber-900/50",
          className,
        )}
        aria-label={`Your rating ${ratingLabel}. View all candidate reviews.`}
      >
        <Star
          className={cn(
            "h-4 w-4 shrink-0",
            ratingCount > 0 ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
          )}
        />
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="text-sm tabular-nums text-foreground">{ratingLabel}</span>
          <span className="text-[10px] font-normal text-muted-foreground">Your rating</span>
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(88dvh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="space-y-2 border-b border-border/60 px-5 pb-4 pt-5 text-left">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </span>
              <span>
                Your rating{" "}
                <span className="tabular-nums text-[#7367F0]">{ratingLabel}</span>
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {ratingCount > 0
                ? `Based on ${ratingCount} candidate review${ratingCount === 1 ? "" : "s"}. Read what candidates shared after your sessions.`
                : "You have not received any candidate reviews yet. Reviews appear here after completed sessions."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No candidate feedback yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-border/60 bg-muted/10 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {review.interviewLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref {review.bookingRef}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {review.feedback.rating}
                        </span>
                        <StarRating rating={review.feedback.rating} />
                      </div>
                    </div>
                    {review.feedback.comments ? (
                      <blockquote className="mt-3 rounded-lg border border-border/40 bg-background/60 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
                        &ldquo;{review.feedback.comments}&rdquo;
                      </blockquote>
                    ) : null}
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {new Date(review.feedback.at || review.start).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
