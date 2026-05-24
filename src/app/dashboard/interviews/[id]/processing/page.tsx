"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { interviewApi, Interview } from "@/lib/api";
import {
  practiceHubHref,
  practiceHubLabel,
} from "@/lib/interview-practice-hub";

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [status, setStatus] = useState<"processing" | "completed" | "failed">(
    "processing"
  );
  const [interview, setInterview] = useState<Interview | null>(null);
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    checkInterviewStatus();
  }, [interviewId]);

  const checkInterviewStatus = async () => {
    try {
      const data = await interviewApi.get(interviewId);
      setInterview(data);

      if (data.status === "completed") {
        setStatus("completed");
        // Redirect to report after 2 seconds
        setTimeout(() => {
          router.push(`/dashboard/interviews/${interviewId}/report`);
        }, 2000);
      } else if (data.status === "failed") {
        setStatus("failed");
      } else if (data.status === "processing") {
        // Check again in 3 seconds
        setTimeout(checkInterviewStatus, 3000);
      }
    } catch (error) {
      console.error("Error checking interview status:", error);
      setStatus("failed");
      try {
        const data = await interviewApi.get(interviewId);
        setInterview(data);
      } catch {
        /* link falls back to practice interviews list */
      }
    }
  };

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
              <p className="text-gray-600 mb-8 text-lg">
                Our AI is analyzing your responses and generating detailed
                feedback. This usually takes 30-60 seconds.
              </p>

              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Analyzing Audio
                    </div>
                    <div className="text-sm text-gray-600">
                      Transcribing your responses and detecting speech patterns
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Evaluating Content
                    </div>
                    <div className="text-sm text-gray-600">
                      Assessing technical accuracy and communication skills
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0 animate-spin" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Generating Report
                    </div>
                    <div className="text-sm text-gray-600">
                      Creating your personalized feedback and improvement tips
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-primary">
                  💡 <strong>Tip:</strong> While you wait, consider what went
                  well and what you'd like to improve for your next interview!
                </p>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-green-600">
                Analysis Complete!
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Your interview report is ready. Redirecting you now...
              </p>
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
              <h2 className="text-3xl font-bold mb-4 text-slate-800">
                Ooops...
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                We encountered an error while analyzing your interview. Please
                try again or contact support if the issue persists.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href={practiceHubHref(interview)}>
                    {practiceHubLabel(interview)}
                  </Link>
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => checkInterviewStatus()}
                >
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
