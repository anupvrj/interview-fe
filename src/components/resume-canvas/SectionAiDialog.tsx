"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { resumeApi } from "@/lib/api";
import { sectionChips, type ChipContext } from "@/lib/sectionChips";
import { cn } from "@/lib/utils";

export type SectionAiTarget = {
  sectionId: string;
  sectionType: string;
  title: string;
  /** One entry for summary/skills/custom; one per job/project/degree otherwise (or just the picked one). */
  entries: Array<{ index: number; title: string; lines: string[] }>;
  context: ChipContext & { industry?: string };
  resumeText: string;
};

/**
 * ✦ on a section header: write it (empty) or rewrite it (filled), with optional instructions and
 * quick chips fitted to the section, field and seniority. Preview first; Apply is one undo step.
 */
export function SectionAiDialog({
  target,
  onClose,
  onApply,
}: {
  target: SectionAiTarget | null;
  onClose: () => void;
  onApply: (target: SectionAiTarget, entries: Array<{ index: number; lines: string[] }>) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<{ loading: boolean; result?: Array<{ index: number; lines: string[] }>; dropped?: number; error?: string }>({ loading: false });
  useEffect(() => {
    setInstruction("");
    setNote("");
    setState({ loading: false });
  }, [target?.sectionId, target?.entries.length]);
  if (!target) return null;

  const empty = target.entries.every((e) => !e.lines.length);
  const needsNote = empty && !["profileSummary", "skills"].includes(target.sectionType);
  const chips = sectionChips(target.sectionType, { ...target.context, empty });

  const run = async () => {
    setState({ loading: true });
    try {
      const r = await resumeApi.aiSection({
        sectionType: target.sectionType,
        sectionTitle: target.title,
        entries: target.entries,
        note: note.trim() || undefined,
        instruction: instruction.trim() || undefined,
        targetRole: target.context.targetRole,
        seniority: target.context.seniority,
        industry: target.context.industry,
        resumeText: target.resumeText,
      });
      setState({ loading: false, result: r.entries, dropped: r.dropped });
    } catch {
      setState({ loading: false, error: "Couldn't write this section right now. Try again." });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        closeVariant="round"
        // Phones: a sheet from the bottom (full width, room for the keyboard); larger screens: centred.
        className="max-h-[90vh] max-w-xl overflow-y-auto max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[92dvh] max-sm:translate-y-0 max-sm:gap-3 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0 max-sm:p-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:data-[state=open]:slide-in-from-bottom-1/2"
        data-testid="section-ai"
      >
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="flex items-start gap-2 text-[17px] leading-snug sm:text-lg">
            <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
            {empty ? "Write" : "Rewrite"} {target.entries.length === 1 && target.entries[0].title && !["profileSummary", "skills"].includes(target.sectionType) ? target.entries[0].title : target.title} with AI
          </DialogTitle>
          <DialogDescription>Built only from what&apos;s on your resume and what you tell us here — nothing invented. You see it before it goes in.</DialogDescription>
        </DialogHeader>

        {needsNote ? (
          <label className="block text-sm">
            <span className="font-medium text-foreground">What should it say?</span>
            <textarea
              aria-label="What should it say"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="A few words is enough — e.g. what you did, the tools you used, what came of it."
              className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-base text-foreground outline-none focus:border-primary sm:text-sm"
            />
          </label>
        ) : null}

        <div>
          <p className="text-xs font-semibold text-muted-foreground">Quick options</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map((c) => {
              const on = instruction.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setInstruction((v) => (on ? v.replace(c, "").replace(/;\s*;/g, ";").replace(/^;\s*|;\s*$/g, "").trim() : [v.trim(), c].filter(Boolean).join("; ")))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/60",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <label className="block text-sm">
          <span className="text-xs font-semibold text-muted-foreground">Anything else? (optional)</span>
          <input
            aria-label="Instructions"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. more technical, mention leading the migration"
            className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary sm:h-10 sm:text-sm"
          />
        </label>

        {state.result ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3" data-testid="section-ai-preview">
            {state.result.map((r) => {
              const entry = target.entries.find((e) => e.index === r.index);
              return (
                <div key={r.index}>
                  {target.entries.length > 1 && entry?.title ? <p className="text-xs font-semibold text-muted-foreground">{entry.title}</p> : null}
                  {target.sectionType === "skills" ? (
                    <p className="text-sm text-foreground">{r.lines.join(" · ")}</p>
                  ) : target.sectionType === "profileSummary" ? (
                    <p className="text-sm text-foreground">{r.lines.join(" ")}</p>
                  ) : (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                      {r.lines.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {state.dropped ? <p className="text-[11px] text-muted-foreground">Left out {state.dropped} line{state.dropped === 1 ? "" : "s"} that added things you didn&apos;t say.</p> : null}
          </div>
        ) : null}
        {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}

        {/* Phones: full-width buttons, the main one first and Cancel last. */}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end [&>button]:max-sm:h-11 [&>button]:max-sm:w-full">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground sm:mr-auto">
            Cancel
          </Button>
          {state.result ? (
            <>
              <Button variant="outline" onClick={() => void run()} disabled={state.loading}>
                {state.loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />} Try again
              </Button>
              <Button
                onClick={() => {
                  onApply(target, state.result!);
                  onClose();
                }}
              >
                Apply
              </Button>
            </>
          ) : (
            <Button onClick={() => void run()} disabled={state.loading || (needsNote && note.trim().length < 8)}>
              {state.loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              {empty ? "Write it" : "Rewrite it"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
