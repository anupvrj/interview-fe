"use client";

import { Check, Minus } from "lucide-react";
import type { ComparisonCell } from "@/lib/pricingPageContent";
import { usePlanComparison } from "@/hooks/usePlanComparison";
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

export function PricingComparisonTable() {
  const { rows, columns } = usePlanComparison();

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
