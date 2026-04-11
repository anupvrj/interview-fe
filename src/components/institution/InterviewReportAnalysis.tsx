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
} from "lucide-react";
import type { InterviewReport } from "@/lib/api";
import { getScoreColor, getScoreGradient } from "@/lib/utils";

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
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "below":
      return "bg-orange-50 text-orange-700 border border-orange-100";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-100";
  }
}

/** Full report: scores, strengths, behavioral, question-by-question (same data as candidate report). */
export function InterviewReportAnalysis({ report }: { report: InterviewReport }) {
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-2">
        <div
          className={`h-2 bg-gradient-to-r ${getScoreGradient(report.overallScore)}`}
        />
        <CardContent className="p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="mb-2 text-2xl font-bold">Overall performance</h2>
              <p className="text-gray-600">
                Aggregated score across categories (generated at interview completion)
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div
                className={`text-5xl font-bold sm:text-6xl ${getScoreColor(
                  report.overallScore,
                )}`}
              >
                {report.overallScore}
              </div>
              <div className="text-sm text-gray-500">out of 100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(report.passStatus === "pass" || report.passStatus === "fail") &&
        report.passingScoreThreshold != null && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              report.passStatus === "pass"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            <span className="font-medium">Institution passing bar:</span> overall score of{" "}
            {report.passingScoreThreshold} or higher was required. Result:{" "}
            <span className="font-semibold">
              {report.passStatus === "pass" ? "Pass" : "Below bar"}.
            </span>
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Technical skills</CardTitle>
                <CardDescription>Problem-solving & knowledge</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`text-3xl font-bold ${getScoreColor(
                  report.categoryScores.technical,
                )}`}
              >
                {report.categoryScores.technical}
              </span>
              <span className="text-gray-500">/ 100</span>
            </div>
            <Progress value={report.categoryScores.technical} className="h-3" />
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Behavioral</CardTitle>
                <CardDescription>STAR & storytelling</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`text-3xl font-bold ${getScoreColor(
                  report.categoryScores.behavioral,
                )}`}
              >
                {report.categoryScores.behavioral}
              </span>
              <span className="text-gray-500">/ 100</span>
            </div>
            <Progress value={report.categoryScores.behavioral} className="h-3" />
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-green-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Clarity & structure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`text-3xl font-bold ${getScoreColor(
                  report.categoryScores.communication,
                )}`}
              >
                {report.categoryScores.communication}
              </span>
              <span className="text-gray-500">/ 100</span>
            </div>
            <Progress
              value={report.categoryScores.communication}
              className="h-3"
            />
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Mic className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Confidence</CardTitle>
                <CardDescription>Delivery & presence</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`text-3xl font-bold ${getScoreColor(
                  report.categoryScores.confidence,
                )}`}
              >
                {report.categoryScores.confidence}
              </span>
              <span className="text-gray-500">/ 100</span>
            </div>
            <Progress value={report.categoryScores.confidence} className="h-3" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.strengths.map((strength, index) => (
                <li key={`strength-${index}-${strength.slice(0, 12)}`} className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              Areas for improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.improvements.map((improvement, index) => (
                <li
                  key={`improvement-${index}-${improvement.slice(0, 12)}`}
                  className="flex gap-2"
                >
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle>Behavioral analysis</CardTitle>
          <CardDescription>Communication metrics from the session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Confidence</span>
                <span
                  className={`text-sm font-semibold ${getScoreColor(
                    report.behavioral.confidence,
                  )}`}
                >
                  {report.behavioral.confidence}%
                </span>
              </div>
              <Progress value={report.behavioral.confidence} className="mb-4 h-2" />
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Clarity</span>
                <span
                  className={`text-sm font-semibold ${getScoreColor(
                    report.behavioral.clarity,
                  )}`}
                >
                  {report.behavioral.clarity}%
                </span>
              </div>
              <Progress value={report.behavioral.clarity} className="mb-4 h-2" />
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Fluency</span>
                <span
                  className={`text-sm font-semibold ${getScoreColor(
                    report.behavioral.fluency,
                  )}`}
                >
                  {report.behavioral.fluency}%
                </span>
              </div>
              <Progress value={report.behavioral.fluency} className="h-2" />
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="mb-1 font-semibold text-purple-900">Filler words</div>
              <div className="text-2xl font-bold text-purple-600">
                {report.behavioral.fillersPerMinute.toFixed(1)} / min
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {report.qaAnalysis && report.qaAnalysis.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Question-by-question analysis</CardTitle>
            <CardDescription>
              Per-question scoring, answers, and feedback (as generated at interview time)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.qaAnalysis.map((qa, index) => (
              <div
                key={`${qa.question}-${index}`}
                className="rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Question #{index + 1}
                    </p>
                    <h3 className="text-base font-semibold text-slate-800">
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
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
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

                <div className="space-y-5 px-6 py-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Candidate answer
                    </p>
                    <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-900">
                      {qa.candidateAnswer}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Suggested answer
                    </p>
                    <p className="mt-2 rounded-xl bg-violet-50/70 p-4 text-sm leading-relaxed text-slate-900">
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
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
                      >
                        <p className="text-xs text-slate-500">{metric.label}</p>
                        <p
                          className={`text-2xl font-semibold ${getScoreColor(metric.value)}`}
                        >
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Experience alignment
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {qa.experienceAlignmentScore} / 100
                      </span>
                    </div>
                    <Progress
                      value={qa.experienceAlignmentScore}
                      className="mt-2 h-2"
                    />
                    {qa.validationNotes && qa.validationNotes !== "N/A" && (
                      <p className="mt-2 text-xs text-slate-500">{qa.validationNotes}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Feedback
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{qa.feedback}</p>
                  </div>
                </div>

                <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Strengths
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {qa.strengths.map((strength, idx) => (
                          <li key={`strength-${index}-${idx}`} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                        Improvements
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {qa.improvements.map((improvement, idx) => (
                          <li key={`improvement-${index}-${idx}`} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
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
      )}
    </div>
  );
}
