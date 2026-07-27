import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Resume } from "@/lib/api";
import {
  debugResumePagination,
  isResumePaginationDebugEnabled,
} from "@/lib/debug-resume-pagination";
import {
  getLastGoodPagesForResume,
  setLastGoodPagesForResume,
} from "@/lib/resume-pagination-last-good-cache";
import type { PageBand } from "@/lib/resume-pagination-engine";
import {
  buildMeasuredUnits,
  type MeasuredUnit,
} from "@/lib/resume-pagination/buildMeasuredUnits";
import { packUnitsIntoPages } from "@/lib/resume-pagination/packUnitsIntoPages";

/** Same shape as `PageBand` (preview + PDF slices); kept for snapshot back-compat. */
export type PageData = PageBand;

interface PaginationOptions {
  resume: Resume | null;
  sections: any[];
  pageHeightLimit: number; // A4 content height per page (px)
  measureKey: string;
}

const PAGINATION_DEBOUNCE_MS = 120;
const MAX_EMPTY_DOM_RETRIES = 16;
const MAX_UNDERPAGED_RETRIES = 4;

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

interface PaginationState {
  pages: PageData[];
  /** Visible unit ids per page (drives display:none rendering). */
  pageUnits: string[][];
  /** All known unit ids (used to decide which nodes are hideable). */
  allUnitIds: string[];
  pagesKey: string;
}

const EMPTY_STATE: PaginationState = { pages: [], pageUnits: [], allUnitIds: [], pagesKey: "" };

function isTwoColumnLayout(units: MeasuredUnit[]): boolean {
  return units.some((u) => u.column === "left" || u.column === "right");
}

/** Pack a single column's units; returns per-page unit-id lists. */
function packColumn(units: MeasuredUnit[], pageHeightPx: number) {
  return packUnitsIntoPages(units, pageHeightPx);
}

export function useResumePagination({
  resume,
  sections,
  pageHeightLimit,
  measureKey,
}: PaginationOptions) {
  const measuringRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PaginationState>(() =>
    resume?.resumeId
      ? { pages: getLastGoodPagesForResume(resume.resumeId) ?? [], pageUnits: [], allUnitIds: [], pagesKey: "" }
      : EMPTY_STATE,
  );
  const [isPaginating, setIsPaginating] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const resumeRef = useRef(resume);
  resumeRef.current = resume;
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const pageHeightLimitRef = useRef(pageHeightLimit);
  pageHeightLimitRef.current = pageHeightLimit;
  const measureKeyRef = useRef(measureKey);
  measureKeyRef.current = measureKey;

  const lastMeasuredHeightRef = useRef(0);
  const emptyDomRetriesRef = useRef(0);
  const underPagedRetriesRef = useRef(0);
  const measureNowRef = useRef<(keyForPass: string) => void>(() => {});

  useLayoutEffect(() => {
    if (!resume?.resumeId) {
      setState(EMPTY_STATE);
      return;
    }
    const cached = getLastGoodPagesForResume(resume.resumeId);
    setState({ pages: cached?.length ? cached : [], pageUnits: [], allUnitIds: [], pagesKey: "" });
  }, [resume?.resumeId]);

  /**
   * Measure the intact ResumeRenderer render into atomic units, then greedy bin-pack
   * whole units per column into fixed-height A4 pages. The renderer stays whole on
   * every page; PaginatedPreview hides the units that don't belong on a page via
   * display:none, so they collapse out of flow and the remaining units pack to the
   * top with no clipping and no gaps. Container CSS (timeline rails, grids, sidebar
   * backgrounds) is preserved by construction.
   */
  const measureNow = useCallback((keyForPass: string) => {
    if (keyForPass !== measureKeyRef.current) return;
    const container = measuringRef.current;
    const activeResume = resumeRef.current;
    if (!container || !activeResume) return;

    const fullHeight = Math.ceil(container.scrollHeight);
    const activeSections = sectionsRef.current;
    const { units, columnBudgets } = buildMeasuredUnits(
      container,
      pageHeightLimitRef.current,
    );

    if (
      units.length === 0 &&
      activeSections.some((s: { visible?: boolean }) => s.visible !== false)
    ) {
      if (emptyDomRetriesRef.current < MAX_EMPTY_DOM_RETRIES) {
        emptyDomRetriesRef.current += 1;
        requestAnimationFrame(() => measureNowRef.current(keyForPass));
      } else if (stateRef.current.pages.length === 0) {
        setIsPaginating(false);
      }
      return;
    }

    const twoColumn = isTwoColumnLayout(units);
    const allUnitIds = units.map((u) => u.id);

    let pageUnits: string[][];
    let pages: PageData[];

    if (twoColumn) {
      const left = units.filter((u) => u.column === "left");
      const right = units.filter((u) => u.column === "right");
      // "single"-column units (e.g. Saffron Line's full-width personalInfo header) sit
      // above both columns on page 1 only. They are not part of left/right packing; if
      // we omitted them they would have no page assignment and vanish from every page.
      const single = units.filter((u) => u.column === "single");
      const leftPages = packColumn(left, columnBudgets.left);
      const rightPages = packColumn(right, columnBudgets.right);
      const pageCount = Math.max(leftPages.length, rightPages.length, 1);
      const singleIds = single.map((u) => u.id);
      pageUnits = [];
      pages = [];
      for (let i = 0; i < pageCount; i++) {
        const li = leftPages[i]?.unitIds ?? [];
        const ri = rightPages[i]?.unitIds ?? [];
        const si = i === 0 ? singleIds : [];
        pageUnits.push([...si, ...li, ...ri]);
        // Representative Y-window for snapshot/page-delete back-compat: prefer the
        // main (right) column, fall back to the left column.
        const rep = rightPages[i] ?? leftPages[i];
        pages.push({
          pageNumber: i + 1,
          offsetY: rep?.offsetY ?? 0,
          height: rep?.height ?? 0,
        });
      }
    } else {
      const packed = packColumn(units, columnBudgets.single);
      pageUnits = packed.map((p) => p.unitIds);
      pages = packed.map((p) => ({
        pageNumber: p.pageNumber,
        offsetY: p.offsetY,
        height: p.height,
      }));
    }

    // Under-paged guard: content clearly spans >1 page but we only got one (DOM reflowing).
    const minBudget = Math.min(columnBudgets.left, columnBudgets.right, columnBudgets.single);
    const lastBand = pages[pages.length - 1];
    const spanEnd = lastBand ? lastBand.offsetY + lastBand.height : 0;
    if (
      pages.length === 1 &&
      fullHeight > minBudget + 48 &&
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
        twoColumn,
        unitsCount: units.length,
        pagesCount: pages.length,
      });
    }

    setState({ pages, pageUnits, allUnitIds, pagesKey: keyForPass });
    setIsPaginating(false);
    if (activeResume.resumeId && pages.length > 0) {
      setLastGoodPagesForResume(activeResume.resumeId, pages);
    }
  }, []);

  measureNowRef.current = measureNow;

  useLayoutEffect(() => {
    if (!resume?.resumeId || !measureKey) return;
    let cancelled = false;
    setIsPaginating(stateRef.current.pages.length === 0);
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
    pages: state.pages,
    pageUnits: state.pageUnits,
    allUnitIds: state.allUnitIds,
    pagesKey: state.pagesKey,
    isPaginating,
    measuringRef,
  };
}
