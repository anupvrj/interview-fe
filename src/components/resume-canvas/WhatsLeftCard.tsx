"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, ListChecks, Plus, Scissors, Sparkles, X } from "lucide-react";
import type { WhatsLeftItem } from "@/lib/aiBuildMetaApply";
import { SLOT_RE } from "@/lib/aiBuildMetaApply";
import { cn } from "@/lib/utils";

/**
 * "What's left for you": after the AI build, only what the user alone knows — their contact
 * details, the real numbers for achievement lines, skills to confirm, suggested lines to adopt,
 * and optional cuts if the resume runs long. Each item is one click.
 */
export function WhatsLeftCard({
  items,
  compact = false,
  onFillSlot,
  onConfirmSkill,
  onAddSuggestion,
  onRemoveLine,
  onEditContact,
  onDismiss,
}: {
  items: WhatsLeftItem[];
  compact?: boolean;
  onFillSlot: (item: WhatsLeftItem & { kind: "slot" }, value: string) => void;
  onConfirmSkill: (skill: string, key: string) => void;
  onAddSuggestion: (item: WhatsLeftItem & { kind: "suggestion" }) => void;
  onRemoveLine: (item: WhatsLeftItem & { kind: "length" }) => void;
  onEditContact: (field: string) => void;
  onDismiss: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  if (!items.length) return null;

  const row = "flex flex-col gap-2 rounded-lg border border-border bg-background/70 p-2.5 sm:flex-row sm:items-center";
  const btn = "inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] font-semibold transition-colors";

  return (
    <div data-testid="whats-left" className={cn("border-b border-border bg-primary/[0.04]", compact ? "px-3 py-2" : "px-4 py-2.5")}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
        <ListChecks className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-[13.5px] font-semibold text-foreground">What&apos;s left for you</span>
        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">{items.length}</span>
        <span className="hidden text-[12.5px] text-muted-foreground sm:inline">Only what you know — the AI did the rest.</span>
        {open ? <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" /> : <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />}
      </button>
      {open ? (
        <ul className="mt-2.5 grid max-h-[38vh] gap-2 overflow-y-auto pb-1 lg:grid-cols-2">
          {items.map((it) => (
            <li key={it.key} className={row}>
              {it.kind === "contact" ? (
                <>
                  <p className="min-w-0 flex-1 text-[13px] text-foreground">{it.label}</p>
                  <button type="button" className={cn(btn, "bg-primary text-white hover:bg-primary/90")} onClick={() => onEditContact(it.field)}>
                    Add
                  </button>
                </>
              ) : it.kind === "slot" ? (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Add your real number</p>
                    <p className="line-clamp-2 text-[13px] text-foreground">
                      {it.text.split(SLOT_RE)[0]}
                      <mark className="rounded bg-amber-200/70 px-1 font-semibold text-amber-900 dark:bg-amber-500/30 dark:text-amber-100">{it.text.match(SLOT_RE)?.[0]}</mark>
                      {it.text.split(SLOT_RE)[1]}
                    </p>
                  </div>
                  <form
                    className="flex shrink-0 items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = values[it.key]?.trim();
                      if (v) onFillSlot(it, v);
                    }}
                  >
                    <input
                      aria-label="Your number"
                      placeholder={/%/.test(it.text.match(SLOT_RE)?.[0] ?? "") ? "e.g. 30%" : "e.g. 12"}
                      value={values[it.key] ?? ""}
                      onChange={(e) => setValues((s) => ({ ...s, [it.key]: e.target.value }))}
                      className="h-7 w-24 rounded-md border border-border bg-background px-2 text-[12.5px] text-foreground"
                    />
                    <button type="submit" className={cn(btn, "bg-primary text-white hover:bg-primary/90")}>
                      <Check className="h-3.5 w-3.5" /> Fill
                    </button>
                  </form>
                </>
              ) : it.kind === "skill" ? (
                <>
                  <p className="min-w-0 flex-1 text-[13px] text-foreground">
                    The job asks for <b className="font-semibold">{it.skill}</b>. Do you have it?
                  </p>
                  <button type="button" className={cn(btn, "bg-primary text-white hover:bg-primary/90")} onClick={() => onConfirmSkill(it.skill, it.key)}>
                    <Plus className="h-3.5 w-3.5" /> Yes, add
                  </button>
                </>
              ) : it.kind === "suggestion" ? (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" /> Suggested for {it.role.split(" (")[0]}
                    </p>
                    <p className="text-[13px] text-foreground">{it.text}</p>
                  </div>
                  <button type="button" className={cn(btn, "bg-primary text-white hover:bg-primary/90")} onClick={() => onAddSuggestion(it)}>
                    <Plus className="h-3.5 w-3.5" /> Add if true
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Over the page budget — could move out</p>
                    <p className="line-clamp-2 text-[13px] text-foreground">{it.text}</p>
                  </div>
                  <button type="button" className={cn(btn, "border border-border text-foreground hover:bg-muted")} onClick={() => onRemoveLine(it)}>
                    <Scissors className="h-3.5 w-3.5" /> Remove
                  </button>
                </>
              )}
              <button type="button" aria-label="Dismiss" title="Dismiss" className={cn(btn, "text-muted-foreground hover:bg-muted hover:text-foreground")} onClick={() => onDismiss(it.key)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
