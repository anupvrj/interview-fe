"use client";

import { MessageSquareQuote, Star } from "lucide-react";
import { PeerBookingCardShell } from "@/components/peer/PeerBookingCardShell";
import { cn } from "@/lib/utils";
import type { PeerFeedback } from "@/lib/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}

export function PeerPartnerRatingCard({
  title,
  feedback,
  emptyMessage = "No rating yet.",
}: {
  title: string;
  description?: string;
  feedback?: PeerFeedback;
  emptyMessage?: string;
}) {
  return (
    <PeerBookingCardShell title={title} icon={MessageSquareQuote}>
      {feedback ? (
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold tabular-nums leading-none text-foreground">
              {feedback.rating}
            </span>
            <div className="pb-0.5">
              <StarRating rating={feedback.rating} />
              <p className="mt-0.5 text-[10px] text-muted-foreground">out of 5</p>
            </div>
          </div>

          {feedback.comments ? (
            <blockquote className="rounded-xl border border-border/40 bg-muted/15 px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{feedback.comments}&rdquo;
            </blockquote>
          ) : null}

          {feedback.at ? (
            <p className="text-[10px] text-muted-foreground">
              {new Date(feedback.at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </PeerBookingCardShell>
  );
}
