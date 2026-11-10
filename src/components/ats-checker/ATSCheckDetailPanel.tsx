"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { isAdvisoryCheck } from "@/types/atsReport";
import { CheckPanelRouter } from "./panels/CheckPanelRouter";

interface ATSCheckDetailPanelProps {
  check: import("@/types/atsReport").ATSCheckResult | null;
  categoryLabel?: string;
  targetRole?: string;
  compact?: boolean;
  /** Where a locked check sends people (sign-up). */
  lockedHref?: string;
}

export function ATSCheckDetailPanel({
  check,
  categoryLabel,
  targetRole,
  compact = false,
  lockedHref,
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
          {isAdvisoryCheck(check) ? (
            <p className="mt-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Optional tip — doesn&apos;t affect your ATS score
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">
            Score: {check.score}
          </span>
          {check.issueCount > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {check.issueCount} {isAdvisoryCheck(check) ? "tip" : "issue"}
              {check.issueCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {check.locked ? (
        <LockedFindings count={check.issueCount} href={lockedHref} />
      ) : (
      <CheckPanelRouter
        check={check}
        targetRole={targetRole}
        categoryLabel={categoryLabel}
        compact={compact}
      />
      )}
    </div>
  );
}

/** Findings kept for after sign-up: their shape, blurred, and the way to see them. */
function LockedFindings({ count, href }: { count: number; href?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <div aria-hidden className="space-y-3 p-4 blur-[3px] select-none">
        {Array.from({ length: Math.min(count, 3) }, (_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
            <div className="h-3 w-2/3 rounded bg-foreground/15" />
            <div className="h-2 w-full rounded bg-foreground/10" />
            <div className="h-2 w-4/5 rounded bg-foreground/10" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/70 px-6 text-center backdrop-blur-[1px]">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Lock className="h-5 w-5" /></span>
        <p className="text-[15px] font-semibold text-foreground">
          {count} finding{count === 1 ? "" : "s"} here, with how to fix {count === 1 ? "it" : "them"}
        </p>
        {href && (
          <Link href={href} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[14px] font-semibold text-white hover:bg-primary/90">
            Sign up free to see {count === 1 ? "it" : "them"}
          </Link>
        )}
      </div>
    </div>
  );
}
