import type { ReactNode } from "react";
import { dashboardChartCardClass } from "@/lib/dashboard-chart-theme";
import { cn } from "@/lib/utils";

export function ChartPanel({
  title,
  description,
  children,
  className,
  headerAction,
}: Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}>) {
  return (
    <div className={cn("min-w-0 overflow-hidden", dashboardChartCardClass, className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0 pb-0">
          <p className="text-lg font-semibold text-foreground">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerAction ? (
          <div className="shrink-0">{headerAction}</div>
        ) : null}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}
