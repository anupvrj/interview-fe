"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Code2,
  Coins,
  Crown,
  LayoutGrid,
  Mic,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SubscriptionPlanSlug } from "@/lib/api";
import { PLAN_COLUMN_LABELS, type PaidPlanId } from "@/lib/pricingPageContent";

type UpgradePlanSlug = Extract<
  SubscriptionPlanSlug,
  "general_pass" | "tech_basic" | "tech_pro"
>;

type PlanUpgradeContent = {
  badge: string;
  defaultTitle: string;
  defaultDescription: string;
  price: string;
  credits: string;
  audience: string;
  highlight: string;
  features: string[];
};

const PLAN_UPGRADE_CONTENT: Record<UpgradePlanSlug, PlanUpgradeContent> = {
  general_pass: {
    badge: "Practice access",
    defaultTitle: "Upgrade to practice",
    defaultDescription:
      "AI mock interviews and full practice features require General Pass or higher.",
    price: "₹699/mo",
    credits: "600 credits / month",
    audience: "Plan for everyone",
    highlight: "Full AI interview practice",
    features: [
      "AI mock interviews",
      "Behavioral interview practice",
      "Resume design & PDF download",
      "ATS checker & optimizer",
      "iX Report & certified badge",
      "Target company practice",
    ],
  },
  tech_basic: {
    badge: "Tech practice",
    defaultTitle: "Upgrade to practice",
    defaultDescription:
      "Coding rounds and system design sessions are included on Tech Basic and Tech Pro.",
    price: "₹899/mo",
    credits: "1,000 credits / month",
    audience: "Jr & mid developers",
    highlight: "Coding + system design unlocked",
    features: [
      "Coding round practice",
      "System design sessions",
      "AI mock interviews",
      "Whiteboard drawing",
      "ATS tools & resume builder",
      "iX Report & detailed feedback",
    ],
  },
  tech_pro: {
    badge: "Pro practice",
    defaultTitle: "Upgrade to practice",
    defaultDescription:
      "Get the full technical stack — coding, system design, growth tracking, and peer interviews.",
    price: "₹1,999/mo",
    credits: "3,000 credits / month",
    audience: "Sr engineers & tech leads",
    highlight: "Everything in Tech Basic, plus more",
    features: [
      "Coding round practice",
      "System design sessions",
      "Growth tracking & analytics",
      "2 free peer interviews / period",
      "30-minute AI sessions",
      "Priority support",
    ],
  },
};

type UpgradeUpsellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  targetPlan: SubscriptionPlanSlug;
  preview?: React.ReactNode;
  onDismiss?: () => void;
};

function UpgradeStatPill({
  icon: Icon,
  label,
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}>) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7367F0]/15 bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-[#7367F0]" aria-hidden />
      {label}
    </span>
  );
}

function resolvePlanContent(
  targetPlan: SubscriptionPlanSlug,
): PlanUpgradeContent {
  if (targetPlan in PLAN_UPGRADE_CONTENT) {
    return PLAN_UPGRADE_CONTENT[targetPlan as UpgradePlanSlug];
  }
  return PLAN_UPGRADE_CONTENT.general_pass;
}

export function UpgradeUpsellDialog({
  open,
  onOpenChange,
  title,
  description,
  targetPlan,
  preview,
  onDismiss,
}: UpgradeUpsellDialogProps) {
  const router = useRouter();
  const content = resolvePlanContent(targetPlan);
  const planLabel =
    (targetPlan in PLAN_COLUMN_LABELS
      ? PLAN_COLUMN_LABELS[targetPlan as PaidPlanId]
      : null) ?? "Upgrade";
  const dialogTitle = title ?? content.defaultTitle;
  const dialogDescription = description ?? content.defaultDescription;

  const handleUpgrade = () => {
    onOpenChange(false);
    if (
      targetPlan === "general_pass" ||
      targetPlan === "tech_basic" ||
      targetPlan === "tech_pro"
    ) {
      router.push(`/checkout?plan=${targetPlan}`);
    } else {
      router.push("/pricing");
    }
  };

  const handleDismiss = () => {
    onDismiss?.();
    onOpenChange(false);
  };

  const showTechIcons = targetPlan === "tech_basic" || targetPlan === "tech_pro";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[520px] md:max-w-[600px] lg:max-w-[640px]">
        {preview ? (
          <div className="relative max-h-28 overflow-hidden border-b border-border/40">
            <div className="pointer-events-none select-none opacity-35 blur-[3px]">
              {preview}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
          </div>
        ) : null}

        <div className="relative overflow-hidden px-6 pb-5 pt-8 md:px-8">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#7367F0]/20 via-violet-500/10 to-cyan-400/5"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#7367F0]/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-violet-400/15 blur-2xl"
            aria-hidden
          />

          <div className="relative space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7367F0]/25 bg-[#7367F0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7367F0]">
              <Sparkles className="h-3 w-3" aria-hidden />
              {content.badge}
            </span>

            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-xl font-bold leading-tight tracking-tight sm:text-[1.35rem]">
                {dialogTitle}
              </DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                {dialogDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <UpgradeStatPill icon={Crown} label={planLabel} />
              <UpgradeStatPill icon={Coins} label={content.credits} />
              {showTechIcons ? (
                <>
                  <UpgradeStatPill icon={Code2} label="Coding rounds" />
                  <UpgradeStatPill icon={LayoutGrid} label="System design" />
                </>
              ) : (
                <UpgradeStatPill icon={Mic} label="AI interviews" />
              )}
            </div>
          </div>
        </div>

        <div className="mx-6 mb-4 rounded-2xl border border-[#7367F0]/15 bg-[#7367F0]/[0.04] p-4 md:mx-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {planLabel}
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {content.price.replace("/mo", "")}
                </span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {content.audience}
              </p>
            </div>
            <div className="rounded-xl bg-[#7367F0]/10 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7367F0]">
                Unlocks
              </p>
              <p className="text-sm font-bold text-foreground">
                {content.highlight}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-6 mb-4 md:mx-8">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What&apos;s included
          </p>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-border/60 bg-muted/30 p-4 md:grid-cols-2 md:p-5">
            {content.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check
                    className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                    strokeWidth={3}
                    aria-hidden
                  />
                </span>
                <span className="font-medium text-foreground/90">{feature}</span>
              </li>
            ))}
            <li className="col-span-1 flex items-center gap-3 border-t border-border/50 pt-2.5 text-sm md:col-span-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/15">
                <Zap
                  className="h-3 w-3 text-[#7367F0]"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
              <span className="text-muted-foreground">
                Billed at 5 credits per minute · Cancel anytime
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/50 bg-muted/20 px-6 py-5 md:px-8">
          <Button
            size="lg"
            className="h-12 w-full bg-[#7367F0] text-base font-semibold shadow-lg shadow-[#7367F0]/20 hover:bg-[#6358d8]"
            onClick={handleUpgrade}
          >
            Upgrade to {planLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            Maybe later
          </Button>
          <Button
            variant="link"
            size="sm"
            className="h-auto py-1 text-muted-foreground hover:text-[#7367F0]"
            onClick={() => {
              onOpenChange(false);
              router.push("/pricing");
            }}
          >
            Compare all plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
