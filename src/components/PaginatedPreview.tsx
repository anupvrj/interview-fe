"use client";

import React, { useMemo } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { ResumeRenderer } from "./ResumeRenderer";
import { useResumePagination } from "@/hooks/useResumePagination";

interface PaginatedPreviewProps {
  resume: Resume;
  template: ResumeTemplate;
  sections?: any[];
  layout?: any;
}

export const PaginatedPreview: React.FC<PaginatedPreviewProps> = ({
  resume,
  template,
  sections,
  layout,
}) => {
  // Use config layout or fallback
  const currentLayout = layout || resume.layout || { type: "single" };
  const isTwoColumn = currentLayout.type === "double";

  // Create a tracking key so the paginator knows exactly when to rerun
  const rendererKey = useMemo(() => {
    return sections?.map((s, idx) => `${idx}:${s.id}-${s.visible}`).join("|") + `-${currentLayout.type}`;
  }, [sections, currentLayout.type]);

  const A4_HEIGHT_IN_PX = 1120; // safe approximation for a standard 297mm print height at web DPI (minus margins)

  const PAGE_HEIGHT_MM = 297;
  const TOP_MARGIN_MM = 5; // Reduced from 15mm
  const BOTTOM_MARGIN_MM = 5; // Reduced from 15mm
  const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - TOP_MARGIN_MM - BOTTOM_MARGIN_MM;

  // 1. Hook up the math pagination engine
  const { pages, totalHeight, isPaginating, measuringRef } = useResumePagination({
    resume,
    sections: sections || [],
    isTwoColumn,
    pageHeightLimit: (CONTENT_HEIGHT_MM / 297) * 1122.5, // Calc pixel limit based on content height
  });


  return (
    <>
      {/* 2. THE MEASUREMENT DOM (INVISIBLE) */}
      <div
        ref={measuringRef}
        key={`measure-${rendererKey}`}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          top: -10000,
          left: -10000,
          width: "210mm",
        }}
      >
        <ResumeRenderer
          resume={resume}
          template={template}
          sections={sections}
          layout={layout}
        />
      </div>

      {/* 3. THE ACTUAL RENDER TARGET */}
      <div className="flex flex-col items-center">
        {pages.map((page, index) => (
          <div
            key={`page-${index}-${rendererKey}`}
            className="resume-page"
            style={{
              width: "210mm",
              height: `${PAGE_HEIGHT_MM}mm`,
              maxHeight: `${PAGE_HEIGHT_MM}mm`,
              overflow: "hidden",
              marginBottom: "20px",
              position: "relative",
              background: "white",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* 
              THE VIEWPORT: Uses strict pixel height from the semantic calculation.
              Top margin is fixed at 15mm.
            */}
            <div
              style={{
                position: "absolute",
                top: `${TOP_MARGIN_MM}mm`,
                left: 0,
                width: "210mm",
                height: `${page.height}px`, // Dynamic semantic height
                overflow: "hidden",
              }}
            >
              {/* The windowed renderer */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  // Move content UP by the calculated semantic offset (forced integer)
                  transform: `translateY(-${Math.floor(page.offsetY)}px)`,
                }}
              >
                <ResumeRenderer
                  resume={resume}
                  template={template}
                  sections={sections}
                  layout={layout}
                  pageNumber={page.pageNumber}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isPaginating && (
        <div className="text-gray-400 text-sm mt-4 animate-pulse">
          Optimizing floor...
        </div>
      )}
    </>
  );
};
