"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type HorizontalResizeHandleProps = React.ComponentProps<"button"> & {
  label?: string;
  showFrom?: "md" | "lg" | "xl";
};

export function HorizontalResizeHandle({
  label = "Drag to resize panels",
  showFrom = "xl",
  className,
  ...props
}: HorizontalResizeHandleProps) {
  const showClass =
    showFrom === "md"
      ? "md:flex"
      : showFrom === "lg"
        ? "lg:flex"
        : "xl:flex";

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "hidden min-h-0 w-2 shrink-0 cursor-col-resize touch-none flex-col items-center justify-center border-x border-white/10 bg-card/[0.06] hover:bg-card/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:bg-card/15",
        showClass,
        className,
      )}
      {...props}
    >
      <GripVertical
        className="h-10 w-3.5 text-gray-500 hover:text-gray-300"
        aria-hidden
      />
    </button>
  );
}
