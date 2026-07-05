"use client";

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardDarkClass } from "@/lib/dashboard-portal";

export interface IconTooltipButtonProps extends ButtonProps {
  label: string;
  children: ReactNode;
}

export function IconTooltipButton({
  label,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: IconTooltipButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dashboardDark = useDashboardDarkClass();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const updateTooltipPosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltipPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const openTooltip = useCallback(() => {
    updateTooltipPosition();
    setTooltipVisible(true);
  }, [updateTooltipPosition]);

  const closeTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        size="icon"
        title={label}
        className={cn("h-9 w-9 shrink-0 p-0", className)}
        aria-label={label}
        onMouseEnter={(e) => {
          openTooltip();
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          closeTooltip();
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          openTooltip();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          closeTooltip();
          onBlur?.(e);
        }}
        {...props}
      >
        {children}
        <span className="sr-only">{label}</span>
      </Button>
      {tooltipVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            className={cn(
              dashboardDark,
              "pointer-events-none fixed z-[10050] max-w-[min(90vw,16rem)] -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-center text-xs font-medium text-popover-foreground shadow-lg",
            )}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
