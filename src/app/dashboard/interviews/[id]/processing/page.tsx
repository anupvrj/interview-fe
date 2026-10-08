"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { interviewApi, Interview } from "@/lib/api";
import {
  practiceHubHref,
  practiceHubLabel,
} from "@/lib/interview-practice-hub";
import {
  clearStoredInterviewReturnTo,
  hackathonDashboardFromTags,
  isHackathonDashboardReturn,
  resolveInterviewReturnTo,
} from "@/lib/interview-return-to";

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = params.id as string;
  const returnTo = resolveInterviewReturnTo(interviewId, searchParams);
  const returnToRef = useRef(returnTo);
  returnToRef.current = returnTo;

  const [status, setStatus] = useState<"processing" | "completed" | "failed">(
    "processing",
  );
  const [interview, setInterview] = useState<Interview | null>(null);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const goNext = (data: Interview) => {
      const dest =
        returnToRef.current ??
        hackathonDashboardFromTags(data.metadata?.tags) ??
        `/dashboard/interviews/${interviewId}/report`;
      if (isHackathonDashboardReturn(dest) || dest.includes("/hackathon/")) {
        clearStoredInterviewReturnTo(interviewId);
      }
      redirectTimer = setTimeout(() => {
        if (!cancelled) router.push(dest);
      }, 1200);
    };

    const checkInterviewStatus = async () => {
      try {
        const data = await interviewApi.get(interviewId);
        if (cancelled) return;
        setInterview(data);
        const stored = resolveInterviewReturnTo(interviewId, searchParams);
        if (stored) returnToRef.current = stored;
        else if (!returnToRef.current) {
          returnToRef.current = hackathonDashboardFromTags(data.metadata?.tags);
        }

        if (data.status === "completed") {
          setStatus("completed");
          goNext(data);
        } else if (data.status === "failed") {
          setStatus("failed");
        } else {
          retryTimer = setTimeout(() => {
            void checkInterviewStatus();
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking interview status:", error);
        if (cancelled) return;
        setStatus("failed");
        try {
          const data = await interviewApi.get(interviewId);
          if (!cancelled) setInterview(data);
        } catch {
          /* link falls back to practice interviews list */
        }
      }
    };

    void checkInterviewStatus();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [interviewId, router, searchParams]);

  const backHref =
    returnToRef.current ??
    hackathonDashboardFromTags(interview?.metadata?.tags) ??
    practiceHubHref(interview);
  const backLabel = isHackathonDashboardReturn(backHref)
    ? "Back to hackathon"
    : returnTo
      ? "Go back"
      : practiceHubLabel(interview);

  const headingComplete = isHackathonDashboardReturn(returnToRef.current)
    ? "Interview submitted"
    : "Analysis Complete!";
  const completeCopy = isHackathonDashboardReturn(returnToRef.current)
    ? "Taking you back to your hackathon challenges so the next one can unlock..."
    : "Your interview report is ready. Redirecting you now...";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2">
        <CardContent className="p-12">
          {status === "processing" && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
                <Loader2 className="h-10 w-10 animate-spin text-primary-foreground" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-primary">
                Processing Your Interview{dots}
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {isHackathonDashboardReturn(returnToRef.current)
                  ? "We’re scoring this round and unlocking the next challenge. This usually takes about a minute."
                  : "Our AI is analyzing your responses and generating detailed feedback. This usually takes 30-60 seconds."}
              </p>

              {isHackathonDashboardReturn(returnToRef.current) ? (
                <Button variant="outline" asChild className="mb-8">
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
              ) : null}

              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Analyzing Audio
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Transcribing your responses and detecting speech patterns
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Evaluating Content
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Assessing technical accuracy and communication skills
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0 animate-spin" />
                  <div>
                    <div className="font-semibold text-foreground">
                      {isHackathonDashboardReturn(returnToRef.current)
                        ? "Updating your hackathon"
                        : "Generating Report"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isHackathonDashboardReturn(returnToRef.current)
                        ? "Saving your score so the next challenge can unlock"
                        : "Creating your personalized feedback and improvement tips"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-green-600">{headingComplete}</h2>
              <p className="text-muted-foreground mb-8 text-lg">{completeCopy}</p>
              <div className="animate-pulse">
                <Loader2 className="w-8 h-8 text-purple-600 mx-auto animate-spin" />
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-foreground">Ooops...</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                We encountered an error while analyzing your interview. Please try again or
                contact support if the issue persists.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
                <Button variant="gradient" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
