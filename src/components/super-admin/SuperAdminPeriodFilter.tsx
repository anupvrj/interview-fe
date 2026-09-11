"use client";

import { FilterBar } from "@/components/app/FilterBar";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INTERVIEW_TYPE_OPTIONS,
  PERIOD_OPTIONS,
  type InsightInterviewType,
  type InsightPeriod,
} from "@/lib/super-admin-insights";

export function SuperAdminPeriodFilter({
  period,
  from,
  to,
  type,
  onPeriodChange,
  onRangeChange,
  onTypeChange,
  showType = false,
  embedded = false,
}: Readonly<{
  period: InsightPeriod;
  from: string;
  to: string;
  type?: InsightInterviewType;
  onPeriodChange: (period: InsightPeriod) => void;
  onRangeChange: (from: string, to: string) => void;
  onTypeChange?: (type: InsightInterviewType) => void;
  showType?: boolean;
  embedded?: boolean;
}>) {
  return (
    <FilterBar
      className={
        embedded
          ? "w-full border-0 bg-transparent p-0 shadow-none sm:w-auto sm:justify-end"
          : undefined
      }
    >
      {showType && onTypeChange ? (
        <AppSelect
          id="insight-interview-type"
          value={type ?? "all"}
          onChange={(value) => onTypeChange(value as InsightInterviewType)}
          options={INTERVIEW_TYPE_OPTIONS}
          className="h-11 w-full sm:w-[200px]"
        />
      ) : null}
      <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={period === option.value ? "default" : "outline"}
            size="sm"
            className="h-11 shrink-0"
            onClick={() => onPeriodChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 sm:w-[160px] sm:flex-none">
            <Label htmlFor="insight-from" className="sr-only">
              From
            </Label>
            <Input
              id="insight-from"
              type="date"
              value={from}
              onChange={(e) => onRangeChange(e.target.value, to)}
              className="h-11 w-full"
            />
          </div>
          <div className="min-w-0 flex-1 sm:w-[160px] sm:flex-none">
            <Label htmlFor="insight-to" className="sr-only">
              To
            </Label>
            <Input
              id="insight-to"
              type="date"
              value={to}
              onChange={(e) => onRangeChange(from, e.target.value)}
              className="h-11 w-full"
            />
          </div>
        </div>
      ) : null}
    </FilterBar>
  );
}
