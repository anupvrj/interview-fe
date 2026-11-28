"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Check, Pencil, RefreshCw, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** "{X}", "{XX%}", "{N}" or "[X%]", "[N users]" — a number the AI left for the user to fill in. */
const BLANK_RE = /\{[^{}\n]{0,15}\}|\[(?:X%?|N|\$X|X [a-z]+|N [a-z]+)\]/;

type View = "choose" | "edit" | "done";

/**
 * Suggested wordings in one card with three steps:
 * - choose: the options; tap one to use it ("↻ New options" asks the AI again).
 * - edit: only the picked option, as an editable box; Back returns to the options (edits kept),
 *   ⌘/Ctrl+Enter puts it in, Esc goes back. A "{X}" left for a real number must be filled in first.
 * - done: a green "In your resume" row with Undo (back to editing that text) and Rewrite / Other
 *   options. The new line itself shows on the page and in the box above, so it isn't repeated here.
 */
export function SuggestionPicker({
  options,
  onApply,
  onUndo,
  applyLabel = "Put this in",
  onRewrite,
  rewriting = false,
}: Readonly<{
  options: string[];
  /** Put the text in the resume; false when it couldn't (the box stays as it is). */
  onApply: (text: string) => boolean;
  /** Undo the last change in the editor. */
  onUndo?: () => void;
  applyLabel?: string;
  /** Ask the AI for new options (AI Coach). Without it, "Other options" shows these again. */
  onRewrite?: () => void;
  /** New options are on their way. */
  rewriting?: boolean;
}>) {
  const unique = options.filter((o, i) => options.indexOf(o) === i);
  const [view, setView] = useState<View>("choose");
  /** The picked option (by its text, so it survives more options arriving). */
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  /** What this picker put in, oldest first (Undo steps back one). */
  const [appliedStack, setAppliedStack] = useState<string[]>([]);
  const applied = appliedStack.length ? appliedStack[appliedStack.length - 1] : null;
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const boxId = useId();
  /** Rewrite was asked for: the new options open on the choose step. */
  const wantNew = useRef(false);

  // New options: keep editing a pick that's still offered; a finished card stays finished unless
  // the new options were asked for; otherwise show the options.
  const key = unique.join("\u0000");
  useEffect(() => {
    const stillThere = selected !== null && unique.includes(selected);
    if (!stillThere) setSelected(null);
    setView((v) => {
      if (wantNew.current) return "choose";
      if (v === "edit" && stillThere) return "edit";
      if (v === "done") return "done";
      return "choose";
    });
    wantNew.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const draft = selected === null ? "" : drafts[selected] ?? selected;
  const hasBlank = BLANK_RE.test(draft);

  // Grow with the text.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, view]);

  const focusBox = () =>
    requestAnimationFrame(() => {
      const el = boxRef.current;
      if (!el) return;
      el.focus();
      // The caret on the first blank, if any, so typing the number is one step.
      const match = el.value.match(BLANK_RE);
      if (match?.index !== undefined) el.setSelectionRange(match.index, match.index + match[0].length);
      else el.setSelectionRange(el.value.length, el.value.length);
    });

  const pick = (option: string) => {
    setSelected(option);
    setView("edit");
    focusBox();
  };

  const apply = () => {
    const text = draft.trim();
    if (!text || hasBlank) return;
    if (onApply(text)) {
      setAppliedStack((stack) => [...stack, text]);
      setView("done");
    }
  };

  const undo = () => {
    onUndo?.();
    setAppliedStack((stack) => stack.slice(0, -1));
    // Back to the text that was just taken out, ready to tweak and put in again.
    setView(selected !== null ? "edit" : "choose");
    if (selected !== null) focusBox();
  };

  const rewrite = () => {
    if (onRewrite) {
      wantNew.current = true;
      onRewrite();
    }
    setView("choose");
  };

  const smallBtn = "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11.5px] font-semibold transition-colors";

  if (view === "done") {
    return (
      <div
        data-testid="suggestion-done"
        role="status"
        className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-50 px-2.5 py-2 dark:bg-emerald-950/30"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <Check className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 whitespace-nowrap text-[12.5px] font-semibold text-emerald-800 dark:text-emerald-200">In your resume</span>
        <div className="flex items-center gap-1">
          {onUndo ? (
            <button type="button" onClick={undo} className={cn(smallBtn, "text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/40")}>
              <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo
            </button>
          ) : null}
          {onRewrite || unique.length > 1 ? (
            <button type="button" onClick={rewrite} className={cn(smallBtn, "text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/40")}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> {onRewrite ? "Rewrite" : "Other options"}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (view === "edit" && selected !== null) {
    const n = unique.indexOf(selected);
    return (
      <div className="mt-2 rounded-lg border border-primary/50 bg-background p-2.5 ring-1 ring-primary/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={boxId} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Edit before it goes in
          </label>
          {unique.length > 1 && n >= 0 ? <span className="text-[11px] tabular-nums text-muted-foreground">Option {n + 1} of {unique.length}</span> : null}
        </div>
        <textarea
          id={boxId}
          ref={boxRef}
          rows={2}
          value={draft}
          onChange={(e) => setDrafts((d) => ({ ...d, [selected]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              apply();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setView("choose");
            }
          }}
          className="mt-1.5 w-full resize-none overflow-hidden rounded-md border border-border bg-background px-2.5 py-2 text-[12.5px] leading-relaxed text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        {hasBlank ? (
          <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
            Replace {draft.match(BLANK_RE)?.[0]} with your real number first — it would print as written.
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setView("choose")} className={cn(smallBtn, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to options
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!draft.trim() || hasBlank}
            title="⌘/Ctrl + Enter"
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            {applied ? "Replace" : applyLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      {applied ? <p className="mb-1.5 text-[11px] text-muted-foreground">Picking one replaces the line you put in.</p> : null}
      {rewriting ? (
        <ul className="space-y-1.5" aria-busy="true" aria-label="Writing new options">
          {[0, 1, 2].map((i) => (
            <li key={i} className="space-y-1.5 rounded-lg border border-border p-2.5">
              <div className="h-2.5 w-11/12 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-1.5" aria-label="Suggested wordings">
          {unique.map((option, i) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => pick(option)}
                className="group w-full rounded-lg border border-border px-2.5 py-2 text-left text-[12.5px] leading-relaxed text-foreground transition-colors hover:border-primary/60 hover:bg-primary/[0.04] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
              >
                {drafts[option] ?? option}
                <span className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="tabular-nums text-muted-foreground">{unique.length > 1 ? `${i + 1} of ${unique.length}` : ""}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-80 group-hover:opacity-100">
                    <Pencil className="h-3 w-3" aria-hidden /> Use &amp; edit
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {onRewrite ? (
        <button type="button" onClick={rewrite} disabled={rewriting} className={cn(smallBtn, "mt-1.5 text-primary hover:bg-primary/10 disabled:opacity-50")}>
          <RefreshCw className={cn("h-3.5 w-3.5", rewriting && "animate-spin")} aria-hidden /> {rewriting ? "Writing new options…" : "New options"}
        </button>
      ) : null}
    </div>
  );
}
