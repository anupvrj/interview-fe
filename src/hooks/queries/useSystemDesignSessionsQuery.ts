"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { systemDesignApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useSystemDesignSessionsQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.systemDesignSessions(userId),
    queryFn: () => systemDesignApi.listMySessions().catch(() => []),
    enabled: Boolean(userId),
  });
}
