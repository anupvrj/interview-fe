"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { resumeApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useDefaultResumeQuery(enabled = true) {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.defaultResume(userId),
    queryFn: () => resumeApi.getDefault(userId),
    enabled: enabled && Boolean(userId),
  });
}
