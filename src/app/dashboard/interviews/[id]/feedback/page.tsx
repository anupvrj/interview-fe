"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  PostInterviewFeedbackForm,
  type PostInterviewFeedbackPayload,
} from "@/components/interview/post-interview-feedback-form";
import { interviewApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { appCardElevated } from "@/lib/app-theme";
import { journey } from "@/components/interview/journey-ui";
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
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <div className={cn(appCardElevated, "overflow-hidden")}>
          <div className={journey.headerBand}>
            <p className={journey.eyebrow}>
              {isHackathon ? "Interview complete" : "Before your report"}
            </p>
            <h1 className={cn(journey.title, "mt-2")}>How was your mock interview?</h1>
            <p className={journey.description}>
              {isHackathon
                ? "Quick feedback, then we\u2019ll analyse your interview."
                : "Quick feedback, then we\u2019ll generate your report."}
            </p>
          </div>

          <div className="px-5 py-4 sm:px-6">
            {submitError && (
              <div
                className="mb-4 flex items-start gap-2 rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
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
        </div>
      </div>
    </section>
  );
}
