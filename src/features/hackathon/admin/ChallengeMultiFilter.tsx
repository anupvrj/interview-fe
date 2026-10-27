"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hackathonAdminControlClass } from "./HackathonAdminField";

export type ChallengeFilterOption = {
  challengeId: string;
  label: string;
};

export function ChallengeMultiFilter({
  id,
  options,
  selectedIds,
  onChange,
}: Readonly<{
  id: string;
  options: ChallengeFilterOption[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
}>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = new Set(selectedIds);
  const count = selectedIds.length;
  const triggerLabel =
    count === 0
      ? "All challenges"
      : count === 1
        ? options.find((o) => o.challengeId === selectedIds[0])?.label ?? "1 challenge"
        : `${count} challenges`;

  const toggle = (challengeId: string) => {
    const next = new Set(selected);
    if (next.has(challengeId)) next.delete(challengeId);
    else next.add(challengeId);
    onChange([...next]);
  };

  return (
    <div ref={rootRef} className="relative w-full min-w-[200px] sm:w-56">
      <Button
        type="button"
        id={id}
        variant="outline"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(hackathonAdminControlClass, "w-full justify-between font-normal")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
      </Button>
      {open ? (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-50 mt-1 w-full min-w-[240px] rounded-md border border-border bg-popover p-2 shadow-md"
        >
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Show participants who have <span className="font-medium text-foreground">passed</span> every selected
            challenge.
          </p>
          {options.length === 0 ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">No challenges configured.</p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {options.map((opt) => {
                const checked = selected.has(opt.challengeId);
                return (
                  <li key={opt.challengeId}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/80">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border-input"
                        checked={checked}
                        onChange={() => toggle(opt.challengeId)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {count > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
            >
              Clear selection
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
