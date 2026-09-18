"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { resumeApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useResumesQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.resumes(userId),
    queryFn: () => resumeApi.list(userId),
    enabled: Boolean(userId),
  });
}
