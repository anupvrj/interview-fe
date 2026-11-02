"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { userApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

/** Last setup choices and saved job posts; shared by the AI interview, coding and system design setups. */
export function useInterviewSetupQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.interviewSetup(userId),
    queryFn: () => userApi.getInterviewSetup(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
