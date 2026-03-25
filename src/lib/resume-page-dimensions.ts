/**
 * Single source of truth for resume preview & PDF export page geometry.
 * ISO 216 A4: 210mm × 297mm. Layout padding (mm) comes from resume.layout.padding
 * and matches template inner padding in ResumeRenderer.
 */

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export const DEFAULT_LAYOUT_PADDING_MM = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

export type LayoutPaddingMm = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export function resolveLayoutPaddingMm(
  padding?: Partial<LayoutPaddingMm> | null,
): LayoutPaddingMm {
  const d = DEFAULT_LAYOUT_PADDING_MM;
  return {
    top: padding?.top ?? d.top,
    bottom: padding?.bottom ?? d.bottom,
    left: padding?.left ?? d.left,
    right: padding?.right ?? d.right,
  };
}

/** Vertical gutter inside each A4 page for the paginated viewport (matches PDF snapshot). */
export function pageVerticalGuttersMm(padding: LayoutPaddingMm) {
  const top = Math.max(0, Math.min(padding.top, A4_HEIGHT_MM - 8));
  const bottom = Math.max(0, Math.min(padding.bottom, A4_HEIGHT_MM - top - 8));
  const contentHeightMm = Math.max(8, A4_HEIGHT_MM - top - bottom);
  return {
    topMm: top,
    bottomMm: bottom,
    contentHeightMm,
  };
}
