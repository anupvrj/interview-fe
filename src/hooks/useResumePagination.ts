import { useState, useEffect, useRef } from "react";
import { Resume } from "@/lib/api";
import {
  collectOrphanRepairBoxes,
  fixOrphanSemanticBoxes,
  runResumePagination,
  trimTrailingEmptySliverPages,
  type PaginationAtomicIfFitsBox,
  type PaginationElementInput,
} from "@/lib/resume-pagination-engine";
import { resolvePaginationStraddleColumn } from "@/lib/resolve-pagination-straddle-column";
import { snapResumePageBreaksToLineBounds } from "@/lib/snap-resume-page-breaks";

export interface PageData {
  pageNumber: number;
  offsetY: number;
  height: number;
}

interface PaginationOptions {
  resume: Resume | null;
  sections: any[];
  isTwoColumn: boolean;
  pageHeightLimit: number; // Max content height per page in pixels
  /** Snap cuts to text line bounds (corporate template only; other layouts rely on default bands). */
  snapPageBreaksToLineBounds?: boolean;
}

const INITIAL_PAGINATION_DELAY_MS = 200;
const SETTLE_PAGINATION_DELAY_MS = 120;

export function useResumePagination({
  resume,
  sections,
  isTwoColumn,
  pageHeightLimit,
  snapPageBreaksToLineBounds = false,
}: PaginationOptions) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [totalHeight, setTotalHeight] = useState(0);
  const measuringRef = useRef<HTMLDivElement>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!resume || !measuringRef.current) return;

    setIsPaginating(true);
    setIsCalculated(false);

    const timeoutId = setTimeout(() => {
      calculatePages();

      const settleTimeoutId = globalThis.setTimeout(() => {
        calculatePages();
      }, SETTLE_PAGINATION_DELAY_MS);
      settleTimeoutRef.current = settleTimeoutId;
    }, INITIAL_PAGINATION_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
      if (settleTimeoutRef.current !== null) {
        clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
    };
  }, [resume, sections, isTwoColumn, pageHeightLimit, snapPageBreaksToLineBounds]);

  const calculatePages = () => {
    if (!measuringRef.current || !resume) {
      setIsPaginating(false);
      return;
    }

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

    const atomicIfFitsOnOnePage: PaginationAtomicIfFitsBox[] =
      atomicIfFitsNodes.map((node) => {
        const r = node.getBoundingClientRect();
        return {
          top: Math.floor(r.top - containerRect.top),
          bottom: Math.ceil(r.bottom - containerRect.top),
        };
      });

    let trimmedPages = runResumePagination(
      fullHeight,
      elements,
      integerLimit,
      atomicIfFitsOnOnePage,
    );

    if (snapPageBreaksToLineBounds) {
      trimmedPages = snapResumePageBreaksToLineBounds(
        container,
        trimmedPages,
        fullHeight,
      );
    }

    const orphanBoxes = collectOrphanRepairBoxes(elements);
    for (let pass = 0; pass < 6; pass++) {
      const next = fixOrphanSemanticBoxes(trimmedPages, orphanBoxes);
      if (
        next.length === trimmedPages.length &&
        next.every(
          (p, idx) =>
            p.offsetY === trimmedPages[idx].offsetY &&
            p.height === trimmedPages[idx].height,
        )
      ) {
        trimmedPages = next;
        break;
      }
      trimmedPages = next;
    }

    trimmedPages = trimTrailingEmptySliverPages(trimmedPages, elements);

    setPages(trimmedPages);
    setIsPaginating(false);
    setIsCalculated(true);
  };

  return {
    pages,
    totalHeight,
    isPaginating,
    isCalculated,
    measuringRef,
  };
}
