"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  PostInterviewFeedbackForm,
  type PostInterviewFeedbackPayload,
} from "@/components/interview/post-interview-feedback-form";
import { interviewApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { appCardElevated } from "@/lib/app-theme";

export default function PostInterviewFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      router.push(`/dashboard/interviews/${interviewId}/processing`);
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
          <div className="border-b border-border/60 px-5 py-4 sm:px-6">
            <h1 className="text-lg font-semibold text-foreground">
              How was your mock interview?
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Quick feedback, then we&apos;ll generate your report.
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
              submitting={submitting}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
