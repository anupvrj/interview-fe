"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { PaginatedPreview } from "@/components/PaginatedPreview";
import { TemplateStyleLoader } from "@/components/TemplateStyleLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResumePreviewFitZoom } from "@/hooks/useResumePreviewFitZoom";
import { useResumePreviewPinchZoom } from "@/hooks/useResumePreviewPinchZoom";
import { useResumePreviewTrackpadZoom } from "@/hooks/useResumePreviewTrackpadZoom";
import { cn } from "@/lib/utils";

interface ResumePdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume;
  template: ResumeTemplate;
  sections?: unknown[];
  layout?: {
    type: "single" | "double";
    columnWidths?: { left: number; right: number };
    padding?: { top: number; bottom: number; left: number; right: number };
    dismissedEmptyTrailingPages?: number;
  };
  compact?: boolean;
}

export function ResumePdfPreviewDialog({
  open,
  onOpenChange,
  resume,
  template,
  sections,
  layout,
  compact = false,
}: ResumePdfPreviewDialogProps) {
  const [renderKey, setRenderKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageMeasureRef = useRef<HTMLDivElement>(null);
  const scaledPageRef = useRef<HTMLDivElement>(null);
  const [scaledLayout, setScaledLayout] = useState({ width: 0, height: 0 });
  const minZoom = 1;
  const zoomScale = zoomLevel / 100;

  const measureScaledLayout = useCallback(() => {
    const scaledPage = scaledPageRef.current;
    if (!scaledPage) return;
    const rect = scaledPage.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setScaledLayout({ width: rect.width, height: rect.height });
    }
  }, []);

  const { markUserAdjusted } = useResumePreviewFitZoom({
    enabled: compact && open,
    minFitZoom: 1,
    containerRef,
    pageMeasureRef,
    onZoom: setZoomLevel,
    resetKey: `${renderKey}-${resume.resumeId}`,
  });

  useResumePreviewPinchZoom({
    enabled: open,
    containerRef,
    zoomLevel,
    onZoom: setZoomLevel,
    onUserAdjusted: markUserAdjusted,
    minZoom,
    maxZoom: 200,
  });

  useResumePreviewTrackpadZoom({
    enabled: open,
    rootRef: dialogContentRef,
    zoomLevel,
    onZoom: setZoomLevel,
    onUserAdjusted: markUserAdjusted,
    minZoom,
    maxZoom: 200,
  });

  useEffect(() => {
    if (open) {
      setRenderKey((key) => key + 1);
      if (!compact) {
        setZoomLevel(100);
      }
    }
  }, [open, compact]);

  useEffect(() => {
    if (!open) return;

    measureScaledLayout();
    const scaledPage = scaledPageRef.current;
    if (!scaledPage) return;

    const ro = new ResizeObserver(() => measureScaledLayout());
    ro.observe(scaledPage);
    return () => ro.disconnect();
  }, [open, measureScaledLayout, zoomLevel, renderKey, resume.resumeId]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => measureScaledLayout());
  }, [open, zoomLevel, measureScaledLayout, sections, layout]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogContentRef}
        className={cn(
          "flex flex-col gap-0 overflow-hidden border-border/60 bg-zinc-950 p-0 shadow-2xl [&>button]:text-zinc-300 [&>button]:hover:text-white",
          compact
            ? "fixed inset-0 h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0"
            : "h-[92vh] max-h-[92vh] w-[calc(210mm+4rem)] max-w-[96vw] sm:rounded-xl",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-white/10 px-4 py-3 text-left sm:px-5">
          <DialogTitle className="flex items-center gap-2 text-base text-white">
            {compact ? <Eye className="h-4 w-4 shrink-0 text-[#a78bfa]" /> : null}
            PDF Preview
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Pinch or use two fingers on your trackpad to zoom in or out
          </DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          className={cn(
            "min-h-0 flex-1 touch-pan-x touch-pan-y overflow-auto bg-zinc-800/90",
            compact ? "px-1.5 py-3" : "px-4 py-8 sm:px-8",
          )}
        >
          <div
            aria-hidden
            ref={pageMeasureRef}
            className="pointer-events-none fixed left-[-9999px] top-0 h-0 w-[210mm] overflow-hidden opacity-0"
          />
          <div className="mx-auto flex w-full justify-center">
            <div
              className="mx-auto"
              style={{
                width:
                  scaledLayout.width > 0
                    ? `${scaledLayout.width}px`
                    : `calc(${210 * zoomScale}mm)`,
                height:
                  scaledLayout.height > 0 ? `${scaledLayout.height}px` : undefined,
                position: "relative",
              }}
            >
              <div
                ref={scaledPageRef}
                style={{
                  width: "210mm",
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "top left",
                }}
              >
                <TemplateStyleLoader templateId={template.id} />
                <PaginatedPreview
                  key={`pdf-preview-${renderKey}`}
                  resume={resume}
                  template={template}
                  sections={sections}
                  layout={layout}
                  dismissedEmptyTrailingPages={
                    layout?.dismissedEmptyTrailingPages ?? 0
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
