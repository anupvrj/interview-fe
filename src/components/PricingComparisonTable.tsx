"use client";

import { useEffect, useState } from "react";
import { Check, Minus } from "lucide-react";
import {
  COMPARISON_ROWS,
  PLAN_COLUMN_LABELS,
  withLivePlanComparison,
  type ComparisonCell,
  type PaidPlanId,
} from "@/lib/pricingPageContent";
import { planApi } from "@/lib/api";
import type { PlanRecord } from "@/lib/planRecord";
import { cn } from "@/lib/utils";
import { appCard } from "@/lib/app-theme";

function CellValue({ value }: { value: ComparisonCell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-5 w-5 text-emerald-600" aria-label="Included" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-muted-foreground">
        <Minus className="h-5 w-5" aria-label="Not included" />
      </span>
    );
  }
  if (value === "—") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (value === "Coming soon") {
    return (
      <span className="coming-soon-tag inline-flex rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
        Coming soon
      </span>
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

type CompareColumn = {
  planId: string;
  label: string;
  popular: boolean;
};

function columnsFromPlans(plans: PlanRecord[]): CompareColumn[] {
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

export function PricingComparisonTable() {
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

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className={cn(appCard, "overflow-hidden shadow-header")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-4 text-sm font-semibold text-foreground sm:px-6">
                Platform feature
              </th>
              {columns.map((col) => (
                <th
                  key={col.planId}
                  className={cn(
                    "px-4 py-4 text-center text-sm font-semibold sm:px-6",
                    col.popular && "bg-primary/5 text-primary",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.feature}
                className={cn(
                  "border-b border-border/60 last:border-0",
                  idx % 2 === 1 && "bg-muted/20",
                )}
              >
                <td className="px-4 py-3.5 text-sm font-medium text-foreground sm:px-6">
                  {row.feature}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.planId}
                    className={cn(
                      "px-4 py-3.5 text-center sm:px-6",
                      col.popular && "bg-primary/[0.03]",
                    )}
                  >
                    <CellValue value={row[col.planId] ?? "—"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
