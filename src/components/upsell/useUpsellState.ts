"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { planApi, type PlanEntitlements, type SubscriptionPlanSlug } from "@/lib/api";
import {
  FALLBACK_UPGRADE_TARGETS,
  pickUpgradePlan,
  type EntitlementFeature,
  type UpgradePlanSource,
} from "@/lib/planFeatureAccess";
import { PLAN_COLUMN_LABELS } from "@/lib/pricingPageContent";

const TRIAL_PROMO_DISMISSED_KEY = "trial_promo_dismissed_at";
const TRIAL_PROMO_SESSION_KEY = "trial_promo_shown_session";
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type UpsellFeature = keyof PlanEntitlements;

const UPGRADE_TARGETS: Partial<
  Record<UpsellFeature, { plan: SubscriptionPlanSlug; label: string }>
> = {
  codingRound: { plan: "tech_basic", label: "Tech Basic" },
  systemDesign: { plan: "tech_basic", label: "Tech Basic" },
  whiteboard: { plan: "tech_basic", label: "Tech Basic" },
  detailedInterviewReport: { plan: "general_pass", label: "General Pass" },
  ixScore: { plan: "general_pass", label: "General Pass" },
  behavioralMock: { plan: "general_pass", label: "General Pass" },
  growthTracking: { plan: "tech_pro", label: "Tech Pro" },
  oneClickResumeOptimizer: { plan: "general_pass", label: "General Pass" },
  aiMockInterview: { plan: "general_pass", label: "General Pass" },
};

const TRIAL_GATED: UpsellFeature[] = [
  "aiMockInterview",
  "oneClickResumeOptimizer",
];

export function useUpsellState() {
  const { data, loading, refresh, canUse } = useEntitlements();
  const [publicPlans, setPublicPlans] = useState<UpgradePlanSource[]>([]);

  useEffect(() => {
    let cancelled = false;
    planApi
      .getAllPlans()
      .then((plans) => {
        if (!cancelled) setPublicPlans(plans);
      })
      .catch(() => {
        if (!cancelled) setPublicPlans([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shouldShowTrialPromo = useCallback(() => {
    if (!data?.showTrialUpsell) return false;

    if (typeof window === "undefined") return false;

    if (sessionStorage.getItem(TRIAL_PROMO_SESSION_KEY) === "1") {
      return false;
    }

    const dismissedAt = localStorage.getItem(TRIAL_PROMO_DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (!Number.isNaN(elapsed) && elapsed < DISMISS_COOLDOWN_MS) {
        return false;
      }
    }

    return true;
  }, [data?.showTrialUpsell]);

  const markTrialPromoShown = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(TRIAL_PROMO_SESSION_KEY, "1");
  }, []);

  const dismissTrialPromo = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TRIAL_PROMO_DISMISSED_KEY, String(Date.now()));
    sessionStorage.setItem(TRIAL_PROMO_SESSION_KEY, "1");
  }, []);

  const needsTrial = useMemo(
    () => data?.isFreeTier && data.canPurchaseTrial,
    [data?.isFreeTier, data?.canPurchaseTrial],
  );

  const requireTrialOrPaid = useCallback(
    (feature: UpsellFeature): boolean => {
      if (!data) return true;
      if (canUse(feature)) return false;
      if (data.isFreeTier && TRIAL_GATED.includes(feature)) {
        return data.canPurchaseTrial;
      }
      return true;
    },
    [canUse, data],
  );

  const getUpgradeTarget = useCallback(
    (feature: UpsellFeature) => {
      if (!data) return null;
      if (
        data.isFreeTier &&
        TRIAL_GATED.includes(feature) &&
        data.canPurchaseTrial
      ) {
        return { plan: "trial" as SubscriptionPlanSlug, label: "Trial" };
      }
      const picked = pickUpgradePlan(publicPlans, feature as EntitlementFeature);
      if (picked) {
        return {
          plan: picked.planId as SubscriptionPlanSlug,
          label:
            picked.displayName ||
            PLAN_COLUMN_LABELS[
              picked.planId as keyof typeof PLAN_COLUMN_LABELS
            ] ||
            picked.name ||
            picked.planId,
        };
      }
      const fallbackId = FALLBACK_UPGRADE_TARGETS[feature as EntitlementFeature];
      return fallbackId
        ? UPGRADE_TARGETS[feature] ?? {
            plan: fallbackId as SubscriptionPlanSlug,
            label: fallbackId,
          }
        : UPGRADE_TARGETS[feature] ?? null;
    },
    [data, publicPlans],
  );

  return {
    data,
    loading,
    refresh,
    canUse,
    needsTrial,
    isFreeTier: data?.isFreeTier ?? false,
    showTrialUpsell: data?.showTrialUpsell ?? false,
    hasActiveTrial: data?.hasActiveTrial ?? false,
    shouldShowTrialPromo,
    markTrialPromoShown,
    dismissTrialPromo,
    requireTrialOrPaid,
    getUpgradeTarget,
  };
}
