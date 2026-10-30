"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
  onSkip?: () => void;
  submitButtonLabel?: string;
  skipButtonLabel?: string;
  compact?: boolean;
  submitting?: boolean;
};

const CHALLENGES: { value: InterviewPostSessionChallenge; label: string }[] = [
  { value: "none", label: "No issues" },
  { value: "slowness", label: "Slowness or lag" },
  { value: "connection_abort", label: "Connection dropped" },
  { value: "audio", label: "Audio issues" },
  { value: "video", label: "Video issues" },
  { value: "other", label: "Other" },
];

const RATING_WORDS = ["Poor", "Fair", "Good", "Great", "Excellent"] as const;

const mono = "font-[family-name:var(--font-geist-mono)]";

/** One question: a numbered label, the control, and its error underneath. */
function Question({
  n,
  label,
  htmlFor,
  error,
  children,
}: {
  n: number;
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-b-0">
      <Label htmlFor={htmlFor} className="flex items-baseline gap-2.5 text-[15px] font-semibold leading-snug text-foreground">
        <span className={cn(mono, "text-[11px] font-normal text-primary")}>{String(n).padStart(2, "0")}</span>
        {label}
      </Label>
      <div className="mt-3">{children}</div>
      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
  invalid,
}: {
  value: boolean | null;
  onChange: (next: boolean) => void;
  invalid?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:max-w-sm" role="radiogroup">
      {(
        [
          { label: "Yes", val: true, Icon: ThumbsUp },
          { label: "No", val: false, Icon: ThumbsDown },
        ] as const
      ).map(({ label, val, Icon }) => {
        const selected = value === val;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(val)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-xl border text-[14.5px] font-semibold transition-all",
              selected
                ? "border-primary bg-primary text-white shadow-[0_10px_24px_-12px_rgba(115,103,240,.8)]"
                : cn("bg-card text-foreground hover:border-primary/40", invalid ? "border-red-400/60" : "border-border"),
            )}
          >
            <Icon className="h-4 w-4" />
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
  onSkip,
  submitButtonLabel,
  skipButtonLabel,
  compact,
  submitting = false,
}: PostInterviewFeedbackFormProps) {
  const [sessionHelpful, setSessionHelpful] = useState<boolean | null>(null);
  const [questionsRelevant, setQuestionsRelevant] = useState<boolean | null>(
    null,
  );
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [sessionChallenge, setSessionChallenge] =
    useState<InterviewPostSessionChallenge>("none");
  const [comment, setComment] = useState("");
  const [touchedSubmit, setTouchedSubmit] = useState(false);

  const showHelpfulError = touchedSubmit && sessionHelpful === null;
  const showQuestionsRelevantError =
    touchedSubmit && questionsRelevant === null;
  const showRatingError = touchedSubmit && overallRating === null;
  const shownRating = hoverRating ?? overallRating;
  const answered = [sessionHelpful !== null, questionsRelevant !== null, overallRating !== null].filter(Boolean).length;

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
      <Question n={1} label="Was this session helpful?" error={showHelpfulError ? "Pick yes or no" : undefined}>
        <YesNoToggle value={sessionHelpful} onChange={setSessionHelpful} invalid={showHelpfulError} />
      </Question>

      <Question n={2} label="Were the questions relevant to the role?" error={showQuestionsRelevantError ? "Pick yes or no" : undefined}>
        <YesNoToggle value={questionsRelevant} onChange={setQuestionsRelevant} invalid={showQuestionsRelevantError} />
      </Question>

      <Question n={3} label="Overall experience" error={showRatingError ? "Pick a rating" : undefined}>
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Overall rating from 1 to 5"
            onMouseLeave={() => setHoverRating(null)}
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const active = shownRating !== null && value <= shownRating;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={overallRating === value}
                  aria-label={`${value} out of 5 stars, ${RATING_WORDS[value - 1]}`}
                  className="rounded-lg p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onMouseEnter={() => setHoverRating(value)}
                  onClick={() => setOverallRating(value)}
                >
                  <Star
                    className={cn("h-8 w-8 transition-colors", active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
                    strokeWidth={active ? 0 : 1.5}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
          <span className={cn(mono, "text-[12px]", shownRating ? "text-foreground" : "text-muted-foreground/60")}>
            {shownRating ? `${shownRating}/5 · ${RATING_WORDS[shownRating - 1].toUpperCase()}` : "TAP A STAR"}
          </span>
        </div>
      </Question>

      <Question n={4} label="Did anything get in the way?">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Session issues">
          {CHALLENGES.map((c) => {
            const selected = sessionChallenge === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSessionChallenge(c.value)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                  selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Question>

      <Question n={5} label="Anything else? (optional)" htmlFor="interview-feedback-comment">
        <Textarea
          id="interview-feedback-comment"
          placeholder="A question that felt off, something you liked, a bug you hit…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[96px] resize-none rounded-xl border-border bg-background text-[14px] placeholder:text-muted-foreground/60"
          maxLength={2000}
          rows={3}
        />
        <p className={cn(mono, "mt-1.5 text-right text-[10.5px] text-muted-foreground/70")}>{comment.length}/2000</p>
      </Question>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn(mono, "text-[11px] text-muted-foreground")}>{answered}/3 REQUIRED ANSWERED</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={submitting}
              className="h-11 rounded-xl text-muted-foreground hover:text-foreground"
            >
              {skipButtonLabel ?? "Skip for now →"}
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl bg-primary px-5 text-[14.5px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(115,103,240,.75)] hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Submitting…
              </>
            ) : (
              <>
                {submitButtonLabel ?? "Submit & generate report"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
