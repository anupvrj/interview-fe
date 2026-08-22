"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResumeCreationStepId =
  | "template"
  | "import"
  | "jobDescription"
  | "processing";

export type ResumeCreationStep = {
  id: ResumeCreationStepId;
  label: string;
};

export const RESUME_CREATION_STEPS: ResumeCreationStep[] = [
  { id: "template", label: "Template" },
  { id: "import", label: "Import" },
  { id: "jobDescription", label: "Target Job" },
  { id: "processing", label: "Build" },
];

interface ResumeCreationStepperProps {
  steps?: ResumeCreationStep[];
  currentStep: ResumeCreationStepId;
}

export function ResumeCreationStepper({
  steps = RESUME_CREATION_STEPS,
  currentStep,
}: ResumeCreationStepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep),
  );

  return (
    <nav
      aria-label="Resume creation progress"
      className="rounded-xl border border-border/80 bg-card p-4 shadow-card sm:p-5"
    >
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 items-center last:flex-none"
            >
              <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    isComplete &&
                      "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(115,103,240,0.35)]",
                    isActive &&
                      "border-2 border-primary bg-primary/[0.08] text-primary shadow-[0_0_0_4px_rgba(115,103,240,0.12)]",
                    isUpcoming &&
                      "border border-border/80 bg-muted/40 text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block sm:text-sm",
                    isActive && "text-primary",
                    isComplete && "text-foreground",
                    isUpcoming && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 hidden h-0.5 flex-1 rounded-full sm:block",
                    index < currentIndex ? "bg-primary/50" : "bg-border/80",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-sm font-medium text-primary sm:hidden">
        {steps[currentIndex]?.label}
      </p>
    </nav>
  );
}
