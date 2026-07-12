"use client";

import { useCallback, useEffect, useRef } from "react";

type UseResumePreviewFitZoomOptions = {
  enabled: boolean;
  pageWidthGutterPx?: number;
  horizontalPadding?: number;
  minFitZoom?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageMeasureRef: React.RefObject<HTMLDivElement | null>;
  onZoom: (zoom: number) => void;
  resetKey?: string | number;
};

export function useResumePreviewFitZoom({
  enabled,
  pageWidthGutterPx = 0,
  horizontalPadding = 12,
  minFitZoom = 30,
  containerRef,
  pageMeasureRef,
  onZoom,
  resetKey,
}: UseResumePreviewFitZoomOptions) {
  const userAdjustedZoomRef = useRef(false);
  const onZoomRef = useRef(onZoom);
  onZoomRef.current = onZoom;

  const computeFitZoom = useCallback(() => {
    const container = containerRef.current;
    const pageMeasure = pageMeasureRef.current;
    if (!container || !pageMeasure) return null;

    const available = container.clientWidth - horizontalPadding;
    const pageWidthPx = pageMeasure.offsetWidth + pageWidthGutterPx;
    if (available <= 0 || pageWidthPx <= 0) return null;

    const fitZoom = Math.floor((available / pageWidthPx) * 100);
    return Math.min(100, Math.max(minFitZoom, fitZoom));
  }, [containerRef, horizontalPadding, minFitZoom, pageMeasureRef, pageWidthGutterPx]);

  const applyFitZoom = useCallback(() => {
    if (!enabled || userAdjustedZoomRef.current) return;
    const fitZoom = computeFitZoom();
    if (fitZoom != null) {
      onZoomRef.current(fitZoom);
    }
  }, [computeFitZoom, enabled]);

  const resetFitZoom = useCallback(() => {
    userAdjustedZoomRef.current = false;
    requestAnimationFrame(() => applyFitZoom());
  }, [applyFitZoom]);

  useEffect(() => {
    if (!enabled) return;
    userAdjustedZoomRef.current = false;
    applyFitZoom();
  }, [enabled, resetKey, applyFitZoom]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (!userAdjustedZoomRef.current) {
        applyFitZoom();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [enabled, applyFitZoom, containerRef]);

  return {
    markUserAdjusted: () => {
      userAdjustedZoomRef.current = true;
    },
    resetFitZoom,
    computeFitZoom,
  };
}
