"use client";

import { GripVertical } from "lucide-react";
import { resumeSectionDragHandle } from "@/components/resume-editor/resumeEditorStyles";

interface ResumeSectionDragHandleProps {
  sectionId: string;
  onDragStart: (e: React.DragEvent, sectionId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function ResumeSectionDragHandle({
  sectionId,
  onDragStart,
  onDragEnd,
}: ResumeSectionDragHandleProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e, sectionId);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd(e);
      }}
      className={resumeSectionDragHandle}
      aria-label="Drag to reorder section"
      title="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </div>
  );
}
