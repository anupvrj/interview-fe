"use client";

import { useEffect, useRef } from "react";

type UseResumePreviewTrackpadZoomOptions = {
  rootRef: React.RefObject<HTMLElement | null>;
  zoomLevel: number;
  onZoom: (zoom: number) => void;
  onUserAdjusted?: () => void;
  minZoom?: number;
  maxZoom?: number;
  enabled?: boolean;
};

type WebKitGestureEvent = Event & {
  scale: number;
  rotation: number;
};

export function useResumePreviewTrackpadZoom({
  rootRef,
  zoomLevel,
  onZoom,
  onUserAdjusted,
  minZoom = 1,
  maxZoom = 200,
  enabled = true,
}: UseResumePreviewTrackpadZoomOptions) {
  const zoomRef = useRef(zoomLevel);
  zoomRef.current = zoomLevel;
  const onZoomRef = useRef(onZoom);
  onZoomRef.current = onZoom;
  const onUserAdjustedRef = useRef(onUserAdjusted);
  onUserAdjustedRef.current = onUserAdjusted;
  const gestureStartZoomRef = useRef(zoomLevel);

  useEffect(() => {
    if (!enabled) return;

    let cleanup: (() => void) | undefined;
    let rafId = 0;

    const attach = () => {
      const root = rootRef.current;
      if (!root) return false;

      const clampZoom = (value: number) =>
        Math.min(maxZoom, Math.max(minZoom, Math.round(value)));

      const applyZoom = (value: number) => {
        onUserAdjustedRef.current?.();
        onZoomRef.current(clampZoom(value));
      };

      const isPinchWheel = (event: WheelEvent) =>
        event.ctrlKey || event.metaKey;

      const isWithinRoot = (target: EventTarget | null) =>
        target instanceof Node && root.contains(target);

      const handleWheel = (event: WheelEvent) => {
        if (!isPinchWheel(event) || !isWithinRoot(event.target)) return;

        event.preventDefault();
        event.stopPropagation();

        // Multiplicative zoom — trackpad pinch deltas are small; additive + round often stalls.
        const intensity = 0.012;
        const nextZoom = zoomRef.current * (1 - event.deltaY * intensity);
        applyZoom(nextZoom);
      };

      const handleGestureStart = (event: Event) => {
        if (!isWithinRoot(event.target)) return;
        event.preventDefault();
        gestureStartZoomRef.current = zoomRef.current;
      };

      const handleGestureChange = (event: Event) => {
        if (!isWithinRoot(event.target)) return;
        event.preventDefault();
        const gesture = event as WebKitGestureEvent;
        applyZoom(gestureStartZoomRef.current * gesture.scale);
      };

      const handleGestureEnd = (event: Event) => {
        if (!isWithinRoot(event.target)) return;
        event.preventDefault();
      };

      document.addEventListener("wheel", handleWheel, {
        passive: false,
        capture: true,
      });
      root.addEventListener(
        "gesturestart",
        handleGestureStart as EventListener,
        { passive: false },
      );
      root.addEventListener(
        "gesturechange",
        handleGestureChange as EventListener,
        { passive: false },
      );
      root.addEventListener("gestureend", handleGestureEnd as EventListener, {
        passive: false,
      });

      cleanup = () => {
        document.removeEventListener("wheel", handleWheel, { capture: true });
        root.removeEventListener(
          "gesturestart",
          handleGestureStart as EventListener,
        );
        root.removeEventListener(
          "gesturechange",
          handleGestureChange as EventListener,
        );
        root.removeEventListener(
          "gestureend",
          handleGestureEnd as EventListener,
        );
      };
      return true;
    };

    if (!attach()) {
      rafId = window.requestAnimationFrame(() => {
        attach();
      });
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      cleanup?.();
    };
  }, [enabled, maxZoom, minZoom, rootRef]);
}
