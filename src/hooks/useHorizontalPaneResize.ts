"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const HORIZONTAL_SPLITTER_PX = 8;

type UseHorizontalPaneResizeOptions = {
  storageKey?: string;
  defaultWidth: number;
  minWidth: number;
  getMaxWidth: () => number;
  enabled?: boolean;
};

export function useHorizontalPaneResize({
  storageKey,
  defaultWidth,
  minWidth,
  getMaxWidth,
  enabled = true,
}: UseHorizontalPaneResizeOptions) {
  const [widthPx, setWidthPx] = useState(defaultWidth);
  const widthRef = useRef(defaultWidth);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const n = Number.parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= minWidth) {
          setWidthPx(n);
          widthRef.current = n;
        }
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, minWidth]);

  useEffect(() => {
    widthRef.current = widthPx;
  }, [widthPx]);

  useEffect(() => {
    if (!enabled) return;
    const max = getMaxWidth();
    if (max < minWidth) return;
    setWidthPx((prev) => {
      const clamped = Math.min(Math.max(prev, minWidth), max);
      widthRef.current = clamped;
      return clamped;
    });
  }, [enabled, getMaxWidth, minWidth]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!enabled) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startW: widthRef.current,
      };
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (
        !enabled ||
        !e.currentTarget.hasPointerCapture(e.pointerId) ||
        dragRef.current == null
      ) {
        return;
      }
      const dx = e.clientX - dragRef.current.startX;
      const max = getMaxWidth();
      const next = Math.round(
        Math.min(max, Math.max(minWidth, dragRef.current.startW + dx)),
      );
      widthRef.current = next;
      setWidthPx(next);
    },
    [enabled, getMaxWidth, minWidth],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (dragRef.current == null) return;
      dragRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(widthRef.current));
        } catch {
          /* ignore */
        }
      }
    },
    [storageKey],
  );

  return {
    widthPx,
    setWidthPx,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
