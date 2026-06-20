"use client";

import { Check, Minus } from "lucide-react";
import {
  COMPARISON_ROWS,
  PLAN_COLUMN_LABELS,
  type ComparisonCell,
  type PaidPlanId,
} from "@/lib/pricingPageContent";
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

const COLUMNS: PaidPlanId[] = ["general_pass", "tech_basic", "tech_pro"];

export function PricingComparisonTable() {
  return (
    <div className={cn(appCard, "overflow-hidden shadow-header")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-4 text-sm font-semibold text-foreground sm:px-6">
                Platform feature
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className={cn(
                    "px-4 py-4 text-center text-sm font-semibold sm:px-6",
                    col === "tech_pro" && "bg-primary/5 text-primary",
                  )}
                >
                  {PLAN_COLUMN_LABELS[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, idx) => (
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
                {COLUMNS.map((col) => (
                  <td
                    key={col}
                    className={cn(
                      "px-4 py-3.5 text-center sm:px-6",
                      col === "tech_pro" && "bg-primary/[0.03]",
                    )}
                  >
                    <CellValue value={row[col]} />
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
