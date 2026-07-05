"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function IxScoreFilterSlider({
  id = "talent-min-ix-score",
  value,
  onChange,
  label = "iX Score",
  className,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
}) {
  const setValue = (next: number) => onChange(Math.min(100, Math.max(0, next)));

  return (
    <div
      className={cn("flex min-w-[15rem] shrink-0 flex-col gap-1.5", className)}
    >
      <Label
        htmlFor={id}
        className="whitespace-nowrap text-xs font-medium text-muted-foreground"
      >
        {label}
      </Label>
      <div className="flex h-11 items-center gap-1.5 rounded-[0.625rem] border border-input bg-card px-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full border-border/70"
          onClick={() => setValue(value - 1)}
          disabled={value <= 0}
          aria-label="Decrease minimum iX Score"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span
          className={cn(
            "min-w-[2.5rem] shrink-0 rounded-md px-1 py-0.5 text-center text-sm font-bold tabular-nums",
            value === 0
              ? "text-muted-foreground"
              : value >= 70
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : value < 50
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-[#7367F0]/10 text-[#7367F0]",
          )}
        >
          {value === 0 ? "Any" : value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full border-border/70"
          onClick={() => setValue(value + 1)}
          disabled={value >= 100}
          aria-label="Increase minimum iX Score"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <div className="relative min-w-[5rem] flex-1 px-0.5">
          <Slider
            id={id}
            min={0}
            max={100}
            step={1}
            value={[value]}
            onValueChange={([next]) => setValue(next ?? 0)}
            variant="peer"
            className="py-1"
            aria-label={label}
          />
          <div className="pointer-events-none absolute inset-x-0.5 top-1/2 flex -translate-y-1/2 justify-between px-0.5">
            {[0, 25, 50, 75, 100].map((tick) => (
              <span
                key={tick}
                className={cn(
                  "h-1 w-px bg-border/80",
                  tick === 0 || tick === 100 ? "opacity-0" : "opacity-60",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
