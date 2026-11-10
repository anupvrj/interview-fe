"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mono } from "@/components/marketing-2026/primitives";
import { dash2026Scope, EASE } from "@/components/dashboard-2026/ui";
import type { PdfSnapshot } from "@/lib/pdf-snapshot";

export const ATS_PROCESSING_STEPS = [
  "Parsing your resume",
  "Analyzing your experience",
  "Extracting your skills",
  "Generating recommendations",
] as const;

export const ATS_IMPROVE_STEPS = [
  "Reviewing ATS feedback",
  "Enhancing resume content",
  "Adding missing sections",
  "Finalizing improvements",
] as const;

/** How fast the scan moves down the page, one line at a time. */
const LINE_MS = 320;

interface ATSProcessingViewProps {
  currentStep: number;
  fileName?: string;
  steps?: readonly string[];
  headerLabel?: string;
  /** The first page of their own resume; a generic page shows without one. */
  snapshot?: PdfSnapshot | null;
}

/** What each step is doing, for the one in progress. */
const STEP_DETAILS: Record<string, string> = {
  "Parsing your resume": "Reading your PDF the way ATS software does",
  "Analyzing your experience": "Working out your roles, dates and sections",
  "Extracting your skills": "Scoring content, format and red flags",
  "Generating recommendations": "Preparing what to fix first",
  "Reviewing ATS feedback": "Going through your findings",
  "Enhancing resume content": "Rewriting weak lines",
  "Adding missing sections": "Filling the gaps",
  "Finalizing improvements": "Almost ready",
};

/** Steps top to bottom, ticked as they finish, joined by a line that fills as they complete. */
export function ATSStepRail({ steps, current }: { steps: readonly string[]; current: number }) {
  const reduce = useReducedMotion();
  return (
    <nav aria-label="Progress">
      <ol>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const last = index === steps.length - 1;
          return (
            <li key={step} aria-current={active ? "step" : undefined} className="relative flex gap-4 pb-6 last:pb-0">
              {!last && (
                <span aria-hidden className="absolute bottom-0 left-[15px] top-8 w-0.5 overflow-hidden rounded-full bg-border">
                  <motion.span
                    className="block size-full origin-top bg-gradient-to-b from-[#7367F0] to-[#1F8FFF]"
                    initial={false}
                    animate={{ scaleY: done ? 1 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                  />
                </span>
              )}
              <span
                className={cn(
                  "relative grid size-8 shrink-0 place-items-center rounded-full border-2 bg-card transition-colors duration-300",
                  done && "border-transparent bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white",
                  active && "border-primary text-primary ring-4 ring-primary/15",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mono className="text-[11px]">{index + 1}</Mono>}
              </span>
              <div className="min-w-0 pt-1">
                <p className={cn("text-[15px] font-semibold leading-snug tracking-[-0.01em]", active || done ? "text-foreground" : "text-muted-foreground")}>{step}</p>
                {active && STEP_DETAILS[step] && <p className="mt-1 animate-fade-in text-[13.5px] leading-snug text-muted-foreground">{STEP_DETAILS[step]}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Always on white paper, so its colours don't follow the theme. */
function GenericPage() {
  return (
    <div className="space-y-3 p-6" aria-hidden>
      <div className="h-3.5 w-2/3 rounded bg-slate-900/15" />
      <div className="h-2 w-1/2 rounded bg-slate-900/10" />
      {[100, 88, 92, 76, 84, 96, 70, 90, 82, 94, 66, 88].map((w, i) => (
        <div key={i} className={cn("h-1.5 rounded bg-slate-900/[0.08]", i % 4 === 3 && "!mt-5 h-2 bg-[#7367F0]/25")} style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/** Their resume being read: the lines already read stay marked, the current one glows. */
function ScanningCard({ snapshot, active }: { snapshot?: PdfSnapshot | null; active: boolean }) {
  const reduce = useReducedMotion();
  const lines = snapshot?.lines ?? [];
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (reduce || !active || lines.length === 0) return;
    const timer = setInterval(() => setLine((l) => (l + 1) % (lines.length + 6)), LINE_MS);
    return () => clearInterval(timer);
  }, [reduce, active, lines.length]);

  const current = lines[Math.min(line, lines.length - 1)];
  const scanTop = current ? current.top * 100 : 0;

  return (
    <div
      className="relative mx-auto max-h-full w-auto max-w-full overflow-hidden rounded-lg bg-white shadow-[0_30px_60px_-24px_rgba(30,20,90,.55),0_0_0_1px_rgba(30,20,90,.08)] max-lg:w-full max-lg:max-w-[280px] lg:h-full"
      style={{ aspectRatio: snapshot ? String(snapshot.aspect) : "0.72" }}
    >
      {snapshot ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local data URL of their own PDF
        <img src={snapshot.dataUrl} alt="First page of your resume" className="absolute inset-0 size-full object-cover" />
      ) : (
        <GenericPage />
      )}
      {!reduce && lines.slice(0, line + 1).map((box, index) => (
        <span
          key={index}
          aria-hidden
          className={cn("absolute rounded-[2px] transition-colors duration-300", index === line ? "bg-[#1F8FFF]/30" : "bg-[#7367F0]/[0.09]")}
          style={{ top: `${box.top * 100}%`, left: `${box.left * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }}
        />
      ))}
      {!reduce && active && (
        lines.length > 0 ? (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#1F8FFF] to-transparent shadow-[0_0_14px_3px_rgba(31,143,255,.45)]"
            animate={{ top: `${scanTop}%` }}
            transition={{ duration: LINE_MS / 1000, ease: "linear" }}
          />
        ) : (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#1F8FFF] to-transparent shadow-[0_0_14px_3px_rgba(31,143,255,.45)]"
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        )
      )}
    </div>
  );
}

export function ATSProcessingView({
  currentStep,
  fileName,
  steps = ATS_PROCESSING_STEPS,
  headerLabel = "Running ATS analysis",
  snapshot,
}: ATSProcessingViewProps) {
  const activeLabel = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-6xl")}>
      <section className="grid overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_24px_60px_-44px_rgba(30,20,90,.55)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* the resume being read */}
        <div className="relative order-2 overflow-hidden border-border bg-muted/40 p-6 max-lg:border-t sm:p-8 lg:order-1 lg:border-r">
          <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_0%,rgba(115,103,240,.14),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ScanLine className="h-4 w-4 text-primary" />
              <Mono className="text-[11px] tracking-wider">SCANNING DOCUMENT</Mono>
            </div>
            {/* the whole page stays in view, however short the window */}
            <div className="mt-5 flex justify-center lg:h-[clamp(420px,calc(100vh-240px),640px)]">
              <ScanningCard snapshot={snapshot} active={currentStep < steps.length} />
            </div>
          </div>
        </div>

        {/* where the check has got to */}
        <div className="order-1 flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:order-2 lg:p-12">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <Mono className="text-[11px] uppercase tracking-wider text-primary">{headerLabel}</Mono>
          </div>

          <h1 key={activeLabel} className="mt-5 animate-fade-in text-balance text-[30px] font-black leading-[1.05] tracking-[-0.05em] text-foreground sm:text-[38px]">
            {activeLabel}
            <span className="animate-pulse text-primary">…</span>
          </h1>

          {fileName && (
            <p className="mt-3 truncate text-[15px] font-medium text-muted-foreground" title={fileName}>
              {fileName}
            </p>
          )}

          <div className="mt-8 border-t border-border pt-8">
            <ATSStepRail steps={steps} current={currentStep} />
          </div>
        </div>
      </section>
    </div>
  );
}
