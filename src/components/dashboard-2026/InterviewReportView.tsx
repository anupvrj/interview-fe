"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { InterviewCoverageArea, InterviewReport } from "@/lib/api";
import { cn, getScoreColor } from "@/lib/utils";
import { Mono } from "@/components/marketing-2026/primitives";
import { buildOverallExperienceParagraph } from "@/lib/interview-report-overall-experience";
import { sessionAverageScore } from "@/lib/interview-report-session-scores";
import { Eyebrow } from "./ui";

const card = "rounded-[18px] border border-border bg-card";

const QUESTION_TYPE: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  "system-design": "System design",
  hr: "HR / Fit",
};

const COVERAGE_LABEL: Record<InterviewCoverageArea["outcome"], string> = {
  explored: "Explored",
  touched: "Touched",
  no_example: "No example",
  not_answered: "Not answered",
};
const COVERAGE_TONE: Record<InterviewCoverageArea["outcome"], string> = {
  explored: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  touched: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  no_example: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  not_answered: "border-border bg-muted text-muted-foreground",
};

function barTone(v: number) {
  if (v >= 80) return "from-emerald-500 to-emerald-400";
  if (v >= 60) return "from-[#7367F0] to-[#1F8FFF]";
  if (v >= 40) return "from-amber-500 to-amber-400";
  return "from-rose-500 to-rose-400";
}

/** One measure, one 0–100 scale: a labelled horizontal bar. */
function ScoreBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] font-medium text-foreground">
          {label}
          {hint ? <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">{hint}</span> : null}
        </span>
        <Mono className={cn("text-[14px] tabular-nums", getScoreColor(value))}>{Math.round(value)}</Mono>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full bg-gradient-to-r", barTone(value))} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function ringColor(v: number) {
  if (v >= 80) return "#10B981";
  if (v >= 60) return "#7367F0";
  if (v >= 40) return "#F59E0B";
  return "#F43F5E";
}

