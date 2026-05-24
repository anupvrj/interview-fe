"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  Brain,
  CheckCircle,
  MessageSquare,
  Mic,
  TrendingUp,
  Code2,
  Sparkles,
} from "lucide-react";
import type { InterviewReport } from "@/lib/api";
import { buildOverallExperienceParagraph } from "@/lib/interview-report-overall-experience";
import { sessionAverageScore } from "@/lib/interview-report-session-scores";
import { cn, getScoreColor, getScoreGradient } from "@/lib/utils";
import { dashboardHeroStatPalette } from "@/lib/dashboard-stat-themes";

const reportCardClass =
  "overflow-hidden rounded-xl border border-border/60 bg-card shadow-card";
const reportCardHeaderClass = "border-b border-border/60 px-5 py-4";
const scoreTileClass = cn(
  "rounded-xl border p-4 text-center",
  dashboardHeroStatPalette.shell,
);
const categoryTileClass =
  "rounded-xl border border-[#7367F0]/10 bg-[#7367F0]/[0.04] p-4";
const iconShellClass = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
  dashboardHeroStatPalette.iconShell,
);

function getQuestionTypeText(type: string) {
  switch (type) {
    case "technical":
      return "Technical";
    case "behavioral":
      return "Behavioral";
    case "system-design":
      return "System Design";
    case "hr":
      return "HR / Fit";
    default:
      return type;
  }
}

function getDifficultyStyles(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "medium":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    case "hard":
      return "bg-rose-50 text-rose-700 border border-rose-100";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-100";
  }
}

function getValidationStyles(match: string | boolean) {
  if (typeof match === "boolean") {
    return match
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : "bg-rose-50 text-rose-700 border border-rose-100";
  }
  switch (match) {
    case "exceeds":
      return "bg-violet-50 text-violet-700 border border-violet-100";
    case "meets":
      return "bg-muted text-primary border border-border";
    case "below":
      return "bg-orange-50 text-orange-700 border border-orange-100";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-100";
  }
}

