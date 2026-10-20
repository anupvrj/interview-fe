"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Target, Wand2 } from "lucide-react";
import { resumeApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The bullet (or summary) the user last put their caret in. */
export interface AiTarget {
  path: string;
  kind: "bullet" | "summary";
  text: string;
  role?: string;
  company?: string;
  /** Replace the text on the page and save it. */
  apply: (text: string) => void;
}

export function AiAssistPanel({
  target,
  targetRole,
  onTailor,
  onFixMistakes,
}: {
  target: AiTarget | null;
  targetRole?: string;
  onTailor: () => void;
  onFixMistakes: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  // New target → old suggestions no longer apply.
  useEffect(() => {
    setSuggestions([]);
    setError(null);
    setAppliedIndex(null);
  }, [target?.path, target?.text]);

  const run = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    setAppliedIndex(null);
    try {
      const out = await resumeApi.aiRewrite({
        text: target.text,
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
          Rewrite with AI
        </h4>
        {target ? (
          <>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {target.kind === "summary" ? "Your summary" : "Selected bullet"}
            </p>
            <p className="mt-1 line-clamp-4 rounded-lg bg-muted/60 px-2.5 py-2 text-xs leading-relaxed text-foreground">{target.text}</p>
            <Button type="button" size="sm" className="mt-3 w-full" onClick={() => void run()} disabled={loading || target.text.length < 3}>
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              {suggestions.length ? "Suggest again" : "Suggest better wording"}
            </Button>
            {error ? <p className="mt-2 text-xs text-muted-foreground">{error}</p> : null}
            {suggestions.length ? (
              <ul className="mt-3 space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        target.apply(s);
                        setAppliedIndex(i);
                      }}
                      className={cn(
                        "w-full rounded-lg border px-2.5 py-2 text-left text-xs leading-relaxed transition-colors",
                        appliedIndex === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40",
                      )}
                    >
                      {s}
                      <span className="mt-1 block text-[11px] font-semibold text-primary">{appliedIndex === i ? "Applied ✓" : "Use this"}</span>
                    </button>
                  </li>
                ))}
              </ul>
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
            <span className="block text-sm font-semibold text-foreground">Tailor to a job</span>
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
            <span className="block text-sm font-semibold text-foreground">Fix mistakes</span>
            <span className="block text-xs text-muted-foreground">See the ATS report and apply suggested fixes.</span>
          </span>
        </button>
      </section>
    </div>
  );
}
