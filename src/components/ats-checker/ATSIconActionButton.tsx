"use client";

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ATSIconActionButtonProps extends ButtonProps {
  label: string;
  children: ReactNode;
}

export function ATSIconActionButton({
  label,
  className,
  children,
  ...props
}: ATSIconActionButtonProps) {
  return (
    <div className="group/icon-action relative inline-flex">
      <Button
        type="button"
        size="sm"
        className={cn("h-8 w-8 shrink-0 p-0", className)}
        aria-label={label}
        {...props}
      >
        {children}
        <span className="sr-only">{label}</span>
      </Button>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-foreground shadow-md group-hover/icon-action:block"
      >
        {label}
      </span>
    </div>
  );
}
