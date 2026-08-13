"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  readonly value?: number;
  readonly onChange: (value: number | undefined) => void;
  readonly disabled?: boolean;
  readonly size?: "sm" | "md";
}

export function StarRatingInput({
  value,
  onChange,
  disabled,
  size = "md",
}: StarRatingInputProps) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            className={cn(
              "rounded p-0.5 transition-colors",
              disabled ? "cursor-not-allowed opacity-50" : "hover:scale-105",
            )}
            onClick={() => onChange(value === n ? undefined : n)}
          >
            <Star
              className={cn(
                iconClass,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function StarRatingDisplay({
  value,
  size = "sm",
}: {
  readonly value?: number;
  readonly size?: "sm" | "md";
}) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5" title={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            iconClass,
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}
