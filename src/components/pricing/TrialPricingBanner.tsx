"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trialApi } from "@/lib/api";
import {
  TRIAL_CTA,
  TRIAL_FEATURES_TAGLINE,
} from "@/lib/trialFeatures";
import { cn } from "@/lib/utils";

type TrialPricingBannerProps = {
  className?: string;
  visible?: boolean;
  onTrialStarted?: () => void;
};

export function TrialPricingBanner({
  className,
  visible = true,
  onTrialStarted,
}: TrialPricingBannerProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleStartTrial = async () => {
    if (!isSignedIn) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent("/pricing")}`,
      );
      return;
    }

    setStarting(true);
    setError(null);
    try {
      await trialApi.startTrial();
      onTrialStarted?.();
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to start trial. Please try again.";
      setError(message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-[#7367F0]/20 bg-gradient-to-r from-[#7367F0]/10 via-amber-500/10 to-[#7367F0]/10",
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
              {TRIAL_CTA} — 14 days free
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {TRIAL_FEATURES_TAGLINE} Full platform access — AI interviews,
              coding, system design, and ATS tools.
            </p>
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
          </div>
        </div>
        <div className="shrink-0">
          <Button
            size="lg"
            className="w-full bg-[#7367F0] px-6 text-white hover:bg-[#6358d8] sm:w-auto"
            onClick={() => void handleStartTrial()}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                {TRIAL_CTA}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
