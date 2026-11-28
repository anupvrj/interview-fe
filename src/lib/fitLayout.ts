/**
 * Fit to the page budget with layout first: margins, then body text, then headings, each in
 * small steps and never below a readable floor. Content is only cut by the user (What's left).
 */
export type FitTypography = { heading: number; subheading: number; body: number; small: number; sectionHeader: number };
export type FitLayout = {
  padding?: { top: number; bottom: number; left: number; right: number };
  fontSize?: Partial<FitTypography>;
};

export const FIT_FLOORS = { padding: 6, bodyMin: 10, bodyDrop: 1.5, headingDrop: 2 };

/** The next, slightly tighter layout; null when nothing more can be tightened. */
export function nextFitStep<L extends FitLayout>(layout: L, base: FitTypography, basePadding: { top: number; bottom: number; left: number; right: number }): L | null {
  const pad = layout.padding ?? basePadding;
  const fs: FitTypography = { ...base, ...(layout.fontSize ?? {}) } as FitTypography;
  const tighterPad = (v: number) => Math.max(FIT_FLOORS.padding, Math.round((v - 2) * 10) / 10);
  if ((["top", "bottom", "left", "right"] as const).some((k) => pad[k] > FIT_FLOORS.padding)) {
    return { ...layout, padding: { top: tighterPad(pad.top), bottom: tighterPad(pad.bottom), left: tighterPad(pad.left), right: tighterPad(pad.right) } };
  }
  const bodyFloor = Math.max(FIT_FLOORS.bodyMin, base.body - FIT_FLOORS.bodyDrop);
  if (fs.body - 0.5 >= bodyFloor) {
    return { ...layout, fontSize: { ...layout.fontSize, body: fs.body - 0.5, small: Math.max(FIT_FLOORS.bodyMin - 1, fs.small - 0.5) } };
  }
  const headFloor = (b: number) => b - FIT_FLOORS.headingDrop;
  if (fs.subheading - 1 >= headFloor(base.subheading) || fs.sectionHeader - 1 >= headFloor(base.sectionHeader)) {
    return {
      ...layout,
      fontSize: {
        ...layout.fontSize,
        subheading: Math.max(headFloor(base.subheading), fs.subheading - 1),
        sectionHeader: Math.max(headFloor(base.sectionHeader), fs.sectionHeader - 1),
        heading: Math.max(headFloor(base.heading), fs.heading - 1),
      },
    };
  }
  return null;
}
