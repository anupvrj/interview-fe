import { useState, useEffect, useRef } from "react";
import { Resume } from "@/lib/api";

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
}

const INITIAL_PAGINATION_DELAY_MS = 200;
const SETTLE_PAGINATION_DELAY_MS = 120;
const BREAKPOINT_PADDING_PX = 5;
const MIN_VISIBLE_SECTION_HEADER_PX = 80;
const MIN_VISIBLE_ITEM_PX = 120;
const MIN_ITEM_HEIGHT_PX = 150;
const TRAILING_EMPTY_SLIVER_MAX_PX = 80;

export function useResumePagination({
  resume,
  sections,
  isTwoColumn,
  pageHeightLimit,
}: PaginationOptions) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [totalHeight, setTotalHeight] = useState(0);
  const measuringRef = useRef<HTMLDivElement>(null);
  const settleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!resume || !measuringRef.current) return;

    setIsPaginating(true);
    setIsCalculated(false);

    const timeoutId = setTimeout(() => {
      calculatePages();

      // Run a quick second pass after layout settles (fonts/rich text/DOM updates)
      // so new overflow pages appear immediately without requiring a reload.
      const settleTimeoutId = window.setTimeout(() => {
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
  }, [resume, sections, isTwoColumn, pageHeightLimit]);

  const calculatePages = () => {
    if (!measuringRef.current || !resume) {
      setIsPaginating(false);
      return;
    }

    const container = measuringRef.current;

    // Use Math.ceil for fullHeight to avoid sub-pixel scroll issues
    const fullHeight = Math.ceil(container.scrollHeight);
    setTotalHeight(fullHeight);

    // 1. Get all semantic elements
    const sectionNodes = Array.from(
      container.querySelectorAll("[data-section]"),
    );
    const itemNodes = Array.from(container.querySelectorAll("[data-item-id]"));

    // Map elements to their boundaries with integer rounding
    const elements = [...sectionNodes, ...itemNodes]
      .map((node) => {
        const elementNode = node as HTMLElement;
        const rect = elementNode.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const isSection = elementNode.hasAttribute("data-section");
        const textContent = elementNode.textContent?.trim() || "";
        const hasRenderableChild =
          elementNode.querySelector(
            "img,svg,canvas,p,li,h1,h2,h3,h4,h5,h6,a,span,table",
          ) !== null;

        return {
          id:
            elementNode.getAttribute("data-section") ||
            elementNode.getAttribute("data-item-id"),
          top: Math.floor(rect.top - containerRect.top),
          bottom: Math.ceil(rect.bottom - containerRect.top),
          height: Math.ceil(rect.height),
          isSection,
          hasMeaningfulContent: isSection
            ? textContent.length > 0 || hasRenderableChild
            : true,
        };
      })
      .sort((a, b) => a.top - b.top);

    // 2. Dynamic Slicing Logic with Integer Math
    const newPages: PageData[] = [];
    let currentY = 0;
    let pageNum = 1;

    // Use a slightly larger target limit to ensure we utilize space, but floor it for safety
    const integerLimit = Math.floor(pageHeightLimit);

    while (currentY < fullHeight - BREAKPOINT_PADDING_PX) {
      // Cap target to actual measured content height.
      // Without this, the last page can be created with a full-page height
      // even when only a tiny remainder exists.
      let targetEndY = Math.min(currentY + integerLimit, fullHeight);
      let safeEndY = targetEndY;

      // Find all elements straddling the target break point
      const straddlingElements = elements.filter(
        (el) => el.top < targetEndY && el.bottom > targetEndY,
      );

      if (straddlingElements.length > 0) {
        // Prioritize atomic items (data-item-id) over section wrappers
        const atomicElement =
          [...straddlingElements].reverse().find((el) => !el.isSection) ||
          straddlingElements[0];

        const visibleOnPageHeight = targetEndY - atomicElement.top;

        if (atomicElement.isSection) {
          // Protect Section Header: Push if less than 80px visible
          if (visibleOnPageHeight < MIN_VISIBLE_SECTION_HEADER_PX) {
            safeEndY = atomicElement.top;
          }
        } else {
          // Protect Items: Push if too brief (sliver prevention)
          // Increased to 120px for robust protection against orphaned lines/headers
          if (
            atomicElement.height < MIN_ITEM_HEIGHT_PX ||
            visibleOnPageHeight < MIN_VISIBLE_ITEM_PX
          ) {
            safeEndY = atomicElement.top;
          }
        }
      }

      // Enforce Integer Slicing: This prevents "half-line" cuts
      safeEndY = Math.floor(safeEndY);
      safeEndY = Math.min(safeEndY, fullHeight);

      // Safety check: if safeEndY hasn't progressed, force it to targetEndY
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

    // Drop only tiny trailing empty sliver pages.
    // Full non-sliver pages are kept to avoid disappearing content during edits.
    const hasContentInRange = (startY: number, endY: number) =>
      elements.some(
        (el) =>
          el.bottom > startY &&
          el.top < endY &&
          el.height > 2 &&
          el.hasMeaningfulContent,
      );

    let lastContentPageIndex = newPages.length - 1;
    while (lastContentPageIndex > 0) {
      const page = newPages[lastContentPageIndex];
      const startY = page.offsetY;
      const endY = page.offsetY + page.height;
      const isTinySliver = page.height <= TRAILING_EMPTY_SLIVER_MAX_PX;
      if (hasContentInRange(startY, endY)) {
        break;
      }
      if (!isTinySliver) {
        break;
      }
      lastContentPageIndex--;
    }

    const trimmedPages = newPages.slice(0, lastContentPageIndex + 1);
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
