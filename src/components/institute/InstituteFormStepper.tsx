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
        "rounded-xl border border-border/80 bg-gradient-to-br from-primary/5 via-transparent to-transparent px-3 py-4 sm:px-5",
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
      <ol className="mt-4 flex w-full items-start" aria-label="Onboarding steps">
        {steps.map((step, index) => {
          const done = currentStep > step.number;
          const isActive = currentStep === step.number;
          const StepIcon = step.icon;
          const last = index === steps.length - 1;
          return (
            <li key={step.number} className="flex min-w-0 flex-1 items-start">
              <div className="flex w-full min-w-0 flex-col items-center gap-1.5">
                <div className="relative flex h-8 w-full items-center justify-center overflow-hidden">
                  {index > 0 ? (
                    <span
                      className={cn(
                        "absolute right-1/2 top-1/2 mr-4 h-px w-[calc(50%-1rem)] -translate-y-1/2",
                        currentStep > step.number - 1 ? "bg-emerald-400/70" : "bg-border",
                      )}
                      aria-hidden
                    />
                  ) : null}
                  {!last ? (
                    <span
                      className={cn(
                        "absolute left-1/2 top-1/2 ml-4 h-px w-[calc(50%-1rem)] -translate-y-1/2",
                        done ? "bg-emerald-400/70" : "bg-border",
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
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
                </div>
                <span
                  className={cn(
                    "w-full px-0.5 text-center text-[10px] font-medium leading-tight sm:text-xs",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
