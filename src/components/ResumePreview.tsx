/**
 * Resume Preview Component
 * Configuration-driven resume preview that works with all templates
 */

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, FileText, Eye } from "lucide-react";
import { PaginatedPreview } from "./PaginatedPreview";
import type { ResumePaginationSnapshot } from "./PaginatedPreview";
import { debugResumePagination } from "@/lib/debug-resume-pagination";
import { ResumePdfPreviewDialog } from "./ResumePdfPreviewDialog";
import { cn } from "@/lib/utils";
import {
  resumePreviewZoomHeader,
  resumePreviewZoomHeaderDesktop,
  resumePreviewZoomHeaderMobile,
} from "@/components/resume-editor/resumeEditorStyles";
import { useResumePreviewFitZoom } from "@/hooks/useResumePreviewFitZoom";
import { useResumePreviewPinchZoom } from "@/hooks/useResumePreviewPinchZoom";
import { useResumePreviewTrackpadZoom } from "@/hooks/useResumePreviewTrackpadZoom";

interface Section {
  id: string;
  type:
    | "personalInfo"
    | "profileSummary"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "achievements"
    | "languages"
    | "certificates"
    | "interests"
    | "courses"
    | "awards"
    | "organisations"
    | "publications"
    | "references"
    | "declaration"
    | "quote"
    | "spacer"
    | "custom";
  title: string;
  visible: boolean;
  expanded?: boolean;
  column?: "left" | "right";
}

interface ResumePreviewProps {
  resume: Resume;
  template?: ResumeTemplate;
  sections?: Section[];
  layout?: {
    type: "single" | "double";
    columnWidths?: {
      left: number;
      right: number;
    };
    padding?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    dismissedEmptyTrailingPages?: number;
  };
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  onPageDelete?: (payload: {
    pageNumber: number;
    totalPages: number;
  }) => void;
  onPaginationSnapshot?: (snapshot: ResumePaginationSnapshot) => void;
  /** Remount preview content (re-measure / re-paginate). Falls back to local remount when omitted. */
  onRefresh?: () => void;
  /** Mobile: auto fit page width to viewport and use tighter chrome */
  compact?: boolean;
}

export type ResumePreviewHandle = {
  resetPreview: (options?: {
    resetZoom?: boolean;
    /** `local` remounts PaginatedPreview only; `full` remounts via parent onRefresh. */
    remount?: "local" | "full";
  }) => void;
};

