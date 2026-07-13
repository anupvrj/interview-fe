"use client";

import { useEffect, useRef } from "react";

type UseResumePreviewPinchZoomOptions = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  onZoom: (zoom: number) => void;
  onUserAdjusted?: () => void;
  minZoom?: number;
  maxZoom?: number;
  enabled?: boolean;
};

function getTouchDistance(touches: TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export function useResumePreviewPinchZoom({
  containerRef,
  zoomLevel,
  onZoom,
  onUserAdjusted,
  minZoom = 30,
  maxZoom = 200,
  enabled = true,
}: UseResumePreviewPinchZoomOptions) {
  const zoomRef = useRef(zoomLevel);
  zoomRef.current = zoomLevel;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let pinchStartDistance = 0;
    let pinchStartZoom = zoomRef.current;
    let pinching = false;

    const clampZoom = (value: number) =>
      Math.min(maxZoom, Math.max(minZoom, Math.round(value)));

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      pinchStartDistance = getTouchDistance(event.touches);
      pinchStartZoom = zoomRef.current;
      pinching = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pinching || event.touches.length !== 2 || pinchStartDistance <= 0) {
        return;
      }

      event.preventDefault();
      onUserAdjusted?.();

      const distance = getTouchDistance(event.touches);
      const scale = distance / pinchStartDistance;
      onZoom(clampZoom(pinchStartZoom * scale));
    };

    const endPinch = () => {
      pinchStartDistance = 0;
      pinching = false;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", endPinch);
    container.addEventListener("touchcancel", endPinch);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", endPinch);
      container.removeEventListener("touchcancel", endPinch);
    };
  }, [containerRef, enabled, maxZoom, minZoom, onUserAdjusted, onZoom]);
}
