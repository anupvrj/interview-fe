/** Page bands in document Y (px) for preview + serialized PDF pages. */

export interface PageBand {
  pageNumber: number;
  offsetY: number;
  height: number;
}

/** Minimal box for overlap + orphan repair (document coordinates, px). */
export interface PaginationBox {
  top: number;
  bottom: number;
}

/** Project card: keep on one page when height ≤ one page budget. */
export type PaginationAtomicIfFitsBox = PaginationBox;

export interface PaginationElementInput {
  top: number;
  bottom: number;
  height: number;
  kind: "header" | "item";
  /** When false, skip in orphan repair (empty chrome). */
  hasMeaningfulContent: boolean;
  /** Two-column: only the wider column (see resolvePaginationStraddleColumn); else always true. */
  useForStraddlingRules: boolean;
}

const BREAKPOINT_PADDING_PX = 5;
const MIN_VISIBLE_SECTION_HEADER_PX = 80;
const MIN_VISIBLE_ITEM_PX = 120;
const MIN_ITEM_HEIGHT_PX = 150;
const TRAILING_EMPTY_SLIVER_MAX_PX = 80;
const DEFAULT_TAIL_SLIVER_MAX_PX = 48;

function intersectsBand(
  box: PaginationBox,
  offsetY: number,
  height: number,
): boolean {
  const bandEnd = offsetY + height;
  return box.top < bandEnd && box.bottom > offsetY;
}

function isBoxCoveredByAnyPage(box: PaginationBox, pages: PageBand[]): boolean {
  return pages.some((p) => intersectsBand(box, p.offsetY, p.height));
}

/**
 * When a page break falls inside a box, visible height in the current slice
 * [currentY, targetEndY) — accounts for items that started on a previous page.
 */
function visibleHeightInSlice(
  el: PaginationElementInput,
  currentY: number,
  targetEndY: number,
): number {
  const visTop = Math.max(currentY, el.top);
  const visBot = Math.min(targetEndY, el.bottom);
  return Math.max(0, visBot - visTop);
}

/**
 * Straddles the horizontal cut at targetEndY within the current page window.
 * Must extend below the cut and still occupy space on or after currentY.
 */
function straddlesCut(
  el: PaginationElementInput,
  currentY: number,
  targetEndY: number,
): boolean {
  return (
    el.top < targetEndY &&
    el.bottom > targetEndY &&
    el.bottom > currentY
  );
}

/** Continuation slices use visibleHeightInSlice; break-before only when el.top > currentY. */
export function computePageBands(
  fullHeight: number,
  elements: PaginationElementInput[],
  integerLimit: number,
  atomicIfFitsOnOnePage: PaginationAtomicIfFitsBox[] = [],
  tailSliverMaxPx: number = DEFAULT_TAIL_SLIVER_MAX_PX,
): PageBand[] {
  const newPages: PageBand[] = [];
  let currentY = 0;
  let pageNum = 1;

  while (currentY < fullHeight - BREAKPOINT_PADDING_PX) {
    let targetEndY = Math.min(currentY + integerLimit, fullHeight);
    let safeEndY = targetEndY;

    const straddlingElements = elements.filter((el) => {
      if (!el.useForStraddlingRules) return false;
      if (!straddlesCut(el, currentY, targetEndY)) return false;
      return true;
    });

    if (straddlingElements.length > 0) {
      for (const el of straddlingElements) {
        const visiblePx = visibleHeightInSlice(el, currentY, targetEndY);

        const needsBreakBefore =
          el.kind === "header"
            ? visiblePx < MIN_VISIBLE_SECTION_HEADER_PX
            : el.height < MIN_ITEM_HEIGHT_PX ||
              visiblePx < MIN_VISIBLE_ITEM_PX;

        if (needsBreakBefore && el.top > currentY) {
          safeEndY = Math.min(safeEndY, el.top);
          continue;
        }

        // If only a tiny tail would land on the next page, keep the whole tail on this page.
        if (el.bottom > targetEndY) {
          const tailPx = el.bottom - targetEndY;
          if (tailPx > 0 && tailPx <= tailSliverMaxPx) {
            safeEndY = Math.min(fullHeight, Math.max(safeEndY, el.bottom));
          }
        }
      }
    }

    for (const atom of atomicIfFitsOnOnePage) {
      const blockH = atom.bottom - atom.top;
      if (blockH > integerLimit) continue;
      if (currentY >= atom.top) continue;
      if (atom.top < targetEndY && atom.bottom > targetEndY) {
        safeEndY = Math.min(safeEndY, atom.top);
      }
    }

    safeEndY = Math.floor(safeEndY);
    safeEndY = Math.min(safeEndY, fullHeight);

    if (safeEndY <= currentY) {
      safeEndY = targetEndY;
    }

    newPages.push({
      pageNumber: pageNum++,
      offsetY: Math.floor(currentY),
      height: Math.floor(safeEndY - currentY),
    });

    currentY = safeEndY;
  }

  return newPages;
}

