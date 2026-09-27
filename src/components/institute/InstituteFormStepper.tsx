"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type InstituteFormStep = {
  number: number;
  title: string;
  headline: string;
  description: string;
  icon: LucideIcon;
};

type Props = Readonly<{
  steps: InstituteFormStep[];
  currentStep: number;
  className?: string;
}>;

export function InstituteFormStepper({ steps, currentStep, className }: Props) {
  const active = steps[currentStep - 1];
  if (!active) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-gradient-to-br from-primary/5 via-transparent to-transparent px-4 py-4 sm:px-5",
        className,
      )}
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
        Step {currentStep} of {steps.length}
      </p>
      <h3 className="mt-1.5 text-center text-base font-semibold text-foreground">
        {active.headline}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted-foreground">
        {active.description}
      </p>
      <div className="mt-4 flex items-center gap-1.5 sm:gap-2">
        {steps.map((step, index) => {
          const done = currentStep > step.number;
          const isActive = currentStep === step.number;
          const StepIcon = step.icon;
          return (
            <div
              key={step.number}
              className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground shadow-sm",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  !isActive &&
                    !done &&
                    "border-border bg-muted/40 text-muted-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {done ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <StepIcon className="h-3.5 w-3.5" aria-hidden />
                )}
              </div>
              <span
                className={cn(
                  "hidden truncate text-xs font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "mx-0.5 h-px min-w-[0.5rem] flex-1",
                    done ? "bg-emerald-400/70" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
