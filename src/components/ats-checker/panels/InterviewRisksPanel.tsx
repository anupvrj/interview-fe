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

/** Something likely to hurt if asked. Everything else is a question to be ready for. */
const isRedFlag = (issue: ATSIssue) => issue.severity === "fail";

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
          {isRedFlag(issue) ? (
            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-[#fd7070]" aria-label="Red flag" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" aria-label="Warning" />
          )}
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
        <div className={cn("rounded-lg border px-3 py-2.5", isRedFlag(issue) ? "border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/25" : "border-amber-100 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25")}>
          <p className={cn("text-sm leading-relaxed", isRedFlag(issue) ? "text-red-900 dark:text-[#fd7070]" : "text-amber-950 dark:text-amber-100")}>
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
        <div className="flex gap-3 rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-3 dark:border-violet-900/40 dark:bg-violet-950/25">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
              Q
            </p>
            <p className="mt-1 text-sm leading-relaxed text-violet-950 dark:text-violet-100">
              {issue.interviewQuestion}
            </p>
          </div>
        </div>
      )}

      {(issue.fixBody || issue.suggestion || issue.rewriteSuggestion) && (
        <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25 px-3 py-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              Fix
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950 dark:text-amber-100">
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
  const redFlags = risks.filter(isRedFlag);
  const warnings = risks.filter((issue) => !isRedFlag(issue));
  // The stored headline counts every finding, including any set aside since.
  const counted =
    risks.length > 0
      ? `We found ${risks.length} area${risks.length > 1 ? "s" : ""} that would make any technical interviewer probe deeply into your resume.`
      : "No open interview risks.";
  const heroText = check.baseline ? counted : check.summary?.headline || counted;

  const group = (title: string, items: ATSIssue[], icon: React.ReactNode) =>
    items.length > 0 && (
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 text-base font-bold text-foreground">
          {icon}
          {title} ({items.length})
        </h4>
        <div className="space-y-3">
          {items.map((issue) => (
            <InterviewRiskCard key={`${issue.title}:${issue.excerpt ?? ""}`} issue={issue} check={check} categoryLabel={categoryLabel} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>

      {risks.length > 0 ? (
        <>
          <div
            className={cn(
              "rounded-xl border p-5 sm:p-6",
              redFlags.length > 0
                ? "border-red-200 bg-gradient-to-br from-red-50/80 to-orange-50/40 dark:border-red-900/50 dark:from-red-950/30 dark:to-orange-950/10"
                : "border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/10",
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-card text-xl font-bold", redFlags.length > 0 ? "text-red-600 dark:text-[#fd7070]" : "text-amber-600 dark:text-amber-300")}>
                {risks.length}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-lg font-bold", redFlags.length > 0 ? "text-red-900 dark:text-[#fd7070]" : "text-amber-900 dark:text-amber-200")}>
                  {redFlags.length > 0 ? "Careful!" : "Be ready for these"}
                </p>
                <p className={cn("mt-1 text-sm leading-relaxed", redFlags.length > 0 ? "text-red-950/90 dark:text-[#fd7070]" : "text-amber-950/90 dark:text-amber-100")}>
                  {heroText}
                </p>
              </div>
            </div>
          </div>

          {group("Red flags", redFlags, <X className="h-4 w-4 text-red-600 dark:text-[#fd7070]" />)}
          {group("Warnings", warnings, <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />)}
        </>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/50 dark:bg-green-950/30">
          <p className="font-medium text-green-800 dark:text-green-200">{heroText}</p>
        </div>
      )}

      <ATSFAQAccordion faq={check.faq} />
    </div>
  );
}
