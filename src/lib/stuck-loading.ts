"use client";

import { useEffect } from "react";

/**
 * A spinner showing longer than this means something is wrong (API, network or UI):
 * 60 s plus 5 s for the app's own 60 s request timeout to show its error first.
 */
export const STUCK_AFTER_MS = 65_000;

/** Query/mutation `meta` key for requests allowed to take longer (e.g. resume scoring). */
export const STUCK_AFTER_META = "stuckAfterMs";

type LoadingEntry = { label: string; startedAt: number; limitMs: number };

const entries = new Map<symbol, LoadingEntry>();

/** Loading states that have been showing longer than their limit. */
export function stuckLoadingLabels(now = Date.now()): string[] {
  return [...entries.values()].filter((e) => now - e.startedAt >= e.limitMs).map((e) => e.label);
}

/**
 * Report a loading state (page loader, "Connecting…") to the stuck-loading watchdog
 * while `active`. The watchdog shows "Something isn't right" if it lasts past the limit.
 */
export function useLoadingTimeout(active: boolean, label: string, limitMs = STUCK_AFTER_MS) {
  useEffect(() => {
    if (!active) return;
    const id = Symbol(label);
    entries.set(id, { label, startedAt: Date.now(), limitMs });
    return () => {
      entries.delete(id);
    };
  }, [active, label, limitMs]);
}

/** Test helper. */
export function resetStuckLoading() {
  entries.clear();
}
