"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const target = Math.min(100, Math.max(0, value ?? 0));
  const [display, setDisplay] = React.useState(0);
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) setDisplay(target);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [target]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary/20",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "relative h-full w-full flex-1 overflow-hidden bg-gradient-to-r from-primary to-secondary",
          "origin-left transition-[transform] duration-700 ease-out will-change-transform",
          !reducedMotion && display > 0 && "animate-progress-pulse",
        )}
        style={{ transform: `translateX(-${100 - display}%)` }}
      >
        {!reducedMotion && display > 0 && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 -left-1/3 w-2/5",
              "bg-gradient-to-r from-transparent via-white/40 to-transparent",
              "animate-progress-shimmer",
            )}
          />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
