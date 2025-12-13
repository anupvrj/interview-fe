/**
 * Resume Preview Component
 * Configuration-driven resume preview that works with all templates
 */

import { useState, useRef, useEffect } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { PaginatedPreview } from "./PaginatedPreview";

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
}

export function ResumePreview({
  resume,
  template,
  sections,
  layout,
}: ResumePreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle pinch-to-zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoomLevel((prev) => {
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
  }, []);

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
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Zoom Controls */}
      <div className="sticky top-0 z-20 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
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
            className="h-8 px-3 ml-2"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Scrollable Preview Container */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200">
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
              width: `${210 * (zoomLevel / 100)}mm`,
              position: "relative",
            }}
          >
            <div
              id={`resume-preview-container-${resume.resumeId}`}
              style={{
                width: "210mm",
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
