export type FocusCameraFrame = { x: number; y: number; s: number };

/** Pure camera math used by `useFocusCamera`. Fit-all overview never scales above 1. */
export function computeFocusCamera(opts: {
  focused: boolean;
  max: number;
  vpW: number;
  vpH: number;
  rootW: number;
  rootH: number;
  panel?: { x: number; y: number; w: number; h: number } | null;
}): FocusCameraFrame {
  const { focused, max, vpW, vpH, rootW, rootH, panel } = opts;
  if (!focused || !panel) {
    const s0 = Math.min(1, vpW / rootW, vpH / rootH);
    return { s: s0, x: (vpW - rootW * s0) / 2, y: (vpH - rootH * s0) / 2 };
  }
  const sc = Math.min(max, (vpW - 40) / panel.w, (vpH - 48) / panel.h);
  return {
    s: sc,
    x: vpW / 2 - (panel.x + panel.w / 2) * sc,
    y: vpH / 2 - (panel.y + panel.h / 2) * sc,
  };
}
