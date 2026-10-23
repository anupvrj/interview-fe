"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Pencil, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** "{X}", "{XX%}", "{N}" — a number the AI left for the user to fill in. */
const BLANK_RE = /\{[^{}\n]{0,15}\}/;

/**
 * Pick a suggested wording, edit it if you like, then put it in the resume.
 * - Tapping an option selects it into an editable box; tapping another swaps it in
 *   (your edits to each option are kept while you switch).
 * - A "{X}" left for a real number must be filled in before it can go in.
 * - After applying, the box stays: pick or edit another and apply again to replace it.
 */
export function SuggestionPicker({
  options,
  onApply,
  onUndo,
  applyLabel = "Put this in",
}: Readonly<{
  options: string[];
  /** Put the text in the resume; false when it couldn't (the box stays as it is). */
  onApply: (text: string) => boolean;
  /** Undo the last change in the editor. */
  onUndo?: () => void;
  applyLabel?: string;
}>) {
  /** The picked option (by its text, so it survives more options arriving). */
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  /** What this picker put in, oldest first (Undo steps back one). */
  const [appliedStack, setAppliedStack] = useState<string[]>([]);
  const applied = appliedStack.length ? appliedStack[appliedStack.length - 1] : null;
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const boxId = useId();

  // More options arriving (e.g. AI ones after the suggested wording) keep your pick and edits;
  // a pick that's no longer offered is let go.
  const key = options.join("\u0000");
  useEffect(() => {
    setSelected((s) => (s !== null && options.includes(s) ? s : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const draft = selected === null ? "" : drafts[selected] ?? selected;
  const hasBlank = BLANK_RE.test(draft);
  const inResume = applied !== null && applied.trim() === draft.trim();

  // Grow with the text, and focus it when an option is picked.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  const pick = (option: string) => {
    setSelected(option);
    requestAnimationFrame(() => {
      const el = boxRef.current;
      if (!el) return;
      el.focus();
      // Put the caret on the first blank, if any, so typing the number is one step.
      const match = el.value.match(BLANK_RE);
      if (match?.index !== undefined) el.setSelectionRange(match.index, match.index + match[0].length);
    });
  };

  const apply = () => {
    const text = draft.trim();
    if (!text || hasBlank) return;
    if (onApply(text)) setAppliedStack((stack) => [...stack, text]);
  };

  return (
    <div className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <ul className="space-y-1.5">
        {options.filter((o, i) => options.indexOf(o) === i).map((option) => (
          <li key={option}>
            <button
              type="button"
              onClick={() => pick(option)}
              aria-pressed={selected === option}
              className={cn(
                "w-full rounded-md border px-2.5 py-1.5 text-left text-xs leading-relaxed transition-colors",
                selected === option ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/60 hover:bg-muted/40",
              )}
            >
              {drafts[option] ?? option}
              {selected === option ? null : (
                <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Pencil className="h-3 w-3" aria-hidden /> Use &amp; edit
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {selected !== null ? (
        <div className="rounded-lg border border-primary/40 bg-background p-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor={boxId}>
            Edit before it goes in
          </label>
          <textarea
            id={boxId}
            ref={boxRef}
            rows={2}
            value={draft}
            onChange={(e) => setDrafts((d) => ({ ...d, [selected]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) apply();
            }}
            className="mt-1 w-full resize-none overflow-hidden rounded-md border border-border bg-background px-2 py-1.5 text-xs leading-relaxed text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          {hasBlank ? (
            <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Replace {draft.match(BLANK_RE)?.[0]} with your real number first — it would print as written.
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {inResume ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" aria-hidden /> In your resume
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {applied ? "Pick or edit another and apply to replace it." : "Tip: ⌘/Ctrl + Enter to apply"}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {applied && onUndo ? (
                <button
                  type="button"
                  onClick={() => {
                    onUndo();
                    setAppliedStack((stack) => stack.slice(0, -1));
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Undo2 className="h-3 w-3" aria-hidden /> Undo
                </button>
              ) : null}
              <button
                type="button"
                onClick={apply}
                disabled={!draft.trim() || hasBlank || inResume}
                className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {applied && !inResume ? "Replace" : applyLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
