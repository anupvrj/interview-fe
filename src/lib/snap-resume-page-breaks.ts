import type { PageBand } from "@/lib/resume-pagination-engine";
import {
  debugResumePagination,
  isResumePaginationDebugEnabled,
} from "@/lib/debug-resume-pagination";

/** Tolerance (px) for treating a cut as aligned with a line edge. */
const LINE_CUT_EPS = 3;

export type TextLineBounds = { top: number; bottom: number };

/**
 * After band computation, page cuts can fall through the middle of a text line
 * (one pagination "item" spans multiple lines). Snap each cut to the nearest
 * line boundary so lines are not visually sliced between pages.
 */
export function snapResumePageBreaksToLineBounds(
  container: HTMLElement,
  pages: PageBand[],
  fullHeight: number,
): PageBand[] {
  if (pages.length <= 1) return pages;

  const containerRect = container.getBoundingClientRect();
  const lines = collectTextLineBounds(container, containerRect);

  if (lines.length === 0) return pages;

  let current = pages;
  for (let pass = 0; pass < 12; pass++) {
    const next = enforceLineSafePageBreaks(current, lines, fullHeight);
    if (pageBandsEqual(current, next)) {
      current = next;
      break;
    }
    current = next;
  }

  const result = current;
  if (
    isResumePaginationDebugEnabled() &&
    !pageBandsEqual(result, pages)
  ) {
    debugResumePagination("pagination:snapLineBounds:adjusted", {
      beforePagesCount: pages.length,
      afterPagesCount: result.length,
      beforeSummary: pages.map((p) => ({
        offsetY: p.offsetY,
        height: p.height,
      })),
      afterSummary: result.map((p) => ({ offsetY: p.offsetY, height: p.height })),
    });
  }

  return result;
}

/** Returns true when cut y falls strictly inside a rendered text line. */
export function cutSplitsTextLine(
  y: number,
  lines: TextLineBounds[],
): boolean {
  return lines.some(
    (line) => y > line.top + LINE_CUT_EPS && y < line.bottom - LINE_CUT_EPS,
  );
}

/**
 * Move every page break off text-line interiors. Prefer pushing the whole line
 * to the next page (snap to line.top); extend the current page (line.bottom)
 * when that keeps more content without re-splitting a line.
 */
export function enforceLineSafePageBreaks(
  pages: PageBand[],
  lines: TextLineBounds[],
  fullHeight: number,
): PageBand[] {
  if (pages.length <= 1 || lines.length === 0) return pages;

  const breaks: number[] = [];
  for (let i = 0; i < pages.length - 1; i++) {
    breaks.push(pages[i].offsetY + pages[i].height);
  }

  for (let i = 0; i < breaks.length; i++) {
    const prevBreak = i === 0 ? 0 : breaks[i - 1];
    const nextBreak = i === breaks.length - 1 ? fullHeight : breaks[i + 1];
    breaks[i] = snapCutToAvoidSplitLines(
      breaks[i],
      lines,
      prevBreak,
      nextBreak,
      fullHeight,
    );
  }

  return rebuildPageBandsFromBreaks(breaks, fullHeight);
}

function pageBandsEqual(a: PageBand[], b: PageBand[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (p, i) =>
        p.offsetY === b[i].offsetY &&
        p.height === b[i].height &&
        p.pageNumber === b[i].pageNumber,
    )
  );
}

function rebuildPageBandsFromBreaks(
  breaks: number[],
  fullHeight: number,
): PageBand[] {
  const normalizedBreaks: number[] = [];
  for (const rawBreak of breaks) {
    const b = Math.floor(rawBreak);
    if (b <= 0 || b >= fullHeight) continue;
    if (
      normalizedBreaks.length === 0
        ? b <= 0
        : b <= normalizedBreaks[normalizedBreaks.length - 1]
    ) {
      continue;
    }
    normalizedBreaks.push(b);
  }

  const out: PageBand[] = [];
  let offsetY = 0;

  for (const endY of normalizedBreaks) {
    const height = endY - offsetY;
    if (height <= 0) continue;
    out.push({
      pageNumber: out.length + 1,
      offsetY,
      height,
    });
    offsetY = endY;
  }

  const tailHeight = fullHeight - offsetY;
  if (tailHeight > 0) {
    out.push({
      pageNumber: out.length + 1,
      offsetY,
      height: tailHeight,
    });
  }

  return out.length > 0 ? out : [{ pageNumber: 1, offsetY: 0, height: fullHeight }];
}

