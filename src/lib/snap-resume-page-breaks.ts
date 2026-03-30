import type { PageBand } from "@/lib/resume-pagination-engine";

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

  const out: PageBand[] = [];
  for (let i = 0; i <= breaks.length; i++) {
    const offsetY = i === 0 ? 0 : breaks[i - 1];
    const endY = i === breaks.length ? fullHeight : breaks[i];
    const height = Math.floor(endY - offsetY);
    if (height <= 0) {
      return pages;
    }
    out.push({
      pageNumber: out.length + 1,
      offsetY: Math.floor(offsetY),
      height,
    });
  }

  return out.length === pages.length ? out : pages;
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
    if (line.top > prevBreak + LINE_CUT_EPS) {
      return line.top;
    }
    if (line.bottom < nextBreak - LINE_CUT_EPS) {
      return line.bottom;
    }
  }
  return y;
}

function collectTextLineBounds(
  container: HTMLElement,
  containerRect: DOMRect,
): { top: number; bottom: number }[] {
  const out: { top: number; bottom: number }[] = [];
  const nodes = container.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6");

  nodes.forEach((el) => {
    if (!el.textContent?.trim()) return;
    const range = document.createRange();
    try {
      range.selectNodeContents(el);
    } catch {
      return;
    }
    const rects = range.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.width < 1 || r.height < 4) continue;
      out.push({
        top: r.top - containerRect.top,
        bottom: r.bottom - containerRect.top,
      });
    }
  });

  return out.sort((a, b) => a.top - b.top);
}
