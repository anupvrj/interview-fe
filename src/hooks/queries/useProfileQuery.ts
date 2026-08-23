"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { userApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useProfileQuery(enabled = true) {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => userApi.getMyProfile(),
    enabled: enabled && Boolean(userId),
  });
}
