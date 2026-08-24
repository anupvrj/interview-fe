"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { interviewApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useInterviewsQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.interviews(userId),
    queryFn: () => interviewApi.list(userId),
    enabled: Boolean(userId),
  });
}