/** A score out of 100 as a small ring, number in the middle, label and hint underneath. */
function ScoreRingTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative size-[92px]">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90" role="img" aria-label={`${label}: ${Math.round(v)} out of 100`}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={ringColor(v)} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} className="transition-[stroke-dashoffset] duration-700" />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-[family-name:var(--font-geist-mono)] text-[22px] tabular-nums text-foreground">{Math.round(v)}</span>
      </div>
      <p className="mt-2.5 text-[13.5px] font-semibold text-foreground">{label}</p>
      {hint ? <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function verdict(score: number) {
  if (score >= 80) return "A strong round";
  if (score >= 65) return "Solid, with gaps";
  if (score >= 45) return "Getting there";
  return "Needs more practice";
}

/** Big score with the verdict word under it. */
function BigScore({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[150px] shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <defs><linearGradient id="report-ring" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" /><stop offset="1" stopColor="#1F8FFF" /></linearGradient></defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#report-ring)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[44px] font-black leading-none tracking-[-0.05em] text-foreground tabular-nums">{score}</p>
          <Mono className="text-[11px] text-muted-foreground">/ 100</Mono>
        </div>
      </div>
    </div>
  );
}

export function InterviewReportView({ report }: { report: InterviewReport }) {
  // one question open at a time; opening another closes the last
  const [openQ, setOpenQ] = useState(0);
  const qRefs = useRef<(HTMLElement | null)[]>([]);
  const toggleQ = (i: number) => {
    const next = openQ === i ? -1 : i;
    setOpenQ(next);
    if (next < 0) return;
    // the answer above may collapse and shift the page; keep the one just opened in view
    requestAnimationFrame(() => {
      const el = qRefs.current[next];
      if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const coding = report.codingSummary?.problems.length ? report.codingSummary : null;
  // coding rounds: the headline is the session average, and coding + discussion lead the rings
  const headline = coding ? sessionAverageScore(report) : report.overallScore;
  const coachRead = coding ? buildOverallExperienceParagraph(report) : null;

  const categories = [
    { label: "Technical", hint: "problem solving & knowledge", value: report.categoryScores.technical },
    { label: "Behavioral", hint: "STAR & storytelling", value: report.categoryScores.behavioral },
    { label: "Communication", hint: "clarity & structure", value: report.categoryScores.communication },
    { label: "Confidence", hint: "delivery & presence", value: report.categoryScores.confidence },
  ];
  const rings = coding
    ? [
        { label: "Coding", hint: "all problems, tests", value: coding.overallCodingScore },
        { label: "Discussion", hint: "explaining your approach", value: report.overallScore },
        { label: "Technical", hint: "problem solving & knowledge", value: report.categoryScores.technical },
        { label: "Communication", hint: "clarity & structure", value: report.categoryScores.communication },
      ]
    : categories;
  const ranked = [...rings].sort((a, b) => b.value - a.value);
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const coverage = report.coverage && report.coverage.questionsAsked > 0 ? report.coverage : null;
  const areas = coverage?.areas.filter((a) => a.bucket !== "intro") ?? [];

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* ── The verdict: score, one honest line, and the four categories behind it */}
      <section className={cn(card, "grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center")}>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <BigScore score={Math.round(headline)} />
          <div>
            <Mono className="text-[11px] text-primary">{coding ? "SESSION AVERAGE" : "OVERALL"}</Mono>
            <h2 className="mt-1 text-[28px] font-black leading-tight tracking-[-0.04em] text-foreground">{verdict(headline)}</h2>
            <p className="mt-2 max-w-[38ch] text-[14.5px] leading-relaxed text-muted-foreground">
              {best.value === 0 ? (
                "No answers were scored this round. Answer a few questions fully next time and you'll get a full read."
              ) : Math.round(best.value) === Math.round(weakest.value) ? (
                <>Even across all four categories, at {Math.round(best.value)}.</>
              ) : (
                <>
                  Strongest on <b className="font-semibold text-foreground">{best.label.toLowerCase()}</b> ({Math.round(best.value)}).
                  {" "}Work on <b className="font-semibold text-foreground">{weakest.label.toLowerCase()}</b> ({Math.round(weakest.value)}) next.
                </>
              )}
            </p>
            {(report.passStatus === "pass" || report.passStatus === "fail") && report.passingScoreThreshold != null ? (
              <p className={cn("mt-3 inline-flex rounded-lg border px-2.5 py-1 text-[12.5px]", report.passStatus === "pass" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
                Institution bar {report.passingScoreThreshold}: {report.passStatus === "pass" ? "passed" : "below bar"}
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:border-l lg:border-border lg:pl-8">
          {rings.map((c) => <ScoreRingTile key={c.label} {...c} />)}
        </div>
      </section>

      {/* ── Coding rounds: every problem, then the coach's read of the whole session */}
      {coding ? (
        <section className={cn("grid gap-4", coachRead ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" : "")}>
          <div className={cn(card, "overflow-hidden")}>
            <div className="flex items-end justify-between gap-3 border-b border-border p-5 md:p-6">
              <div>
                <Eyebrow>PROBLEMS</Eyebrow>
                <h2 className="mt-3 text-[20px] font-extrabold tracking-[-0.03em] text-foreground">
                  {coding.problems.length} problem{coding.problems.length === 1 ? "" : "s"}, scored on public and hidden tests.
                </h2>
              </div>
              <div className="shrink-0 text-right">
                <Mono className={cn("block text-[26px] leading-none tabular-nums", getScoreColor(coding.overallCodingScore))}>{coding.overallCodingScore}</Mono>
                <Mono className="text-[10.5px] text-muted-foreground">CODING AVG</Mono>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {coding.problems.map((p, i) => {
                const pct = p.total ? Math.round((p.passed / p.total) * 100) : 0;
                return (
                  <li key={p.problemId} className="flex items-center gap-4 px-5 py-4 md:px-6">
                    <Mono className="shrink-0 text-[12px] text-primary">{String(i + 1).padStart(2, "0")}</Mono>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-foreground">{p.title}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full bg-gradient-to-r", barTone(pct))} style={{ width: `${Math.max(2, pct)}%` }} />
                        </div>
                        <Mono className="shrink-0 text-[11px] text-muted-foreground">{p.passed}/{p.total} TESTS · {p.language.toUpperCase()}</Mono>
                      </div>
                    </div>
                    <Mono className={cn("w-10 shrink-0 text-right text-[20px] tabular-nums", getScoreColor(p.score))}>{p.score}</Mono>
                  </li>
                );
              })}
            </ul>
          </div>
          {coachRead ? (
            <div className={cn(card, "p-6")}>
              <Eyebrow>COACH&apos;S READ</Eyebrow>
              <p className="mt-4 text-[14.5px] leading-relaxed text-foreground">{coachRead}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── What to do with it */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className={cn(card, "p-6")}>
          <Eyebrow>FIX THESE FIRST</Eyebrow>
          <ol className="mt-4 space-y-3.5">
            {report.improvements.map((t, i) => (
              <li key={`imp-${i}`} className="flex gap-3 text-[14.5px] leading-relaxed text-foreground">
                <Mono className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] text-primary">{i + 1}</Mono>
                {t}
              </li>
            ))}
          </ol>
        </div>
        <div className={cn(card, "p-6")}>
          <div className="flex items-center gap-3 text-[12px] tracking-wider text-emerald-600 dark:text-emerald-400">
            <Mono>— WHAT WORKED —</Mono>
            <span className="h-px w-20 border-t-2 border-dotted border-emerald-500/40" />
          </div>
          {report.strengths.length === 0 ? (
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">Nothing stood out yet. Give fuller answers next round and this fills in.</p>
          ) : null}
          <ul className="mt-4 space-y-3.5">
            {report.strengths.map((t, i) => (
              <li key={`str-${i}`} className="flex gap-3 text-[14.5px] leading-relaxed text-foreground">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How you sounded + what it covered */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className={cn(card, "flex flex-col p-6")}>
          <Eyebrow>HOW YOU SOUNDED</Eyebrow>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <ScoreRingTile label="Confidence" value={report.behavioral.confidence} />
            <ScoreRingTile label="Clarity" value={report.behavioral.clarity} />
            <ScoreRingTile label="Fluency" value={report.behavioral.fluency} />
          </div>
          <div className="mt-6 flex items-baseline justify-between rounded-xl bg-muted/50 px-4 py-3 lg:mt-auto">
            <span className="text-[13px] text-muted-foreground">Filler words</span>
            <span><Mono className="text-[22px] text-foreground">{report.behavioral.fillersPerMinute.toFixed(1)}</Mono><span className="ml-1 text-[13px] text-muted-foreground">per min</span></span>
          </div>
        </div>
        {coverage ? (
          <div className={cn(card, "p-6")}>
            <Eyebrow>WHAT IT COVERED</Eyebrow>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{coverage.summary}</p>
            <div className="mt-4 grid grid-cols-2 divide-border overflow-hidden rounded-xl border border-border sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:max-sm:border-b [&>*:nth-child(odd)]:max-sm:border-r">
              {[
                ["Questions", String(coverage.questionsAsked)],
                ["Areas", String(coverage.areasTouched)],
                ["Breadth", `${coverage.breadthScore}`],
                ["Depth", `${coverage.depthScore}`],
              ].map(([k, v]) => (
                <div key={k} className="border-border px-4 py-3">
                  <p className="text-[12px] text-muted-foreground">{k}</p>
                  <Mono className="text-[20px] text-foreground">{v}</Mono>
                </div>
              ))}
            </div>
            {areas.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {areas.map((a) => (
                  <li key={`${a.bucket}-${a.label}`} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px]", COVERAGE_TONE[a.outcome])}>
                    <span className="font-medium">{a.label}</span>
                    <span className="opacity-75">· {COVERAGE_LABEL[a.outcome]}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {coverage.noExampleAreas.length > 0 ? (
              <p className="mt-3 text-[12.5px] text-muted-foreground">
                No example given for: {coverage.noExampleAreas.join(", ")}. That&apos;s a gap in evidence, not a wrong answer.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ── Every question, answer next to the stronger version */}
      {report.qaAnalysis?.length ? (
        <section className={cn(card, "overflow-hidden")}>
          <div className="border-b border-border p-5 md:p-6">
            <Eyebrow>{coding ? "THE DISCUSSION" : "QUESTION BY QUESTION"}</Eyebrow>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground">
              {report.qaAnalysis.length} question{report.qaAnalysis.length === 1 ? "" : "s"}. Open one to see your answer next to a stronger one.
            </h2>
          </div>
          <div className="divide-y divide-border">
            {report.qaAnalysis.map((qa, i) => {
              const avg = Math.round((qa.correctnessScore + qa.clarityScore + qa.completenessScore) / 3);
              return (
                <details
                  key={`${qa.question}-${i}`}
                  ref={(el) => { qRefs.current[i] = el; }}
                  open={openQ === i}
                  className="group scroll-mt-24"
                >
                  <summary
                    onClick={(e) => { e.preventDefault(); toggleQ(i); }}
                    className="flex cursor-pointer list-none items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40 md:px-6 [&::-webkit-details-marker]:hidden"
                  >
                    <Mono className="mt-0.5 shrink-0 text-[12px] text-primary">Q{i + 1}</Mono>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug text-foreground">{qa.question}</p>
                      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        <Mono className="text-[10.5px] text-muted-foreground">{(QUESTION_TYPE[qa.questionType] ?? qa.questionType).toUpperCase()}</Mono>
                        <Mono className={cn("text-[10.5px]", qa.questionDifficulty === "hard" ? "text-rose-500" : qa.questionDifficulty === "medium" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>{qa.questionDifficulty.toUpperCase()}</Mono>
                        {!qa.answerMatchedQuestion ? <Mono className="text-[10.5px] text-amber-600 dark:text-amber-400">OFF THE QUESTION</Mono> : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Mono className={cn("text-[18px] tabular-nums", getScoreColor(avg))}>{avg}</Mono>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="space-y-5 px-5 pb-6 md:px-6 md:pl-[3.75rem]">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <Mono className="text-[10.5px] text-muted-foreground">YOUR ANSWER</Mono>
                        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{qa.candidateAnswer}</p>
                      </div>
                      <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-4">
                        <Mono className="text-[10.5px] text-primary">A STRONGER ANSWER</Mono>
                        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{qa.suggestedAnswer}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ScoreBar label="Correctness" value={qa.correctnessScore} />
                      <ScoreBar label="Clarity" value={qa.clarityScore} />
                      <ScoreBar label="Completeness" value={qa.completenessScore} />
                    </div>
                    <p className="text-[14px] leading-relaxed text-muted-foreground"><b className="font-semibold text-foreground">Feedback.</b> {qa.feedback}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {qa.strengths.length ? (
                        <div>
                          <Mono className="text-[10.5px] text-emerald-600 dark:text-emerald-400">KEEP</Mono>
                          <ul className="mt-2 space-y-1.5 text-[13.5px] text-foreground">
                            {qa.strengths.map((t, k) => <li key={k} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />{t}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {qa.improvements.length ? (
                        <div>
                          <Mono className="text-[10.5px] text-primary">CHANGE</Mono>
                          <ul className="mt-2 space-y-1.5 text-[13.5px] text-foreground">
                            {qa.improvements.map((t, k) => <li key={k} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{t}</li>)}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[12.5px] text-muted-foreground">
                      <span>Depth for your level: <b className="font-medium text-foreground">{qa.technicalDepthMatch}</b></span>
                      <span>Experience alignment: <Mono className="text-foreground">{qa.experienceAlignmentScore}</Mono></span>
                      {qa.validationNotes && qa.validationNotes !== "N/A" ? <span>{qa.validationNotes}</span> : null}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
