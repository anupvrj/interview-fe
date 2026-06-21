"use client";

import { Check, X, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ATSCheckResult, ATSCheckStatus } from "@/types/atsReport";

function StatusIcon({ status }: { status: ATSCheckStatus }) {
  if (status === "pass")
    return <Check className="h-4 w-4 text-green-600 shrink-0" />;
  if (status === "fail")
    return <X className="h-4 w-4 text-red-600 shrink-0" />;
  if (status === "skipped")
    return <Lock className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
}

interface ATSCheckListItemProps {
  check: ATSCheckResult;
  selected: boolean;
  onSelect: () => void;
}

export function ATSCheckListItem({
  check,
  selected,
  onSelect,
}: ATSCheckListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors",
        selected ? "bg-primary/10 text-primary" : "hover:bg-muted/80",
      )}
    >
      <StatusIcon status={check.status} />
      <span className="flex-1 truncate">{check.label}</span>
      {check.status !== "skipped" && check.issueCount > 0 ? (
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          {check.issueCount} issue{check.issueCount !== 1 ? "s" : ""}
        </span>
      ) : check.status === "pass" ? (
        <span className="text-xs text-green-600">No issues</span>
      ) : null}
    </button>
  );
}
