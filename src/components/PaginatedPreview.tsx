"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Trash2 } from "lucide-react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import { ResumeRenderer } from "./ResumeRenderer";
import { useResumePagination } from "@/hooks/useResumePagination";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  ATLANTIC_BLUE_PAGINATED_PAGE_BG,
  getPageViewportTopMm,
  getTemplateContinuationTopMm,
  pageContentHeightPx,
  pageVerticalGuttersMm,
  resolveEffectiveLayoutPaddingMm,
} from "@/lib/resume-page-dimensions";
import { debugResumePagination } from "@/lib/debug-resume-pagination";
import { buildResumeContentMeasureKey } from "@/lib/resume-content-measure-key";
import type { PageData } from "@/hooks/useResumePagination";
import {
  applyDismissedEmptyTrailingPages,
  canDeleteEmptyResumePage,
  canDeleteResumePage,
  filterNonEmptyPreviewPages,
  isEmptyResumePageBand,
} from "@/lib/resume-page-delete";
import { cn } from "@/lib/utils";

export interface ResumePaginationSnapshot {
  /** Display pagination bands (after blank-page dismissals). */
  pages: PageData[];
  /** Live pagination bands from the committed measure pass. */
  rawPages: PageData[];
  measureRoot: HTMLElement | null;
  isCalculated: boolean;
}

interface PaginatedPreviewProps {
  resume: Resume;
  template: ResumeTemplate;
  sections?: any[];
  layout?: any;
  /** User-dismissed blank trailing pages (persisted in resume layout). */
  dismissedEmptyTrailingPages?: number;
  onPageDelete?: (payload: {
    pageNumber: number;
    totalPages: number;
  }) => void;
  onPaginationSnapshot?: (snapshot: ResumePaginationSnapshot) => void;
}

/**
 * A committed render frame. Page bands are only valid for the exact content they were
 * measured against, so we pair them atomically with the resume/sections/layout/template
 * used. The hidden measure DOM always renders the live props; the visible pages render
 * from this frame. The frame swaps only when a fresh measure for the current key lands,
 * which makes a band/content mismatch (clipping, blank pages) impossible.
 */
interface PreviewFrame {
  key: string;
  pages: PageData[];
  resume: Resume;
  sections: any[] | undefined;
  layout: any;
  template: ResumeTemplate;
}

/** Bleed at continuation page tops so ascenders are not clipped at the cut. */
const PAGE_CLIP_BLEED_PX = 8;
/** Extra breathing room at the top of page 2+ after a page break. */
const CONTINUATION_PAGE_TOP_PAD_PX = 10;

