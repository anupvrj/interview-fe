"use client";

import { useEffect, useState, type RefObject } from "react";

/** Tracks inner width of a workspace row via ResizeObserver (debounced with rAF). */
export function useWorkspaceRowWidth(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
): number {
  const [widthPx, setWidthPx] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(
        entry.contentRect.width ||
          (entry.borderBoxSize?.[0]?.inlineSize ?? 0),
      );
      if (w < 1) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        setWidthPx((prev) => (Math.abs(prev - w) < 2 ? prev : w));
      });
    });
    ro.observe(el);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [containerRef, enabled]);

  return widthPx;
}
