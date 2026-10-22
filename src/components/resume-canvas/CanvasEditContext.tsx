"use client";

import React, { createContext, useContext } from "react";

/**
 * Present only inside the canvas editor. Without it, the renderer's editable
 * fields render exactly as before (thumbnails, PDF, public views).
 */
export interface CanvasEditApi {
  /** Write one field ("experience.2.company", "personalInfo.fullName", "profileSummary"). */
  commitField: (path: string, value: string) => void;
  /** Rename a section heading. */
  commitSectionTitle: (sectionId: string, title: string) => void;
  /** Called when a field gains focus, so toolbars can follow it. */
  onFieldFocus?: (path: string, element: HTMLElement) => void;
  onFieldBlur?: (path: string) => void;
  /** What is selected on the page; empty optional slots are only shown for it. */
  focus?: { sectionId: string; sectionType: string; index: number | null } | null;
}

const CanvasEditContext = createContext<CanvasEditApi | null>(null);

/** `value={null}` turns editing off (e.g. while the PDF is captured from the page). */
export function CanvasEditProvider({ value, children }: { value: CanvasEditApi | null; children: React.ReactNode }) {
  return <CanvasEditContext.Provider value={value}>{children}</CanvasEditContext.Provider>;
}

export function useCanvasEdit(): CanvasEditApi | null {
  return useContext(CanvasEditContext);
}
