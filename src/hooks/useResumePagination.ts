import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
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
  clearLastGoodPagesForResume,
} from "@/lib/resume-pagination-last-good-cache";
import { resolvePaginationStraddleColumn } from "@/lib/resolve-pagination-straddle-column";
import {
  measureTextLineBounds,
  resolveTailSliverMaxPx,
  snapResumePageBreaksToLineBounds,
} from "@/lib/snap-resume-page-breaks";

/** Same shape as `PageBand` from the pagination engine (preview + PDF slices). */
export type PageData = PageBand;

interface PaginationOptions {
  resume: Resume | null;
  sections: any[];
  isTwoColumn: boolean;
  pageHeightLimit: number; // Max content height per page in pixels
  /** Snap cuts to text line bounds when true (PaginatedPreview enables for all templates). */
  snapPageBreaksToLineBounds?: boolean;
  /**
   * Must change when the measure root is remounted (e.g. PaginatedPreview `key=measure-${rendererKey}`)
   * so ResizeObserver re-attaches to the live node.
   */
  measureLayoutKey?: string;
  /**
   * Changes when typography/padding/layout affects measure height (font size, font family, margins).
   * Triggers immediate remeasure so page bands are not stale while text grows.
   */
  layoutMeasureKey?: string;
}

/** Coalesce rapid resume/section updates (typing, paste) into one measure pass. */
const PAGINATION_DEBOUNCE_MS = 200;

/** Same delay as `handleDownload` before reading layout — catches TipTap/async reflow after rAF (logs6). */
const POST_MEASURE_SETTLE_MS = 100;

/** Cap chained 100ms settle remeasures per burst (reset when debounced effect or RO run starts). */
const MAX_SETTLE_100MS_PASSES = 12;

/** If layout still grows after measure (TipTap/fonts/images), remeasure up to this many extra times. */
const MAX_LAYOUT_STABILIZE_FOLLOW_UPS = 3;

