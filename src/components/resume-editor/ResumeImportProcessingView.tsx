"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESUME_IMPORT_PROCESSING_MESSAGES } from "@/lib/resume-data-import";

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
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
          <ScanLine className="h-4 w-4 animate-pulse" />
          Scanning document…
        </div>
      )}
    </div>
  );
}

interface ResumeImportProcessingViewProps {
  fileName: string;
  messageIndex: number;
  /** Override rotating headline (defaults to message at messageIndex). */
  title?: string;
  /** Custom message list (defaults to RESUME_IMPORT_PROCESSING_MESSAGES). */
  messages?: readonly string[];
  headerLabel?: string;
}

export function ResumeImportProcessingView({
  fileName,
  messageIndex,
  title,
  messages: messagesProp,
  headerLabel = "Importing resume",
}: ResumeImportProcessingViewProps) {
  const [pulseIndex, setPulseIndex] = useState(0);
  const messages = messagesProp ?? RESUME_IMPORT_PROCESSING_MESSAGES;
  const steps = messages.slice(0, 4);
  const activeIndex = Math.min(messageIndex, steps.length - 1);
  const activeMessage =
    title ?? steps[activeIndex] ?? messages[Math.min(messageIndex, messages.length - 1)];

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((i) => (i + 1) % steps.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 text-center sm:mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {headerLabel}
        </div>

        <h2
          key={activeMessage}
          className="animate-fade-in text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl"
        >
          {activeMessage.replace(/…$/, "")}
          <span className="inline-block w-5 animate-pulse text-primary">…</span>
        </h2>

        {fileName ? (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Processing{" "}
            <span className="font-medium text-foreground">{fileName}</span>
          </p>
        ) : null}
      </div>

      <div className="mx-auto grid max-w-3xl items-start justify-center gap-6 lg:max-w-none lg:grid-cols-[minmax(280px,320px)_minmax(300px,380px)] lg:justify-center lg:gap-8 xl:gap-10">
        <div className="order-2 rounded-2xl border border-border/80 bg-card p-6 shadow-card sm:p-7 lg:order-1 lg:mx-auto lg:w-full lg:max-w-[320px]">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Document scan
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">Your resume</p>
          </div>

          <ResumeScanMock active={messageIndex < steps.length} />
        </div>

        <div className="order-1 mx-auto flex w-full max-w-[380px] min-w-0 flex-col gap-3 sm:gap-4 lg:order-2">
          {steps.map((step, idx) => {
            const done = messageIndex > idx;
            const active = messageIndex === idx;
            const upcoming = messageIndex < idx;

            return (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-500 sm:px-5 sm:py-4",
                  done && "border-primary/15 bg-primary/[0.04] shadow-sm",
                  active &&
                    "scale-[1.01] border-primary/40 bg-gradient-to-r from-primary/[0.08] to-transparent shadow-md",
                  upcoming && "border-border/60 bg-card/50 opacity-60",
                  !active && !done && pulseIndex === idx && "opacity-75",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-11 sm:w-11",
                    done
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : active
                        ? "border-2 border-primary bg-card text-primary ring-4 ring-primary/15"
                        : "border-2 border-muted-foreground/20 bg-muted/30 text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{idx + 1}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-snug sm:text-base",
                      done && "text-foreground",
                      active && "text-primary",
                      upcoming && "text-muted-foreground",
                    )}
                  >
                    {step.replace(/…$/, "")}
                  </p>
                  {active ? (
                    <p className="mt-0.5 animate-fade-in text-xs text-muted-foreground sm:text-sm">
                      This usually takes a few seconds…
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
