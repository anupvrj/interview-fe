"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { planApi, userApi } from "@/lib/api";
import type { PlanRecord } from "@/lib/planRecord";
import { buildDisplayRows } from "@/lib/pricingPlanRows";

/** Plans from the backend plus the choose-a-plan flow (sign-in → onboarding → checkout, or contact sales). */
export function usePricingPlans() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [contactSalesOpen, setContactSalesOpen] = useState(false);
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError(null);
        setLoading(true);
        const list = await planApi.getAllPlans();
        if (cancelled) return;
        const sorted = [...list].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        setPlans(sorted);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Could not load plans. Try again.",
          );
          setPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = buildDisplayRows(plans);

  const handleChoosePlan = async (planId: string) => {
    if (!isLoaded) return;

    if (planId === "enterprise") {
      setContactSalesOpen(true);
      return;
    }

    setLoadingPlanId(planId);

    try {
      if (planId === "free") {
        if (!user) {
          localStorage.setItem("pendingPlan", "free");
          router.push(`/sign-in?redirect=/onboarding`);
          return;
        }
        try {
          const profile = await userApi.getMyProfile();
          if (!profile.onboardingCompleted) {
            localStorage.setItem("pendingPlan", "free");
            router.push("/onboarding");
            return;
          }
          router.push("/dashboard");
        } catch {
          localStorage.setItem("pendingPlan", "free");
          router.push("/onboarding");
        }
        return;
      }

      if (!user) {
        localStorage.setItem("pendingPlan", planId);
        router.push(`/sign-in?redirect=/onboarding`);
        return;
      }

      try {
        const profile = await userApi.getMyProfile();

        if (!profile.onboardingCompleted) {
          localStorage.setItem("pendingPlan", planId);
          router.push("/onboarding");
          return;
        }

        router.push(`/checkout?plan=${planId}&cycle=monthly`);
      } catch {
        localStorage.setItem("pendingPlan", planId);
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error in handleChoosePlan:", error);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return {
    plans,
    rows,
    loading,
    loadError,
    loadingPlanId,
    isLoaded,
    contactSalesOpen,
    setContactSalesOpen,
    handleChoosePlan,
  };
}
