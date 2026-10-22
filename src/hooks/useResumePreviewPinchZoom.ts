"use client";

import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";

type UseResumePreviewPinchZoomOptions = {
  /** The scroll container that receives the touches. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * The scroll container's content. While fingers move it is scaled with a CSS transform
   * (GPU, no React render) around the point between the fingers; the real zoom is applied
   * once, on release.
   */
  contentRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  onZoom: (zoom: number) => void;
  onUserAdjusted?: () => void;
  minZoom?: number;
  maxZoom?: number;
  enabled?: boolean;
};

function midpoint(touches: TouchList) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function distance(touches: TouchList) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

export function useResumePreviewPinchZoom({
  containerRef,
  contentRef,
  zoomLevel,
  onZoom,
  onUserAdjusted,
  minZoom = 30,
  maxZoom = 200,
  enabled = true,
}: UseResumePreviewPinchZoomOptions) {
  const zoomRef = useRef(zoomLevel);
  zoomRef.current = zoomLevel;
  const onZoomRef = useRef(onZoom);
  onZoomRef.current = onZoom;
  const onUserAdjustedRef = useRef(onUserAdjusted);
  onUserAdjustedRef.current = onUserAdjusted;

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    let pinch: null | {
      startDistance: number;
      startZoom: number;
      /** Pinch point inside the content box, at the start zoom (transform origin). */
      originX: number;
      originY: number;
      /** Content box's position in the container's scroll area (its padding). */
      offsetX: number;
      offsetY: number;
      /** Pinch point on screen (relative to the container) at the start. */
      startX: number;
      startY: number;
      scale: number;
      panX: number;
      panY: number;
    } = null;
    let frame = 0;

    const clampZoom = (value: number) => Math.min(maxZoom, Math.max(minZoom, value));

    const paint = () => {
      frame = 0;
      const content = contentRef.current;
      if (!pinch || !content) return;
      content.style.transformOrigin = `${pinch.originX}px ${pinch.originY}px`;
      content.style.transform = `translate3d(${pinch.panX}px, ${pinch.panY}px, 0) scale(${pinch.scale})`;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      const rect = container.getBoundingClientRect();
      const mid = midpoint(event.touches);
      const startX = mid.x - rect.left;
      const startY = mid.y - rect.top;
      const box = contentRef.current?.getBoundingClientRect();
      const originX = box ? mid.x - box.left : container.scrollLeft + startX;
      const originY = box ? mid.y - box.top : container.scrollTop + startY;
      pinch = {
        startDistance: distance(event.touches),
        startZoom: zoomRef.current,
        originX,
        originY,
        offsetX: container.scrollLeft + startX - originX,
        offsetY: container.scrollTop + startY - originY,
        startX,
        startY,
        scale: 1,
        panX: 0,
        panY: 0,
      };
      const content = contentRef.current;
      if (content) content.style.willChange = "transform";
      onUserAdjustedRef.current?.();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2 || pinch.startDistance <= 0) return;
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      const mid = midpoint(event.touches);
      const nextZoom = clampZoom((pinch.startZoom * distance(event.touches)) / pinch.startDistance);
      pinch.scale = nextZoom / pinch.startZoom;
      // Two-finger drag moves the page too, like a photo viewer.
      pinch.panX = mid.x - rect.left - pinch.startX;
      pinch.panY = mid.y - rect.top - pinch.startY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const endPinch = () => {
      if (!pinch) return;
      const done = pinch;
      pinch = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;

      const finalZoom = Math.round(clampZoom(done.startZoom * done.scale));
      const ratio = finalZoom / done.startZoom;
      // Keep the pinched spot under the fingers once the real zoom has laid out.
      const scrollLeft = done.offsetX + done.originX * ratio - (done.startX + done.panX);
      const scrollTop = done.offsetY + done.originY * ratio - (done.startY + done.panY);

      const content = contentRef.current;
      const clear = () => {
        if (!content) return;
        content.style.transform = "";
        content.style.transformOrigin = "";
        content.style.willChange = "";
      };

      // One task, no paint in between: drop the preview transform, commit the real zoom
      // (the preview sizes itself from it during render), then scroll so the pinched spot
      // stays under the fingers. No flash back to the old zoom.
      clear();
      if (finalZoom !== done.startZoom) flushSync(() => onZoomRef.current(finalZoom));
      container.scrollLeft = Math.max(0, scrollLeft);
      container.scrollTop = Math.max(0, scrollTop);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) endPinch();
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerRef, contentRef, enabled, maxZoom, minZoom]);
}
