"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { RealtimeInterviewClient } from "@/components/interview/RealtimeInterviewClient";
import { StuckLoadingWatchdog } from "@/components/StuckLoadingWatchdog";
import { currentInterviewReturnTo, resolveHackathonInterviewHome } from "@/lib/interview-return-to";

export default function RealtimeInterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const interviewId = params.id as string;
  const isCodingDiscussion =
    searchParams.get("sessionPhase") === "coding_discussion";
  const codingEmbed = searchParams.get("codingEmbed") === "1";

  // Hackathon interviews: if loading or connecting hangs, don't leave them on a spinner.
  const [isHackathon, setIsHackathon] = useState(false);
  useEffect(() => {
    setIsHackathon(Boolean(resolveHackathonInterviewHome(currentInterviewReturnTo(interviewId))));
  }, [interviewId]);

  return (
    <>
      <RealtimeInterviewClient
        interviewId={interviewId}
        isCodingDiscussion={isCodingDiscussion}
        codingEmbed={codingEmbed}
      />
      {isHackathon ? (
        // Only the loading/connecting states count here: the recording upload at the end can take minutes.
        <StuckLoadingWatchdog watchRequests={false} />
      ) : null}
    </>
  );
}
