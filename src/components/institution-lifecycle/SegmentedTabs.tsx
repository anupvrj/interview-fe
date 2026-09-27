"use client";

import { useId, type ComponentType } from "react";
import { cn } from "@/lib/utils";

export type SegmentedTab<T extends string> = {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

/** Pill tab bar matching the report tabs; scrolls horizontally on small screens. */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: Readonly<{
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}>) {
  const baseId = useId();
  return (
    <div className="rounded-xl border border-border/70 bg-card p-1 shadow-card">
      <div role="tablist" aria-label={ariaLabel} className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`${baseId}-${tab.value}`}
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors sm:flex-1",
                active
                  ? "bg-[#7367F0] text-white shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
