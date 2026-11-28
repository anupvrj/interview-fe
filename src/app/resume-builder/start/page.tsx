"use client";

/**
 * "Build my resume": the sign-up form (Google or email), then the dashboard's new-resume
 * flow. Onboarding waits until the resume is built (resumeBuilderFlow.ts). Signed in already:
 * straight to the new-resume flow.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { track } from "@/lib/analytics/productEvents";
import { RESUME_BUILDER_FLOW_PATH, startResumeBuilderFlow } from "@/lib/resumeBuilderFlow";

const SIGN_UP_HREF = `/sign-up?redirect_url=${encodeURIComponent(RESUME_BUILDER_FLOW_PATH)}`;

export default function ResumeBuilderStartPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    track("resume_builder_signup_opened", { signed_in: Boolean(isSignedIn) });
    if (isSignedIn) {
      router.replace(RESUME_BUILDER_FLOW_PATH);
      return;
    }
    startResumeBuilderFlow();
    router.replace(SIGN_UP_HREF);
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-label="Opening the resume builder">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
