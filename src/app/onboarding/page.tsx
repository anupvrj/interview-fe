"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { CandidateOnboardingForm } from "@/components/onboarding/CandidateOnboardingForm";
import { OnboardingPageGraphics } from "@/components/onboarding/OnboardingAnimatedGraphics";
import {
  OnboardingPathChooser,
  type OnboardingPath,
} from "@/components/onboarding/OnboardingPathChooser";
import { isPaidPlanId } from "@/lib/pricingPageContent";
import { consumePostSignInReturnUrl } from "@/lib/post-sign-in-redirect";
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
        const returnUrl = consumePostSignInReturnUrl();
        if (returnUrl) {
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
    void userApi.sendWelcomeSignup(path).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

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
      <div className="relative min-h-screen bg-background">
        <OnboardingPageGraphics />
        <div className="relative z-10">
          <OnboardingPathChooser
            displayName={displayName}
            onChoose={handleOnboardingPathChoice}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <OnboardingPageGraphics />
      <div className="relative z-10 mx-auto mb-8 flex justify-center">
        <InterviewTrixLogo
          variant="onLightBg"
          className="h-8 w-auto dark:hidden"
        />
        <InterviewTrixLogo
          variant="white"
          className="hidden h-8 w-auto dark:block"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOnboardingPath(null)}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Choose a different path
        </Button>
        <CandidateOnboardingForm />
      </div>
    </div>
  );
}
