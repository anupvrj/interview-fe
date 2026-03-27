/**
 * Inner padding for Atlantic Blue column flex items (px).
 * Keep in sync with --ab-* tokens in style.css (same numbers).
 * Used as inline styles in ResumeRenderer so padding always applies even if template CSS loads late.
 */
export const ATLANTIC_BLUE_INNER_PADDING_PX = {
  vertical: 44,
  outerEdge: 40,
  /** Inset at the blue|white seam (left column padding-right, right column padding-left) */
  seam: 36,
} as const;