export const PaginatedPreview: React.FC<PaginatedPreviewProps> = ({
  resume,
  template,
  sections,
  layout,
  dismissedEmptyTrailingPages = 0,
  onPageDelete,
  onPaginationSnapshot,
}) => {
  const currentLayout = layout || resume.layout || { type: "single" };

  /** Same padding merge as ResumeRenderer + server PDF (no double-counting @page). */
  const paddingMm = useMemo(() => {
    const templatePadding = getTemplateStyle(getExtendedTemplate(template)).padding;
    return resolveEffectiveLayoutPaddingMm(
      template.id,
      currentLayout.padding as
        | { top: number; bottom: number; left: number; right: number }
        | undefined,
      templatePadding,
    );
  }, [
    template,
    currentLayout.type,
    currentLayout.padding?.top,
    currentLayout.padding?.bottom,
    currentLayout.padding?.left,
    currentLayout.padding?.right,
  ]);
  const { topMm: TOP_MARGIN_MM, contentHeightMm: CONTENT_HEIGHT_MM } =
    pageVerticalGuttersMm(paddingMm);

  const typographyKey = useMemo(() => {
    const fs = currentLayout.fontSize as
      | {
          heading?: number;
          subheading?: number;
          body?: number;
          small?: number;
          sectionHeader?: number;
        }
      | undefined;
    return [
      fs?.heading ?? "",
      fs?.subheading ?? "",
      fs?.body ?? "",
      fs?.small ?? "",
      fs?.sectionHeader ?? "",
      currentLayout.fontFamily ?? "",
    ].join("|");
  }, [currentLayout.fontSize, currentLayout.fontFamily]);

  const contentMeasureKey = useMemo(
    () => buildResumeContentMeasureKey(resume),
    [resume],
  );

  const sectionOrderKey = useMemo(
    () =>
      sections
        ?.map((s, idx) => `${idx}:${s.id}-${s.visible}-${s.column ?? ""}`)
        .join("|") ?? "",
    [sections],
  );

  /** Single source of truth for "what affects layout" — drives both measure + commit. */
  const rendererKey = useMemo(() => {
    const padKey = `${paddingMm.top}-${paddingMm.bottom}-${paddingMm.left}-${paddingMm.right}`;
    return `${sectionOrderKey}-${template.id}-${currentLayout.type}-${padKey}-${typographyKey}-${contentMeasureKey}`;
  }, [
    sectionOrderKey,
    template.id,
    currentLayout.type,
    paddingMm,
    typographyKey,
    contentMeasureKey,
  ]);

  const isAtlanticBlue = template.id === "atlantic-blue";
  const continuationTopMm = getTemplateContinuationTopMm(
    template.id,
    paddingMm.top,
  );
  const pageHeightLimit = pageContentHeightPx(CONTENT_HEIGHT_MM);
  const continuationPageHeightLimit =
    continuationTopMm > 0
      ? pageContentHeightPx(CONTENT_HEIGHT_MM - continuationTopMm)
      : undefined;

  const { pages, pagesKey, isPaginating, measuringRef } = useResumePagination({
    resume,
    sections: sections || [],
    pageHeightLimit,
    continuationPageHeightLimit,
    /** Snap page cuts to line boundaries for all templates (rich text / multi-line items). */
    snapPageBreaksToLineBounds: true,
    measureKey: rendererKey,
  });

  // ---- Atomic double buffer ----
  const [frame, setFrame] = useState<PreviewFrame>(() => ({
    key: "",
    pages: [],
    resume,
    sections,
    layout,
    template,
  }));

  useLayoutEffect(() => {
    // Commit only when the freshly measured bands belong to the current content.
    if (pagesKey && pagesKey === rendererKey && pages.length > 0) {
      setFrame({ key: rendererKey, pages, resume, sections, layout, template });
    }
  }, [pagesKey, rendererKey, pages, resume, sections, layout, template]);

  const frameIsCurrent = frame.key === rendererKey;

  /** Visible bands: dismiss blank trailing pages / drop empty pages only when the
   *  committed frame matches the live measure DOM (otherwise show frame bands as-is). */
  const visiblePages = useMemo(() => {
    if (frame.pages.length === 0) return [] as PageData[];
    if (!frameIsCurrent) return frame.pages;

    const measureRoot = measuringRef.current;
    const dismissed = applyDismissedEmptyTrailingPages(
      frame.pages,
      measureRoot,
      dismissedEmptyTrailingPages,
    );

    if (onPageDelete || !measureRoot) return dismissed;

    const nonEmpty = filterNonEmptyPreviewPages(measureRoot, dismissed);
    return nonEmpty.length > 0 ? nonEmpty : dismissed;
    // measuringRef is stable; rendererKey gating handled via frameIsCurrent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, frameIsCurrent, dismissedEmptyTrailingPages, onPageDelete]);

  const totalPreviewPages = visiblePages.length;

  const isPageEmpty = useCallback(
    (page: PageData): boolean => {
      const measureRoot =
        measuringRef.current ??
        document.getElementById(`resume-measure-${resume.resumeId}`);
      return isEmptyResumePageBand(measureRoot, page);
    },
    // measuringRef is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resume.resumeId],
  );

  const canShowPageDeleteControl = useCallback(
    (page: PageData): boolean =>
      canDeleteResumePage(page.pageNumber, totalPreviewPages),
    [totalPreviewPages],
  );

  // Report the committed frame so page-delete acts on bands that match the DOM.
  useLayoutEffect(() => {
    onPaginationSnapshot?.({
      pages: visiblePages,
      rawPages: frame.pages,
      measureRoot: measuringRef.current,
      isCalculated: frameIsCurrent && !isPaginating,
    });
    // measuringRef is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePages, frame, frameIsCurrent, isPaginating, onPaginationSnapshot]);

  const handlePageDeleteClick = useCallback(
    (page: PageData) => {
      if (!onPageDelete || !isPageEmpty(page)) return;

      const measureRoot =
        measuringRef.current ??
        document.getElementById(`resume-measure-${resume.resumeId}`);

      if (!canDeleteEmptyResumePage(measureRoot, page.pageNumber, visiblePages)) {
        return;
      }

      onPageDelete({
        pageNumber: page.pageNumber,
        totalPages: totalPreviewPages,
      });
    },
    // measuringRef is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPageEmpty, onPageDelete, visiblePages, resume.resumeId, totalPreviewPages],
  );

  useEffect(() => {
    debugResumePagination("PaginatedPreview:frame", {
      resumeId: resume.resumeId,
      templateId: template.id,
      rendererKeyHead: rendererKey.slice(0, 80),
      pagesCount: pages.length,
      framePages: frame.pages.length,
      frameIsCurrent,
      isPaginating,
    });
  }, [
    resume.resumeId,
    template.id,
    rendererKey,
    pages.length,
    frame.pages.length,
    frameIsCurrent,
    isPaginating,
  ]);

  const showSpinner = visiblePages.length === 0;

  return (
    <>
      {/* Hidden measure DOM — always renders the LIVE props. */}
      <div
        ref={measuringRef}
        id={`resume-measure-${resume.resumeId}`}
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

      {showSpinner && isPaginating && (
        <div className="text-gray-400 text-sm mt-4 animate-pulse">
          Optimizing layout...
        </div>
      )}

      {/* Visible pages — render from the committed frame (bands + matching content). */}
      {visiblePages.length > 0 && (
        <div
          className="inline-block"
          style={{ paddingRight: onPageDelete ? "44px" : undefined }}
        >
          <div className="flex flex-col items-center">
            {visiblePages.map((page, index) => {
              const isContinuationPage = index > 0;
              const topBleed = isContinuationPage ? PAGE_CLIP_BLEED_PX : 0;
              const pageViewportTopMm = getPageViewportTopMm(
                template.id,
                isContinuationPage,
                TOP_MARGIN_MM,
                continuationTopMm,
              );
              const continuationPadPx =
                isContinuationPage && continuationTopMm === 0
                  ? CONTINUATION_PAGE_TOP_PAD_PX
                  : 0;

              return (
              <div
                key={`page-wrap-${index}-${frame.key}`}
                className="relative mb-5"
                style={{ width: `${A4_WIDTH_MM}mm` }}
              >
                <div
                  className={
                    isAtlanticBlue
                      ? "resume-page resume-page--atlantic-blue"
                      : "resume-page"
                  }
                  style={{
                    width: `${A4_WIDTH_MM}mm`,
                    height: `${A4_HEIGHT_MM}mm`,
                    maxHeight: `${A4_HEIGHT_MM}mm`,
                    overflow: "hidden",
                    position: "relative",
                    background: isAtlanticBlue
                      ? ATLANTIC_BLUE_PAGINATED_PAGE_BG
                      : "#ffffff",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: `${pageViewportTopMm}mm`,
                      left: 0,
                      width: `${A4_WIDTH_MM}mm`,
                      height: `${page.height + topBleed + continuationPadPx}px`,
                      paddingTop: `${continuationPadPx}px`,
                      boxSizing: "border-box",
                      overflow: "hidden",
                      background: isAtlanticBlue
                        ? ATLANTIC_BLUE_PAGINATED_PAGE_BG
                        : "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: `-${page.offsetY - topBleed}px`,
                        left: 0,
                        width: "100%",
                      }}
                    >
                      <ResumeRenderer
                        resume={frame.resume}
                        template={frame.template}
                        sections={frame.sections}
                        layout={frame.layout}
                        pageNumber={page.pageNumber}
                      />
                    </div>
                  </div>
                </div>

                {onPageDelete && canShowPageDeleteControl(page) ? (
                  <button
                    type="button"
                    disabled={!isPageEmpty(page)}
                    onClick={() => handlePageDeleteClick(page)}
                    className={cn(
                      "absolute top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-background shadow-sm transition-colors",
                      isPageEmpty(page)
                        ? "text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        : "cursor-not-allowed text-muted-foreground/40 opacity-50",
                    )}
                    style={{ left: `calc(${A4_WIDTH_MM}mm + 12px)` }}
                    title={
                      isPageEmpty(page)
                        ? `Remove blank page ${page.pageNumber}`
                        : `Page ${page.pageNumber} has content and cannot be deleted`
                    }
                    aria-label={
                      isPageEmpty(page)
                        ? `Remove blank page ${page.pageNumber}`
                        : `Page ${page.pageNumber} has content`
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            );
            })}
          </div>
        </div>
      )}
    </>
  );
};
