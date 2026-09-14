"use client";

import { Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AppliedCoupon } from "@/lib/api";

export function CheckoutCouponField({
  inputValue,
  onInputChange,
  onApply,
  onClear,
  applying,
  applied,
}: {
  inputValue: string;
  onInputChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  applying: boolean;
  applied: AppliedCoupon | null;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Discount code
      </p>
      {applied ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              {applied.code}
            </p>
            <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
              {applied.message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1 text-emerald-700/70 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300/70"
            aria-label="Remove coupon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            maxLength={6}
            placeholder="Enter code"
            className="uppercase"
            onChange={(e) => onInputChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onApply();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={applying || !inputValue.trim()}
            className={cn("shrink-0")}
            onClick={onApply}
          >
            {applying ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
