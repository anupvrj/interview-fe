import type { Resume } from "@/lib/api";

export interface ResumeEditorSection {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  expanded: boolean;
  column?: "left" | "right";
}

export interface ResumeEditorLayout {
  type: "single" | "double";
  columnWidths: { left: number; right: number };
  padding?: { top: number; bottom: number; left: number; right: number };
  fontSize?: {
    heading?: number;
    subheading?: number;
    body?: number;
    small?: number;
    sectionHeader?: number;
  };
  fontFamily?: string;
  dismissedEmptyTrailingPages?: number;
}

export interface ResumeEditorSnapshot {
  resume: Resume;
  sections: ResumeEditorSection[];
  layout: ResumeEditorLayout;
}

export function cloneResumeEditorSnapshot(
  snapshot: ResumeEditorSnapshot,
): ResumeEditorSnapshot {
  return {
    resume: structuredClone(snapshot.resume),
    sections: structuredClone(snapshot.sections),
    layout: structuredClone(snapshot.layout),
  };
}

export function resumeEditorSnapshotSignature(
  snapshot: ResumeEditorSnapshot,
): string {
  try {
    return JSON.stringify(snapshot);
  } catch {
    return String(Date.now());
  }
}
