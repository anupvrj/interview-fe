"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  JourneyCard,
  JourneyIconTile,
  JourneyLoader,
  JourneySpinner,
  JourneyStep,
  journey,
} from "@/components/interview/journey-ui";
import { interviewApi, Interview } from "@/lib/api";
import {
  practiceHubHref,
  practiceHubLabel,
} from "@/lib/interview-practice-hub";
import {
  clearStoredInterviewReturnTo,
  hackathonDashboardFromTags,
  hackathonResultPath,
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
        // Hackathon results aren't shown here: the hackathon dashboard has the result pop-up.
        if (data.metadata?.tags?.includes("hackathon")) {
          router.replace(
            hackathonResultPath(
              resolveInterviewReturnTo(interviewId, searchParams) ?? hackathonDashboardFromTags(data.metadata?.tags),
              interviewId,
            ),
          );
          return;
        }
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
    : "Your report is ready";
  const completeCopy = isHackathonDashboardReturn(returnToRef.current)
    ? "Taking you back to your hackathon challenges so the next one can unlock..."
    : "Your interview report is ready. Redirecting you now...";

  const hackathon = isHackathonDashboardReturn(returnToRef.current);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-xl">
        {status === "processing" && (
          <JourneyCard
            icon={<JourneySpinner size="lg" />}
            eyebrow={hackathon ? "Scoring your round" : "Interview report"}
            title={`Generating your report${dots}`}
            description={
              interview?.session?.terminationReason === "server_error"
                ? "This interview was cut short by a server error. We’re preparing a report from the answers that were saved."
                : hackathon
                  ? "We’re scoring this round and unlocking the next challenge. This usually takes about a minute."
                  : "We’re analysing your answers and writing detailed feedback. This usually takes 30–60 seconds."
            }
            footer={
              hackathon ? (
                <Button variant="outline" asChild className="h-11">
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-2.5">
              <JourneyStep
                state="done"
                title="Analysing audio"
                description="Transcribing your answers and speech patterns"
              />
              <JourneyStep
                state="done"
                title="Evaluating content"
                description="Checking accuracy, depth and communication"
              />
              <JourneyStep
                state="active"
                title={hackathon ? "Updating your hackathon" : "Writing your report"}
                description={
                  hackathon
                    ? "Saving your score so the next challenge can unlock"
                    : "Scores, strengths and what to improve next"
                }
              />
            </div>
          </JourneyCard>
        )}

        {status === "completed" && (
          <JourneyCard
            icon={
              <JourneyIconTile tone="success" size="lg">
                <CheckCircle className="h-7 w-7" aria-hidden />
              </JourneyIconTile>
            }
            eyebrow="Interview report"
            title={headingComplete}
            description={completeCopy}
          >
            <JourneyLoader variant="inline" title="Opening your report…" className="py-2" />
          </JourneyCard>
        )}

        {status === "failed" && (
          <JourneyCard
            icon={
              <JourneyIconTile tone="danger" size="lg">
                <AlertCircle className="h-7 w-7" aria-hidden />
              </JourneyIconTile>
            }
            eyebrow="Interview report"
            title="We couldn’t finish your report"
            description="Something went wrong while analysing your interview. Try again, or contact support if it keeps happening."
            footer={
              <>
                <Button variant="outline" asChild className="h-11">
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
                <Button className={journey.primaryButton} onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </>
            }
          />
        )}
      </div>
    </section>
  );
}
