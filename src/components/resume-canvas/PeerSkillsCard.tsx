"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inside the ATS panel: skills recruiters for this role usually look for that aren't on the
 * resume yet. Only the person knows which they have, so they tick them; nothing is added for them.
 */
export function PeerSkillsCard({
  skills,
  role,
  onAdd,
  onDismiss,
}: {
  skills: string[];
  role?: string;
  onAdd: (skills: string[]) => void;
  onDismiss: () => void;
}) {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const chosen = skills.filter((s) => picked[s]);
  if (!skills.length) return null;
  return (
    <div data-testid="peer-skills-card" className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">
          Skills recruiters{role ? ` for ${role}` : ""} look for
          <span className="mt-0.5 block text-[11.5px] font-normal text-muted-foreground">Tick the ones you really have — we&apos;ll add them to Skills.</span>
        </p>
        <button type="button" aria-label="Dismiss" title="Not for me" onClick={onDismiss} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" data-testid="peer-skills">
        {skills.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={!!picked[s]}
            onClick={() => setPicked((p) => ({ ...p, [s]: !p[s] }))}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[12px]",
              picked[s] ? "border-primary bg-primary text-white" : "border-border text-foreground hover:border-primary/60",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!chosen.length}
        onClick={() => onAdd(chosen)}
        className="mt-2.5 inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[12px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" /> {chosen.length ? `Add ${chosen.length} to Skills` : "Add the ones I ticked"}
      </button>
    </div>
  );
}
