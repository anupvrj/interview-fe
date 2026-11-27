"use client";

import { track } from "@/lib/analytics/productEvents";
import { useEffect, useState } from "react";
import { Loader2, MessageCircleQuestion, Sparkles, Target, Wand2 } from "lucide-react";
import { resumeApi } from "@/lib/api";
import type { SuggestionAt } from "@/lib/suggestionApply";
import { spliceSelection, type AiSelection } from "@/lib/aiSelection";
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
  /** Part of the line was selected: reword only that span and splice it back. */
  selection?: AiSelection;
  /** Set by the "AI" button: a new id asks for options right away. */
  requestId?: number;
}

/** The last "AI" button press already answered (a re-opened panel must not ask again). */
let lastAutoRunId: number | undefined;

/** Placeholder text has nothing true to reword; rewriting it would only invent claims. */
function isSampleText(text: string): boolean {
  return /^(sample|your)\b/i.test(text.trim());
}

function canRewrite(text: string): boolean {
  return text.length >= 3 && !isSampleText(text);
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
  evidence,
}: {
  /** Where each AI-written line came from (Resume Writer v2), shown as "Based on…". */
  evidence?: { path: string; text: string; sources: string[] }[];
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
  /** "Practice defending this line": interview follow-ups for the line. */
  const [defend, setDefend] = useState<{ question: string; showWith: string }[] | null>(null);
  const [defendLoading, setDefendLoading] = useState(false);
  /** What's in that bullet now (it changes as options are put in). */
  const [current, setCurrent] = useState<{ text: string; at: SuggestionAt } | null>(target ? { text: target.text, at: target.at } : null);
  /** The selected span being reworded (moves as options are put in), else the whole line. */
  const [selection, setSelection] = useState<AiSelection | null>(target?.selection ?? null);
  void liveText;

  // Another bullet, or a new "AI" press → start over. Same bullet edited on the page → follow its text.
  const targetKey = target ? `${target.at.path}#${target.at.index ?? ""}#${target.requestId ?? ""}` : "";
  useEffect(() => {
    setSuggestions([]);
    setDefend(null);
    setError(null);
    setCurrent(target ? { text: target.text, at: target.at } : null);
    setSelection(target?.selection ?? null);
    if (target?.requestId && target.requestId !== lastAutoRunId) {
      lastAutoRunId = target.requestId;
      if (canRewrite(target.text)) void run(target.text, target.selection ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);
  useEffect(() => {
    if (target) setCurrent((prev) => (prev && prev.text !== target.text ? { ...prev, text: target.text } : prev));
  }, [target?.text]);

  // The bullet as it is now on the page (after undo/redo or typing), else what we last knew.
  const currentText = (current && textAt?.(current.at)) || current?.text || target?.text || "";

  const run = async (lineText = currentText, span: AiSelection | null = selection) => {
    if (!target) return;
    setLoading(true);
    setError(null);
    track("resume_ai_enhancement_requested", { kind: span ? `${target.kind}_selection` : String(target.kind) });
    try {
      const out = await resumeApi.aiRewrite({
        text: span ? span.text : lineText,
        kind: target.kind,
        role: target.role,
        company: target.company,
        targetRole,
        goal: span
          ? `Reword only this phrase, taken from the line "${lineText.slice(0, 300)}". Reply with a phrase that fits back in its place in that sentence, not a whole new bullet.`
          : undefined,
      });
      setSuggestions(out);
      if (out.length === 0) setError("No better wording found — try adding a little more detail first.");
    } catch {
      setError("Couldn't get suggestions right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const practice = async () => {
    if (!target) return;
    setDefendLoading(true);
    setError(null);
    track("resume_ai_defend_requested", { kind: String(target.kind) });
    try {
      const out = await resumeApi.aiDefend({ text: currentText, role: target.role, company: target.company, targetRole });
      setDefend(out);
      if (!out.length) setError("No questions for this line — add a little more detail first.");
    } catch {
      setError("Couldn't get questions right now. Try again in a moment.");
    } finally {
      setDefendLoading(false);
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
              {selection ? "Selected text" : target.kind === "summary" ? "Your summary" : "Selected bullet"}
            </p>
            <p data-testid="ai-coach-target" className="mt-1 line-clamp-4 rounded-lg bg-muted/60 px-2.5 py-2 text-xs leading-relaxed text-foreground">
              {selection && currentText.slice(selection.start, selection.start + selection.text.length) === selection.text ? (
                <>
                  {currentText.slice(0, selection.start)}
                  <mark className="rounded bg-primary/15 px-0.5 text-foreground">{selection.text}</mark>
                  {currentText.slice(selection.start + selection.text.length)}
                </>
              ) : (
                currentText
              )}
            </p>
            {(() => {
              const key = target.at.index === null ? target.at.path : `${target.at.path}.${target.at.index}`;
              const words = (t: string) => new Set(t.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
              const similar = (a: string, b: string) => {
                const wa = words(a), wb = words(b);
                const shared = [...wa].filter((w) => wb.has(w)).length;
                return shared / Math.max(1, Math.min(wa.size, wb.size)) >= 0.6;
              };
              const hit =
                evidence?.find((e) => e.text === target.text) ??
                evidence?.find((e) => e.path === key && similar(e.text, target.text));
              if (!hit?.sources.length) return null;
              return (
                <details data-testid="ai-coach-based-on" className="mt-2 rounded-lg border border-border px-2.5 py-1.5 text-xs">
                  <summary className="cursor-pointer font-medium text-muted-foreground">Based on your resume ({hit.sources.length})</summary>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-foreground">
                    {hit.sources.slice(0, 4).map((src) => (
                      <li key={src}>{src}</li>
                    ))}
                  </ul>
                </details>
              );
            })()}
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
              disabled={loading || !canRewrite(target.text)}
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
                  // A selected span goes back into its line; otherwise the option is the whole line.
                  const spliced = selection ? spliceSelection(currentText, selection, text) : null;
                  if (selection && !spliced) return false;
                  const line = spliced ? spliced.text : text;
                  const at = onApply(line, current.at, currentText);
                  if (at) {
                    setCurrent({ text: line, at });
                    if (spliced) setSelection(spliced.selection);
                  }
                  return !!at;
                }}
              />
            ) : null}
            {target.kind === "bullet" && canRewrite(target.text) ? (
              <div className="mt-3 border-t border-border pt-3">
                <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => void practice()} disabled={defendLoading}>
                  {defendLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MessageCircleQuestion className="mr-1.5 h-3.5 w-3.5" />}
                  Practice defending this line
                </Button>
                {defend?.length ? (
                  <ol data-testid="ai-coach-defend" className="mt-2.5 space-y-2 text-xs">
                    {defend.map((q, i) => (
                      <li key={i} className="rounded-lg bg-muted/60 px-2.5 py-2">
                        <p className="font-medium text-foreground">
                          {i + 1}. {q.question}
                        </p>
                        <p className="mt-1 text-muted-foreground">A strong answer shows: {q.showWith}</p>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              AI only rewords what you wrote. Where a result would be stronger with a number, it leaves a [X%] for you to fill in.
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
