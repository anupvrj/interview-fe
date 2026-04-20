"use client";

import { useParams, useSearchParams } from "next/navigation";
import { RealtimeInterviewClient } from "@/components/interview/RealtimeInterviewClient";

export default function RealtimeInterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const interviewId = params.id as string;
  const isCodingDiscussion =
    searchParams.get("sessionPhase") === "coding_discussion";
  const codingEmbed = searchParams.get("codingEmbed") === "1";

  return (
    <RealtimeInterviewClient
      interviewId={interviewId}
      isCodingDiscussion={isCodingDiscussion}
      codingEmbed={codingEmbed}
    />
  );
}
