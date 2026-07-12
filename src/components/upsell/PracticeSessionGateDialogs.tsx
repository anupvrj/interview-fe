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
    title: "Upgrade to practice",
    description:
      "Coding rounds and system design sessions are included on Tech Basic and Tech Pro.",
  },
  general_pass: {
    title: "Upgrade to practice",
    description:
      "AI mock interviews and full practice features require General Pass or higher.",
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
        hasPurchasedTrial={entitlements?.trial.hasPurchased}
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
