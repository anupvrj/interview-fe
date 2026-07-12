"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { TrialOfferStep } from "@/components/onboarding/TrialOfferStep";
import { entitlementApi } from "@/lib/api";

export default function TrialOfferPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasPurchasedTrial, setHasPurchasedTrial] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    void (async () => {
      try {
        const entitlements = await entitlementApi.getEntitlements();
        setHasPurchasedTrial(entitlements.trial.hasPurchased);
      } catch {
        setHasPurchasedTrial(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
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
      <TrialOfferStep hasPurchasedTrial={hasPurchasedTrial} />
    </div>
  );
}
