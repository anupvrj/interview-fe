"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { interviewScheduleApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useInterviewSchedulesQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.interviewSchedules(userId),
    queryFn: () => interviewScheduleApi.listMine().catch(() => [] as Awaited<ReturnType<typeof interviewScheduleApi.listMine>>),
    enabled: Boolean(userId),
  });
}
