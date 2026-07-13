"use client";

import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeSectionDragHandle } from "@/components/resume-editor/ResumeSectionDragHandle";
import { resumeSectionHeader } from "@/components/resume-editor/resumeEditorStyles";

interface ResumeSectionCardHeaderProps {
  section: {
    id: string;
    title: string;
    expanded: boolean;
  };
  onDragStart: (e: React.DragEvent, sectionId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onOpenForEdit: (sectionId: string) => void;
  onToggle: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
  showDelete?: boolean;
  showEdit?: boolean;
}

export function ResumeSectionCardHeader({
  section,
  onDragStart,
  onDragEnd,
  onOpenForEdit,
  onToggle,
  onDelete,
  showDelete = true,
  showEdit = true,
}: ResumeSectionCardHeaderProps) {
  return (
    <div className={resumeSectionHeader}>
      <div className="flex items-center gap-2 flex-1">
        <ResumeSectionDragHandle
          sectionId={section.id}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
        <h3 className="min-w-0 flex-1 truncate font-semibold text-sm">
          {section.title}
        </h3>
        {showEdit ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            title="Edit section"
            onClick={() => onOpenForEdit(section.id)}
          >
            <Edit className="w-3 h-3" />
          </Button>
        ) : null}
        {showDelete && onDelete ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-950/30"
            onClick={() => onDelete(section.id)}
            title="Delete Section"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        ) : null}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          onClick={() => onToggle(section.id)}
        >
          {section.expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
