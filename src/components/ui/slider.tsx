"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    /** Red accent. `primary` matches dashboard / coding (blue-600). Default keeps landing purple. */
    variant?: "default" | "accent" | "primary";
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
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
      <SliderPrimitive.Range
        className={cn(
          "absolute h-full",
          variant === "accent"
            ? "bg-red-600"
            : variant === "primary"
              ? "bg-primary"
              : "bg-primary"
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-full border-2 border-white bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "accent"
          ? "border-red-600 focus-visible:ring-red-500"
          : variant === "primary"
            ? "border-primary focus-visible:ring-blue-500"
            : "border-purple-600 focus-visible:ring-purple-500"
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

