"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { codingInterviewApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useCodingInterviewsQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.codingInterviews(userId),
    queryFn: () => codingInterviewApi.listMine().catch(() => []),
    enabled: Boolean(userId),
  });
}
