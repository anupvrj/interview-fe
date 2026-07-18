import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Resume } from "@/lib/api";
import {
  debugResumePagination,
  isResumePaginationDebugEnabled,
} from "@/lib/debug-resume-pagination";
import {
  runResumePagination,
  trimTrailingEmptySliverPages,
  type PageBand,
  type PaginationAtomicIfFitsBox,
  type PaginationElementInput,
} from "@/lib/resume-pagination-engine";
import {
  getLastGoodPagesForResume,
  setLastGoodPagesForResume,
} from "@/lib/resume-pagination-last-good-cache";
import { resolvePaginationStraddleColumn } from "@/lib/resolve-pagination-straddle-column";
import {
  measureTextLineBounds,
  resolveTailSliverMaxPx,
  snapResumePageBreaksToLineBounds,
  cutSplitsTextLine,
} from "@/lib/snap-resume-page-breaks";

/** Same shape as `PageBand` from the pagination engine (preview + PDF slices). */
export type PageData = PageBand;

interface PaginationOptions {
  resume: Resume | null;
  sections: any[];
  pageHeightLimit: number; // Max content height per page in pixels
  /** Snap cuts to text line bounds when true (PaginatedPreview enables for all templates). */
  snapPageBreaksToLineBounds?: boolean;
  /**
   * Single key encoding every input that affects layout: section order/visibility,
   * resume content, typography, padding, template, column layout. A change schedules
   * a remeasure. The returned `pagesKey` reports which key the current `pages` belong to.
   */
  measureKey: string;
}

/** Coalesce rapid resume/section updates (typing, paste, drag) into one measure pass. */
const PAGINATION_DEBOUNCE_MS = 120;

/** Measure DOM not painted yet — retry up to this many frames before giving up. */
const MAX_EMPTY_DOM_RETRIES = 16;

/** Tall content but only one band (DOM mid-reflow) — retry this many times. */
const MAX_UNDERPAGED_RETRIES = 4;

/** Reserve px at the bottom of each page band so clip overflow does not slice text. */
const PAGE_BOTTOM_CLIP_SAFETY_PX = 6;

