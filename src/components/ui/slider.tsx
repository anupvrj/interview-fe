"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    /** Red accent. `primary` matches dashboard / coding (blue-600). `peer` matches peer interview purple. */
    variant?: "default" | "accent" | "primary" | "peer";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-muted/80">
      <SliderPrimitive.Range
        className={cn(
          "absolute h-full rounded-full",
          variant === "accent"
            ? "bg-red-600"
            : variant === "primary"
              ? "bg-primary"
              : variant === "peer"
                ? "bg-gradient-to-r from-[#7367F0]/80 to-[#7367F0]"
                : "bg-primary",
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-full border-2 border-background bg-card shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "accent"
          ? "border-red-600 focus-visible:ring-red-500"
          : variant === "primary"
            ? "border-primary focus-visible:ring-blue-500"
            : variant === "peer"
              ? "border-[#7367F0] focus-visible:ring-[#7367F0]/40"
              : "border-purple-600 focus-visible:ring-purple-500",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

