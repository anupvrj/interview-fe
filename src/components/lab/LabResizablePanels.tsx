"use client";

import { LabResizeHandle } from "@/components/lab/LabResizeHandle";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "agent-lab-panel-widths";
const DEFAULT_LEFT = 260;
const DEFAULT_RIGHT = 320;
const MIN_LEFT = 200;
const MAX_LEFT = 420;
const MIN_RIGHT = 220;
const MAX_RIGHT = 560;
const MIN_CENTER = 280;

type PanelWidths = { left: number; right: number };

function loadWidths(): PanelWidths {
  if (typeof window === "undefined") {
    return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT };
    const parsed = JSON.parse(raw) as PanelWidths;
    return {
      left: clamp(parsed.left, MIN_LEFT, MAX_LEFT),
      right: clamp(parsed.right, MIN_RIGHT, MAX_RIGHT),
    };
  } catch {
    return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function constrainPair(
  left: number,
  right: number,
  containerWidth: number,
): PanelWidths {
  let nextLeft = clamp(left, MIN_LEFT, MAX_LEFT);
  let nextRight = clamp(right, MIN_RIGHT, MAX_RIGHT);

  if (containerWidth > 0) {
    const handles = 6;
    const maxCombined = containerWidth - MIN_CENTER - handles;
    if (nextLeft + nextRight > maxCombined) {
      const excess = nextLeft + nextRight - maxCombined;
      const leftShare = nextLeft / (nextLeft + nextRight);
      nextLeft -= excess * leftShare;
      nextRight -= excess * (1 - leftShare);
      nextLeft = clamp(nextLeft, MIN_LEFT, MAX_LEFT);
      nextRight = clamp(nextRight, MIN_RIGHT, MAX_RIGHT);
    }
  }

  return { left: Math.round(nextLeft), right: Math.round(nextRight) };
}

type Props = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export function LabResizablePanels({ left, center, right }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<PanelWidths>({
    left: DEFAULT_LEFT,
    right: DEFAULT_RIGHT,
  });

  useEffect(() => {
    setWidths(loadWidths());
  }, []);

  const persistWidths = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  }, [widths]);

  const applyResize = useCallback((deltaLeft: number, deltaRight: number) => {
    setWidths((prev) => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      return constrainPair(
        prev.left + deltaLeft,
        prev.right + deltaRight,
        containerWidth,
      );
    });
  }, []);

  const onResizeLeft = useCallback(
    (deltaX: number) => applyResize(deltaX, 0),
    [applyResize],
  );

  const onResizeRight = useCallback(
    (deltaX: number) => applyResize(0, -deltaX),
    [applyResize],
  );

  return (
    <div ref={containerRef} className="flex h-full min-h-0 w-full overflow-hidden">
      <aside
        style={{ width: widths.left }}
        className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-muted/10"
      >
        {left}
      </aside>

      <LabResizeHandle onResize={onResizeLeft} onResizeEnd={persistWidths} />

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-border/60 bg-background">
        {center}
      </main>

      <LabResizeHandle onResize={onResizeRight} onResizeEnd={persistWidths} />

      <aside
        style={{ width: widths.right }}
        className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-muted/10"
      >
        {right}
      </aside>
    </div>
  );
}
