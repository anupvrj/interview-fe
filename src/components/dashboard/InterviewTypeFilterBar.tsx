"use client";

import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import {
  dashboardSessionKindLabel,
  type DashboardSessionFilter,
} from "@/lib/dashboard-recent-sessions";

type InterviewTypeFilterBarProps = {
  id?: string;
  value: DashboardSessionFilter;
  onChange: (value: DashboardSessionFilter) => void;
  counts?: Record<DashboardSessionFilter, number>;
  showCounts?: boolean;
  className?: string;
};

const OPTIONS: DashboardSessionFilter[] = [
  "all",
  "screening",
  "coding",
  "systemDesign",
  "peer",
];

export function InterviewTypeFilterBar({
  id,
  value,
  onChange,
  counts,
  showCounts = true,
  className,
}: InterviewTypeFilterBarProps) {
  const formatLabel = (opt: DashboardSessionFilter) => {
    const base =
      opt === "all" ? "All types" : dashboardSessionKindLabel(opt);
    if (!showCounts || !counts) return base;
    return `${base} (${counts[opt]})`;
  };

  return (
    <AppSelect
      id={id}
      value={value}
      onChange={(next) => onChange(next as DashboardSessionFilter)}
      className={cn("h-9 w-[200px] sm:h-10 sm:w-[220px]", className)}
      placeholder="Filter by type"
      options={OPTIONS.map((opt) => ({
        value: opt,
        label: formatLabel(opt),
      }))}
    />
  );
}
