"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  PostInterviewFeedbackForm,
  type PostInterviewFeedbackPayload,
} from "@/components/interview/post-interview-feedback-form";
import { interviewApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { dash2026Scope, Eyebrow, SegmentedSteps } from "@/components/dashboard-2026/ui";
import {
  hackathonResultPath,
  isHackathonDashboardReturn,
  resolveInterviewReturnTo,
  withInterviewReturnTo,
} from "@/lib/interview-return-to";

export default function PostInterviewFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = params.id as string;
  const returnTo = resolveInterviewReturnTo(interviewId, searchParams);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isHackathon = isHackathonDashboardReturn(returnTo);

  // Hackathon: the result pop-up on the hackathon dashboard ("analysing…"). Otherwise: the report.
  const goNext = () => {
    router.push(
      isHackathon
        ? hackathonResultPath(returnTo, interviewId)
        : withInterviewReturnTo(`/dashboard/interviews/${interviewId}/processing`, returnTo),
    );
  };

  const handleFeedbackSubmit = async (payload: PostInterviewFeedbackPayload) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await interviewApi.submitPostInterviewFeedback(interviewId, {
        sessionHelpful: payload.sessionHelpful,
        questionsRelevant: payload.questionsRelevant,
        overallRating: payload.overallRating,
        sessionChallenge: payload.sessionChallenge,
        comment: payload.comment || undefined,
      });
      goNext();
    } catch (err: unknown) {
      setSubmitError(
        getApiErrorMessage(err, "Error saving feedback. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-6xl space-y-5 lg:space-y-6")}>
      {/* header: the round is done, one short step before the report */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(115,103,240,.13),transparent_70%),radial-gradient(40%_70%_at_95%_20%,rgba(40,199,111,.10),transparent_70%)]" />
        <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <Eyebrow>{isHackathon ? "INTERVIEW COMPLETE" : "INTERVIEW COMPLETE · BEFORE YOUR REPORT"}</Eyebrow>
            <h1 className="text-balance mt-4 text-[30px] font-black leading-[1.04] tracking-[-0.045em] text-foreground md:text-[40px]">
              Nice work. How did that round feel?
            </h1>
            <p className="text-balance mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
              {isHackathon
                ? "Thirty seconds of feedback, then we analyse your interview."
                : "Thirty seconds of feedback, then we build your report. It helps us improve the interviewer."}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-3.5 py-2.5 text-[13px] text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Session saved
          </span>
        </div>
        <div className="relative border-t border-border px-6 py-4 md:px-8">
          <SegmentedSteps labels={["Interview", "Feedback", isHackathon ? "Result" : "Report"]} current={1} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="rounded-[18px] border border-border bg-card p-5 sm:p-7">
          {submitError && (
            <div
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-3.5 py-2.5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{submitError}</p>
            </div>
          )}
          <PostInterviewFeedbackForm
            interviewId={interviewId}
            onSubmitFeedback={handleFeedbackSubmit}
            submitButtonLabel={
              isHackathon ? "Submit & see result" : "Submit & generate report"
            }
            submitting={submitting}
          />
        </div>

        <aside className="rounded-[18px] border border-border bg-card p-5 lg:sticky lg:top-6">
          <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary">{isHackathon ? "WHAT HAPPENS NEXT" : "WHAT'S IN YOUR REPORT"}</p>
          <ul className="mt-3 space-y-3 text-[13.5px] text-foreground">
            {(isHackathon
              ? ["Your interview is analysed", "Your result shows on the hackathon dashboard"]
              : ["An overall score out of 100", "Scores by category", "How you did on every question", "What to fix before the real round"]
            ).map((t) => (
              <li key={t} className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{t}</li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            The report usually takes about a minute after you submit.
          </p>
        </aside>
      </div>
    </div>
  );
}
