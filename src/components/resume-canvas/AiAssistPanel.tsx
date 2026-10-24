"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Target, Wand2 } from "lucide-react";
import { resumeApi } from "@/lib/api";
import type { SuggestionAt } from "@/lib/suggestionApply";
import { SuggestionPicker } from "./SuggestionPicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The bullet (or summary) the user last put their caret in. */
export interface AiTarget {
  path: string;
  kind: "bullet" | "summary";
  text: string;
  role?: string;
  company?: string;
  /** Where it is: the field, and which bullet in it (null: the whole field, e.g. the summary). */
  at: SuggestionAt;
}

/** Placeholder text has nothing true to reword; rewriting it would only invent claims. */
function isSampleText(text: string): boolean {
  return /^(sample|your)\b/i.test(text.trim());
}

export function AiAssistPanel({
  target,
  targetRole,
  onTailor,
  onFixMistakes,
  liveText,
  textAt,
  onApply,
  onUndo,
}: {
  /** What's at that spot in the resume now (follows undo/redo and typing on the page). */
  textAt?: (at: SuggestionAt) => string | null;
  /** Put `text` in place of `original` at `at`; returns where it went (null: couldn't). */
  onApply: (text: string, at: SuggestionAt, original: string) => SuggestionAt | null;
  onUndo?: () => void;
  /** Lower-cased resume text now, so "In your resume" clears after an undo. */
  liveText?: string;
  target: AiTarget | null;
  targetRole?: string;
  onTailor: () => void;
  onFixMistakes: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  /** What's in that bullet now (it changes as options are put in). */
  const [current, setCurrent] = useState<{ text: string; at: SuggestionAt } | null>(target ? { text: target.text, at: target.at } : null);
  void liveText;

  // Another bullet → start over. Same bullet edited on the page → follow its text.
  const targetKey = target ? `${target.at.path}#${target.at.index ?? ""}` : "";
  useEffect(() => {
    setSuggestions([]);
    setError(null);
    setCurrent(target ? { text: target.text, at: target.at } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);
  useEffect(() => {
    if (target) setCurrent((prev) => (prev && prev.text !== target.text ? { ...prev, text: target.text } : prev));
  }, [target?.text]);

  // The bullet as it is now on the page (after undo/redo or typing), else what we last knew.
  const currentText = (current && textAt?.(current.at)) || current?.text || target?.text || "";

  const run = async () => {
    if (!target || !current) return;
    setLoading(true);
    setError(null);
    try {
      const out = await resumeApi.aiRewrite({
        text: currentText,
        kind: target.kind,
        role: target.role,
        company: target.company,
        targetRole,
      });
      setSuggestions(out);
      if (out.length === 0) setError("No better wording found — try adding a little more detail first.");
    } catch {
      setError("Couldn't get suggestions right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-6">
      <section className="rounded-xl border border-border bg-card p-3.5">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Wand2 className="h-4 w-4 text-primary" />
          Reword with AI Coach
        </h4>
        {target ? (
          <>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {target.kind === "summary" ? "Your summary" : "Selected bullet"}
            </p>
            <p className="mt-1 line-clamp-4 rounded-lg bg-muted/60 px-2.5 py-2 text-xs leading-relaxed text-foreground">{currentText}</p>
            {isSampleText(target.text) ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                This is still sample text. Write what you actually did in a few words first — AI will then make it sound sharper,
                without inventing anything.
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full"
              onClick={() => void run()}
              disabled={loading || target.text.length < 3 || isSampleText(target.text)}
            >
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              {suggestions.length ? "More options" : "Show me 3 options"}
            </Button>
            {error ? <p className="mt-2 text-xs text-muted-foreground">{error}</p> : null}
            {suggestions.length && current ? (
              <SuggestionPicker
                options={suggestions}
                onUndo={onUndo}
                onApply={(text) => {
                  const at = onApply(text, current.at, currentText);
                  if (at) setCurrent({ text, at });
                  return !!at;
                }}
              />
            ) : null}
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              AI only rewords what you wrote. Where a number would help, it leaves a {"{X}"} for you to fill in.
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Click into any bullet point or your summary on the page, then come back here for three better ways to say it.
          </p>
        )}
      </section>
      <section className="space-y-2">
        <button
          type="button"
          onClick={onTailor}
          className="flex w-full items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/60"
        >
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-semibold text-foreground">Match a job</span>
            <span className="block text-xs text-muted-foreground">Paste a job description and match your resume to it.</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onFixMistakes}
          className="flex w-full items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/60"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-semibold text-foreground">Raise my score</span>
            <span className="block text-xs text-muted-foreground">See the ATS report and apply suggested fixes.</span>
          </span>
        </button>
      </section>
    </div>
  );
}
