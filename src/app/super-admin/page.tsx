"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SuperAdminInsightsDashboard } from "@/components/super-admin/SuperAdminInsightsDashboard";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { adminApi } from "@/lib/api";
import { useInsightFilters } from "@/hooks/useInsightFilters";
import { type AdminInsights } from "@/lib/super-admin-insights";

export default function SuperAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuperAdminOverview />
    </Suspense>
  );
}

function SuperAdminOverview() {
  const { period, from, to, setFilters } = useInsightFilters();
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setInsightsLoading(true);
    adminApi
      .getInsights({
        period: period === "all" ? undefined : period,
        from: period === "custom" ? from || undefined : undefined,
        to: period === "custom" ? to || undefined : undefined,
      })
      .then((data) => {
        if (!cancelled) setInsights(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setInsights(null);
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, from, to]);

  return (
    <div className="space-y-5">
      <SuperAdminPageHeader />

      {insightsLoading && !insights ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : null}
      {!insightsLoading && !insights ? (
        <p className="rounded-xl border border-border/60 bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-card">
          Could not load platform insights.
        </p>
      ) : null}
      {insights ? (
        <SuperAdminInsightsDashboard
          insights={insights}
          period={period}
          from={from}
          to={to}
          onPeriodChange={(next) => setFilters({ period: next })}
          onRangeChange={(nextFrom, nextTo) =>
            setFilters({ period: "custom", from: nextFrom, to: nextTo })
          }
        />
      ) : null}
    </div>
  );
}
