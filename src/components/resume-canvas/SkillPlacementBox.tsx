"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MapPin, Plus, RefreshCw } from "lucide-react";
import { resumeApi, type SkillPlacement, type SkillPlacementEntry } from "@/lib/api";
import type { SuggestionAt } from "@/lib/suggestionApply";
import { cn } from "@/lib/utils";

export type SkillPlacementApi = {
  /** The person's jobs and projects as they are on the page now. */
  entries: () => SkillPlacementEntry[];
  /** Everything the resume says (lower-cased), so proposals can't bring in new names. */
  vocabulary: () => string;
  targetRole?: string;
  /** Reword one existing line in place (flashes green). */
  rewrite: (p: NonNullable<SkillPlacement["place"]>) => SuggestionAt | null;
  /** Add a line under an entry (flashes green). */
  add: (p: NonNullable<SkillPlacement["place"]>) => SuggestionAt | null;
  onUndo?: () => void;
};

/** "orphan skills" text from the finding → the skill names. */
export function orphanSkillsFrom(excerpt: string): string[] {
  return [...new Set(excerpt.replace(/^["“]|["”]$/g, "").split(/\s*[,;|•]\s*|\s+and\s+/).map((s) => s.trim()).filter((s) => s && s.length <= 60))];
}

/**
 * Orphan skills, handled as additions (not replacements): for each skill the AI finds the line or
 * job where it honestly belongs, the card says exactly where, and one click puts it there.
 */
export function SkillPlacementBox({ skills, api }: { skills: string[]; api: SkillPlacementApi }) {
  const [state, setState] = useState<{ loading: boolean; placements: SkillPlacement[]; error?: string }>({ loading: false, placements: [] });
  const [done, setDone] = useState<Record<string, boolean>>({});

  const run = async () => {
    setState({ loading: true, placements: [] });
    try {
      const placements = await resumeApi.aiSkillPlacement({ skills, entries: api.entries(), targetRole: api.targetRole, vocabulary: api.vocabulary() });
      setState({ loading: false, placements });
    } catch {
      setState({ loading: false, placements: [], error: "Couldn't work out where these fit right now. Try again." });
    }
  };
  useEffect(() => {
    void run();
    // Once per card: the skills are fixed for this finding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills.join("|")]);

  const placed = state.placements.filter((p) => p.relevant && p.place);
  const noPlace = state.placements.filter((p) => p.relevant && !p.place);
  const notNeeded = state.placements.filter((p) => !p.relevant);

  return (
    <div data-testid="skill-placement" className="mt-2.5 space-y-2" onClick={(e) => e.stopPropagation()}>
      {state.loading ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding where each skill fits in your work…
        </p>
      ) : null}
      {state.error ? (
        <p className="text-xs text-muted-foreground">
          {state.error}{" "}
          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => void run()}>
            Retry
          </button>
        </p>
      ) : null}

      {placed.map((p) => {
        const place = p.place!;
        const isDone = done[p.skill];
        return (
          <div key={p.skill} className={cn("rounded-lg border p-2.5 text-xs", isDone ? "border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-border bg-background")}>
            <p className="flex items-center gap-1 font-semibold text-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              {p.skill}
              <span className="font-normal text-muted-foreground">
                {" "}
                → {place.mode === "rewrite" ? "mention in a line at" : "add a line to"} {place.entryTitle}
              </span>
            </p>
            {place.mode === "rewrite" && place.original ? (
              <p className="mt-1 text-muted-foreground line-through decoration-muted-foreground/40">{place.original}</p>
            ) : null}
            <p className="mt-1 text-foreground">{place.text}</p>
            {place.fit === "likely" ? (
              <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Most likely here — add only if you used {p.skill} in this job.</p>
            ) : p.why ? (
              <p className="mt-1 text-[11px] text-muted-foreground">{p.why}</p>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              {isDone ? (
                <>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" /> Added — check it on the page
                  </span>
                  {api.onUndo ? (
                    <button
                      type="button"
                      className="font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        api.onUndo?.();
                        setDone((d) => ({ ...d, [p.skill]: false }));
                      }}
                    >
                      Undo
                    </button>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 font-semibold text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    const at = place.mode === "rewrite" ? api.rewrite(place) : api.add(place);
                    if (at) setDone((d) => ({ ...d, [p.skill]: true }));
                  }}
                >
                  {place.mode === "rewrite" ? <RefreshCw className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {place.mode === "rewrite" ? "Update this line" : "Add here if true"}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {noPlace.length ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">No clear place yet for {noPlace.map((p) => p.skill).join(", ")}.</span> If you used{" "}
          {noPlace.length > 1 ? "them" : "it"} in a job, add a line there saying what you did with {noPlace.length > 1 ? "each" : "it"} — or ask the AI Coach on
          that job&apos;s bullet.
        </p>
      ) : null}
      {notNeeded.length ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Fine to keep only in Skills (no proof needed for this role): {notNeeded.map((p) => p.skill).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
