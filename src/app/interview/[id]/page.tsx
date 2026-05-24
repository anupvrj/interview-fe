"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  useEffect(() => {
    // Redirect to realtime interview page
    if (interviewId) {
      router.replace(`/interview/${interviewId}/realtime`);
    }
  }, [interviewId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to interview...</p>
      </div>
    </div>
  );
}
