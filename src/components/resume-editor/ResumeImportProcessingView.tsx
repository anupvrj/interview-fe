"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESUME_IMPORT_PROCESSING_MESSAGES } from "@/lib/resume-data-import";

function ResumeScanMock({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
        <div className="h-2 bg-gradient-to-r from-[#7367F0]/30 via-[#7367F0]/50 to-[#7367F0]/30" />
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
        </div>

        {active && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-primary/[0.04]" />
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_16px_rgba(115,103,240,0.55)]"
              style={{ animation: "ats-scan-sweep 2s ease-in-out infinite" }}
            />
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
}

export function ResumeImportProcessingView({
  fileName,
  messageIndex,
}: ResumeImportProcessingViewProps) {
  const [pulseIndex, setPulseIndex] = useState(0);
  const messages = RESUME_IMPORT_PROCESSING_MESSAGES;
  const activeMessage =
    messages[Math.min(messageIndex, messages.length - 1)];

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((i) => (i + 1) % 4);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 py-2">
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Importing resume
        </div>
        <h3 className="text-lg font-semibold text-foreground">{activeMessage}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Processing{" "}
          <span className="font-medium text-foreground">{fileName}</span>
        </p>
      </div>

      <ResumeScanMock active />

      <div className="space-y-2">
        {messages.slice(0, 4).map((step, idx) => {
          const done = messageIndex > idx;
          const active = messageIndex === idx;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all",
                done && "border-primary/15 bg-primary/[0.04]",
                active &&
                  "border-primary/30 bg-gradient-to-r from-primary/[0.08] to-transparent",
                !done && !active && "border-border/60 opacity-60",
                !active && !done && pulseIndex === idx && "opacity-80",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "border-2 border-primary text-primary"
                      : "border border-muted-foreground/20 text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={cn(
                  active && "font-medium text-primary",
                  done && "text-foreground",
                )}
              >
                {step.replace(/…$/, "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
