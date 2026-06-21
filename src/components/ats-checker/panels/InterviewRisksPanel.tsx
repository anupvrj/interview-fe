"use client";

import {
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";
import { ATSFAQAccordion } from "./shared";
import { ATSIssueMagicButton } from "../ATSIssueImproveDialog";
import { ATSIssueIgnoreButton } from "../ATSIssueIgnoreButton";

function InterviewRiskCard({
  issue,
  check,
  categoryLabel,
}: {
  issue: ATSIssue;
  check: ATSCheckResult;
  categoryLabel?: string;
}) {
  const excerpts = issue.excerpt
    ? issue.excerpt.split(/,\s*(?=[a-z])/i).filter(Boolean)
    : [];

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="font-semibold text-foreground">{issue.title}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <ATSIssueIgnoreButton check={check} issue={issue} />
          <ATSIssueMagicButton
            check={check}
            issue={issue}
            categoryLabel={categoryLabel}
          />
        </div>
      </div>

      {excerpts.length > 0 && (
        <div className="rounded-lg border border-red-100 bg-red-50/80 px-3 py-2.5">
          <p className="text-sm leading-relaxed text-red-900">
            {excerpts.map((excerpt, idx) => (
              <span key={idx}>
                {idx > 0 && ", "}
                &ldquo;{excerpt.trim()}&rdquo;
              </span>
            ))}
          </p>
        </div>
      )}

      {issue.description && !issue.excerpt && (
        <p className="text-sm text-muted-foreground">{issue.description}</p>
      )}

      {issue.interviewQuestion && (
        <div className="flex gap-3 rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-3">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-800">
              Q
            </p>
            <p className="mt-1 text-sm leading-relaxed text-violet-950">
              {issue.interviewQuestion}
            </p>
          </div>
        </div>
      )}

      {(issue.fixBody || issue.suggestion || issue.rewriteSuggestion) && (
        <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
              Fix
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950">
              {issue.fixBody || issue.rewriteSuggestion || issue.suggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface InterviewRisksPanelProps {
  check: ATSCheckResult;
  categoryLabel?: string;
}

export function InterviewRisksPanel({
  check,
  categoryLabel,
}: InterviewRisksPanelProps) {
  const risks = check.issues.filter(
    (i) =>
      i.kind !== "positive" &&
      i.kind !== "credibility_positive" &&
      i.kind !== "skill_present",
  );
  const intro =
    check.summary?.intro ||
    "Your resume is your first interview. We've identified specific gaps in your impact and credibility that will likely trigger tough questions from recruiters. Addressing these now prevents surprises later.";
  const heroText =
    check.summary?.headline ||
    (risks.length > 0
      ? `We found ${risks.length} area${risks.length > 1 ? "s" : ""} that would make any technical interviewer probe deeply into your metrics methodology, project ownership, and career timeline consistency.`
      : "No major interview risk flags detected.");

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>

      {risks.length > 0 ? (
        <>
          <div
            className={cn(
              "rounded-xl border p-5 sm:p-6",
              "border-red-200 bg-gradient-to-br from-red-50/80 to-orange-50/40",
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-xl font-bold text-red-700 shadow-sm">
                {risks.length}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-red-900">Careful!</p>
                <p className="mt-1 text-sm leading-relaxed text-red-950/90">
                  {heroText}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-base font-bold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Detected red flags
            </h4>
            <div className="space-y-3">
              {risks.map((issue, idx) => (
                <InterviewRiskCard
                  key={idx}
                  issue={issue}
                  check={check}
                  categoryLabel={categoryLabel}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-medium text-green-800">{heroText}</p>
        </div>
      )}

      <ATSFAQAccordion faq={check.faq} />
    </div>
  );
}
