"use client";

import { useState } from "react";
import { Check, ChevronDown, FileSearch, Loader2, TriangleAlert, X } from "lucide-react";
import type { AtsParseResult, AtsReader } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const READERS: Array<{ id: AtsReader; label: string; hint: string }> = [
  { id: "modern", label: "Most ATS today", hint: "Layout-aware parsers that read each column top to bottom (Textkernel-style)." },
  { id: "basic", label: "Plain text", hint: "Text in the order the PDF stores it, as simple parsers and copy-paste see it." },
  { id: "legacy", label: "Older ATS", hint: "Read straight across the page, line by line — side-by-side columns get mixed." },
];

function band(rate: number) {
  if (rate >= 95) return { label: "Reads cleanly", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" };
  if (rate >= 85) return { label: "Mostly readable", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
  return { label: "ATS will miss things", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" };
}

/**
 * "How ATS read your resume": runs on demand (it builds the real PDF on the server), shows the
 * parse rate, which kinds of ATS read it well, what they missed, and the text they get.
 */
export function AtsParseCard({ onCheck }: Readonly<{ onCheck: () => Promise<AtsParseResult> }>) {
  const [result, setResult] = useState<AtsParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFields, setShowFields] = useState(false);
  const [showText, setShowText] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await onCheck());
    } catch {
      setError("Couldn't check right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const b = result ? band(result.parseRate) : null;
  const missing = result?.fields.filter((f) => !f.found) ?? [];
  const found = result?.fields.filter((f) => f.found) ?? [];

  return (
    <section className="rounded-xl border border-border bg-card p-3.5" aria-label="How ATS read your resume">
      <div className="flex items-start gap-2">
        <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">How ATS read your resume</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            We make the same PDF you download and read it the way ATS software does (Workday, Greenhouse, iCIMS, Taleo…).
          </p>
        </div>
      </div>

      {result && b ? (
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-baseline justify-between">
              <span className={cn("text-xs font-bold uppercase tracking-wide", b.text)}>{b.label}</span>
              <span className="text-lg font-bold tabular-nums text-foreground">{result.parseRate}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", b.bar)} style={{ width: `${result.parseRate}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Share of your details an ATS picks up, in the right place.</p>
          </div>

          <ul className="grid grid-cols-3 gap-1.5">
            {READERS.map((r) => (
              <li key={r.id} title={r.hint} className="rounded-lg bg-muted/60 px-2 py-1.5 text-center">
                <span className={cn("block text-sm font-bold tabular-nums", band(result.readers[r.id]).text)}>{result.readers[r.id]}%</span>
                <span className="block text-[10px] leading-tight text-muted-foreground">{r.label}</span>
              </li>
            ))}
          </ul>

          {result.problems.length ? (
            <ul className="space-y-1.5">
              {result.problems.map((p) => (
                <li key={p} className="flex gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Check className="h-3.5 w-3.5" aria-hidden /> Every detail we checked came through, in the right section.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowFields((v) => !v)}
            aria-expanded={showFields}
            className="flex w-full items-center justify-between text-xs font-semibold text-foreground"
          >
            What was read ({found.length} of {result.fields.length})
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFields && "rotate-180")} aria-hidden />
          </button>
          {showFields ? (
            <ul className="max-h-60 space-y-1 overflow-y-auto pr-1">
              {[...missing, ...found].map((f) => (
                <li key={f.key} className="flex items-start gap-1.5 text-xs">
                  {f.found ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Read" />
                  ) : (
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" aria-label="Missed" />
                  )}
                  <span className={cn("min-w-0", f.found ? "text-muted-foreground" : "font-medium text-foreground")}>
                    {f.label}
                    {f.found && f.missedBy.length ? (
                      <span className="text-[11px] text-amber-700 dark:text-amber-300">
                        {" "}
                        (missed by {f.missedBy.map((r) => READERS.find((x) => x.id === r)?.label.toLowerCase()).join(", ")})
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            onClick={() => setShowText((v) => !v)}
            aria-expanded={showText}
            className="flex w-full items-center justify-between text-xs font-semibold text-foreground"
          >
            See the text an ATS gets
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showText && "rotate-180")} aria-hidden />
          </button>
          {showText ? (
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/60 p-2.5 font-mono text-[10.5px] leading-relaxed text-foreground">
              {result.text}
            </pre>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      <Button type="button" size="sm" variant={result ? "outline" : "default"} className="mt-3 w-full" onClick={() => void run()} disabled={busy}>
        {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileSearch className="mr-1.5 h-3.5 w-3.5" />}
        {busy ? "Reading it like an ATS…" : result ? "Check again" : "See what an ATS reads"}
      </Button>
    </section>
  );
}
