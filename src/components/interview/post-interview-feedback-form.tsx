"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InterviewPostSessionChallenge } from "@/lib/api";

/** Payload for `interviewApi.submitPostInterviewFeedback`. */
export type PostInterviewFeedbackPayload = {
  interviewId: string;
  /** Simple yes/no answer. */
  sessionHelpful: boolean;
  /** 1–5 overall experience. */
  overallRating: number;
  /** Technical or connectivity issues during the session. */
  sessionChallenge: InterviewPostSessionChallenge;
  comment: string;
};

type PostInterviewFeedbackFormProps = {
  interviewId: string;
  onSubmitFeedback: (payload: PostInterviewFeedbackPayload) => void;
  /** Tighter spacing when embedded (e.g. processing page). */
  compact?: boolean;
  submitting?: boolean;
};

export function PostInterviewFeedbackForm({
  interviewId,
  onSubmitFeedback,
  compact,
  submitting = false,
}: PostInterviewFeedbackFormProps) {
  const [sessionHelpful, setSessionHelpful] = useState<boolean | null>(null);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [sessionChallenge, setSessionChallenge] =
    useState<InterviewPostSessionChallenge>("none");
  const [comment, setComment] = useState("");
  const [touchedSubmit, setTouchedSubmit] = useState(false);

  const showHelpfulError = touchedSubmit && sessionHelpful === null;
  const showRatingError = touchedSubmit && overallRating === null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setTouchedSubmit(true);
    if (sessionHelpful === null || overallRating === null) return;

    onSubmitFeedback({
      interviewId,
      sessionHelpful,
      overallRating,
      sessionChallenge,
      comment: comment.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(compact ? "space-y-5" : "space-y-8")}
    >
      <div className="space-y-3">
        <Label className="text-base text-gray-900">
          Was this session helpful for your interview preparation?
        </Label>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={sessionHelpful === true ? "default" : "outline"}
            className={cn(
              "min-w-[100px] border-gray-200",
              sessionHelpful === true &&
                "!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md",
            )}
            onClick={() => setSessionHelpful(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={sessionHelpful === false ? "default" : "outline"}
            className={cn(
              "min-w-[100px] border-gray-200",
              sessionHelpful === false &&
                "!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md",
            )}
            onClick={() => setSessionHelpful(false)}
          >
            No
          </Button>
        </div>
        {showHelpfulError && (
          <p className="text-sm text-red-600" role="alert">
            Please choose Yes or No.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-base text-gray-900">
          How would you rate the overall experience?
        </Label>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Overall rating from 1 to 5"
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const active = overallRating !== null && value <= overallRating;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={overallRating === value}
                aria-label={`${value} out of 5 stars`}
                className={cn(
                  "rounded-md p-1.5 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(37,99,235)] focus-visible:ring-offset-2",
                )}
                onClick={() => setOverallRating(value)}
              >
                <Star
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10",
                    active
                      ? "fill-amber-400 text-amber-500"
                      : "text-gray-300",
                  )}
                  strokeWidth={active ? 0 : 1.5}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
        {overallRating !== null && (
          <p className="text-sm text-gray-600">
            {overallRating} out of 5
          </p>
        )}
        {showRatingError && (
          <p className="text-sm text-red-600" role="alert">
            Please select a rating.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="interview-feedback-challenge"
          className="text-base text-gray-900"
        >
          Any challenges during the session?
        </Label>
        <p className="text-sm text-gray-500">
          For example slowness, connection drops, or audio issues.
        </p>
        <Select
          value={sessionChallenge}
          onValueChange={(v) =>
            setSessionChallenge(v as InterviewPostSessionChallenge)
          }
        >
          <SelectTrigger
            id="interview-feedback-challenge"
            className="border-gray-200 bg-white text-gray-900 h-11"
          >
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No issues</SelectItem>
            <SelectItem value="slowness">Slowness or lag</SelectItem>
            <SelectItem value="connection_abort">
              Connection dropped or aborted
            </SelectItem>
            <SelectItem value="audio">Audio issues</SelectItem>
            <SelectItem value="video">Video or camera issues</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interview-feedback-comment" className="text-base text-gray-900">
          Anything else you&apos;d like to share?{" "}
          <span className="font-normal text-gray-500">(optional)</span>
        </Label>
        <Textarea
          id="interview-feedback-comment"
          placeholder="Comments, suggestions, or issues you noticed…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] resize-y border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 text-right">{comment.length} / 2000</p>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto min-w-[160px] !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:hover:!bg-[rgb(37,99,235)]"
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </Button>
      </div>
    </form>
  );
}
