"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareHeart } from "lucide-react";
import {
  PostInterviewFeedbackForm,
  type PostInterviewFeedbackPayload,
} from "@/components/interview/post-interview-feedback-form";
import { interviewApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";

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
    <div className="w-full flex justify-center py-6 sm:py-10 lg:py-12">
      <Card className="w-full max-w-3xl border-2 border-border bg-card shadow-xl">
        <CardHeader className="space-y-3 pb-2 text-left">
          <div className="flex h-12 w-14 items-center justify-center rounded-xl bg-muted/30 text-primary">
            <MessageSquareHeart className="h-6 w-6" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Quick feedback
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground leading-relaxed">
            Please fill the feedback form to continue. Once submitted, we&apos;ll
            generate your interview report.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-8">
          {submitError && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}
          <PostInterviewFeedbackForm
            interviewId={interviewId}
            onSubmitFeedback={handleFeedbackSubmit}
            submitting={submitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
