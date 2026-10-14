/**
 * Single source of truth for resume preview & PDF export page geometry.
 * ISO 216 A4: 210mm × 297mm. Layout padding (mm) comes from resume.layout.padding
 * and matches template inner padding in ResumeRenderer.
 */

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/**
 * Paginated preview / snapshot: full A4 fill for Atlantic Blue (must match
 * `--ab-sidebar-width-pct` and colors in atlantic-blue/style.css).
 */
export const ATLANTIC_BLUE_PAGINATED_PAGE_BG =
  "linear-gradient(to right, #2c3e50 0%, #2c3e50 40%, #ffffff 40%, #ffffff 100%)";

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

/**
 * Merge saved resume.layout.padding with template defaults per side (undefined → template).
 * Matches ResumeRenderer so preview, pagination, and PDF use the same gutters (e.g. Atlantic Blue top/bottom while left/right stay 0).
 */
export function mergeLayoutPaddingWithTemplateStyle(
  resumePadding: Partial<LayoutPaddingMm> | undefined,
  templatePadding: LayoutPaddingMm,
): LayoutPaddingMm {
  const p = resumePadding ?? {};
  return {
    top: p.top ?? templatePadding.top,
    bottom: p.bottom ?? templatePadding.bottom,
    left: p.left ?? templatePadding.left,
    right: p.right ?? templatePadding.right,
  };
}

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

export const MERCURY_LAYOUT_PADDING_MM: LayoutPaddingMm = {
  top: 0,
  bottom: 20,
  left: 0,
  right: 0,
};

/** Top gutter on Mercury page 2+ (page 1 stays flush). */
export const MERCURY_CONTINUATION_TOP_MM = 5;

export const CORPORATE_LAYOUT_PADDING_MM: LayoutPaddingMm = {
  top: 6,
  bottom: 8,
  left: 8,
  right: 8,
};

/** Page 2+ continuation top gutter follows `layout.padding.top` for corporate & executive. */
export function getTemplateContinuationTopMm(
  templateId: string,
  layoutTopPaddingMm: number,
): number {
  if (templateId === "mercury") return MERCURY_CONTINUATION_TOP_MM;
  if (templateId === "corporate" || templateId === "executive") {
    return Math.max(0, layoutTopPaddingMm);
  }
  return 0;
}

/** Paginated preview viewport top — avoids double-counting page padding on page 1. */
export function getPageViewportTopMm(
  templateId: string,
  isContinuationPage: boolean,
  topMarginMm: number,
  continuationTopMm: number,
): number {
  if (isContinuationPage && continuationTopMm > 0) {
    return continuationTopMm;
  }
  if (
    templateId === "mercury" ||
    templateId === "corporate" ||
    templateId === "executive"
  ) {
    return 0;
  }
  return topMarginMm;
}

/** A4 content height in CSS px at 96dpi (matches PaginatedPreview). */
export const A4_HEIGHT_PX = (A4_HEIGHT_MM / 25.4) * 96;

export function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export function pageContentHeightPx(contentHeightMm: number): number {
  return (contentHeightMm / A4_HEIGHT_MM) * A4_HEIGHT_PX;
}

/** Mercury uses full-bleed header/section bars; horizontal inset lives in template CSS. */
export function applyTemplateLayoutPaddingOverrides(
  templateId: string,
  padding: LayoutPaddingMm,
): LayoutPaddingMm {
  if (templateId === "mercury") {
    return {
      ...MERCURY_LAYOUT_PADDING_MM,
      bottom: padding.bottom ?? MERCURY_LAYOUT_PADDING_MM.bottom,
    };
  }
  return padding;
}

export function resolveEffectiveLayoutPaddingMm(
  templateId: string,
  resumePadding: Partial<LayoutPaddingMm> | undefined,
  templatePadding: LayoutPaddingMm,
): LayoutPaddingMm {
  return applyTemplateLayoutPaddingOverrides(
    templateId,
    resolveLayoutPaddingMm(
      mergeLayoutPaddingWithTemplateStyle(resumePadding, templatePadding),
    ),
  );
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
