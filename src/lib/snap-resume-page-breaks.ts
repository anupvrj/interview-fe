import type { PageBand } from "@/lib/resume-pagination-engine";
import {
  debugResumePagination,
  isResumePaginationDebugEnabled,
} from "@/lib/debug-resume-pagination";

const LINE_CUT_EPS = 1;

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
  for (let pass = 0; pass < 5; pass++) {
    const next = snapResumePageBreaksOnce(
      lines,
      current,
      fullHeight,
    );
    if (pageBandsEqual(current, next)) {
      current = next;
      break;
    }
    current = next;
  }

  const result = current;
  if (
    isResumePaginationDebugEnabled() &&
    result !== pages &&
    (pages.length !== result.length ||
      pages.some(
        (p, i) =>
          !result[i] ||
          p.offsetY !== result[i].offsetY ||
          p.height !== result[i].height,
      ))
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

function snapResumePageBreaksOnce(
  lines: { top: number; bottom: number }[],
  pages: PageBand[],
  fullHeight: number,
): PageBand[] {
  const breaks: number[] = [];
  for (let i = 0; i < pages.length - 1; i++) {
    breaks.push(pages[i].offsetY + pages[i].height);
  }

  for (let i = 0; i < breaks.length; i++) {
    const prevBreak = i === 0 ? 0 : breaks[i - 1];
    const nextBreak = i === breaks.length - 1 ? fullHeight : breaks[i + 1];
    const y = breaks[i];
    const snapped = snapCutToAvoidSplitLines(y, lines, prevBreak, nextBreak);
    if (snapped !== y) {
      breaks[i] = Math.floor(snapped);
    }
  }

  const out = rebuildPageBandsFromBreaks(breaks, fullHeight);
  return out.length === pages.length ? out : pages;
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
  const out: PageBand[] = [];
  for (let i = 0; i <= breaks.length; i++) {
    const offsetY = i === 0 ? 0 : breaks[i - 1];
    const endY = i === breaks.length ? fullHeight : breaks[i];
    const height = Math.floor(endY - offsetY);
    if (height <= 0) {
      return [];
    }
    out.push({
      pageNumber: out.length + 1,
      offsetY: Math.floor(offsetY),
      height,
    });
  }
  return out;
}

function snapCutToAvoidSplitLines(
  y: number,
  lines: { top: number; bottom: number }[],
  prevBreak: number,
  nextBreak: number,
): number {
  for (const line of lines) {
    if (y <= line.top + LINE_CUT_EPS || y >= line.bottom - LINE_CUT_EPS) {
      continue;
    }

    const distToTop = y - line.top;
    const distToBottom = line.bottom - y;
    const canMoveToNextPage = line.top > prevBreak + LINE_CUT_EPS;
    const canExtendThisPage = line.bottom <= nextBreak - LINE_CUT_EPS;

    // Cut through middle of a line — snap to the nearest valid line edge.
    if (canMoveToNextPage && (!canExtendThisPage || distToTop <= distToBottom)) {
      return line.top;
    }

    if (canExtendThisPage) {
      return line.bottom;
    }

    if (canMoveToNextPage) {
      return line.top;
    }
  }
  return y;
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
): { top: number; bottom: number }[] {
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
): { top: number; bottom: number }[] {
  const raw: { top: number; bottom: number }[] = [];
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
      if (r.width < 1 || r.height < 4) continue;
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
  lines: { top: number; bottom: number }[],
): { top: number; bottom: number }[] {
  if (lines.length === 0) return lines;

  const sorted = [...lines].sort((a, b) =>
    a.top !== b.top ? a.top - b.top : a.bottom - b.bottom,
  );

  const merged: { top: number; bottom: number }[] = [];
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
      Math.abs(prev.top - line.top) <= 3
    ) {
      prev.bottom = Math.max(prev.bottom, line.bottom);
      prev.top = Math.min(prev.top, line.top);
      continue;
    }
    merged.push({ top: line.top, bottom: line.bottom });
  }

  return merged;
}
