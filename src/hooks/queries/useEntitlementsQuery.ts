"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { entitlementApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useEntitlementsQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.entitlements(userId),
    queryFn: () => entitlementApi.getEntitlements(),
    enabled: Boolean(userId),
  });
}
