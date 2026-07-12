"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entitlementApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const TRIAL_CHECKOUT_PATH = "/checkout?plan=trial";

type TrialPricingBannerProps = {
  className?: string;
};

export function TrialPricingBanner({ className }: TrialPricingBannerProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [hideBanner, setHideBanner] = useState(false);
  const [entitlementsReady, setEntitlementsReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setEntitlementsReady(true);
      return;
    }

    let cancelled = false;
    entitlementApi
      .getEntitlements()
      .then((data) => {
        if (cancelled) return;
        if (!data.canPurchaseTrial || data.hasActiveTrial) {
          setHideBanner(true);
        }
      })
      .catch(() => {
        /* show banner if entitlements unavailable */
      })
      .finally(() => {
        if (!cancelled) setEntitlementsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const handleStartTrial = () => {
    if (isSignedIn) {
      router.push(TRIAL_CHECKOUT_PATH);
      return;
    }
    router.push(
      `/sign-in?redirect_url=${encodeURIComponent(TRIAL_CHECKOUT_PATH)}`,
    );
  };

  if (!isLoaded || !entitlementsReady || hideBanner) return null;

  return (
    <div
      className={cn(
        "relative mt-16 overflow-hidden border-b border-[#7367F0]/20 bg-gradient-to-r from-[#7367F0]/10 via-amber-500/10 to-[#7367F0]/10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(115,103,240,0.15),_transparent_55%)]" />
      <div className="container relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:gap-6 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3 text-center sm:items-center sm:text-left">
          <div className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/15 text-[#7367F0] sm:mx-0">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground sm:text-base">
              Experience everything for{" "}
              <span className="text-[#7367F0]">₹299</span> — 14-day trial
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Full platform for 14 days — AI interviews, coding, system design,
              ATS tools &amp; 200 credits. One-time ₹299.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Button
            size="lg"
            className="w-full bg-[#7367F0] px-6 text-white hover:bg-[#6358d8] sm:w-auto"
            onClick={handleStartTrial}
          >
            Start your trial now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
