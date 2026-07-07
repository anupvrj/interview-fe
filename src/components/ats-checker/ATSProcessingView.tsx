"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export const ATS_PROCESSING_STEPS = [
  "Parsing your resume",
  "Analyzing your experience",
  "Extracting your skills",
  "Generating recommendations",
] as const;

const SCAN_CATEGORIES = [
  { label: "Content", stepThreshold: 0 },
  { label: "Sections", stepThreshold: 1 },
  { label: "ATS Essentials", stepThreshold: 2 },
  { label: "Tailoring", stepThreshold: 3 },
] as const;

export const ATS_IMPROVE_STEPS = [
  "Reviewing ATS feedback",
  "Enhancing resume content",
  "Adding missing sections",
  "Finalizing improvements",
] as const;

interface ATSProcessingViewProps {
  currentStep: number;
  fileName?: string;
  hasJobDescription?: boolean;
  steps?: readonly string[];
  headerLabel?: string;
}

function ResumeScanMock({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-lg">
        <div className="h-2 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
        <div className="space-y-2.5 p-4">
          <div className="h-3 w-3/4 rounded-md bg-foreground/12" />
          <div className="h-2 w-1/2 rounded-md bg-foreground/8" />
          <div className="space-y-1.5 pt-1">
            {[100, 88, 92, 76, 84].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded bg-foreground/7"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          <div className="h-2.5 w-2/5 rounded-md bg-primary/20" />
          <div className="space-y-1">
            {[90, 72, 85].map((w, i) => (
              <div
                key={i}
                className="h-1 rounded bg-foreground/6"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>

        {active && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-primary/[0.04]" />
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_16px_rgba(115,103,240,0.55)]"
              style={{ animation: "ats-scan-sweep 2s ease-in-out infinite" }}
            />
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="pointer-events-none absolute left-3 right-3 h-px bg-primary/25"
                style={{
                  top: `${22 + i * 16}%`,
                  animation: `ats-scan-line 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {active && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary font-medium">
          <ScanLine className="h-4 w-4 animate-pulse" />
          Scanning document…
        </div>
      )}
    </div>
  );
}

function CategoryProgress({
  currentStep,
  hasJobDescription,
}: {
  currentStep: number;
  hasJobDescription?: boolean;
}) {
  return (
    <div className="mt-8 space-y-4">
      {SCAN_CATEGORIES.map(({ label, stepThreshold }) => {
        const isTailoring = label === "Tailoring";
        const skipped = isTailoring && !hasJobDescription;
        const done = !skipped && currentStep > stepThreshold;
        const active = !skipped && currentStep === stepThreshold;
        const pct = skipped ? 0 : done ? 100 : active ? 55 : 8;

        return (
          <div key={label} className={cn("space-y-2", skipped && "opacity-40")}>
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  done || active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {skipped ? "—" : done ? "100%" : active ? "…" : "—"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/80">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  done
                    ? "bg-gradient-to-r from-primary to-primary/80"
                    : active
                      ? "bg-primary/70 animate-pulse"
                      : "bg-muted-foreground/15",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ATSProcessingView({
  currentStep,
  fileName,
  hasJobDescription,
  steps = ATS_PROCESSING_STEPS,
  headerLabel = "Running ATS analysis",
}: ATSProcessingViewProps) {
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((i) => (i + 1) % steps.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [steps.length]);

  const activeIndex = Math.min(currentStep, steps.length - 1);
  const activeLabel = steps[activeIndex];

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="mb-8 text-center sm:mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {headerLabel}
        </div>

        <h1
          key={activeLabel}
          className="animate-fade-in text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
        >
          {activeLabel}
          <span className="inline-block w-6 animate-pulse text-primary">…</span>
        </h1>

        {fileName && (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Analyzing{" "}
            <span className="font-medium text-foreground">{fileName}</span>
          </p>
        )}
      </div>

      {/* Side-by-side: scan panel (left) + step list (right) */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,360px)_1fr] lg:gap-8 xl:gap-10">
        {/* Left on desktop — document scan + category bars */}
        <div className="order-2 rounded-2xl border border-border/80 bg-card p-6 shadow-card sm:p-8 lg:order-1 lg:sticky lg:top-6">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Document scan
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">Your Score</p>
          </div>

          <ResumeScanMock active={currentStep < steps.length} />

          <CategoryProgress
            currentStep={currentStep}
            hasJobDescription={hasJobDescription}
          />
        </div>

        {/* Right on desktop — processing steps */}
        <div className="order-1 flex min-w-0 flex-col gap-3 sm:gap-4 lg:order-2">
          {steps.map((step, idx) => {
            const done = idx < currentStep;
            const active = idx === currentStep;
            const upcoming = idx > currentStep;

            return (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-500 sm:px-6 sm:py-5",
                  done && "border-primary/15 bg-primary/[0.04] shadow-sm",
                  active &&
                    "scale-[1.01] border-primary/40 bg-gradient-to-r from-primary/[0.08] to-transparent shadow-md",
                  upcoming && "border-border/60 bg-card/50 opacity-60",
                  !active && !done && pulseIndex === idx && "opacity-75",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    done
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : active
                        ? "border-2 border-primary bg-card text-primary ring-4 ring-primary/15"
                        : "border-2 border-muted-foreground/20 bg-muted/30 text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : active ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-semibold">{idx + 1}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-base font-semibold sm:text-lg lg:text-xl",
                      done && "text-foreground",
                      active && "text-primary",
                      upcoming && "text-muted-foreground",
                    )}
                  >
                    {step}
                  </p>
                  {active && (
                    <p className="mt-0.5 animate-fade-in text-sm text-muted-foreground">
                      This usually takes a few seconds…
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
