"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Briefcase, Check, Circle, FolderGit2, Hash, LayoutList, Loader2, Lock, ScanLine, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mono } from "@/components/marketing-2026/primitives";
import { dash2026Scope, EASE, Eyebrow, SegmentedSteps } from "@/components/dashboard-2026/ui";
import type { PdfSnapshot } from "@/lib/pdf-snapshot";
import type { ScanFacts } from "@/lib/atsScanFacts";

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
  /** What has been read from it so far; shown as it arrives. */
  facts?: ScanFacts | null;
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

/** The live line at the bottom of "Found so far" (the heading already says what the step is). */
const LIVE_HINTS: Record<string, string> = {
  "Parsing your resume": "Reading your PDF",
  "Analyzing your experience": "Finding your roles and sections",
  "Extracting your skills": "Running 20+ checks on content, format and red flags",
  "Generating recommendations": "Ranking what to fix first",
};

/** Short names for the segmented bar. */
const SHORT_LABELS: Record<string, string> = {
  "Parsing your resume": "Read",
  "Analyzing your experience": "Understand",
  "Extracting your skills": "Score",
  "Generating recommendations": "Recommend",
  "Reviewing ATS feedback": "Review",
  "Enhancing resume content": "Rewrite",
  "Adding missing sections": "Fill gaps",
  "Finalizing improvements": "Finish",
};

/** Typical length of each step (ms), for the time left. Scoring is the long one. */
const TYPICAL_MS: Record<string, number> = {
  "Parsing your resume": 4000,
  "Analyzing your experience": 9000,
  "Extracting your skills": 18000,
  "Generating recommendations": 6000,
  "Reviewing ATS feedback": 4000,
  "Enhancing resume content": 12000,
  "Adding missing sections": 10000,
  "Finalizing improvements": 6000,
};

/** "About 25s left", from typical step lengths and how long this one has run. */
export function timeLeftLabel(steps: readonly string[], current: number, elapsedInStep: number): string {
  if (current >= steps.length) return "Done";
  const thisStep = Math.max(0, (TYPICAL_MS[steps[current]] ?? 6000) - elapsedInStep);
  const rest = steps.slice(current + 1).reduce((sum, step) => sum + (TYPICAL_MS[step] ?? 6000), 0);
  const seconds = Math.round((thisStep + rest) / 1000);
  if (seconds <= 3) return "Almost done";
  return `About ${seconds < 15 ? seconds : Math.round(seconds / 5) * 5}s left`;
}

function useElapsedInStep(current: number): number {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setStartedAt(Date.now());
    setNow(Date.now());
  }, [current]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now - startedAt;
}

type RowState = "done" | "active" | "pending";

