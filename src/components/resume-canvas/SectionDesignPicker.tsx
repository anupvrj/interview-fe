"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIST_DESIGNS, type ListDesignId } from "@/lib/resume-section-designs";

/** A tiny drawing of each design, so people pick by look rather than by name. */
function Thumb({ design }: { design: ListDesignId | null }) {
  const bar = (w: string, key?: React.Key) => <span key={key} className="block h-1 rounded-full bg-current opacity-60" style={{ width: w }} />;
  const box = "flex h-9 w-14 shrink-0 flex-col justify-center gap-1 rounded-md border border-border bg-background px-1.5 text-foreground";
  if (design === null) {
    return (
      <span className={box}>
        <span className="block h-1 w-8 rounded-full bg-primary/70" />
        {bar("90%")}
        {bar("70%")}
      </span>
    );
  }
  if (design === "comma" || design === "dot") {
    return (
      <span className={box}>
        {[0, 1, 2].map((row) => (
          <span key={row} className="flex items-center gap-[3px]">
            {[0, 1, 2].map((i) => (
              <React.Fragment key={i}>
                {i > 0 ? <span className={cn("block bg-current opacity-60", design === "dot" ? "size-[3px] rounded-full" : "h-[3px] w-px")} /> : null}
                <span className="block h-1 flex-1 rounded-full bg-current opacity-60" />
              </React.Fragment>
            ))}
          </span>
        ))}
      </span>
    );
  }
  if (design === "tags") {
    return (
      <span className={cn(box, "flex-row flex-wrap content-center gap-[3px]")}>
        {["40%", "30%", "28%", "45%", "35%"].map((w, i) => (
          <span key={i} className="block h-2 rounded-[2px] border border-current opacity-60" style={{ width: w }} />
        ))}
      </span>
    );
  }
  const cols = design === "columns-3" ? 3 : 2;
  return (
    <span className={box}>
      {[0, 1, 2].map((row) => (
        <span key={row} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }, (_, i) => (
            <span key={i} className="flex items-center gap-[2px]">
              {design === "bullets" ? <span className="block size-[3px] shrink-0 rounded-full bg-current" /> : null}
              <span className="block h-1 flex-1 rounded-full bg-current opacity-60" />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function SectionDesignPicker({
  title,
  value,
  onPick,
  onClose,
}: {
  title: string;
  value: ListDesignId | null;
  onPick: (design: ListDesignId | null) => void;
  onClose: () => void;
}) {
  const options: { id: ListDesignId | null; label: string; hint: string }[] = [
    { id: null, label: "Template design", hint: "How this template shows it" },
    ...LIST_DESIGNS,
  ];
  return (
    <div role="dialog" aria-label={`${title} design`} className="w-72 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
      <div className="flex items-center justify-between px-2 pb-1 pt-0.5">
        <span className="text-xs font-semibold">{title} design</span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
          <X className="size-3.5" />
        </button>
      </div>
      <div role="radiogroup" aria-label={`${title} design`} className="flex flex-col">
        {options.map((o) => {
          const selected = o.id === value;
          return (
            <button
              key={o.id ?? "template"}
              type="button"
              role="radio"
              aria-checked={selected}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(o.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-muted",
                selected && "bg-primary/10",
              )}
            >
              <Thumb design={o.id} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-tight">{o.label}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">{o.hint}</span>
              </span>
              {selected ? <Check className="size-4 shrink-0 text-primary" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
