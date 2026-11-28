"use client";

import { useEffect, useRef, useState } from "react";
import { Check, EyeOff, Loader2, MapPin, Plus, RefreshCw } from "lucide-react";
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
  /** This resume: placements already worked out are kept (also across reloads) instead of asked again. */
  cacheKey?: string;
  /** "Not relevant": set this skill aside on the resume, so no check lists it again. */
  ignoreSkill?: (skill: string) => Promise<void>;
};

/** Placements already worked out, per resume and skill (memory + this browser). */
const memory = new Map<string, Record<string, SkillPlacement>>();
const storeKey = (k: string) => `rx-skill-place:${k}`;
function cached(key: string | undefined): Record<string, SkillPlacement> {
  if (!key) return {};
  if (!memory.has(key)) {
    let saved: Record<string, SkillPlacement> = {};
    try {
      saved = JSON.parse(window.localStorage.getItem(storeKey(key)) ?? "{}") ?? {};
    } catch {
      saved = {};
    }
    memory.set(key, saved);
  }
  return memory.get(key)!;
}
function remember(key: string | undefined, placements: SkillPlacement[]) {
  if (!key) return;
  const all = { ...cached(key) };
  for (const p of placements) all[p.skill.toLowerCase()] = p;
  memory.set(key, all);
  try {
    window.localStorage.setItem(storeKey(key), JSON.stringify(all));
  } catch {
    /* storage full or blocked: memory still has it */
  }
}

/** "orphan skills" text from the finding → the skill names. */
export function orphanSkillsFrom(excerpt: string): string[] {
  return [...new Set(excerpt.replace(/^["“]|["”]$/g, "").split(/\s*[,;|•]\s*|\s+and\s+/).map((s) => s.trim()).filter((s) => s && s.length <= 60))];
}

/**
 * Orphan skills, handled as additions (not replacements): for each skill the AI finds the line or
 * job where it honestly belongs, the card says exactly where, and one click puts it there.
 */
export function SkillPlacementBox({ skills, api }: { skills: string[]; api: SkillPlacementApi }) {
  // The skills this card has shown: a skill that gets added (so it's no longer "unproven") stays,
  // marked Added, instead of the box resetting and asking the AI again.
  const [shown, setShown] = useState<string[]>(skills);
  useEffect(() => {
    setShown((prev) => [...prev, ...skills.filter((s) => !prev.some((p) => p.toLowerCase() === s.toLowerCase()))]);
  }, [skills.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState<{ loading: boolean; placements: SkillPlacement[]; error?: string }>(() => {
    const have = cached(api.cacheKey);
    return { loading: false, placements: skills.map((s) => have[s.toLowerCase()]).filter((p): p is SkillPlacement => !!p) };
  });
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ignored, setIgnored] = useState<Record<string, "saving" | "done">>({});
  const asking = useRef(false);

  /** Ask the AI only for skills it hasn't placed yet (or all of them on Refresh). */
  const run = async (fresh = false) => {
    const have = fresh ? {} : cached(api.cacheKey);
    const missing = shown.filter((s) => !have[s.toLowerCase()]);
    const known = shown.map((s) => have[s.toLowerCase()]).filter((p): p is SkillPlacement => !!p);
    if (!missing.length) {
      setState({ loading: false, placements: known });
      return;
    }
    if (asking.current) return;
    asking.current = true;
    setState((st) => ({ loading: true, placements: fresh ? [] : st.placements.length ? st.placements : known }));
    try {
      const placements = await resumeApi.aiSkillPlacement({ skills: missing, entries: api.entries(), targetRole: api.targetRole, vocabulary: api.vocabulary() });
      remember(api.cacheKey, placements);
      setState((st) => {
        const byName = new Map([...(fresh ? [] : st.placements), ...known, ...placements].map((p) => [p.skill.toLowerCase(), p]));
        return { loading: false, placements: shown.map((s) => byName.get(s.toLowerCase())).filter((p): p is SkillPlacement => !!p) };
      });
    } catch {
      setState((st) => ({ ...st, loading: false, error: "Couldn't work out where these fit right now. Try again." }));
    } finally {
      asking.current = false;
    }
  };
  useEffect(() => {
    void run();
    // Only when a skill appears that hasn't been placed yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.join("|")]);

  const notRelevant = async (skill: string) => {
    if (!api.ignoreSkill) return;
    setIgnored((m) => ({ ...m, [skill]: "saving" }));
    try {
      await api.ignoreSkill(skill);
      setIgnored((m) => ({ ...m, [skill]: "done" }));
    } catch {
      setIgnored((m) => {
        const next = { ...m };
        delete next[skill];
        return next;
      });
    }
  };

  const visible = state.placements.filter((p) => ignored[p.skill] !== "done");
  const placed = visible.filter((p) => p.relevant && p.place);
  const noPlace = visible.filter((p) => p.relevant && !p.place);
  const notNeeded = visible.filter((p) => !p.relevant);
  const setAside = Object.entries(ignored).filter(([, v]) => v === "done").map(([k]) => k);

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
          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => void run(true)}>
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
              {!isDone && api.ignoreSkill ? (
                <button
                  type="button"
                  disabled={!!ignored[p.skill]}
                  title={`Don't suggest ${p.skill} again for this resume`}
                  onClick={() => void notRelevant(p.skill)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {ignored[p.skill] === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : <EyeOff className="h-3 w-3" />}
                  Not relevant
                </button>
              ) : null}
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
      {setAside.length ? (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <EyeOff className="h-3 w-3" /> Won&apos;t suggest again: {setAside.join(", ")}.
        </p>
      ) : null}
      {state.placements.length && !state.loading ? (
        <button type="button" onClick={() => void run(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh suggestions
        </button>
      ) : null}
      {notNeeded.length ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Fine to keep only in Skills (no proof needed for this role): {notNeeded.map((p) => p.skill).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
