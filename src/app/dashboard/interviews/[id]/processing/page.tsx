"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { interviewApi, Interview } from "@/lib/api";

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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2">
        <CardContent className="p-12">
          {status === "processing" && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgb(37 99 235 / var(--tw-text-opacity, 1))' }}>
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

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
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
              <h2 className="text-3xl font-bold mb-4 text-red-600">
                Processing Failed
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                We encountered an error while analyzing your interview. Please
                try again or contact support if the issue persists.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Back to Dashboard
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
