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

  // a segmented progress bar: one segment per step, numbered in mono like the dashboard eyebrows
  return (
    <nav aria-label="Resume creation progress">
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          return (
            <li key={step.id} aria-current={isActive ? "step" : undefined} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] transition-[width] duration-700 ease-out",
                    isComplete ? "w-full" : isActive ? "w-1/2" : "w-0",
                  )}
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={cn(
                    "font-[family-name:var(--font-geist-mono)] text-[11px]",
                    isComplete || isActive ? "text-primary" : "text-muted-foreground/70",
                  )}
                >
                  {isComplete ? <Check className="inline h-3 w-3" /> : String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "truncate text-[12.5px] font-medium",
                    isActive ? "text-foreground" : isComplete ? "text-foreground/80" : "text-muted-foreground",
                    !isActive && "max-sm:hidden",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