export function InterviewReportCodingScores({
  report,
  className,
}: {
  report: InterviewReport;
  className?: string;
}) {
  const summary = report.codingSummary;
  if (!summary?.problems.length) return null;
  return (
    <Card className={cn(reportCardClass, className)}>
      <CardHeader className={reportCardHeaderClass}>
        <div className="flex items-center gap-3">
          <div className={iconShellClass}>
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              Practice coding round — problem scores
            </CardTitle>
            <CardDescription>
              All problems (automated tests: public + hidden on submit)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Overall coding score
          </span>
          <span
            className={cn(
              "text-3xl font-bold tabular-nums",
              getScoreColor(summary.overallCodingScore),
            )}
          >
            {summary.overallCodingScore}
            <span className="text-lg font-normal text-muted-foreground">
              {" "}
              / 100
            </span>
          </span>
        </div>
        <ul className="space-y-2">
          {summary.problems.map((p) => (
            <li
              key={p.problemId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
            >
              <span className="font-medium text-foreground">{p.title}</span>
              <span className="text-muted-foreground">
                {p.score}% · {p.passed}/{p.total} tests · {p.language}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Discussion + coding averages and category breakdown (matches practice interview report fields). */
export function InterviewReportCodingSessionOverview({
  report,
  className,
}: {
  report: InterviewReport;
  className?: string;
}) {
  const cs = report.codingSummary;
  if (!cs?.problems.length) return null;
  const sessionAvg = sessionAverageScore(report);
  const c = report.categoryScores;

  return (
    <Card className={cn(reportCardClass, "mb-8", className)}>
      <CardHeader className={reportCardHeaderClass}>
        <CardTitle className="text-lg font-semibold">Session scores</CardTitle>
        <CardDescription>
          Discussion overall, coding average, overall session average, and category
          scores (technical, behavioral, and more). Per-problem coding results follow
          in the next section.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={scoreTileClass}>
            <p className={cn("text-xs font-medium uppercase tracking-wide", dashboardHeroStatPalette.label)}>
              Discussion overall
            </p>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums",
                getScoreColor(report.overallScore),
              )}
            >
              {report.overallScore}
            </p>
            <p className="text-xs text-muted-foreground">AI Interview Practice &amp; Q&amp;A / 100</p>
          </div>
          <div className={scoreTileClass}>
            <p className={cn("text-xs font-medium uppercase tracking-wide", dashboardHeroStatPalette.label)}>
              Coding average
            </p>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums",
                getScoreColor(cs.overallCodingScore),
              )}
            >
              {cs.overallCodingScore}
            </p>
            <p className="text-xs text-muted-foreground">All problems / 100</p>
          </div>
          <div className={cn(scoreTileClass, "ring-1 ring-[#7367F0]/20")}>
            <p className={cn("text-xs font-medium uppercase tracking-wide", dashboardHeroStatPalette.label)}>
              Overall session average
            </p>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums",
                getScoreColor(sessionAvg),
              )}
            >
              {sessionAvg}
            </p>
            <p className="text-xs text-muted-foreground">Discussion + coding mean</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">
            Category scores (discussion)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { icon: Award, label: "Technical", value: c.technical },
                { icon: Brain, label: "Behavioral", value: c.behavioral },
                { icon: MessageSquare, label: "Communication", value: c.communication },
                { icon: Mic, label: "Confidence", value: c.confidence },
              ] as const
            ).map(({ icon: Icon, label, value }) => (
              <div key={label} className={categoryTileClass}>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-[#7367F0]" />
                  <span className="font-medium text-foreground">{label}</span>
                  <span
                    className={cn(
                      "ml-auto text-xl font-bold tabular-nums",
                      getScoreColor(value),
                    )}
                  >
                    {value}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={value} className="h-2.5" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Narrative summary for practice coding round (Pass 2 + fallback). */
export function InterviewReportOverallExperience({
  report,
  className,
}: {
  report: InterviewReport;
  className?: string;
}) {
  if (!report.codingSummary?.problems.length) return null;
  const text = buildOverallExperienceParagraph(report);
  if (!text) return null;
  return (
    <Card className={cn(reportCardClass, "mb-8", className)}>
      <CardHeader className={reportCardHeaderClass}>
        <div className="flex items-center gap-3">
          <div className={iconShellClass}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Overall experience</CardTitle>
            <CardDescription>
              Coding round plus discussion — coach-style read of how the full session went
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

export function InterviewReportQuestionByQuestion({
  report,
  className,
}: {
  report: InterviewReport;
  className?: string;
}) {
  if (!report.qaAnalysis?.length) return null;
  return (
    <Card className={cn(reportCardClass, "mb-8", className)}>
      <CardHeader className={reportCardHeaderClass}>
        <CardTitle className="text-lg font-semibold">Question-by-question analysis</CardTitle>
        <CardDescription>
          AI Interview Practice discussion and interview Q&amp;A — per-question scoring and feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5">
        {report.qaAnalysis.map((qa, index) => (
          <div
            key={`${qa.question}-${index}`}
            className="overflow-hidden rounded-xl border border-border/60 bg-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[#a8aaae]">
                  Question #{index + 1}
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  {qa.question}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyStyles(
                    qa.questionDifficulty,
                  )}`}
                >
                  {qa.questionDifficulty.toUpperCase()}
                </span>
                <span className="rounded-full border border-[#7367F0]/15 bg-[#7367F0]/10 px-3 py-1 text-xs font-medium text-[#7367F0]">
                  {getQuestionTypeText(qa.questionType)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getValidationStyles(
                    qa.answerMatchedQuestion,
                  )}`}
                >
                  {qa.answerMatchedQuestion
                    ? "Aligned with question"
                    : "Needs better alignment"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getValidationStyles(
                    qa.technicalDepthMatch,
                  )}`}
                >
                  Depth: {qa.technicalDepthMatch}
                </span>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#a8aaae]">
                  Candidate answer
                </p>
                <p className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
                  {qa.candidateAnswer}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#a8aaae]">
                  Suggested answer
                </p>
                <p className="mt-2 rounded-lg border border-[#7367F0]/10 bg-[#7367F0]/[0.04] p-4 text-sm leading-relaxed text-foreground">
                  {qa.suggestedAnswer}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { label: "Correctness", value: qa.correctnessScore },
                    { label: "Clarity", value: qa.clarityScore },
                    { label: "Completeness", value: qa.completenessScore },
                  ] as const
                ).map((metric) => (
                  <div
                    key={metric.label}
                    className={cn(scoreTileClass, "py-3")}
                  >
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p
                      className={cn("text-2xl font-semibold tabular-nums", getScoreColor(metric.value))}
                    >
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Experience alignment
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {qa.experienceAlignmentScore} / 100
                  </span>
                </div>
                <Progress
                  value={qa.experienceAlignmentScore}
                  className="mt-2 h-2"
                />
                {qa.validationNotes && qa.validationNotes !== "N/A" && (
                  <p className="mt-2 text-xs text-muted-foreground">{qa.validationNotes}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#a8aaae]">
                  Feedback
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{qa.feedback}</p>
              </div>
            </div>

            <div className="border-t border-border/60 bg-muted/20 px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Strengths
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {qa.strengths.map((strength, idx) => (
                      <li key={`strength-${index}-${idx}`} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7367F0]">
                    Improvements
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {qa.improvements.map((improvement, idx) => (
                      <li key={`improvement-${index}-${idx}`} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7367F0]" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Full report: scores, strengths, behavioral, question-by-question (same data as candidate report). */
export function InterviewReportAnalysis({ report }: { report: InterviewReport }) {
  const isCodingRoundLayout = !!(
    report.codingSummary && report.codingSummary.problems.length > 0
  );

  const categoryCards = [
    { icon: Award, title: "Technical skills", desc: "Problem-solving & knowledge", value: report.categoryScores.technical },
    { icon: Brain, title: "Behavioral", desc: "STAR & storytelling", value: report.categoryScores.behavioral },
    { icon: MessageSquare, title: "Communication", desc: "Clarity & structure", value: report.categoryScores.communication },
    { icon: Mic, title: "Confidence", desc: "Delivery & presence", value: report.categoryScores.confidence },
  ] as const;

  return (
    <div className="space-y-4 lg:space-y-6">
      <InterviewReportCodingSessionOverview report={report} />
      <InterviewReportCodingScores report={report} />
      <InterviewReportOverallExperience report={report} />

      {isCodingRoundLayout && <InterviewReportQuestionByQuestion report={report} />}

      {!isCodingRoundLayout && (
        <Card className={reportCardClass}>
          <div
            className={`h-1 bg-gradient-to-r ${getScoreGradient(report.overallScore)}`}
          />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">Overall performance</h2>
                <p className="text-muted-foreground">
                  Aggregated score across categories (generated at interview completion)
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div
                  className={cn(
                    "text-5xl font-bold tabular-nums sm:text-6xl",
                    getScoreColor(report.overallScore),
                  )}
                >
                  {report.overallScore}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(report.passStatus === "pass" || report.passStatus === "fail") &&
        report.passingScoreThreshold != null && (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              report.passStatus === "pass"
                ? "border-emerald-200/60 bg-emerald-50/50 text-emerald-900"
                : "border-amber-200/60 bg-amber-50/50 text-amber-950",
            )}
          >
            <span className="font-medium">Institution passing bar:</span> overall score of{" "}
            {report.passingScoreThreshold} or higher was required. Result:{" "}
            <span className="font-semibold">
              {report.passStatus === "pass" ? "Pass" : "Below bar"}.
            </span>
          </div>
        )}

      {!isCodingRoundLayout && (
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
          {categoryCards.map(({ icon: Icon, title, desc, value }) => (
            <Card key={title} className={reportCardClass}>
              <CardHeader className={reportCardHeaderClass}>
                <div className="flex items-center gap-3">
                  <div className={iconShellClass}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn("text-3xl font-bold tabular-nums", getScoreColor(value))}>
                    {value}
                  </span>
                  <span className="text-muted-foreground">/ 100</span>
                </div>
                <Progress value={value} className="h-2.5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
        <Card className={cn(reportCardClass, "border-emerald-200/40")}>
          <CardHeader className={reportCardHeaderClass}>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ul className="space-y-3">
              {report.strengths.map((strength, index) => (
                <li key={`strength-${index}-${strength.slice(0, 12)}`} className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="text-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className={reportCardClass}>
          <CardHeader className={reportCardHeaderClass}>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#7367F0]">
              <TrendingUp className="h-5 w-5" />
              Areas for improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ul className="space-y-3">
              {report.improvements.map((improvement, index) => (
                <li
                  key={`improvement-${index}-${improvement.slice(0, 12)}`}
                  className="flex gap-2"
                >
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className="text-foreground">{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className={reportCardClass}>
        <CardHeader className={reportCardHeaderClass}>
          <CardTitle className="text-lg font-semibold">Behavioral analysis</CardTitle>
          <CardDescription>Communication metrics from the session</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              {(
                [
                  { label: "Confidence", value: report.behavioral.confidence },
                  { label: "Clarity", value: report.behavioral.clarity },
                  { label: "Fluency", value: report.behavioral.fluency },
                ] as const
              ).map(({ label, value }) => (
                <div key={label} className="mb-4 last:mb-0">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className={cn("text-sm font-semibold tabular-nums", getScoreColor(value))}>
                      {value}%
                    </span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#7367F0]/15 bg-[#7367F0]/[0.04] p-4">
              <div className="mb-1 font-semibold text-foreground">Filler words</div>
              <div className="text-2xl font-bold tabular-nums text-[#7367F0]">
                {report.behavioral.fillersPerMinute.toFixed(1)} / min
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isCodingRoundLayout && (
        <InterviewReportQuestionByQuestion report={report} />
      )}
    </div>
  );
}
