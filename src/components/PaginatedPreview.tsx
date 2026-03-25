"use client";

import React, { useMemo } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import { ResumeRenderer } from "./ResumeRenderer";
import { useResumePagination } from "@/hooks/useResumePagination";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  mergeLayoutPaddingWithTemplateStyle,
  pageVerticalGuttersMm,
  resolveLayoutPaddingMm,
} from "@/lib/resume-page-dimensions";

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
  const currentLayout = layout || resume.layout || { type: "single" };
  const isTwoColumn = currentLayout.type === "double";

  /** Same padding merge as ResumeRenderer + server PDF (no double-counting @page). */
  const paddingMm = useMemo(() => {
    const templatePadding = getTemplateStyle(getExtendedTemplate(template)).padding;
    return resolveLayoutPaddingMm(
      mergeLayoutPaddingWithTemplateStyle(
        currentLayout.padding as
          | { top: number; bottom: number; left: number; right: number }
          | undefined,
        templatePadding,
      ),
    );
  }, [
    template.id,
    currentLayout.type,
    currentLayout.padding?.top,
    currentLayout.padding?.bottom,
    currentLayout.padding?.left,
    currentLayout.padding?.right,
  ]);
  const { topMm: TOP_MARGIN_MM, contentHeightMm: CONTENT_HEIGHT_MM } =
    pageVerticalGuttersMm(paddingMm);

  const rendererKey = useMemo(() => {
    const padKey = `${paddingMm.top}-${paddingMm.bottom}-${paddingMm.left}-${paddingMm.right}`;
    return (
      sections?.map((s, idx) => `${idx}:${s.id}-${s.visible}`).join("|") +
      `-${currentLayout.type}-${padKey}`
    );
  }, [sections, currentLayout.type, paddingMm]);

  const isAtlanticBlue = template.id === "atlantic-blue";

  const { pages, isPaginating, measuringRef } =
    useResumePagination({
      resume,
      sections: sections || [],
      isTwoColumn,
      pageHeightLimit: (CONTENT_HEIGHT_MM / A4_HEIGHT_MM) * 1122.5,
    });

  return (
    <>
      <div
        ref={measuringRef}
        key={`measure-${rendererKey}`}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          top: -10000,
          left: -10000,
          width: `${A4_WIDTH_MM}mm`,
        }}
      >
        <ResumeRenderer
          resume={resume}
          template={template}
          sections={sections}
          layout={layout}
        />
      </div>

      <div className="flex flex-col items-center">
        {pages.map((page, index) => (
          <div
            key={`page-${index}-${rendererKey}`}
            className={
              isAtlanticBlue ? "resume-page resume-page--atlantic-blue" : "resume-page"
            }
            style={{
              width: `${A4_WIDTH_MM}mm`,
              height: `${A4_HEIGHT_MM}mm`,
              maxHeight: `${A4_HEIGHT_MM}mm`,
              overflow: "hidden",
              marginBottom: "20px",
              position: "relative",
              background: isAtlanticBlue ? undefined : "white",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: `${TOP_MARGIN_MM}mm`,
                left: 0,
                width: `${A4_WIDTH_MM}mm`,
                height: `${page.height}px`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  /* top (not marginTop): Chromium PDF clips margin-based shifts inside overflow:hidden */
                  top: `-${Math.floor(page.offsetY)}px`,
                  left: 0,
                  width: "100%",
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
