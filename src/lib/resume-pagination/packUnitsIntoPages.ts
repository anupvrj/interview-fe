/**
 * Greedy bin-pack whole atomic units into fixed-height A4 pages, IN Y-SPACE.
 *
 * The preview renders the intact ResumeRenderer per page and hides the units that
 * don't belong on a page via display:none (they collapse out of flow). Because a
 * page's units are a contiguous run from the original render, the re-flowed
 * height equals the original Y-span (lastBottom - firstTop), gaps between
 * consecutive visible units preserved. So we pack by Y-span: a page's
 * (lastBottom - firstTop) must fit the A4 content area. This prevents bottom
 * clipping — the sum-of-heights model ignored inter-unit gaps.
 *
 * keepWithNext glue chains (section/item headers) are placed atomically; an
 * oversized chain is placed alone on a fresh page via isOnEmptyPage.
 *
 * Returns per-page { unitIds, offsetY, height }: unitIds drives which units to
 * hide per page (display:none); offsetY/height is the Y-window (kept for
 * page-delete/snapshot back-compat). Adapted from PAGINATION_APPROACH.md §2 Step 3.
 */
import type { MeasuredUnit } from "./buildMeasuredUnits";

export interface PackedPage {
  pageNumber: number;
  unitIds: string[];
  /** Y-window in render-doc coords (top of first unit on page). */
  offsetY: number;
  /** Y-window height (bottom of last unit - top of first). */
  height: number;
}

export function packUnitsIntoPages(
  units: MeasuredUnit[],
  pageHeightPx: number,
): PackedPage[] {
  if (units.length === 0) {
    return [{ pageNumber: 1, unitIds: [], offsetY: 0, height: 0 }];
  }
  const pages: PackedPage[] = [];
  let i = 0;
  let pageNum = 1;
  while (i < units.length) {
    const firstTop = units[i].top;
    const pageIds: string[] = [];
    while (i < units.length) {
      let chainEnd = i;
      while (chainEnd < units.length - 1 && units[chainEnd].keepWithNext) chainEnd++;
      const spanOnPage = units[chainEnd].bottom - firstTop;
      if (pageIds.length > 0 && spanOnPage > pageHeightPx) break;
      for (let k = i; k <= chainEnd; k++) pageIds.push(units[k].id);
      i = chainEnd + 1;
    }
    const lastBottom = units[i - 1]?.bottom ?? firstTop;
    pages.push({
      pageNumber: pageNum,
      unitIds: pageIds,
      offsetY: firstTop,
      height: Math.max(0, lastBottom - firstTop),
    });
    pageNum++;
  }
  return pages;
}
