"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { CandidateOnboardingForm } from "@/components/onboarding/CandidateOnboardingForm";
import {
  OnboardingPathChooser,
  type OnboardingPath,
} from "@/components/onboarding/OnboardingPathChooser";
import { isPaidPlanId } from "@/lib/pricingPageContent";
import { userApi } from "@/lib/api";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [onboardingPath, setOnboardingPath] = useState<OnboardingPath | null>(
    null,
  );

  const checkOnboardingStatus = async () => {
    let didRedirect = false;
    if (!user) {
      setCheckingStatus(false);
      return;
    }
    try {
      localStorage.setItem("clerk-user-id", user.id);
      const createdUser = await userApi.createOrGetUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || "",
        user.fullName || user.firstName || "User",
      );

      if (createdUser.onboardingCompleted) {
        const returnUrl = localStorage.getItem("resumeBuilderReturnUrl");
        if (returnUrl) {
          localStorage.removeItem("resumeBuilderReturnUrl");
          didRedirect = true;
          router.replace(returnUrl);
          return;
        }

        const pendingPlan = localStorage.getItem("pendingPlan");
        if (pendingPlan === "enterprise") {
          localStorage.removeItem("pendingPlan");
          didRedirect = true;
          router.replace("/contact");
        } else if (pendingPlan && isPaidPlanId(pendingPlan)) {
          localStorage.removeItem("pendingPlan");
          didRedirect = true;
          router.replace(`/checkout?plan=${pendingPlan}&cycle=monthly`);
        } else {
          if (pendingPlan) localStorage.removeItem("pendingPlan");
          didRedirect = true;
          router.replace("/select-role");
        }
        return;
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      if (!didRedirect) setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      void checkOnboardingStatus();
    } else if (isLoaded && !user) {
      setCheckingStatus(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  const handleOnboardingPathChoice = (path: OnboardingPath) => {
    if (path === "interviewer") {
      router.replace("/dashboard/peer-interviews/interviewer");
      return;
    }
    if (path === "recruiter") {
      router.replace("/dashboard/ix-recruiter/apply");
      return;
    }
    setOnboardingPath("candidate");
  };

  if (!isLoaded || checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (onboardingPath === null) {
    const displayName =
      user?.firstName?.trim() || user?.fullName?.trim() || "there";
    return (
      <OnboardingPathChooser
        displayName={displayName}
        onChoose={handleOnboardingPathChoice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto mb-8 flex justify-center">
        <InterviewTrixLogo
          variant="onLightBg"
          className="h-8 w-auto dark:hidden"
        />
        <InterviewTrixLogo
          variant="white"
          className="hidden h-8 w-auto dark:block"
        />
      </div>
      <CandidateOnboardingForm onBack={() => setOnboardingPath(null)} />
    </div>
  );
}
