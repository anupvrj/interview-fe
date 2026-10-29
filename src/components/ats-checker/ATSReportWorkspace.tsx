"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Lock, PenLine, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mono } from "@/components/marketing-2026/primitives";
import { EASE, Eyebrow, ScoreRing } from "@/components/dashboard-2026/ui";
import { geistMono } from "@/components/marketing-2026/fonts";
import { buildFixItems, fixMarks } from "@/components/resume-canvas/FixMistakesPanel";
import { normalizeATSReportV3, reportHasJobMatch } from "@/lib/atsReportNormalize";
import { cn } from "@/lib/utils";
import type { ATSCategoryId, ATSCheckId, ATSCheckResult, ATSReportV3 } from "@/types/atsReport";
import { CATEGORY_ORDER, isAdvisoryCheck } from "@/types/atsReport";
import { ATSScoreSidebar } from "./ATSScoreSidebar";
import { ATSCheckDetailPanel } from "./ATSCheckDetailPanel";
import { ATSResumeCanvas } from "./ATSResumeCanvas";
import { JobMatchBanner } from "./ATSReportDashboard";

function verdict(score: number) {
  if (score >= 80) return { label: "Ready to send", tone: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 60) return { label: "Close, a few fixes away", tone: "text-primary" };
  return { label: "Needs work before you apply", tone: "text-amber-600 dark:text-amber-400" };
}

function locate(report: ATSReportV3, checkId: ATSCheckId): { check: ATSCheckResult; label: string; categoryId: ATSCategoryId } | null {
  for (const catId of CATEGORY_ORDER) {
    const cat = report.categories[catId];
    const check = cat?.checks.find((c) => c.id === checkId);
    if (cat && check) return { check, label: cat.label, categoryId: catId };
  }
  return null;
}

/** First check worth opening: one that fails or warns, else the first that ran. */
function firstActionable(report: ATSReportV3) {
  for (const catId of CATEGORY_ORDER) {
    const cat = report.categories[catId];
    const c = cat?.checks.find((x) => x.status !== "skipped" && !isAdvisoryCheck(x) && x.issueCount > 0 && (x.status === "fail" || x.status === "warn"));
    if (cat && c) return { check: c, label: cat.label, categoryId: catId };
  }
  for (const catId of CATEGORY_ORDER) {
    const cat = report.categories[catId];
    const c = cat?.checks.find((x) => x.status !== "skipped");
    if (cat && c) return { check: c, label: cat.label, categoryId: catId };
  }
  return null;
}

const catTone = (n: number) => (n >= 80 ? "bg-emerald-500" : n >= 60 ? "bg-primary" : "bg-amber-500");

