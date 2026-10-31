"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * Pan and zoom for the Skill Graph SVG, in viewBox units.
 * - Mouse: drag to move; Ctrl/⌘ + wheel (and trackpad pinch, which arrives as ctrl+wheel) to zoom.
 * - Touch: two fingers pinch to zoom and drag to move. One finger is left to the page so it still scrolls.
 * A drag swallows the click that would otherwise follow it, so moving never toggles a node.
 */

export interface View {
  k: number;
  x: number;
  y: number;
}

export const IDENTITY: View = { k: 1, x: 0, y: 0 };
export const MIN_ZOOM = 0.6;
export const MAX_ZOOM = 3;
const DRAG_THRESHOLD_PX = 4;

export const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

/** Zoom to `k` keeping the point (px, py) — in viewBox units — fixed on screen. */
export function zoomAt(view: View, k: number, px: number, py: number): View {
  const next = clampZoom(k);
  const ratio = next / view.k;
  return { k: next, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio };
}

export function usePanZoom(svgRef: RefObject<SVGSVGElement | null>, opts: { center: number; resetKey?: unknown }) {
  const [view, setView] = useState<View>(IDENTITY);
  const viewRef = useRef(view);
  viewRef.current = view;
  const suppressClick = useRef(false);
  const anim = useRef<number | null>(null);

  /** Screen point → viewBox coordinates (before the pan/zoom transform). */
  const toSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      const ctm = svg?.getScreenCTM();
      if (!svg || !ctm) return { x: opts.center, y: opts.center };
      const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
      return { x: p.x, y: p.y };
    },
    [svgRef, opts.center],
  );
  /** viewBox units per screen pixel. */
  const unitsPerPx = useCallback(() => {
    const ctm = svgRef.current?.getScreenCTM();
    return ctm ? 1 / ctm.a : 1;
  }, [svgRef]);

  const stopAnim = () => {
    if (anim.current !== null) cancelAnimationFrame(anim.current);
    anim.current = null;
  };

  /** Short eased tween, for the buttons. */
  const animateTo = useCallback((target: View) => {
    stopAnim();
    const from = viewRef.current;
    const start = performance.now();
    let ran = false;
    const step = (now: number) => {
      ran = true;
      const t = Math.min(1, (now - start) / 220);
      const e = 1 - (1 - t) ** 3;
      setView({ k: from.k + (target.k - from.k) * e, x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e });
      anim.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    anim.current = requestAnimationFrame(step);
    // Background or hidden panes may never deliver a frame: land on the target anyway.
    setTimeout(() => {
      if (ran) return;
      stopAnim();
      setView(target);
    }, 120);
  }, []);

  const zoomBy = useCallback((factor: number) => animateTo(zoomAt(viewRef.current, viewRef.current.k * factor, opts.center, opts.center)), [animateTo, opts.center]);
  const reset = useCallback(() => animateTo(IDENTITY), [animateTo]);

  // New tab / new data: start from the whole graph again.
  useEffect(() => {
    stopAnim();
    setView(IDENTITY);
  }, [opts.resetKey]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Wheel: only with Ctrl/⌘ (trackpad pinch sets ctrlKey), so normal scrolling still scrolls the page.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      stopAnim();
      const p = toSvg(e.clientX, e.clientY);
      const v = viewRef.current;
      // Trackpad pinch sends small deltas, a mouse notch ~100: cap each event so a notch is one gentle step.
      const delta = Math.max(-25, Math.min(25, e.deltaY));
      setView(zoomAt(v, v.k * Math.exp(-delta * 0.01), p.x, p.y));
    };

    // Mouse / pen drag to pan.
    let drag: { id: number; sx: number; sy: number; vx: number; vy: number; moved: boolean } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      stopAnim();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y, moved: false };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      if (!drag.moved) {
        // Move/up are watched on window, so no pointer capture is needed (it throws once a pointer is released).
        drag.moved = true;
        svg.style.cursor = "grabbing";
      }
      // Compute now: a deferred updater could run after pointerup has cleared `drag`.
      const u = unitsPerPx();
      const x = drag.vx + dx * u;
      const y = drag.vy + dy * u;
      setView((v) => ({ ...v, x, y }));
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) suppressClick.current = true;
      svg.style.cursor = "";
      drag = null;
    };

    // Two-finger pinch + pan. Touch events (not pointer events) so one finger keeps scrolling the page.
    let pinch: { d: number; mx: number; my: number; view: View } | null = null;
    const mid = (t: TouchList) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2, d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) });
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      stopAnim();
      const m = mid(e.touches);
      pinch = { d: Math.max(1, m.d), mx: m.x, my: m.y, view: viewRef.current };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const m = mid(e.touches);
      const u = unitsPerPx();
      // Zoom around where the fingers started, then follow the fingers' midpoint.
      const anchor = toSvg(pinch.mx, pinch.my);
      const zoomed = zoomAt(pinch.view, pinch.view.k * (m.d / pinch.d), anchor.x, anchor.y);
      setView({ ...zoomed, x: zoomed.x + (m.x - pinch.mx) * u, y: zoomed.y + (m.y - pinch.my) * u });
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (pinch && e.touches.length < 2) {
        pinch = null;
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 350);
      }
    };
    // Capture phase: a drag that ends on a node must not also click it.
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    svg.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);
    svg.addEventListener("touchcancel", onTouchEnd);
    svg.addEventListener("click", onClickCapture, true);
    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
      svg.removeEventListener("touchcancel", onTouchEnd);
      svg.removeEventListener("click", onClickCapture, true);
      stopAnim();
    };
  }, [svgRef, toSvg, unitsPerPx]);

  return { view, zoomBy, reset, transform: `translate(${view.x} ${view.y}) scale(${view.k})` };
}
