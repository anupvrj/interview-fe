"use client";

import type { ReactNode } from "react";
import type { ButtonProps } from "@/components/ui/button";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
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
    <IconTooltipButton
      label={label}
      className={cn("h-8 w-8", className)}
      {...props}
    >
      {children}
    </IconTooltipButton>
  );
}
