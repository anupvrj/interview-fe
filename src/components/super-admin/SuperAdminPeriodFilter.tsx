"use client";

import type { ReactNode } from "react";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appFilterBar } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
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
  className,
  leading,
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
  className?: string;
  leading?: ReactNode;
}>) {
  return (
    <div
      className={cn(
        !embedded && !className && appFilterBar,
        "flex w-full min-w-0 flex-col gap-3",
        "lg:flex-row lg:flex-nowrap lg:items-center",
        embedded &&
          "border-0 bg-transparent p-0 shadow-none sm:w-auto sm:justify-end",
        className,
      )}
    >
      {leading ? (
        <div className="w-full min-w-0 lg:max-w-[220px] lg:shrink-0 xl:max-w-[280px]">
          {leading}
        </div>
      ) : null}
      {showType && onTypeChange ? (
        <AppSelect
          id="insight-interview-type"
          value={type ?? "all"}
          onChange={(value) => onTypeChange(value as InsightInterviewType)}
          options={INTERVIEW_TYPE_OPTIONS}
          className="h-11 w-full shrink-0 lg:w-[150px] xl:w-[180px]"
        />
      ) : null}
      <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]">
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={period === option.value ? "default" : "outline"}
            size="sm"
            className="h-11 shrink-0 px-3"
            onClick={() => onPeriodChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:shrink-0">
          <div className="min-w-0 flex-1 lg:w-[150px] lg:flex-none">
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
          <div className="min-w-0 flex-1 lg:w-[150px] lg:flex-none">
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
    </div>
  );
}
