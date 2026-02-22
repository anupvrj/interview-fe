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

  useEffect(() => {
    if (!resume || !measuringRef.current) return;

    setIsPaginating(true);
    setIsCalculated(false);

    const timeoutId = setTimeout(() => {
      calculatePages();
    }, 200);

    return () => clearTimeout(timeoutId);
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
    const sectionNodes = Array.from(container.querySelectorAll("[data-section]"));
    const itemNodes = Array.from(container.querySelectorAll("[data-item-id]"));

    // Map elements to their boundaries with integer rounding
    const elements = [...sectionNodes, ...itemNodes].map(node => {
      const rect = (node as HTMLElement).getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return {
        id: (node as HTMLElement).getAttribute("data-section") || (node as HTMLElement).getAttribute("data-item-id"),
        top: Math.floor(rect.top - containerRect.top),
        bottom: Math.ceil(rect.bottom - containerRect.top),
        height: Math.ceil(rect.height),
        isSection: (node as HTMLElement).hasAttribute("data-section")
      };
    }).sort((a, b) => a.top - b.top);

    // 2. Dynamic Slicing Logic with Integer Math
    const newPages: PageData[] = [];
    let currentY = 0;
    let pageNum = 1;

    // Use a slightly larger target limit to ensure we utilize space, but floor it for safety
    const integerLimit = Math.floor(pageHeightLimit);

    while (currentY < fullHeight - 5) {
      let targetEndY = currentY + integerLimit;
      let safeEndY = targetEndY;

      // Find all elements straddling the target break point
      const straddlingElements = elements.filter(el => el.top < targetEndY && el.bottom > targetEndY);

      if (straddlingElements.length > 0) {
        // Prioritize atomic items (data-item-id) over section wrappers
        const atomicElement = [...straddlingElements].reverse().find(el => !el.isSection) || straddlingElements[0];
        
        const visibleOnPageHeight = targetEndY - atomicElement.top;
        
        if (atomicElement.isSection) {
          // Protect Section Header: Push if less than 80px visible
          if (visibleOnPageHeight < 80) {
            safeEndY = atomicElement.top;
          }
        } else {
          // Protect Items: Push if too brief (sliver prevention)
          // Increased to 120px for robust protection against orphaned lines/headers
          if (atomicElement.height < 150 || visibleOnPageHeight < 120) {
            safeEndY = atomicElement.top;
          }
        }
      }

      // Enforce Integer Slicing: This prevents "half-line" cuts
      safeEndY = Math.floor(safeEndY);

      // Safety check: if safeEndY hasn't progressed, force it to targetEndY
      if (safeEndY <= currentY) {
         safeEndY = targetEndY;
      }

      newPages.push({
        pageNumber: pageNum++,
        offsetY: Math.floor(currentY),
        height: Math.floor(safeEndY - currentY)
      });

      currentY = safeEndY;
    }

    setPages(newPages);
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
