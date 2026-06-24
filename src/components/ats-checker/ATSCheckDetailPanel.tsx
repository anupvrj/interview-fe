"use client";

import { CheckPanelRouter } from "./panels/CheckPanelRouter";

interface ATSCheckDetailPanelProps {
  check: import("@/types/atsReport").ATSCheckResult | null;
  categoryLabel?: string;
  targetRole?: string;
  compact?: boolean;
}

export function ATSCheckDetailPanel({
  check,
  categoryLabel,
  targetRole,
  compact = false,
}: ATSCheckDetailPanelProps) {
  if (!check) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
        Select a check from the sidebar to view details
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {categoryLabel && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {categoryLabel}
            </p>
          )}
          <h3 className="break-words text-lg font-bold text-foreground sm:text-xl">
            {check.label}
          </h3>
          <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
            {check.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">
            Score: {check.score}
          </span>
          {check.issueCount > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {check.issueCount} issue{check.issueCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <CheckPanelRouter
        check={check}
        targetRole={targetRole}
        categoryLabel={categoryLabel}
        compact={compact}
      />
    </div>
  );
}
