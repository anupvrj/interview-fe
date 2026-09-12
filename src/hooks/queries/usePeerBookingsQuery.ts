"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { peerApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function usePeerBookingsQuery() {
  const { user } = useUser();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.peerBookings(userId),
    queryFn: () => peerApi.listMyBookings().catch(() => []),
    enabled: Boolean(userId),
  });
}
