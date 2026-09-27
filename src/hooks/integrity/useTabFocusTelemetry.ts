"use client";

import { useEffect, useRef } from "react";
import { shouldEmitTabBlur } from "@/lib/integrity/tabFocusPolicy";
import type { IntegrityEvent } from "@/lib/integrity/types";

export function useTabFocusTelemetry(opts: {
  enabled: boolean;
  displayPickerOpen?: boolean;
  dialogOpen?: boolean;
  onEvent: (event: IntegrityEvent) => void;
}): {
  setDisplayPickerOpen: (open: boolean) => void;
  setDialogOpen: (open: boolean) => void;
} {
  const hiddenAtRef = useRef<number | null>(null);
  const displayPickerRef = useRef(Boolean(opts.displayPickerOpen));
  const dialogRef = useRef(Boolean(opts.dialogOpen));
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;
  displayPickerRef.current = Boolean(opts.displayPickerOpen);
  dialogRef.current = Boolean(opts.dialogOpen);

  useEffect(() => {
    if (!opts.enabled) return;

    const markHidden = () => {
      if (hiddenAtRef.current != null) return;
      if (displayPickerRef.current || dialogRef.current) return;
      hiddenAtRef.current = Date.now();
    };

    const markVisible = () => {
      if (hiddenAtRef.current == null) return;
      const durationMs = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (
        !shouldEmitTabBlur(durationMs, {
          displayPickerOpen: displayPickerRef.current,
          dialogOpen: dialogRef.current,
        })
      ) {
        return;
      }
      onEventRef.current({
        type: "TAB_BLUR",
        durationMs,
        timestamp: Date.now(),
        severity: durationMs >= 3000 ? "MEDIUM" : "LOW",
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") markHidden();
      else markVisible();
    };
    const onBlur = () => {
      markHidden();
    };
    const onFocus = () => markVisible();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [opts.enabled]);

  return {
    setDisplayPickerOpen: (open: boolean) => {
      displayPickerRef.current = open;
    },
    setDialogOpen: (open: boolean) => {
      dialogRef.current = open;
    },
  };
}