export const ResumePreview = forwardRef<ResumePreviewHandle, ResumePreviewProps>(
  function ResumePreview(
  {
  resume,
  template,
  sections,
  layout,
  zoomLevel: controlledZoomLevel,
  onZoomChange,
  onPageDelete,
  onPaginationSnapshot,
  onRefresh,
  compact = false,
}: ResumePreviewProps,
  ref,
) {
  const pageDeleteGutterPx = onPageDelete ? 44 : 0;
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  // Use controlled zoom if provided, otherwise use internal state
  const [internalZoomLevel, setInternalZoomLevel] = useState(100);
  const zoomLevel = controlledZoomLevel ?? internalZoomLevel;
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  
  // Stable setter — avoids retriggering fit-zoom when zoom value changes
  const setZoomLevel = useCallback((value: number | ((prev: number) => number)) => {
    const newValue =
      typeof value === "function" ? value(zoomLevelRef.current) : value;
    if (onZoomChange) {
      onZoomChange(newValue);
    } else {
      setInternalZoomLevel(newValue);
    }
  }, [onZoomChange]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageMeasureRef = useRef<HTMLDivElement>(null);
  const scaledPageRef = useRef<HTMLDivElement>(null);
  const [pageWidthPx, setPageWidthPx] = useState(0);
  const [scaledLayout, setScaledLayout] = useState({ width: 0, height: 0 });
  const minZoom = compact ? 30 : 50;
  const zoomScale = zoomLevel / 100;

  const measurePageWidth = useCallback(() => {
    const pageMeasure = pageMeasureRef.current;
    if (!pageMeasure) return;
    setPageWidthPx(pageMeasure.offsetWidth);
  }, []);

  const measureScaledLayout = useCallback(() => {
    const scaledPage = scaledPageRef.current;
    if (!scaledPage) return;
    const rect = scaledPage.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setScaledLayout({ width: rect.width, height: rect.height });
    }
  }, []);

  const { markUserAdjusted, resetFitZoom } = useResumePreviewFitZoom({
    enabled: compact,
    pageWidthGutterPx: pageDeleteGutterPx,
    horizontalPadding: compact ? 12 : 80,
    containerRef,
    pageMeasureRef,
    onZoom: setZoomLevel,
    resetKey: `${previewRefreshKey}-${resume.resumeId}`,
  });

  useResumePreviewPinchZoom({
    enabled: true,
    containerRef,
    zoomLevel,
    onZoom: setZoomLevel,
    onUserAdjusted: markUserAdjusted,
    minZoom,
    maxZoom: 200,
  });

  useResumePreviewTrackpadZoom({
    enabled: true,
    rootRef: containerRef,
    zoomLevel,
    onZoom: setZoomLevel,
    onUserAdjusted: markUserAdjusted,
    minZoom,
    maxZoom: 200,
  });

  useEffect(() => {
    measurePageWidth();
    const pageMeasure = pageMeasureRef.current;
    if (!pageMeasure) return;

    const ro = new ResizeObserver(() => measurePageWidth());
    ro.observe(pageMeasure);
    return () => ro.disconnect();
  }, [measurePageWidth, previewRefreshKey, resume.resumeId]);

  useEffect(() => {
    if (!compact) return;

    measureScaledLayout();
    const scaledPage = scaledPageRef.current;
    if (!scaledPage) return;

    const ro = new ResizeObserver(() => measureScaledLayout());
    ro.observe(scaledPage);
    return () => ro.disconnect();
  }, [compact, measureScaledLayout, zoomLevel, previewRefreshKey, resume.resumeId]);

  useEffect(() => {
    if (!compact) return;
    requestAnimationFrame(() => measureScaledLayout());
  }, [compact, zoomLevel, measureScaledLayout, sections, layout]);

  useEffect(() => {
    debugResumePagination("ResumePreview:zoom", {
      resumeId: resume.resumeId,
      zoomLevel,
      scale: zoomLevel / 100,
      transform: `scale(${zoomLevel / 100})`,
    });
  }, [zoomLevel, resume.resumeId]);

  const resetPreview = useCallback(
    (options?: {
      resetZoom?: boolean;
      remount?: "local" | "full";
    }) => {
      if (options?.resetZoom !== false) {
        if (compact) {
          resetFitZoom();
        } else {
          setZoomLevel(100);
        }
      }
      containerRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const remount = options?.remount ?? "full";
      if (remount === "full" && onRefresh) {
        onRefresh();
      } else {
        setPreviewRefreshKey((key) => key + 1);
      }
    },
    [onRefresh, setZoomLevel, compact, resetFitZoom],
  );

  useImperativeHandle(ref, () => ({ resetPreview }), [resetPreview]);

  const handleRefreshPreview = useCallback(() => {
    resetPreview({ resetZoom: false, remount: "full" });
    resetFitZoom();
  }, [resetPreview, resetFitZoom]);

  // Use provided template or show placeholder
  if (!template) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4 mx-auto"></div>
          <p>No template selected</p>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => {
    markUserAdjusted();
    setZoomLevel((prev: number) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    markUserAdjusted();
    setZoomLevel((prev) => Math.max(prev - 25, minZoom));
  };

  const scaledWidthPx =
    compact && scaledLayout.width > 0
      ? scaledLayout.width
      : pageWidthPx > 0
        ? pageWidthPx * zoomScale + (pageDeleteGutterPx * zoomLevel) / 100
        : null;
  const scaledHeightPx =
    compact && scaledLayout.height > 0 ? scaledLayout.height : null;

  return (
    <div className="flex h-full flex-col bg-muted/25">
      {/* Zoom Controls */}
      <div
        className={cn(
          resumePreviewZoomHeader,
          compact
            ? resumePreviewZoomHeaderMobile
            : resumePreviewZoomHeaderDesktop,
        )}
      >
        <div className="flex flex-1 items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= minZoom}
            className="h-8 w-8 p-0"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="min-w-[44px] text-center text-xs font-medium text-foreground sm:min-w-[60px] sm:text-sm">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            className="h-8 w-8 p-0"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPreview}
            className="h-8 w-8 p-0"
            title="Refresh preview"
            aria-label="Refresh preview"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPdfPreviewOpen(true)}
          className="h-8 w-8 shrink-0 p-0 md:w-auto md:px-3"
          title="Open PDF preview"
          aria-label="Open PDF preview"
        >
          <Eye className="h-4 w-4 md:hidden" />
          <FileText className="hidden h-4 w-4 md:mr-1 md:block" />
          <span className="hidden md:inline">PDF Preview</span>
        </Button>
      </div>

      {/* Scrollable Preview Container */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 touch-pan-x touch-pan-y overflow-auto bg-muted/40",
          compact && "pl-12",
        )}
      >
        <div
          aria-hidden
          ref={pageMeasureRef}
          className="pointer-events-none fixed left-[-9999px] top-0 h-0 w-[210mm] overflow-hidden opacity-0"
        />
        {/* Zoom Container - handles centering and sizing */}
        <div
          className={cn(
            "flex min-h-full items-start justify-center",
            compact ? "w-full" : "w-max min-w-full",
          )}
          style={{
            padding: compact ? "8px 6px 16px" : "40px",
          }}
        >
          {/* Resume Container Wrapper for Scale */}
          <div
            className={compact ? "mx-auto" : undefined}
            style={{
              width: compact
                ? scaledWidthPx != null
                  ? `${scaledWidthPx}px`
                  : "100%"
                : `calc(${210 * zoomScale}mm + ${(pageDeleteGutterPx * zoomLevel) / 100}px)`,
              height:
                compact && scaledHeightPx != null
                  ? `${scaledHeightPx}px`
                  : undefined,
              position: "relative",
            }}
          >
            <div
              id={`resume-preview-container-${resume.resumeId}`}
              ref={scaledPageRef}
              style={{
                width: compact
                  ? pageWidthPx > 0
                    ? `${pageWidthPx + pageDeleteGutterPx}px`
                    : `calc(210mm + ${pageDeleteGutterPx}px)`
                  : `calc(210mm + ${pageDeleteGutterPx}px)`,
                transform: `scale(${zoomScale})`,
                transformOrigin: "top left",
                transition: compact ? undefined : "transform 200ms",
              }}
            >
              <PaginatedPreview
                key={`paginated-preview-${previewRefreshKey}`}
                resume={resume}
                template={template}
                sections={sections}
                layout={layout}
                dismissedEmptyTrailingPages={
                  layout?.dismissedEmptyTrailingPages ?? 0
                }
                onPageDelete={onPageDelete}
                onPaginationSnapshot={onPaginationSnapshot}
              />
            </div>
          </div>
        </div>
      </div>

      <ResumePdfPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        resume={resume}
        template={template}
        sections={sections}
        layout={layout}
        compact={compact}
      />
    </div>
  );
});
