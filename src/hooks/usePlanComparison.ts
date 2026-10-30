"use client";

import { useEffect, useState } from "react";
import {
  COMPARISON_ROWS,
  PLAN_COLUMN_LABELS,
  withLivePlanComparison,
  type PaidPlanId,
} from "@/lib/pricingPageContent";
import { planApi } from "@/lib/api";
import type { PlanRecord } from "@/lib/planRecord";

export type CompareColumn = {
  planId: string;
  label: string;
  popular: boolean;
};

export function columnsFromPlans(plans: PlanRecord[]): CompareColumn[] {
  return [...plans]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((plan) => ({
      planId: plan.planId,
      label:
        plan.displayName ||
        PLAN_COLUMN_LABELS[plan.planId as PaidPlanId] ||
        plan.name,
      popular: Boolean(plan.isPopular),
    }));
}

/** Feature-by-plan comparison built from the live plans. Columns stay empty until plans load. */
export function usePlanComparison() {
  const [rows, setRows] = useState(COMPARISON_ROWS);
  const [columns, setColumns] = useState<CompareColumn[]>([]);

  useEffect(() => {
    let cancelled = false;
    planApi
      .getAllPlans()
      .then((plans) => {
        if (cancelled) return;
        setColumns(columnsFromPlans(plans));
        setRows(withLivePlanComparison(plans));
      })
      .catch(() => {
        if (!cancelled) {
          setColumns([]);
          setRows(COMPARISON_ROWS);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, columns };
}
