"use client";

import { TrialUpsellDialog } from "./TrialUpsellDialog";
import { UpgradeUpsellDialog } from "./UpgradeUpsellDialog";
import { SubscriptionExpiredDialog } from "@/components/SubscriptionExpiredDialog";
import type { usePracticeSessionGate } from "./usePracticeSessionGate";

type GateState = Pick<
  ReturnType<typeof usePracticeSessionGate>,
  | "trialOpen"
  | "setTrialOpen"
  | "upgradeOpen"
  | "setUpgradeOpen"
  | "dismissUpgrade"
  | "trialVariant"
  | "subscriptionExpiredOpen"
  | "setSubscriptionExpiredOpen"
  | "entitlements"
  | "upgradeTargetPlan"
>;

const UPGRADE_COPY: Record<
  "tech_basic" | "general_pass",
  { title: string; description: string }
> = {
  tech_basic: {
    title: "Unlock coding & system design",
    description:
      "Run interview-style coding rounds and whiteboard system design sessions with AI feedback, scores, and session history.",
  },
  general_pass: {
    title: "Unlock AI interview practice",
    description:
      "Practice company-aware AI mock interviews with scored reports, resume tools, and your full interview history.",
  },
};

export function PracticeSessionGateDialogs({
  trialOpen,
  setTrialOpen,
  upgradeOpen,
  setUpgradeOpen,
  dismissUpgrade,
  trialVariant,
  subscriptionExpiredOpen,
  setSubscriptionExpiredOpen,
  entitlements,
  upgradeTargetPlan,
}: GateState) {
  const upgradeCopy = UPGRADE_COPY[upgradeTargetPlan];

  return (
    <>
      <TrialUpsellDialog
        open={trialOpen}
        onOpenChange={setTrialOpen}
        variant={trialVariant}
        hasPurchasedTrial={
          entitlements ? !entitlements.canPurchaseTrial : false
        }
      />
      <UpgradeUpsellDialog
        open={upgradeOpen}
        onOpenChange={(open) => {
          setUpgradeOpen(open);
          if (!open) dismissUpgrade();
        }}
        title={upgradeCopy.title}
        description={upgradeCopy.description}
        targetPlan={upgradeTargetPlan}
        onDismiss={dismissUpgrade}
      />
      <SubscriptionExpiredDialog
        open={subscriptionExpiredOpen}
        onOpenChange={setSubscriptionExpiredOpen}
      />
    </>
  );
}