/** Wait for web fonts + two animation frames so measurements reflect final layout. */
async function waitForLayoutSettle(): Promise<void> {
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    } catch {
      /* ignore */
    }
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function useResumePagination({
  resume,
  sections,
  pageHeightLimit,
  snapPageBreaksToLineBounds = false,
  measureKey,
}: PaginationOptions) {
  const measuringRef = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<PageData[]>(() =>
    resume?.resumeId ? getLastGoodPagesForResume(resume.resumeId) ?? [] : [],
  );
  /** The `measureKey` for which `pages` were last computed. */
  const [pagesKey, setPagesKey] = useState("");
  /** True only while there is nothing valid to show yet (first load / resume switch). */
  const [isPaginating, setIsPaginating] = useState(false);

  // Latest inputs kept in refs so the measure routine + effects stay referentially stable.
  const pagesRef = useRef<PageData[]>(pages);
  pagesRef.current = pages;
  const resumeRef = useRef(resume);
  resumeRef.current = resume;
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const pageHeightLimitRef = useRef(pageHeightLimit);
  pageHeightLimitRef.current = pageHeightLimit;
  const snapRef = useRef(snapPageBreaksToLineBounds);
  snapRef.current = snapPageBreaksToLineBounds;
  const measureKeyRef = useRef(measureKey);
  measureKeyRef.current = measureKey;

  const lastMeasuredHeightRef = useRef(0);
  const emptyDomRetriesRef = useRef(0);
  const underPagedRetriesRef = useRef(0);
  const measureNowRef = useRef<(keyForPass: string) => void>(() => {});

  // Seed from cache on resume switch so we never flash the previous resume's bands.
  useLayoutEffect(() => {
    if (!resume?.resumeId) {
      setPages([]);
      setPagesKey("");
      return;
    }
    const cached = getLastGoodPagesForResume(resume.resumeId);
    setPages(cached?.length ? cached : []);
    setPagesKey("");
  }, [resume?.resumeId]);

  /**
   * Synchronous measure + paginate against the live measure DOM. Commits a new
   * `pages`/`pagesKey` pair only when it produces a stable, non-degenerate result.
   * Self-retries (capped) while the DOM is still painting/reflowing.
   */
  const measureNow = useCallback((keyForPass: string) => {
    // Abandon stale passes — a newer key has been scheduled.
    if (keyForPass !== measureKeyRef.current) return;

    const container = measuringRef.current;
    const activeResume = resumeRef.current;
    if (!container || !activeResume) return;

    const containerRect = container.getBoundingClientRect();
    const fullHeight = Math.ceil(container.scrollHeight);

    const headerNodes = Array.from(
      container.querySelectorAll("[data-section-header]"),
    );
    const itemNodes = Array.from(container.querySelectorAll("[data-item-id]"));
    const activeSections = sectionsRef.current;

    // DOM not painted yet (no measurable nodes but sections are visible) → retry.
    if (
      headerNodes.length === 0 &&
      itemNodes.length === 0 &&
      activeSections.some((s: { visible?: boolean }) => s.visible !== false)
    ) {
      if (emptyDomRetriesRef.current < MAX_EMPTY_DOM_RETRIES) {
        emptyDomRetriesRef.current += 1;
        requestAnimationFrame(() => measureNowRef.current(keyForPass));
      } else if (pagesRef.current.length === 0) {
        setIsPaginating(false);
      }
      return;
    }

    const atomicIfFitsNodes = Array.from(
      container.querySelectorAll("[data-pagination-atomic-if-fits]"),
    ) as HTMLElement[];

    const straddleColumnRoot = resolvePaginationStraddleColumn(container);

    type MeasuredEl = PaginationElementInput & { node: HTMLElement };

    const elements: PaginationElementInput[] = (
      [...headerNodes, ...itemNodes].map((node) => {
        const elementNode = node as HTMLElement;
        const rect = elementNode.getBoundingClientRect();
        const isHeader = elementNode.hasAttribute("data-section-header");
        const textContent = elementNode.textContent?.trim() || "";
        const hasRenderableChild =
          elementNode.querySelector(
            "img,svg,canvas,p,li,h1,h2,h3,h4,h5,h6,a,span,table",
          ) !== null;
        const useForStraddlingRules =
          straddleColumnRoot === null ||
          straddleColumnRoot.contains(elementNode);

        return {
          node: elementNode,
          top: Math.floor(rect.top - containerRect.top),
          bottom: Math.ceil(rect.bottom - containerRect.top),
          height: Math.ceil(rect.height),
          kind: (isHeader ? "header" : "item") as "header" | "item",
          hasMeaningfulContent: isHeader
            ? textContent.length > 0 || hasRenderableChild
            : true,
          useForStraddlingRules,
        };
      }) as MeasuredEl[]
    )
      .sort((a, b) => {
        if (a.top !== b.top) return a.top - b.top;
        const order =
          a.node.compareDocumentPosition(b.node) &
          Node.DOCUMENT_POSITION_FOLLOWING;
        return order ? -1 : 1;
      })
      .map(({ node: _n, ...rest }) => rest);

    const integerLimit = Math.max(
      120,
      Math.floor(pageHeightLimitRef.current) - PAGE_BOTTOM_CLIP_SAFETY_PX,
    );

    const atomicIfFitsOnOnePage: PaginationAtomicIfFitsBox[] =
      atomicIfFitsNodes.map((node) => {
        const r = node.getBoundingClientRect();
        return {
          top: Math.floor(r.top - containerRect.top),
          bottom: Math.ceil(r.bottom - containerRect.top),
        };
      });

    const textLines = measureTextLineBounds(container);
    const tailSliverMaxPx = resolveTailSliverMaxPx(textLines);

    let trimmedPages = runResumePagination(
      fullHeight,
      elements,
      integerLimit,
      atomicIfFitsOnOnePage,
      tailSliverMaxPx,
    );

    if (snapRef.current) {
      trimmedPages = snapResumePageBreaksToLineBounds(
        container,
        trimmedPages,
        fullHeight,
      );
      trimmedPages = trimTrailingEmptySliverPages(trimmedPages, elements);
      trimmedPages = snapResumePageBreaksToLineBounds(
        container,
        trimmedPages,
        fullHeight,
      );
    }

    trimmedPages = trimTrailingEmptySliverPages(trimmedPages, elements);

    const finalTextLines = measureTextLineBounds(container);
    const hasMidLinePageCut =
      snapRef.current &&
      finalTextLines.length > 0 &&
      trimmedPages.length > 1 &&
      trimmedPages.slice(0, -1).some((page) =>
        cutSplitsTextLine(page.offsetY + page.height, finalTextLines),
      );

    if (
      hasMidLinePageCut &&
      underPagedRetriesRef.current < MAX_UNDERPAGED_RETRIES
    ) {
      underPagedRetriesRef.current += 1;
      requestAnimationFrame(() => measureNowRef.current(keyForPass));
      return;
    }

    // Under-paged guard: content clearly spans >1 page but we only got one band
    // (DOM still reflowing). Retry instead of committing a clipped single page.
    const lastBand = trimmedPages[trimmedPages.length - 1];
    const spanEnd = lastBand ? lastBand.offsetY + lastBand.height : 0;
    if (
      trimmedPages.length === 1 &&
      fullHeight > integerLimit + 48 &&
      fullHeight > spanEnd + 32 &&
      underPagedRetriesRef.current < MAX_UNDERPAGED_RETRIES
    ) {
      underPagedRetriesRef.current += 1;
      requestAnimationFrame(() => measureNowRef.current(keyForPass));
      return;
    }

    emptyDomRetriesRef.current = 0;
    underPagedRetriesRef.current = 0;
    lastMeasuredHeightRef.current = fullHeight;

    if (isResumePaginationDebugEnabled()) {
      debugResumePagination("pagination:measure", {
        keyHead: keyForPass.slice(0, 80),
        fullHeight,
        integerLimit,
        headerCount: headerNodes.length,
        itemCount: itemNodes.length,
        pagesCount: trimmedPages.length,
      });
    }

    // Atomic commit: bands + the key (and therefore the content) they describe.
    setPages(trimmedPages);
    setPagesKey(keyForPass);
    setIsPaginating(false);

    if (activeResume.resumeId && trimmedPages.length > 0) {
      setLastGoodPagesForResume(activeResume.resumeId, trimmedPages);
    }
  }, []);

  measureNowRef.current = measureNow;

  // Single scheduler: remeasure whenever the layout-affecting key changes.
  useLayoutEffect(() => {
    if (!resume?.resumeId || !measureKey) return;

    let cancelled = false;
    // Keep the last good pages on screen; only show the spinner when nothing exists yet.
    setIsPaginating(pagesRef.current.length === 0);
    emptyDomRetriesRef.current = 0;
    underPagedRetriesRef.current = 0;

    const timer = globalThis.setTimeout(() => {
      void (async () => {
        await waitForLayoutSettle();
        if (cancelled) return;
        measureNowRef.current(measureKey);
      })();
    }, PAGINATION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [measureKey, resume?.resumeId]);

  // Catch async layout growth (fonts, images, TipTap reflow) that doesn't change measureKey.
  useEffect(() => {
    if (!resume?.resumeId) return;
    const el = measuringRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (debounce) globalThis.clearTimeout(debounce);
      debounce = globalThis.setTimeout(() => {
        debounce = null;
        const node = measuringRef.current;
        if (!node) return;
        const h = Math.ceil(node.scrollHeight);
        // Ignore the resize caused by our own just-completed measure.
        if (Math.abs(h - lastMeasuredHeightRef.current) < 2) return;
        void (async () => {
          await waitForLayoutSettle();
          if (!measuringRef.current) return;
          emptyDomRetriesRef.current = 0;
          underPagedRetriesRef.current = 0;
          measureNowRef.current(measureKeyRef.current);
        })();
      }, PAGINATION_DEBOUNCE_MS);
    });

    ro.observe(el, { box: "border-box" });

    return () => {
      ro.disconnect();
      if (debounce) globalThis.clearTimeout(debounce);
    };
  }, [resume?.resumeId]);

  return {
    pages,
    pagesKey,
    isPaginating,
    measuringRef,
  };
}
