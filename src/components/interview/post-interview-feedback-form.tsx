"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
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
import { appPrimaryButton } from "@/lib/app-theme";
import type { InterviewPostSessionChallenge } from "@/lib/api";

/** Payload for `interviewApi.submitPostInterviewFeedback`. */
export type PostInterviewFeedbackPayload = {
  interviewId: string;
  sessionHelpful: boolean;
  questionsRelevant: boolean;
  overallRating: number;
  sessionChallenge: InterviewPostSessionChallenge;
  comment: string;
};

type PostInterviewFeedbackFormProps = {
  interviewId: string;
  onSubmitFeedback: (payload: PostInterviewFeedbackPayload) => void;
  compact?: boolean;
  submitting?: boolean;
};

function FieldRow({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-border/50 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
      <Label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-snug text-foreground"
      >
        {label}
      </Label>
      <div className="sm:justify-self-end">{children}</div>
      {error ? (
        <p
          className="text-xs text-red-600 dark:text-red-400 sm:col-span-2"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border/80 bg-card p-0.5">
      {(
        [
          { label: "Yes", val: true },
          { label: "No", val: false },
        ] as const
      ).map(({ label, val }) => {
        const selected = value === val;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(val)}
            className={cn(
              "min-w-[3.25rem] rounded px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-[#7367F0] text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function PostInterviewFeedbackForm({
  interviewId,
  onSubmitFeedback,
  compact,
  submitting = false,
}: PostInterviewFeedbackFormProps) {
  const [sessionHelpful, setSessionHelpful] = useState<boolean | null>(null);
  const [questionsRelevant, setQuestionsRelevant] = useState<boolean | null>(
    null,
  );
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [sessionChallenge, setSessionChallenge] =
    useState<InterviewPostSessionChallenge>("none");
  const [comment, setComment] = useState("");
  const [touchedSubmit, setTouchedSubmit] = useState(false);

  const showHelpfulError = touchedSubmit && sessionHelpful === null;
  const showQuestionsRelevantError =
    touchedSubmit && questionsRelevant === null;
  const showRatingError = touchedSubmit && overallRating === null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setTouchedSubmit(true);
    if (
      sessionHelpful === null ||
      questionsRelevant === null ||
      overallRating === null
    )
      return;

    onSubmitFeedback({
      interviewId,
      sessionHelpful,
      questionsRelevant,
      overallRating,
      sessionChallenge,
      comment: comment.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn(compact ? "space-y-2" : "")}>
      <FieldRow
        label="Was this session helpful?"
        error={showHelpfulError ? "Required" : undefined}
      >
        <YesNoToggle value={sessionHelpful} onChange={setSessionHelpful} />
      </FieldRow>

      <FieldRow
        label="Were the questions relevant?"
        error={showQuestionsRelevantError ? "Required" : undefined}
      >
        <YesNoToggle
          value={questionsRelevant}
          onChange={setQuestionsRelevant}
        />
      </FieldRow>

      <FieldRow
        label="Overall experience"
        error={showRatingError ? "Required" : undefined}
      >
        <div
          className="flex items-center gap-0.5"
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
                className="rounded p-0.5 transition-colors hover:bg-[#7367F0]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7367F0]"
                onClick={() => setOverallRating(value)}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    active
                      ? "fill-amber-400 text-amber-500"
                      : "text-muted-foreground/35",
                  )}
                  strokeWidth={active ? 0 : 1.5}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </FieldRow>

      <FieldRow label="Any issues?" htmlFor="interview-feedback-challenge">
        <Select
          value={sessionChallenge}
          onValueChange={(v) =>
            setSessionChallenge(v as InterviewPostSessionChallenge)
          }
        >
          <SelectTrigger
            id="interview-feedback-challenge"
            className="h-9 w-full min-w-[10rem] border-border/80 bg-card sm:w-[11rem]"
          >
            <SelectValue placeholder="No issues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No issues</SelectItem>
            <SelectItem value="slowness">Slowness or lag</SelectItem>
            <SelectItem value="connection_abort">Connection dropped</SelectItem>
            <SelectItem value="audio">Audio issues</SelectItem>
            <SelectItem value="video">Video issues</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>

      <div className="border-b border-border/50 py-3 last:border-b-0">
        <Label
          htmlFor="interview-feedback-comment"
          className="text-sm font-medium text-foreground"
        >
          Comments <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="interview-feedback-comment"
          placeholder="Anything else to share…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-2 min-h-[64px] resize-none border-border/80 bg-card text-sm placeholder:text-muted-foreground/60"
          maxLength={2000}
          rows={2}
        />
      </div>

      <div className="pt-3">
        <Button
          type="submit"
          disabled={submitting}
          className={cn(appPrimaryButton, "h-9 w-full")}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Submitting…
            </>
          ) : (
            "Submit & generate report"
          )}
        </Button>
      </div>
    </form>
  );
}
