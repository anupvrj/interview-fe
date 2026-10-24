"use client";

import { AlertTriangle, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sample text from a template is still on the resume: say so up front (it would print as
 * written, it holds the ATS score down, and it blocks the hackathon submit), with a way
 * to see it and a one-tap removal.
 */
export function SampleTextNotice({
  examples,
  count,
  removing,
  compact,
  onShow,
  onRemove,
}: Readonly<{
  /** A few of the sample values, as they appear on the page. */
  examples: string[];
  count: number;
  removing: boolean;
  /** Phones: one tighter line. */
  compact?: boolean;
  onShow: () => void;
  onRemove: () => void;
}>) {
  const shown = examples.slice(0, 2).map((e) => `“${e.length > 28 ? `${e.slice(0, 26)}…` : e}”`).join(", ");
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 border-b border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
        compact ? "px-3 py-1.5" : "px-4 py-2",
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p className={cn("min-w-0 flex-1 leading-snug", compact ? "text-xs" : "text-sm")}>
        <span className="font-semibold">
          {count === 1 ? "1 sample item" : `${count} sample items`} still on your resume
        </span>
        {compact ? null : (
          <>
            {shown ? <span className="text-amber-800 dark:text-amber-200"> ({shown}{count > 2 ? ", …" : ""})</span> : null}
            <span className="text-amber-800 dark:text-amber-200"> — your ATS score stays below 60 until it&apos;s replaced.</span>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onShow}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-100"
      >
        Show me
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Wand2 className="h-3.5 w-3.5" aria-hidden />}
        Remove samples
      </button>
    </div>
  );
}
