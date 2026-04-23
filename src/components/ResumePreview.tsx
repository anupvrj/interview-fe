/**
 * Resume Preview Component
 * Configuration-driven resume preview that works with all templates
 */

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { PaginatedPreview } from "./PaginatedPreview";
import { debugResumePagination } from "@/lib/debug-resume-pagination";
import { A4_HEIGHT_MM, A4_WIDTH_MM } from "@/lib/resume-page-dimensions";

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
  };
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  /** On narrow viewports, scale so a full A4 page fits the preview area (no side scroll / minimal zoom gymnastics). */
  autoFitNarrowView?: boolean;
}

function measureMmInPx(mm: number): number {
  if (typeof document === "undefined") return 0;
  const el = document.createElement("div");
  el.style.width = `${mm}mm`;
  el.style.height = "0";
  el.style.position = "absolute";
  el.style.top = "0";
  el.style.left = "0";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  const px = el.getBoundingClientRect().width;
  document.body.removeChild(el);
  return px;
}

function computeA4FitPercent(containerEl: HTMLElement, edgeInsetPx: number) {
  const cw = containerEl.clientWidth;
  const ch = containerEl.clientHeight;
  if (cw < 40 || ch < 40) return 100;
  const wPx = measureMmInPx(A4_WIDTH_MM);
  const hPx = measureMmInPx(A4_HEIGHT_MM);
  if (wPx < 1 || hPx < 1) return 100;
  const zW = ((cw - edgeInsetPx) / wPx) * 100;
  const zH = ((ch - edgeInsetPx) / hPx) * 100;
  const z = Math.min(zW, zH);
  return Math.max(8, Math.min(100, Math.round(z * 10) / 10));
}

export function ResumePreview({
  resume,
  template,
  sections,
  layout,
  zoomLevel: controlledZoomLevel,
  onZoomChange,
  autoFitNarrowView = false,
}: ResumePreviewProps) {
  // Use controlled zoom if provided, otherwise use internal state
  const [internalZoomLevel, setInternalZoomLevel] = useState(100);
  const zoomLevel = controlledZoomLevel ?? internalZoomLevel;
  
  // Create a unified setter that handles both controlled and uncontrolled modes
  const setZoomLevel = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (onZoomChange) {
        const newValue =
          typeof value === "function" ? value(zoomLevel) : value;
        onZoomChange(newValue);
      } else {
        setInternalZoomLevel(value);
      }
    },
    [onZoomChange, zoomLevel],
  );

  /** Stable numeric set — avoids re-running auto-fit / reset effects on every zoom tick. */
  const setZoomPercent = useCallback(
    (next: number) => {
      if (onZoomChange) onZoomChange(next);
      else setInternalZoomLevel(next);
    },
    [onZoomChange],
  );

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
          // Clamp between 8% and 200%
          return Math.min(Math.max(Math.round(newZoom), 8), 200);
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

  const applyA4Fit = useCallback(() => {
    if (!autoFitNarrowView) return;
    const el = containerRef.current;
    if (!el) return;
    const edgeInset =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
        ? 100
        : 24;
    setZoomPercent(computeA4FitPercent(el, edgeInset));
  }, [autoFitNarrowView, setZoomPercent]);

  useLayoutEffect(() => {
    if (!template) return;
    if (autoFitNarrowView) return;
    setZoomPercent(100);
  }, [autoFitNarrowView, template, resume.resumeId, setZoomPercent]);

  useLayoutEffect(() => {
    if (!template || !autoFitNarrowView) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(applyA4Fit);
    });
    ro.observe(el);
    requestAnimationFrame(applyA4Fit);
    return () => ro.disconnect();
  }, [autoFitNarrowView, template, applyA4Fit, resume.resumeId]);

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
    setZoomLevel((prev: number) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 8));
  };

  const handleResetZoom = () => {
    if (autoFitNarrowView) {
      applyA4Fit();
    } else {
      setZoomLevel(100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Zoom Controls */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-2 py-1.5 shadow-sm md:px-4 md:py-2">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 8}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
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
            onClick={handleResetZoom}
            className="h-8 px-2 text-xs md:ml-2 md:px-3"
            title="Reset Zoom"
          >
            <RotateCcw className="mr-0.5 h-4 w-4 md:mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Preview Container */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200">
        {/* Zoom Container - handles centering and sizing */}
        <div
          className="flex min-h-full w-max min-w-full items-start justify-center p-2 md:p-10"
        >
          {/* Resume Container Wrapper for Scale */}
          <div
            style={{
              width: `${A4_WIDTH_MM * (zoomLevel / 100)}mm`,
              position: "relative",
            }}
          >
            <div
              id={`resume-preview-container-${resume.resumeId}`}
              style={{
                width: `${A4_WIDTH_MM}mm`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top left",
                transition: "transform 200ms",
              }}
            >
              <PaginatedPreview
                resume={resume}
                template={template}
                sections={sections}
                layout={layout}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
