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
 * Signed-in users wait for entitlements before showing anything — avoids
 * flashing the trial CTA for emails that already used the trial.
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
        if (data.canPurchaseTrial && !data.hasActiveTrial) {
          setState("show");
        } else {
          setState("hide");
        }
      })
      .catch(() => {
        if (!cancelled) setState("show");
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