function FactRow({ state, icon: Icon, children, meta }: { state: RowState; icon: LucideIcon; children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={cn(
          "mt-px grid size-6 shrink-0 place-items-center rounded-full",
          state === "done" && "bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white",
          state === "active" && "bg-primary/10 text-primary",
          state === "pending" && "bg-muted text-muted-foreground",
        )}
      >
        {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : state === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      </span>
      <div className={cn("min-w-0 flex-1 text-[14px] leading-snug", state === "pending" ? "text-muted-foreground" : "text-foreground")}>{children}</div>
      {meta && <Mono className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">{meta}</Mono>}
    </div>
  );
}

/** Sections most resumes have; anything else is worth calling out as read. */
const USUAL_SECTIONS = new Set(["Summary", "Experience", "Education", "Skills", "Projects", "Languages", "Certificates"]);

/** Facts from their own resume, appearing as they're read. */
function FoundSoFar({ facts, current, steps, detail }: { facts: ScanFacts; current: number; steps: readonly string[]; detail?: string }) {
  const reduce = useReducedMotion();
  const extra = facts.sections.filter((s) => !USUAL_SECTIONS.has(s));
  const scoring = current >= 2;
  const rows: { key: string; node: ReactNode }[] = [];
  if (facts.roles > 0) {
    const years = facts.years ? (facts.years.to === "now" ? new Date().getFullYear() : facts.years.to) - facts.years.from : 0;
    rows.push({
      key: "roles",
      node: (
        <FactRow state="done" icon={Briefcase} meta={years > 0 ? `${years} YRS` : undefined}>
          {facts.roles} role{facts.roles === 1 ? "" : "s"}
          {facts.years && <span className="text-muted-foreground"> · {facts.years.from} to {facts.years.to}</span>}
        </FactRow>
      ),
    });
  }
  if (facts.roles === 0 && facts.projects > 0) {
    rows.push({
      key: "projects",
      node: (
        <FactRow state="done" icon={FolderGit2}>
          {facts.projects} project{facts.projects === 1 ? "" : "s"}
        </FactRow>
      ),
    });
  }
  if (facts.skills.length) {
    rows.push({
      key: "skills",
      node: (
        <FactRow state="done" icon={Sparkles}>
          {facts.skills.length} skill{facts.skills.length === 1 ? "" : "s"}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {facts.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="max-w-[10rem] truncate rounded-full border border-border bg-background px-2.5 py-0.5 text-[12px] text-muted-foreground">{skill}</span>
            ))}
            {facts.skills.length > 4 && <span className="rounded-full bg-primary/[0.08] px-2.5 py-0.5 text-[12px] font-medium text-primary">+{facts.skills.length - 4}</span>}
          </div>
        </FactRow>
      ),
    });
  }
  if (facts.sections.length) {
    rows.push({
      key: "sections",
      node: (
        <FactRow state="done" icon={LayoutList}>
          {facts.sections.length} sections
          {extra.length > 0 && <span className="text-muted-foreground">, including {extra.slice(0, 2).join(" and ")}</span>}
        </FactRow>
      ),
    });
  }
  if (facts.bullets > 0) {
    rows.push({
      key: "numbers",
      node: scoring ? (
        <FactRow state="done" icon={Hash}>
          {facts.bulletsWithNumbers} of {facts.bullets} bullets have numbers
        </FactRow>
      ) : (
        <FactRow state="pending" icon={Hash}>Numbers in your bullets</FactRow>
      ),
    });
  }
  if (current < steps.length && detail) {
    rows.push({ key: `now-${current}`, node: <FactRow state="active" icon={Loader2}>{detail}…</FactRow> });
  }
  return (
    <div className="divide-y divide-border/70">
      <AnimatePresence initial={false}>
        {rows.map((row, index) => (
          <motion.div
            key={row.key}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE, delay: reduce ? 0 : index * 0.12 }}
          >
            {row.node}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Before anything is read (or while improving): the steps themselves, ticked as they finish. */
function StepChecklist({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <div className="divide-y divide-border/70">
      {steps.map((step, index) => (
        <FactRow key={step} state={index < current ? "done" : index === current ? "active" : "pending"} icon={Circle}>
          {index === current ? STEP_DETAILS[step] ?? step : step}
        </FactRow>
      ))}
    </div>
  );
}

export function ATSProcessingView({
  currentStep,
  fileName,
  steps = ATS_PROCESSING_STEPS,
  headerLabel = "Running ATS analysis",
  snapshot,
  facts,
}: ATSProcessingViewProps) {
  const step = Math.min(currentStep, steps.length - 1);
  const activeLabel = steps[step];
  const elapsed = useElapsedInStep(currentStep);

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-6xl")}>
      <section className="grid overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_24px_60px_-44px_rgba(30,20,90,.55)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* the resume being read */}
        <div className="relative order-2 overflow-hidden border-border bg-muted/40 p-5 max-lg:border-t sm:p-8 lg:order-1 lg:border-r">
          <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_0%,rgba(115,103,240,.14),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ScanLine className="h-4 w-4 shrink-0 text-primary" />
              <Mono className="shrink-0 text-[11px] tracking-wider">YOUR RESUME</Mono>
              {fileName && <span className="min-w-0 truncate text-[13px]" title={fileName}>· {fileName}</span>}
            </div>
            {/* the whole page stays in view, however short the window */}
            <div className="mt-5 flex justify-center lg:h-[clamp(420px,calc(100vh-240px),640px)]">
              <ScanningCard snapshot={snapshot} active={currentStep < steps.length} />
            </div>
          </div>
        </div>

        {/* where the check has got to, and what it has found */}
        <div className="order-1 flex min-w-0 flex-col p-5 sm:p-8 lg:order-2 lg:p-10">
          <Eyebrow>{headerLabel.toUpperCase()}</Eyebrow>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Mono className="text-[11px] text-muted-foreground">STEP {step + 1} OF {steps.length}</Mono>
            <Mono className="text-[11px] text-muted-foreground" aria-live="polite">{timeLeftLabel(steps, currentStep, elapsed).toUpperCase()}</Mono>
          </div>
          <div className="mt-3">
            <SegmentedSteps labels={steps.map((s) => SHORT_LABELS[s] ?? s)} current={currentStep} />
          </div>

          <h1 key={activeLabel} className="mt-7 animate-fade-in text-balance text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-foreground sm:text-[30px]">
            {activeLabel}
          </h1>
          <p className="mt-1.5 text-[14.5px] text-muted-foreground">{STEP_DETAILS[activeLabel]}</p>

          <div className="mt-6 rounded-2xl border border-border bg-background/60 px-4 py-1.5">
            <Mono className="block pb-1 pt-2.5 text-[11px] text-primary">{facts ? "FOUND SO FAR" : "WHAT'S HAPPENING"}</Mono>
            {facts ? (
              <FoundSoFar facts={facts} current={currentStep} steps={steps} detail={LIVE_HINTS[activeLabel] ?? STEP_DETAILS[activeLabel]} />
            ) : (
              <StepChecklist steps={steps} current={currentStep} />
            )}
          </div>

          <p className="mt-5 flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Your resume is only used for this check.
          </p>
        </div>
      </section>
    </div>
  );
}