export function ATSReportWorkspace({
  report,
  resumeId,
  resumeTitle,
  error,
  improveUnlocked,
  improving,
  rerunning,
  onImprove,
  onRerun,
  onCheckAnother,
  onRunJobMatch,
  initialJobDescription,
}: {
  report: ATSReportV3;
  resumeId: string;
  resumeTitle?: string;
  error?: string | null;
  improveUnlocked: boolean;
  improving: boolean;
  rerunning: boolean;
  onImprove: () => void;
  onRerun: () => void;
  onCheckAnother: () => void;
  onRunJobMatch: (jd: string) => void | Promise<void>;
  initialJobDescription?: string;
}) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({ initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.55, ease: EASE } });
  const r = useMemo(() => normalizeATSReportV3(report), [report]);
  const start = useMemo(() => firstActionable(r), [r]);
  const [selectedId, setSelectedId] = useState<ATSCheckId | null>(start?.check.id ?? null);
  const selected = selectedId ? locate(r, selectedId) : start;

  // the same findings and highlights the editor's Fix panel uses
  const marks = useMemo(() => fixMarks(buildFixItems(r), new Set()), [r]);
  const activeIds = useMemo(() => new Set(marks.filter((m) => selected && m.id.startsWith(`${selected.check.id}:`)).map((m) => m.id)), [marks, selected]);
  const markedChecks = useMemo(() => new Set(marks.map((m) => m.id.split(":")[0])), [marks]);

  const pickMark = (markId: string) => {
    const id = markId.split(":")[0] as ATSCheckId;
    if (locate(r, id)) setSelectedId(id);
  };
  const pickCategory = (catId: ATSCategoryId) => {
    const cat = r.categories[catId];
    const c = cat?.checks.find((x) => x.status !== "skipped" && x.issueCount > 0) ?? cat?.checks.find((x) => x.status !== "skipped");
    if (c) setSelectedId(c.id);
  };

  const v = verdict(r.score);
  const categories = CATEGORY_ORDER.filter((id) => id !== "jobMatch" && r.categories[id]);
  const editorHref = `/dashboard/resumes/${resumeId}/edit?view=ats`;

  return (
    <div className={cn(geistMono.variable, "space-y-5 lg:space-y-6")}>
      {/* ── header: what this is, the score, what to do next ── */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid items-center gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <motion.div {...rise(0)}><Eyebrow>ATS REPORT</Eyebrow></motion.div>
            <motion.h1 {...rise(0.06)} className="mt-4 truncate text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
              {resumeTitle || "Your resume"}
            </motion.h1>
            <motion.p {...rise(0.12)} className="mt-2 text-[15px] text-muted-foreground">
              {r.issueCount} issue{r.issueCount === 1 ? "" : "s"} across {categories.length} categories
              {r.inferredProfile ? <> · analysed as <span className="font-medium text-foreground">{r.inferredProfile.targetRole}</span> ({r.inferredProfile.seniority})</> : null}
              {r.mode === "tailored" ? " · tailored to a job" : ""}
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-5 flex flex-wrap gap-2">
              <Button onClick={onImprove} disabled={improving} className="h-11 rounded-xl px-5 shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)]">
                {improveUnlocked ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                Improve with AI
                {!improveUnlocked && <Mono className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[9.5px]">UPGRADE</Mono>}
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl px-5">
                <Link href={editorHref}><PenLine className="h-4 w-4" />Fix in the editor</Link>
              </Button>
              <Button variant="outline" onClick={onRerun} disabled={rerunning} className="h-11 rounded-xl px-4" title="Re-run the ATS check">
                <RefreshCw className={cn("h-4 w-4", rerunning && "animate-spin")} />
                <span className="max-sm:hidden">Re-run check</span>
              </Button>
              <Button variant="ghost" onClick={onCheckAnother} className="h-11 rounded-xl px-4 text-muted-foreground" title="Check another resume">
                <RotateCcw className="h-4 w-4" />
                <span className="max-sm:hidden">Check another</span>
              </Button>
            </motion.div>
          </div>
          <motion.div {...rise(0.24)} className="flex items-center gap-4 rounded-2xl border border-border bg-background/70 p-4 pr-6 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
            <div className="[&_p]:font-bold [&_p]:tracking-tight"><ScoreRing score={Math.round(r.score)} /></div>
            <div>
              <Mono className="text-[11px] text-muted-foreground">SMART ATS SCORE</Mono>
              <p className={cn("mt-1 max-w-[16ch] text-[16px] font-semibold leading-snug", v.tone)}>{v.label}</p>
              {r.scoreCap != null && <Mono className="mt-1 block text-[10.5px] text-amber-600 dark:text-amber-400">HELD AT {r.scoreCap} UNTIL FIXED</Mono>}
            </div>
          </motion.div>
        </div>

        {/* category strip: every score at a glance; a tap opens its first open check */}
        <motion.div {...rise(0.3)} className="relative grid grid-cols-2 border-t border-border sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((id) => {
            const c = r.categories[id];
            const ran = c.checks.some((x) => x.status !== "skipped");
            const on = selected?.categoryId === id;
            return (
              <button key={id} type="button" onClick={() => pickCategory(id)}
                className={cn("border-b border-r border-border px-4 py-3.5 text-left transition-colors last:border-r-0 hover:bg-muted/40 lg:border-b-0", on && "bg-primary/[0.06]")}>
                <p className={cn("truncate text-[12px]", on ? "font-semibold text-primary" : "text-muted-foreground")}>{c.label}</p>
                <Mono className="mt-1 block text-[20px] tracking-tight text-foreground">{ran ? `${c.score}` : "—"}</Mono>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                  {ran && <div className={cn("h-full rounded-full", catTone(c.score))} style={{ width: `${c.score}%` }} />}
                </div>
              </button>
            );
          })}
        </motion.div>
      </section>

      {error && <p className="rounded-[18px] border border-destructive/30 bg-destructive/[0.06] px-5 py-3 text-sm text-destructive">{error}</p>}

      {r.scoreCap != null && (r.scoreCapReasons?.length ?? 0) > 0 && (
        <div role="note" className="rounded-[18px] border border-amber-500/40 bg-amber-500/[0.08] px-5 py-4 text-sm">
          <p className="font-semibold text-foreground">Your score is held at {r.scoreCap} until you fix:</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-muted-foreground">{r.scoreCapReasons!.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}

      {/* a finished job match is a result, so it stays; the summary and the promo are gone */}
      {reportHasJobMatch(r) && <div className="[&>div]:rounded-[22px]"><JobMatchBanner report={r} /></div>}

      {/* ── the workspace: resume with findings on the left, the check and its fix on the right ── */}
      {/* on wide screens both panes scroll on their own, so the resume stays in view while you read */}
      <div className="grid gap-5 lg:gap-6 xl:h-[calc(100vh-112px)] xl:min-h-[640px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <ATSResumeCanvas resumeId={resumeId} marks={marks} activeIds={activeIds} onPick={pickMark}
          className="h-[70vh] min-h-[520px] xl:h-full xl:min-h-0" />

        <div className="space-y-5 xl:min-h-0 xl:overflow-y-auto xl:pr-1 [scrollbar-width:thin]">
          <section className="overflow-hidden rounded-[22px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <Mono className="text-[11px] text-primary">— CHECKS —</Mono>
                <p className="mt-1 text-[15px] font-semibold text-foreground">Pick one to see it on your resume.</p>
              </div>
              <Mono className="text-[11px] text-muted-foreground">{markedChecks.size} ON THE PAGE</Mono>
            </div>
            <div className="max-h-[360px] overflow-y-auto px-4 py-2">
              <ATSScoreSidebar score={r.score} issueCount={r.issueCount} categories={r.categories} selectedCheckId={selected?.check.id ?? null}
                onSelectCheck={(c) => setSelectedId(c.id)} openCategoryId={selected?.categoryId ?? null} hideScore compact />
            </div>
          </section>

          <section className="overflow-hidden rounded-[22px] border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <Mono className="text-[11px] text-primary">— WHAT TO FIX —</Mono>
              {selected && activeIds.size > 0 && <Mono className="rounded-md bg-primary/10 px-2 py-0.5 text-[10.5px] text-primary">{activeIds.size} HIGHLIGHTED</Mono>}
            </div>
            <div className="p-5">
              <ATSCheckDetailPanel check={selected?.check ?? null} categoryLabel={selected?.label} targetRole={r.inferredProfile?.targetRole} compact />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3.5">
              <p className="text-[12.5px] text-muted-foreground">Fix it in place and the score updates as you edit.</p>
              <Link href={editorHref} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                Open editor <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
