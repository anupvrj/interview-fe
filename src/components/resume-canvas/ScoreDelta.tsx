"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** "+3 ▲" next to the ATS score for a few seconds after it changes (edits re-score live). */
export function ScoreDelta({ score, className }: { score: number | null | undefined; className?: string }) {
  const prev = useRef<number | null | undefined>(score);
  const [delta, setDelta] = useState<number | null>(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = score;
    if (typeof before !== "number" || typeof score !== "number" || before === score) return;
    setDelta(score - before);
    const t = setTimeout(() => setDelta(null), 4000);
    return () => clearTimeout(t);
  }, [score]);
  if (!delta) return null;
  return (
    <span
      data-testid="score-delta"
      aria-live="polite"
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
        delta > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/15 text-rose-600 dark:text-rose-300",
        className,
      )}
    >
      {delta > 0 ? `+${delta} ▲` : `${delta} ▼`}
    </span>
  );
}