function snapCutToAvoidSplitLines(
  y: number,
  lines: TextLineBounds[],
  prevBreak: number,
  nextBreak: number,
  fullHeight: number,
): number {
  let snapped = Math.floor(y);

  for (const line of lines) {
    if (snapped <= line.top + LINE_CUT_EPS || snapped >= line.bottom - LINE_CUT_EPS) {
      continue;
    }

    const canMoveToNextPage = line.top > prevBreak + LINE_CUT_EPS;
    const canExtendThisPage =
      line.bottom <= fullHeight &&
      line.bottom <= nextBreak + LINE_CUT_EPS &&
      line.bottom > prevBreak + LINE_CUT_EPS;

    // Prefer moving the whole line to the next page — avoids bottom clipping on
    // the current page and gives cleaner continuation-page tops.
    if (canMoveToNextPage) {
      snapped = Math.floor(line.top);
      continue;
    }

    if (canExtendThisPage) {
      snapped = Math.ceil(line.bottom);
    }
  }

  return Math.max(prevBreak + 1, Math.min(snapped, fullHeight - 1));
}

/** Max tail sliver (px) scaled to measured line height — larger body fonts need more room. */
export function resolveTailSliverMaxPx(
  lines: { top: number; bottom: number }[],
): number {
  let maxLine = 16;
  for (const line of lines) {
    maxLine = Math.max(maxLine, line.bottom - line.top);
  }
  return Math.max(48, Math.ceil(maxLine * 3));
}

/** Measure all text line boxes in container document coordinates (px). */
export function measureTextLineBounds(
  container: HTMLElement,
): TextLineBounds[] {
  const containerRect = container.getBoundingClientRect();
  return collectTextLineBounds(container, containerRect);
}

/**
 * Collect every rendered text line in document Y (px), including plain divs
 * (e.g. project "Technologies:" rows) that are not p/li headings.
 */
function collectTextLineBounds(
  container: HTMLElement,
  containerRect: DOMRect,
): TextLineBounds[] {
  const raw: TextLineBounds[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.textContent?.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (!parent || !container.contains(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        const style = globalThis.getComputedStyle(parent);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let textNode: Node | null;
  while ((textNode = walker.nextNode())) {
    const range = document.createRange();
    try {
      range.selectNodeContents(textNode);
    } catch {
      continue;
    }
    const rects = range.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.width < 1 || r.height < 3) continue;
      raw.push({
        top: r.top - containerRect.top,
        bottom: r.bottom - containerRect.top,
      });
    }
  }

  return mergeAdjacentLineBounds(raw);
}

/** Merge rects that belong to the same line (subpixel / split runs). */
function mergeAdjacentLineBounds(
  lines: TextLineBounds[],
): TextLineBounds[] {
  if (lines.length === 0) return lines;

  const sorted = [...lines].sort((a, b) =>
    a.top !== b.top ? a.top - b.top : a.bottom - b.bottom,
  );

  const merged: TextLineBounds[] = [];
  for (const line of sorted) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      Math.abs(prev.top - line.top) <= LINE_CUT_EPS &&
      Math.abs(prev.bottom - line.bottom) <= LINE_CUT_EPS
    ) {
      continue;
    }
    if (
      prev &&
      Math.abs(prev.bottom - line.top) <= LINE_CUT_EPS &&
      Math.abs(prev.top - line.top) <= 4
    ) {
      prev.bottom = Math.max(prev.bottom, line.bottom);
      prev.top = Math.min(prev.top, line.top);
      continue;
    }
    merged.push({ top: line.top, bottom: line.bottom });
  }

  return merged;
}
