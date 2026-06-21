"use client";

import { CheckPanelRouter } from "./panels/CheckPanelRouter";

interface ATSCheckDetailPanelProps {
  check: import("@/types/atsReport").ATSCheckResult | null;
  categoryLabel?: string;
  targetRole?: string;
}

export function ATSCheckDetailPanel({
  check,
  categoryLabel,
  targetRole,
}: ATSCheckDetailPanelProps) {
  if (!check) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
        Select a check from the sidebar to view details
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          {categoryLabel && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {categoryLabel}
            </p>
          )}
          <h3 className="text-xl font-bold text-foreground">{check.label}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {check.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">
            Score: {check.score}
          </span>
          {check.issueCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {check.issueCount} issue{check.issueCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <CheckPanelRouter
        check={check}
        targetRole={targetRole}
        categoryLabel={categoryLabel}
      />
    </div>
  );
}
