"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export type ChecklistItem = { id: string; label: string; done: boolean };

const RING = 2 * Math.PI * 15;
const WIGGLE_EVERY_MS = 45_000;
const MAX_WIGGLES = 3;

/** Phones: sit just above whatever bar is at the bottom (tab bar, issue bar, Submit bar). */
function phoneBottomOffset(): number {
  const bars = Array.from(document.querySelectorAll<HTMLElement>("[data-editor-bottom-bar]")).filter(
    (el) => el.getClientRects().length > 0,
  );
  const top = bars.length ? Math.min(...bars.map((el) => el.getBoundingClientRect().top)) : window.innerHeight - 64;
  return Math.max(12, window.innerHeight - top + 10);
}

export function SetupChecklist({
  items,
  isMobile,
  hidden,
  onShowMe,
  onReplayTour,
  onDismiss,
  onAllDone,
}: Readonly<{
  items: ChecklistItem[];
  isMobile: boolean;
  /** Out of the way for now (tour running, a panel sheet is open, typing…). */
  hidden: boolean;
  onShowMe: (id: string) => void;
  onReplayTour: () => void;
  onDismiss: () => void;
  onAllDone: () => void;
}>) {
  const [open, setOpen] = useState(false);
  const [bottom, setBottom] = useState(76);
  const [wiggle, setWiggle] = useState(false);
  const [plus, setPlus] = useState(0);
  const [justDone, setJustDone] = useState<string | null>(null);
  const prevDone = useRef<Set<string> | null>(null);
  const wiggles = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;
  const nextId = items.find((i) => !i.done)?.id ?? null;

  // A new tick: sparkle + pop (not on first render — those were already done).
  useEffect(() => {
    const now = new Set(items.filter((i) => i.done).map((i) => i.id));
    const before = prevDone.current;
    prevDone.current = now;
    if (!before) return;
    const fresh = [...now].find((id) => !before.has(id));
    if (!fresh) return;
    setJustDone(fresh);
    setPlus((n) => n + 1);
    const t = window.setTimeout(() => setJustDone(null), 600);
    return () => window.clearTimeout(t);
  }, [items]);

  // Everything done: celebrate briefly, then leave for good.
  useEffect(() => {
    if (!allDone) return;
    setOpen(true);
    const t = window.setTimeout(onAllDone, 4000);
    return () => window.clearTimeout(t);
  }, [allDone, onAllDone]);

  // Gentle reminder while something is left (a few times per visit at most).
  useEffect(() => {
    if (allDone || open || hidden) return;
    const t = window.setInterval(() => {
      if (wiggles.current >= MAX_WIGGLES) return;
      wiggles.current += 1;
      setWiggle(true);
      window.setTimeout(() => setWiggle(false), 950);
    }, WIGGLE_EVERY_MS);
    return () => window.clearInterval(t);
  }, [allDone, open, hidden]);

  useEffect(() => {
    if (!isMobile) return;
    const read = () => setBottom(phoneBottomOffset());
    read();
    const t = window.setInterval(read, 400);
    window.addEventListener("resize", read);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", read);
    };
  }, [isMobile]);

  // Tap outside closes the card.
  useEffect(() => {
    if (!open || allDone) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, allDone]);

  if (typeof document === "undefined" || hidden) return null;
  const place: React.CSSProperties = isMobile ? { right: 12, bottom } : { right: 20, bottom: 20 };

  return createPortal(
    <div ref={rootRef} className="eg-root fixed z-40" style={place}>
      {open ? (
        <div
          id="eg-pill"
          className={`eg-slide eg-on ${isMobile ? "w-[calc(100vw-24px)]" : "w-80"} rounded-2xl border border-border bg-background p-4 shadow-2xl`}
          role="region"
          aria-label="Resume setup checklist"
        >
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-foreground">{allDone ? "All done! 🎉" : "Resume setup"}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {doneCount} of {items.length} done
              </span>
              {allDone ? null : (
                <button type="button" aria-label="Collapse checklist" className="rounded-full p-1 text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="eg-bar h-full rounded-full bg-gradient-to-r from-[#7c5cf6] to-[#9b7bff]" style={{ width: `${(doneCount / items.length) * 100}%` }} />
          </div>
          <ul className="mt-2.5 space-y-0.5">
            {items.map((item) => {
              const isNext = item.id === nextId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={item.done}
                    onClick={() => {
                      setOpen(false);
                      onShowMe(item.id);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${isNext ? "bg-primary/5" : ""} ${item.done ? "cursor-default" : "hover:bg-muted"}`}
                  >
                    <span
                      className={`eg-check grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors ${item.done ? "eg-done border-[#7c5cf6] bg-[#7c5cf6]" : "border-muted-foreground/30"} ${justDone === item.id ? "eg-pop-now" : ""}`}
                    >
                      <svg viewBox="0 0 14 14" className="h-3 w-3" aria-hidden>
                        <path d="M2.5 7.5l3 3 6-7" fill="none" stroke="#fff" strokeWidth={3} />
                      </svg>
                    </span>
                    <span className={`flex-1 text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium text-foreground"}`}>{item.label}</span>
                    {isNext ? <span className="eg-nudge text-xs font-semibold text-primary">Show me →</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {allDone ? null : (
            <div className="mt-2 flex items-center justify-between text-xs">
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => { setOpen(false); onReplayTour(); }}>
                Replay the tour
              </button>
              <button type="button" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={onDismiss}>
                <X className="h-3 w-3" /> Hide checklist
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          id="eg-pill"
          type="button"
          onClick={() => setOpen(true)}
          className={`eg-pill eg-slide eg-on ${wiggle ? "eg-wiggle" : ""} relative flex items-center gap-2 rounded-full border border-border bg-background py-1.5 pl-1.5 pr-3 text-sm font-semibold text-foreground shadow-lg`}
          aria-label={`Resume setup: ${doneCount} of ${items.length} done`}
        >
          <span className="relative grid h-8 w-8 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted" strokeWidth="4" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#7c5cf6" strokeWidth="4" strokeLinecap="round" className="eg-prog" strokeDasharray={`${(doneCount / items.length) * RING} ${RING}`} />
            </svg>
            <span className="text-[10px]">{doneCount}/{items.length}</span>
          </span>
          Resume setup
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {plus > 0 ? (
        <span key={plus} className="eg-plus" style={{ right: 24, top: -8 }} aria-hidden>
          +1 ✨
        </span>
      ) : null}
    </div>,
    document.body,
  );
}