export function useResumePagination({
  resume,
  sections,
  isTwoColumn,
  pageHeightLimit,
  snapPageBreaksToLineBounds = false,
  measureLayoutKey = "",
  layoutMeasureKey = "",
}: PaginationOptions) {
  const [isPaginating, setIsPaginating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [totalHeight, setTotalHeight] = useState(0);
  const measuringRef = useRef<HTMLDivElement>(null);
  /** Resets on each debounced run; limits follow-up remeasures when scrollHeight changes after rAF. */
  const layoutStabilizeFollowUpsUsedRef = useRef(0);
  /** Mirrors download's delayed layout read; cleared when starting a new measure. */
  const layoutSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Limits POST_MEASURE_SETTLE_MS chains per burst; reset with debounced/RO schedule. */
  const settle100msPassesRef = useRef(0);
  const calculatePagesRef = useRef<((pass: "debounced") => void) | null>(null);

  const [pages, setPages] = useState<PageData[]>(() =>
    resume?.resumeId
      ? getLastGoodPagesForResume(resume.resumeId) ?? []
      : [],
  );

  // Run before paint so switching `resumeId` does not flash the previous resume's bands.
  useLayoutEffect(() => {
    if (!resume?.resumeId) return;
    const cached = getLastGoodPagesForResume(resume.resumeId);
    if (cached?.length) {
      setPages(cached);
      debugResumePagination("pagination:hydrateFromCache", {
        resumeId: resume.resumeId,
        pagesCount: cached.length,
      });
    } else {
      setPages([]);
      debugResumePagination("pagination:hydrateFromCacheEmpty", {
        resumeId: resume.resumeId,
      });
    }
  }, [resume?.resumeId]);

  const calculatePages = useCallback((measurePass: "debounced") => {
    if (!measuringRef.current || !resume) {
      setIsPaginating(false);
      return;
    }

    if (layoutSettleTimerRef.current) {
      globalThis.clearTimeout(layoutSettleTimerRef.current);
      layoutSettleTimerRef.current = null;
    }

    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const container = measuringRef.current;
    const containerRect = container.getBoundingClientRect();

    const fullHeight = Math.ceil(container.scrollHeight);
    setTotalHeight(fullHeight);

    const headerNodes = Array.from(
      container.querySelectorAll("[data-section-header]"),
    );
    const itemNodes = Array.from(container.querySelectorAll("[data-item-id]"));

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

    const integerLimit = Math.floor(pageHeightLimit);

    const fontsStatus =
      typeof document !== "undefined" && "fonts" in document
        ? (document as Document & { fonts: FontFaceSet }).fonts.status
        : "n/a";

    let minTop = Infinity;
    let maxBottom = -Infinity;
    for (const el of elements) {
      minTop = Math.min(minTop, el.top);
      maxBottom = Math.max(maxBottom, el.bottom);
    }
    if (elements.length === 0) {
      minTop = 0;
      maxBottom = 0;
    }

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

    if (snapPageBreaksToLineBounds) {
      trimmedPages = snapResumePageBreaksToLineBounds(
        container,
        trimmedPages,
        fullHeight,
      );
    }

    trimmedPages = trimTrailingEmptySliverPages(trimmedPages, elements);

    const t1 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const pagesSummary = trimmedPages.map((p) => ({
      pageNumber: p.pageNumber,
      offsetY: p.offsetY,
      height: p.height,
    }));
    const lastPage = trimmedPages[trimmedPages.length - 1];
    const spanEnd = lastPage ? lastPage.offsetY + lastPage.height : 0;

    debugResumePagination("pagination:calculatePages", {
      pass: measurePass,
      durationMs: Math.round((t1 - t0) * 1000) / 1000,
      fontsStatus,
      fullHeight,
      containerRectHeight: Math.round(containerRect.height * 100) / 100,
      integerLimit,
      headerCount: headerNodes.length,
      itemCount: itemNodes.length,
      atomicIfFitsCount: atomicIfFitsNodes.length,
      elementRange: { minTop, maxBottom },
      pagesCount: trimmedPages.length,
      pagesSummary,
      lastPageSpanEnd: spanEnd,
      spanVsFullHeightDelta: fullHeight - spanEnd,
    });

    setPages(trimmedPages);
    if (resume.resumeId && trimmedPages.length > 0) {
      setLastGoodPagesForResume(resume.resumeId, trimmedPages);
    }
    setIsPaginating(false);
    setIsCalculated(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = measuringRef.current;
        if (!el) return;
        const sh = Math.ceil(el.scrollHeight);
        const delta = sh - fullHeight;
        if (isResumePaginationDebugEnabled()) {
          debugResumePagination("pagination:postMeasure:rAF2", {
            pass: measurePass,
            capturedFullHeight: fullHeight,
            scrollHeightNow: sh,
            delta,
          });
        }
        if (
          delta !== 0 &&
          layoutStabilizeFollowUpsUsedRef.current < MAX_LAYOUT_STABILIZE_FOLLOW_UPS
        ) {
          layoutStabilizeFollowUpsUsedRef.current += 1;
          requestAnimationFrame(() => {
            calculatePagesRef.current?.("debounced");
          });
        }

        // Download path waits 100ms before snapshot; layout often grows after rAF2 (TipTap — logs6).
        layoutSettleTimerRef.current = globalThis.setTimeout(() => {
          layoutSettleTimerRef.current = null;
          const settleEl = measuringRef.current;
          if (!settleEl || !resume) return;
          const shNow = Math.ceil(settleEl.scrollHeight);
          const settleDelta = shNow - fullHeight;
          if (settleDelta === 0) return;
          if (isResumePaginationDebugEnabled()) {
            debugResumePagination("pagination:postMeasure:settle100ms", {
              pass: measurePass,
              capturedFullHeight: fullHeight,
              scrollHeightNow: shNow,
              delta: settleDelta,
            });
          }
          if (settle100msPassesRef.current >= MAX_SETTLE_100MS_PASSES) {
            return;
          }
          settle100msPassesRef.current += 1;
          layoutStabilizeFollowUpsUsedRef.current = 0;
          calculatePagesRef.current?.("debounced");
        }, POST_MEASURE_SETTLE_MS);
      });
    });
  }, [
    resume,
    sections,
    isTwoColumn,
    pageHeightLimit,
    snapPageBreaksToLineBounds,
    layoutMeasureKey,
  ]);

  calculatePagesRef.current = calculatePages;

  /** Typography/layout changes reflow text immediately — remeasure without waiting for debounce. */
  useLayoutEffect(() => {
    if (!resume?.resumeId || !measuringRef.current || !layoutMeasureKey) {
      return;
    }

    clearLastGoodPagesForResume(resume.resumeId);
    setIsPaginating(true);
    setIsCalculated(false);

    let cancelled = false;
    void (async () => {
      if (typeof document !== "undefined" && "fonts" in document) {
        try {
          await (
            document as Document & { fonts: FontFaceSet }
          ).fonts.ready;
        } catch {
          /* ignore */
        }
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      if (cancelled || !measuringRef.current) return;

      layoutStabilizeFollowUpsUsedRef.current = 0;
      settle100msPassesRef.current = 0;
      calculatePagesRef.current?.("debounced");
    })();

    return () => {
      cancelled = true;
    };
  }, [layoutMeasureKey, resume?.resumeId]);

  useEffect(() => {
    if (!resume || !measuringRef.current) return;

    setIsPaginating(true);
    setIsCalculated(false);

    const fontsStatus =
      typeof document !== "undefined" && "fonts" in document
        ? (document as Document & { fonts: FontFaceSet }).fonts.status
        : "n/a";

    debugResumePagination("pagination:effect:schedule", {
      resumeId: resume.resumeId,
      sectionsCount: sections.length,
      sectionsVisible: sections.filter((s: { visible?: boolean }) => s.visible)
        .length,
      isTwoColumn,
      pageHeightLimit,
      snapPageBreaksToLineBounds,
      fontsStatus,
      debounceMs: PAGINATION_DEBOUNCE_MS,
    });

    let cancelled = false;
    const timeoutId = globalThis.setTimeout(() => {
      void (async () => {
        if (cancelled) return;

        const tWait0 =
          typeof performance !== "undefined" ? performance.now() : Date.now();

        // Match download path: measure only after web fonts settle, or scrollHeight
        // and band math reflect fallback metrics and breaks stay wrong (see logs5:
        // first pass fontsStatus "loading" fullHeight 1556 vs "loaded" 1637).
        if (typeof document !== "undefined" && "fonts" in document) {
          try {
            await (
              document as Document & { fonts: FontFaceSet }
            ).fonts.ready;
          } catch {
            /* ignore */
          }
        }

        if (cancelled) return;

        if (isResumePaginationDebugEnabled()) {
          const t1 =
            typeof performance !== "undefined" ? performance.now() : Date.now();
          const fontsStatusAfter =
            typeof document !== "undefined" && "fonts" in document
              ? (document as Document & { fonts: FontFaceSet }).fonts.status
              : "n/a";
          debugResumePagination("pagination:preMeasure:awaitFonts", {
            waitedMs: Math.round((t1 - tWait0) * 1000) / 1000,
            fontsStatusAfter,
          });
        }

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

               if (cancelled) return;

        layoutStabilizeFollowUpsUsedRef.current = 0;
        settle100msPassesRef.current = 0;
        calculatePages("debounced");
      })();
    }, PAGINATION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
      if (layoutSettleTimerRef.current) {
        globalThis.clearTimeout(layoutSettleTimerRef.current);
        layoutSettleTimerRef.current = null;
      }
    };
  }, [
    resume,
    sections,
    isTwoColumn,
    pageHeightLimit,
    snapPageBreaksToLineBounds,
    layoutMeasureKey,
    calculatePages,
  ]);

  /** When measure tree height changes after our pass (editor hydration), remeasure — same outcome as post-download setResume remeasure (logs6). */
  useLayoutEffect(() => {
    if (!resume?.resumeId) return;
    const el = measuringRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let roDebounce: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (roDebounce) globalThis.clearTimeout(roDebounce);
      roDebounce = globalThis.setTimeout(() => {
        roDebounce = null;
        if (!measuringRef.current) return;
        void (async () => {
          if (typeof document !== "undefined" && "fonts" in document) {
            try {
              await (
                document as Document & { fonts: FontFaceSet }
              ).fonts.ready;
            } catch {
              /* ignore */
            }
          }
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve());
            });
          });
          if (!measuringRef.current) return;
          layoutStabilizeFollowUpsUsedRef.current = 0;
          settle100msPassesRef.current = 0;
          calculatePagesRef.current?.("debounced");
        })();
      }, PAGINATION_DEBOUNCE_MS);
    });

    ro.observe(el, { box: "border-box" });

    return () => {
      ro.disconnect();
      if (roDebounce) globalThis.clearTimeout(roDebounce);
    };
  }, [resume?.resumeId, measureLayoutKey]);

  useEffect(() => {
    return () => {
      if (layoutSettleTimerRef.current) {
        globalThis.clearTimeout(layoutSettleTimerRef.current);
        layoutSettleTimerRef.current = null;
      }
    };
  }, []);

  return {
    pages,
    totalHeight,
    isPaginating,
    isCalculated,
    measuringRef,
  };
}