/**
 * Ensure every semantic box (section headers + list items) intersects at least one
 * page band. Covers gaps from trimming, float rounding, and two-column quirks.
 */
export function fixOrphanSemanticBoxes(
  pages: PageBand[],
  boxes: PaginationBox[],
): PageBand[] {
  if (pages.length <= 1) return pages;

  const sortedBoxes = [...boxes].sort((a, b) => a.top - b.top);
  let out = pages.map((p) => ({ ...p }));

  for (let round = 0; round < 16; round++) {
    let changed = false;

    for (const h of sortedBoxes) {
      if (isBoxCoveredByAnyPage(h, out)) continue;

      for (let i = 1; i < out.length; i++) {
        const pageStart = out[i].offsetY;
        if (h.bottom > pageStart) continue;

        const prevStart = out[i - 1].offsetY;
        const newStart = h.top;
        if (newStart < prevStart) continue;

        out[i] = { ...out[i], offsetY: newStart };
        out[i - 1] = {
          ...out[i - 1],
          height: newStart - prevStart,
        };
        changed = true;
        break;
      }
    }

    if (!changed) break;
  }

  return out;
}

const hasContentInRange = (
  elements: PaginationElementInput[],
  startY: number,
  endY: number,
) =>
  elements.some(
    (el) =>
      el.hasMeaningfulContent &&
      el.height > 2 &&
      el.bottom > startY &&
      el.top < endY,
  );

export function trimTrailingEmptySliverPages(
  pages: PageBand[],
  elements: PaginationElementInput[],
): PageBand[] {
  let lastContentPageIndex = pages.length - 1;
  while (lastContentPageIndex > 0) {
    const page = pages[lastContentPageIndex];
    const startY = page.offsetY;
    const endY = page.offsetY + page.height;
    const isTinySliver = page.height <= TRAILING_EMPTY_SLIVER_MAX_PX;
    if (hasContentInRange(elements, startY, endY)) {
      break;
    }
    if (!isTinySliver) {
      break;
    }
    lastContentPageIndex--;
  }

  return pages.slice(0, lastContentPageIndex + 1);
}

/** Build orphan-repair boxes from headers (all) + items (meaningful only). */
export function collectOrphanRepairBoxes(
  elements: PaginationElementInput[],
): PaginationBox[] {
  const boxes: PaginationBox[] = [];
  for (const el of elements) {
    if (el.kind === "header") {
      boxes.push({ top: el.top, bottom: el.bottom });
      continue;
    }
    if (el.hasMeaningfulContent && el.height > 2) {
      boxes.push({ top: el.top, bottom: el.bottom });
    }
  }
  return boxes;
}

/** computePageBands → trim trailing slivers → fixOrphanSemanticBoxes (up to 6 passes). */
export function runResumePagination(
  fullHeight: number,
  elements: PaginationElementInput[],
  integerLimit: number,
  atomicIfFitsOnOnePage: PaginationAtomicIfFitsBox[] = [],
  tailSliverMaxPx: number = DEFAULT_TAIL_SLIVER_MAX_PX,
): PageBand[] {
  let pages = computePageBands(
    fullHeight,
    elements,
    integerLimit,
    atomicIfFitsOnOnePage,
    tailSliverMaxPx,
  );
  pages = trimTrailingEmptySliverPages(pages, elements);

  const orphanBoxes = collectOrphanRepairBoxes(elements);

  for (let pass = 0; pass < 6; pass++) {
    const next = fixOrphanSemanticBoxes(pages, orphanBoxes);
    if (
      next.length === pages.length &&
      next.every(
        (p, idx) =>
          p.offsetY === pages[idx].offsetY && p.height === pages[idx].height,
      )
    ) {
      pages = next;
      break;
    }
    pages = next;
  }

  return pages;
}
