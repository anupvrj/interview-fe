"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import { FormField } from "@/components/onboarding/onboarding-form-primitives";
import {
  resumeBuilderFooterActions,
  resumeBuilderPrimaryButton,
} from "@/components/resume-builder/resumeBuilderStyles";
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
  className?: string;
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

/** Same control size and surface as the interview setup form. */
const controlClass =
  "h-12 w-full rounded-xl border-border bg-background text-[14.5px] shadow-none";

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="text-[11px] text-red-600 dark:text-red-400" role="alert">
      {children}
    </p>
  );
}

function YesNoToggle({
  value,
  onChange,
  invalid,
  label,
}: {
  value: boolean | null;
  onChange: (next: boolean) => void;
  invalid?: boolean;
  label: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={label}>
      {(
        [
          { label: "Yes", val: true, Icon: ThumbsUp },
          { label: "No", val: false, Icon: ThumbsDown },
        ] as const
      ).map(({ label: optionLabel, val, Icon }) => {
        const selected = value === val;
        return (
          <button
            key={optionLabel}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(val)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-xl border text-[14.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : cn(
                    "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    invalid ? "border-red-400/60" : "border-border",
                  ),
            )}
          >
            <Icon className={cn("h-4 w-4", selected && "text-primary")} aria-hidden />
            {optionLabel}
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
  className,
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
    <form onSubmit={handleSubmit} className={cn("flex flex-col", className)}>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 sm:items-start", compact ? "gap-4" : "gap-x-4 gap-y-5")}>
        <FormField label="Was this session helpful?">
          <YesNoToggle label="Was this session helpful?" value={sessionHelpful} onChange={setSessionHelpful} invalid={showHelpfulError} />
          <FieldError>{showHelpfulError ? "Pick yes or no" : undefined}</FieldError>
        </FormField>

        <FormField label="Were the questions relevant to the role?">
          <YesNoToggle label="Were the questions relevant to the role?" value={questionsRelevant} onChange={setQuestionsRelevant} invalid={showQuestionsRelevantError} />
          <FieldError>{showQuestionsRelevantError ? "Pick yes or no" : undefined}</FieldError>
        </FormField>

        <FormField label="Overall experience">
          <div
            className={cn(
              "flex h-12 items-center justify-between gap-3 rounded-xl border bg-background pl-2 pr-3.5",
              showRatingError ? "border-red-400/60" : "border-border",
            )}
          >
            <div
              className="flex items-center"
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
                      className={cn("h-6 w-6 transition-colors", active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35")}
                      strokeWidth={active ? 0 : 1.5}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
            <span className={cn(mono, "shrink-0 text-[11.5px]", shownRating ? "text-foreground" : "text-muted-foreground/60")}>
              {shownRating ? `${shownRating}/5 · ${RATING_WORDS[shownRating - 1].toUpperCase()}` : "TAP A STAR"}
            </span>
          </div>
          <FieldError>{showRatingError ? "Pick a rating" : undefined}</FieldError>
        </FormField>

        <FormField label="Did anything get in the way?" htmlFor="interview-feedback-challenge">
          <AppSelect
            id="interview-feedback-challenge"
            value={sessionChallenge}
            onChange={(value) => setSessionChallenge(value as InterviewPostSessionChallenge)}
            options={CHALLENGES}
            className={controlClass}
          />
        </FormField>

        <FormField label="Anything else?" htmlFor="interview-feedback-comment" optional className="sm:col-span-2">
          <Textarea
            id="interview-feedback-comment"
            placeholder="A question that felt off, something you liked, a bug you hit…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[88px] resize-none rounded-xl border-border bg-background text-[14.5px] shadow-none placeholder:text-muted-foreground/60"
            maxLength={2000}
            rows={3}
          />
          <p className={cn(mono, "text-right text-[10.5px] text-muted-foreground/70")}>{comment.length}/2000</p>
        </FormField>
      </div>

      {/* keeps the buttons at the bottom when the card beside the form is taller */}
      <div aria-hidden className="min-h-5 flex-1" />
      <div className={resumeBuilderFooterActions}>
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
            className={cn(resumeBuilderPrimaryButton, "w-full sm:w-auto")}
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
