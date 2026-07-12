"use client";

import { useCallback, useEffect, useState } from "react";
import { entitlementApi, type ResolvedEntitlements } from "@/lib/api";

export function useEntitlements() {
  const [data, setData] = useState<ResolvedEntitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const entitlements = await entitlementApi.getEntitlements();
      setData(entitlements);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load entitlements",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const canUse = useCallback(
    (feature: keyof ResolvedEntitlements["entitlements"]) => {
      if (!data) return false;
      const value = data.entitlements[feature];
      if (typeof value === "number") return value > 0;
      return Boolean(value);
    },
    [data],
  );

  const needsTrial =
    data?.isFreeTier === true && data.canPurchaseTrial === true;

  const isFreeTier = data?.isFreeTier ?? false;

  return {
    data,
    loading,
    error,
    refresh,
    canUse,
    needsTrial,
    isFreeTier,
  };
}
