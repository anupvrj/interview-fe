"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscriptionExpiredGate } from "@/hooks/useSubscriptionExpiredGate";
import { useUpsellState } from "./useUpsellState";
import type { TrialUpsellVariant } from "./TrialUpsellDialog";
import type { PlanEntitlements } from "@/lib/api";

export type PracticeSessionType = "ai" | "coding" | "system_design";

const FEATURE_BY_TYPE: Record<
  PracticeSessionType,
  keyof PlanEntitlements
> = {
  ai: "aiMockInterview",
  coding: "codingRound",
  system_design: "systemDesign",
};

const TRIAL_VARIANT_BY_TYPE: Record<PracticeSessionType, TrialUpsellVariant> = {
  ai: "practice_ai",
  coding: "practice_coding",
  system_design: "practice_system_design",
};

type PendingAction = {
  path?: string;
  onProceed?: () => void;
};

export function usePracticeSessionGate() {
  const router = useRouter();
  const { canUse, showTrialUpsell, data, loading: entitlementsLoading } =
    useUpsellState();
  const {
    open: subscriptionExpiredOpen,
    setOpen: setSubscriptionExpiredOpen,
    checking: checkingSubscription,
    guardSessionStart,
  } = useSubscriptionExpiredGate();

  const [trialOpen, setTrialOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [trialVariant, setTrialVariant] =
    useState<TrialUpsellVariant>("practice_ai");
  const [blockedType, setBlockedType] = useState<PracticeSessionType>("ai");
  const [pending, setPending] = useState<PendingAction | null>(null);

  const startPracticeSession = useCallback(
    (
      type: PracticeSessionType,
      options?: { path?: string; onProceed?: () => void },
    ) => {
      const feature = FEATURE_BY_TYPE[type];

      if (showTrialUpsell) {
        setBlockedType(type);
        setTrialVariant(TRIAL_VARIANT_BY_TYPE[type]);
        setPending(options ?? null);
        setTrialOpen(true);
        return;
      }

      if (!canUse(feature)) {
        setBlockedType(type);
        setPending(options ?? null);
        setUpgradeOpen(true);
        return;
      }

      void guardSessionStart(() => {
        if (options?.onProceed) {
          options.onProceed();
        } else if (options?.path) {
          router.push(options.path);
        }
      });
    },
    [canUse, guardSessionStart, router, showTrialUpsell],
  );

  const dismissUpgrade = useCallback(() => {
    setUpgradeOpen(false);
    setPending(null);
  }, []);

  return {
    startPracticeSession,
    trialOpen,
    setTrialOpen,
    upgradeOpen,
    setUpgradeOpen,
    dismissUpgrade,
    trialVariant,
    subscriptionExpiredOpen,
    setSubscriptionExpiredOpen,
    checkingSubscription,
    entitlements: data,
    entitlementsLoading,
    canUse,
    showTrialUpsell,
    blockedType,
    upgradeTargetPlan:
      blockedType === "coding" || blockedType === "system_design"
        ? ("tech_basic" as const)
        : ("general_pass" as const),
  };
}
