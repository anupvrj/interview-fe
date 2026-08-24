"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import type { ResolvedEntitlements } from "@/lib/api";
import { invalidateEntitlements } from "@/lib/invalidate-queries";
import { useEntitlementsQuery } from "@/hooks/queries/useEntitlementsQuery";

export function useEntitlements() {
  const { user } = useUser();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useEntitlementsQuery();

  const refresh = useCallback(async () => {
    if (userId) {
      await invalidateEntitlements(queryClient, userId);
      return;
    }
    await refetch();
  }, [queryClient, userId, refetch]);

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
    data: data ?? null,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to load entitlements"
      : null,
    refresh,
    canUse,
    needsTrial,
    isFreeTier,
  };
}
