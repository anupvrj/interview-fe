"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  insightSearchParams,
  parseInsightInterviewType,
  parseInsightPeriod,
  type InsightInterviewType,
  type InsightPeriod,
} from "@/lib/super-admin-insights";

export function useInsightFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = parseInsightPeriod(searchParams.get("period"));
  const type = parseInsightInterviewType(searchParams.get("type"));
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const search = searchParams.get("search") || "";

  const setFilters = useCallback(
    (next: {
      period?: InsightPeriod;
      type?: InsightInterviewType;
      from?: string;
      to?: string;
      search?: string;
    }) => {
      const nextPeriod = next.period ?? period;
      const q = insightSearchParams({
        period: nextPeriod,
        from: next.from ?? from,
        to: next.to ?? to,
        type: next.type ?? type,
        search: next.search ?? search,
      });
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [from, pathname, period, router, search, to, type],
  );

  return { period, type, from, to, search, setFilters };
}
