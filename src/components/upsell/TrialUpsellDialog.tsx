"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Coins,
  Calendar,
  Zap,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trialApi } from "@/lib/api";
import {
  TRIAL_CTA,
  TRIAL_FEATURES_TAGLINE,
  TRIAL_STAT_CREDITS,
  TRIAL_STAT_DURATION,
  TRIAL_STAT_FREE,
  TRIAL_UNLOCKED_FEATURES,
} from "@/lib/trialFeatures";
import { cn } from "@/lib/utils";

export type TrialUpsellVariant =
  | "dashboard_promo"
  | "onboarding_complete"
  | "interview_start"
  | "resume_download"
  | "feature_locked"
  | "practice_ai"
  | "practice_coding"
  | "practice_system_design";

type VariantCopy = {
  title: string;
  description: string;
  secondary: string;
  badge?: string;
};

const VARIANT_COPY: Record<TrialUpsellVariant, VariantCopy> = {
  dashboard_promo: {
    title: TRIAL_CTA,
    description: TRIAL_FEATURES_TAGLINE,
    secondary: "Maybe later",
    badge: "Full platform trial",
  },
  onboarding_complete: {
    title: TRIAL_CTA,
    description:
      "Unlock AI mock interviews, coding rounds, system design, ATS tools, and more — free for 14 days.",
    secondary: "Continue on Free plan",
    badge: "Welcome offer",
  },
  interview_start: {
    title: "Start your free trial to practice",
    description: TRIAL_FEATURES_TAGLINE,
    secondary: "Not now",
  },
  resume_download: {
    title: "Unlock with free trial",
    description:
      "Get the full 14-day experience — resume download, interviews, coding, system design & more.",
    secondary: "Continue editing",
  },
  feature_locked: {
    title: "Unlock with free trial",
    description: TRIAL_FEATURES_TAGLINE,
    secondary: "Maybe later",
  },
  practice_ai: {
    title: "Start your free trial to practice",
    description: TRIAL_FEATURES_TAGLINE,
    secondary: "Not now",
    badge: "All features unlocked",
  },
  practice_coding: {
    title: "Start your free trial to get going",
    description: TRIAL_FEATURES_TAGLINE,
    secondary: "Not now",
    badge: "All features unlocked",
  },
  practice_system_design: {
    title: "Start your free trial to get going",
    description: TRIAL_FEATURES_TAGLINE,
    secondary: "Not now",
    badge: "All features unlocked",
  },
};

type TrialUpsellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: TrialUpsellVariant;
  onDismiss?: () => void;
  onTrialStarted?: () => void;
  hasPurchasedTrial?: boolean;
};

function TrialStatPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7367F0]/15 bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-[#7367F0]" aria-hidden />
      {label}
    </span>
  );
}

export function TrialUpsellDialog({
  open,
  onOpenChange,
  variant = "dashboard_promo",
  onDismiss,
  onTrialStarted,
  hasPurchasedTrial = false,
}: TrialUpsellDialogProps) {
  const router = useRouter();
  const copy = VARIANT_COPY[variant];
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleDismiss = () => {
    onDismiss?.();
    onOpenChange(false);
  };

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/pricing");
  };

  const startTrial = async () => {
    setStarting(true);
    setStartError(null);
    try {
      await trialApi.startTrial();
      onTrialStarted?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to start trial. Please try again.";
      setStartError(message);
    } finally {
      setStarting(false);
    }
  };

  if (hasPurchasedTrial) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden border border-border/80 p-0 sm:max-w-md">
          <div className="bg-gradient-to-br from-muted/50 to-background px-6 pb-2 pt-8 text-center">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold">
                Trial already used
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Upgrade to General Pass, Tech Basic, or Tech Pro to keep full
                access.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex flex-col gap-2 px-6 py-6">
            <Button
              size="lg"
              className="w-full bg-[#7367F0] hover:bg-[#6358d8]"
              onClick={handleUpgrade}
            >
              View plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleDismiss}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[520px] md:max-w-[600px] lg:max-w-[640px]">
        <div className="relative overflow-hidden px-6 pb-5 pt-8 md:px-8">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#7367F0]/20 via-amber-400/10 to-violet-500/5"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#7367F0]/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl"
            aria-hidden
          />

          <div className="relative space-y-4">
            {copy.badge ? (
              <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {copy.badge}
              </span>
            ) : null}

            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-xl font-bold leading-tight tracking-tight sm:text-[1.35rem]">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                {copy.description}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <TrialStatPill icon={Zap} label={TRIAL_STAT_FREE} />
              <TrialStatPill icon={Coins} label={TRIAL_STAT_CREDITS} />
              <TrialStatPill icon={Calendar} label={TRIAL_STAT_DURATION} />
            </div>
          </div>
        </div>

        <div className="mx-6 mb-4 rounded-2xl border border-[#7367F0]/15 bg-[#7367F0]/[0.04] p-4 md:mx-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trial pass
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  Free
                </span>
                <span className="text-sm text-muted-foreground">
                  for {TRIAL_STAT_DURATION.replace(" full access", "")}
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Unlocks
              </p>
              <p className="text-sm font-bold text-foreground">Everything</p>
            </div>
          </div>
        </div>

        <div className="mx-6 mb-4 md:mx-8">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What&apos;s included
          </p>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-border/60 bg-muted/30 p-4 md:grid-cols-2 md:p-5">
            {TRIAL_UNLOCKED_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check
                    className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                    strokeWidth={3}
                    aria-hidden
                  />
                </span>
                <span className="font-medium text-foreground/90">
                  {feature}
                </span>
              </li>
            ))}
            <li className="col-span-1 flex items-center gap-3 border-t border-border/50 pt-2.5 text-sm md:col-span-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/15">
                <Plus
                  className="h-3 w-3 text-[#7367F0]"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
              <span className="text-muted-foreground">And many more…</span>
            </li>
          </ul>
        </div>

        <div
          className={cn(
            "flex flex-col gap-2 border-t border-border/50 bg-muted/20 px-6 py-5 md:px-8",
          )}
        >
          {startError ? (
            <p className="text-center text-sm text-destructive">{startError}</p>
          ) : null}
          <Button
            size="lg"
            className="h-12 w-full bg-[#7367F0] text-base font-semibold shadow-lg shadow-[#7367F0]/20 hover:bg-[#6358d8]"
            onClick={() => void startTrial()}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting trial…
              </>
            ) : (
              <>
                {TRIAL_CTA}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            disabled={starting}
          >
            {copy.secondary}
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            One-time per email · No auto-renew · Full platform for 14 days
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
