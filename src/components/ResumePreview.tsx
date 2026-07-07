/**
 * Resume Preview Component
 * Configuration-driven resume preview that works with all templates
 */

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, FileText } from "lucide-react";
import { PaginatedPreview } from "./PaginatedPreview";
import type { ResumePaginationSnapshot } from "./PaginatedPreview";
import { debugResumePagination } from "@/lib/debug-resume-pagination";
import { ResumePdfPreviewDialog } from "./ResumePdfPreviewDialog";

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
}: ResumePreviewProps,
  ref,
) {
  const pageDeleteGutterPx = onPageDelete ? 44 : 0;
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  // Use controlled zoom if provided, otherwise use internal state
  const [internalZoomLevel, setInternalZoomLevel] = useState(100);
  const zoomLevel = controlledZoomLevel ?? internalZoomLevel;
  
  // Create a unified setter that handles both controlled and uncontrolled modes
  const setZoomLevel = useCallback((value: number | ((prev: number) => number)) => {
    if (onZoomChange) {
      // Controlled mode: evaluate function if needed, then pass number to onZoomChange
      const newValue = typeof value === 'function' ? value(zoomLevel) : value;
      onZoomChange(newValue);
    } else {
      // Uncontrolled mode: use React state setter (supports both number and function)
      setInternalZoomLevel(value);
    }
  }, [onZoomChange, zoomLevel]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle pinch-to-zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoomLevel((prev:number) => {
          // Adjust sensitivity as needed
          const delta = -e.deltaY * 0.5;
          const newZoom = prev + delta;
          // Clamp between 50% and 200%
          return Math.min(Math.max(Math.round(newZoom), 50), 200);
        });
      }
    };

    // Add event listener with passive: false to allow preventing default
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [setZoomLevel]);

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
        setZoomLevel(100);
      }
      containerRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const remount = options?.remount ?? "full";
      if (remount === "full" && onRefresh) {
        onRefresh();
      } else {
        setPreviewRefreshKey((key) => key + 1);
      }
    },
    [onRefresh, setZoomLevel],
  );

  useImperativeHandle(ref, () => ({ resetPreview }), [resetPreview]);

  const handleRefreshPreview = useCallback(() => {
    resetPreview({ resetZoom: false, remount: "full" });
  }, [resetPreview]);

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
    setZoomLevel((prev:number) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  return (
    <div className="flex h-full flex-col bg-muted/25">
      {/* Zoom Controls */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-header/95 px-4 py-2 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="min-w-[60px] text-center text-sm font-medium text-foreground">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPreview}
            className="h-8 px-3 ml-2"
            title="Refresh preview"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPdfPreviewOpen(true)}
          className="h-8 px-3"
          title="Open PDF preview"
        >
          <FileText className="w-4 h-4 mr-1" />
          PDF Preview
        </Button>
      </div>

      {/* Scrollable Preview Container */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/40">
        {/* Zoom Container - handles centering and sizing */}
        <div
          className="flex items-start min-h-full"
          style={{
            padding: "40px",
            width: "max-content",
            minWidth: "100%",
            justifyContent: "center",
          }}
        >
          {/* Resume Container Wrapper for Scale */}
          <div
            style={{
              width: `calc(${210 * (zoomLevel / 100)}mm + ${(pageDeleteGutterPx * zoomLevel) / 100}px)`,
              position: "relative",
            }}
          >
            <div
              id={`resume-preview-container-${resume.resumeId}`}
              style={{
                width: `calc(210mm + ${pageDeleteGutterPx}px)`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top left",
                transition: "transform 200ms",
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
      />
    </div>
  );
});
