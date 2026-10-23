import type { CSSProperties } from "react";

export type Box = { left: number; top: number; width: number; height: number };
export const CARD_W = 320;

/** Where the step card goes: beside the target on desktop, above/below it on phones. */
export function cardPosition(
  box: Box,
  isMobile: boolean,
  cardH: number,
  viewport: { width: number; height: number } = { width: window.innerWidth, height: window.innerHeight },
): CSSProperties {
  const vw = viewport.width;
  const vh = viewport.height;
  if (isMobile) {
    const width = vw - 24;
    const centre = box.top + box.height / 2;
    if (centre > vh * 0.55) return { left: 12, width, bottom: Math.max(12, vh - box.top + 16) };
    return { left: 12, width, top: Math.min(box.top + box.height + 16, vh - cardH - 12) };
  }
  if (box.width > 400) {
    // The page itself: sit inside its top-right corner.
    return { left: Math.min(box.left + box.width - CARD_W - 24, vw - CARD_W - 16), top: box.top + 32, width: CARD_W };
  }
  if (box.left < vw / 2) {
    return { left: box.left + box.width + 18, top: Math.min(Math.max(16, box.top - 8), vh - cardH - 16), width: CARD_W };
  }
  return { left: Math.max(16, box.left + box.width - CARD_W), top: box.top + box.height + 14, width: CARD_W };
}

