"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appCard } from "@/lib/app-theme";
import {
  TRIAL_FEATURES_TAGLINE,
  TRIAL_UNLOCKED_FEATURES,
} from "@/lib/trialFeatures";
import { cn } from "@/lib/utils";

const TRIAL_FEATURES = [...TRIAL_UNLOCKED_FEATURES];

type TrialOfferStepProps = {
  hasPurchasedTrial?: boolean;
  className?: string;
};

export function TrialOfferStep({
  hasPurchasedTrial = false,
  className,
}: TrialOfferStepProps) {
  const router = useRouter();

  if (hasPurchasedTrial) {
    return (
      <div className={cn("mx-auto w-full max-w-lg text-center", className)}>
        <div className={cn(appCard, "p-8")}>
          <h2 className="text-xl font-semibold text-foreground">
            You&apos;ve already used your trial
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade to General Pass, Tech Basic, or Tech Pro to unlock full
            features.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/pricing">View plans</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-xl", className)}>
      <div className={cn(appCard, "overflow-hidden")}>
        <div className="bg-gradient-to-br from-amber-500/15 via-[#7367F0]/10 to-transparent px-6 py-8 text-center sm:px-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Experience everything — 14 days
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {TRIAL_FEATURES_TAGLINE}
          </p>
          <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">
            ₹299
            <span className="ml-1 text-base font-normal text-muted-foreground">
              one-time
            </span>
          </p>
        </div>

        <ul className="space-y-3 border-t border-border/60 px-6 py-6 sm:px-8">
          {TRIAL_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-6 sm:px-8">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/checkout?plan=trial")}
          >
            Start trial — ₹299
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push("/select-role")}
          >
            Continue on Free plan
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Trial is one-time only. Upgrade anytime to General Pass, Tech Basic,
            or Tech Pro.
          </p>
        </div>
      </div>
    </div>
  );
}
