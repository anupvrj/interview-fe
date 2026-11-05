"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { entitlementApi } from "@/lib/api";

export type PricingTrialOfferState =
  | "auth_loading"
  | "checking"
  | "show"
  | "hide";

/**
 * Resolves whether the pricing-page trial banner should render.
 * Signed-in users wait for entitlements before showing anything. The banner
 * is only for the free plan, so an active Pro plan does not get a trial reminder.
 */
export function usePricingTrialOffer() {
  const { isLoaded, isSignedIn } = useUser();
  const [state, setState] = useState<PricingTrialOfferState>("auth_loading");

  useEffect(() => {
    if (!isLoaded) {
      setState("auth_loading");
      return;
    }

    if (!isSignedIn) {
      setState("show");
      return;
    }

    let cancelled = false;
    setState("checking");

    entitlementApi
      .getEntitlements()
      .then((data) => {
        if (cancelled) return;
        if (data.isFreeTier && data.canPurchaseTrial && !data.hasActiveTrial) {
          setState("show");
        } else {
          setState("hide");
        }
      })
      .catch(() => {
        if (!cancelled) setState("hide");
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return {
    state,
    showBanner: state === "show",
    isChecking: state === "checking",
    isAuthLoading: state === "auth_loading",
  };
}
