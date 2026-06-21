"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  paymentApi,
  type Subscription,
  type SubscriptionActivationState,
} from "@/lib/api";

const POLL_INTERVAL_MS = 15_000;
const FIRST_POLL_DELAY_MS = 5_000;
const MAX_POLL_DURATION_MS = 48 * 60 * 60 * 1000;

export function usePendingSubscriptionPolling(options?: {
  /** Skip toast notifications (e.g. when parent shows inline UI). */
  silent?: boolean;
}) {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const prevActivationRef = useRef<SubscriptionActivationState | null>(null);
  const pollStartedAtRef = useRef<number | null>(null);

  const activationState: SubscriptionActivationState =
    subscription?.activationState ??
    (subscription?.pendingPayment ? "pending" : "none");

  const refresh = useCallback(async () => {
    if (!user) return null;
    localStorage.setItem("clerk-user-id", user.id);
    const sub = await paymentApi.getSubscription();
    setSubscription(sub);
    return sub;
  }, [user]);

  const syncAndRefresh = useCallback(async () => {
    if (!user) return null;
    localStorage.setItem("clerk-user-id", user.id);
    const sub = await paymentApi.syncPendingSubscription();
    setSubscription(sub);
    return sub;
  }, [user]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let firstPollId: ReturnType<typeof setTimeout> | null = null;

    const runPoll = async () => {
      if (cancelled) return;

      if (
        pollStartedAtRef.current &&
        Date.now() - pollStartedAtRef.current > MAX_POLL_DURATION_MS
      ) {
        setPollTimedOut(true);
        setIsPolling(false);
        if (intervalId) clearInterval(intervalId);
        return;
      }

      try {
        await syncAndRefresh();
      } catch {
        try {
          await refresh();
        } catch {
          // ignore
        }
      }
    };

    refresh().then((sub) => {
      if (cancelled) return;
      const state =
        sub?.activationState ?? (sub?.pendingPayment ? "pending" : "none");
      prevActivationRef.current = state;

      if (state !== "pending") return;

      pollStartedAtRef.current = Date.now();
      setIsPolling(true);
      firstPollId = setTimeout(runPoll, FIRST_POLL_DELAY_MS);
      intervalId = setInterval(runPoll, POLL_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      if (firstPollId) clearTimeout(firstPollId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoaded, user, refresh, syncAndRefresh]);

  useEffect(() => {
    if (!subscription || options?.silent) return;

    const prev = prevActivationRef.current;
    const current = activationState;

    if (prev === "pending" && current === "active") {
      toast.success("Plan activated!", {
        description: "Your subscription is active and credits have been added.",
        duration: 6000,
      });
      setIsPolling(false);
    }

    if (prev === "pending" && current === "failed") {
      toast.error("Payment could not be completed", {
        description:
          "AutoPay was cancelled or the charge failed. Please try checkout again.",
        duration: 8000,
      });
      setIsPolling(false);
    }

    prevActivationRef.current = current;
  }, [activationState, subscription, options?.silent]);

  return {
    subscription,
    activationState,
    isPolling,
    pollTimedOut,
    refresh,
    syncAndRefresh,
  };
}
