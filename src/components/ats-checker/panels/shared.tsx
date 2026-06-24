"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ATSCheckFAQ,
  ATSCheckResult,
  ATSCheckSummary,
  ATSIssue,
} from "@/types/atsReport";
import { ATSIssueMagicButton } from "../ATSIssueImproveDialog";
import { ATSIssueIgnoreButton } from "../ATSIssueIgnoreButton";
import { ATSIssueSuggestionActions } from "../ATSIssueSuggestionActions";

function ATSIssueActionButtons({
  check,
  issue,
  categoryLabel,
}: {
  check: ATSCheckResult;
  issue: ATSIssue;
  categoryLabel?: string;
}) {
  return (
    <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-1 overflow-visible">
      <ATSIssueIgnoreButton check={check} issue={issue} />
      <ATSIssueMagicButton
        check={check}
        issue={issue}
        categoryLabel={categoryLabel}
      />
    </div>
  );
}

export function ATSIssueHero({
  summary,
  issueCount,
  variant = "warn",
}: {
  summary?: ATSCheckSummary;
  issueCount: number;
  variant?: "warn" | "success" | "info";
}) {
  if (!summary?.headline && issueCount === 0) return null;

  const styles =
    variant === "success"
      ? "border-green-200 bg-green-50"
      : variant === "info"
        ? "border-blue-200 bg-blue-50"
        : "border-red-200 bg-red-50";

  return (
    <div className={cn("overflow-hidden rounded-xl border p-4 sm:p-5", styles)}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold sm:h-12 sm:w-12 sm:text-lg",
            variant === "success"
              ? "bg-green-100 text-green-700"
              : variant === "info"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700",
          )}
        >
          {variant === "success" ? (
            <Check className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            issueCount || "!"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
            {summary?.headline ||
              (issueCount > 0
                ? `${issueCount} issue${issueCount > 1 ? "s" : ""} found`
                : "No issues found")}
          </p>
          {summary?.badge && (
            <span className="mt-2 inline-block max-w-full break-words rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700">
              {summary.badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ATSStatCounters({
  stats,
}: {
  stats?: Record<string, number>;
}) {
  if (!stats || Object.keys(stats).length === 0) return null;

  const labels: Record<string, string> = {
    orphanSkills: "Orphan skills",
    weakEvidence: "Weak evidence",
    hiddenSkills: "Hidden skills",
    missingSkills: "Missing skills",
    uniquenessPercent: "Uniqueness %",
  };

  const entries = Object.entries(stats).filter(
    ([key]) => key !== "unquantifiedBullets",
  );

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="rounded-lg border border-border bg-card px-3 py-2 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {labels[key] || key}
          </p>
          <p className="text-xl font-bold text-foreground">{val}</p>
        </div>
      ))}
    </div>
  );
}

export function ATSFAQAccordion({ faq }: { faq?: ATSCheckFAQ[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  if (!faq?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <HelpCircle className="h-4 w-4 text-primary" />
        FAQs
      </p>
      <div className="space-y-2">
        {faq.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-border bg-card">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            >
              {item.question}
              {openIdx === idx ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>
            {openIdx === idx && (
              <p className="border-t px-4 pb-3 pt-2 text-sm text-muted-foreground">
                {item.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ATSSynonymRow({
  issue,
  check,
  categoryLabel,
}: {
  issue: ATSIssue;
  check?: ATSCheckResult;
  categoryLabel?: string;
}) {
  const alts = issue.alternatives || [];
  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="min-w-0 flex-1 break-words font-semibold text-foreground">
          {issue.title}
        </p>
        {check && (
          <ATSIssueActionButtons
            check={check}
            issue={issue}
            categoryLabel={categoryLabel}
          />
        )}
      </div>
      <p className="break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
        {issue.description}
      </p>
      {alts.length > 0 && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-xs font-medium text-muted-foreground">Try instead:</p>
          <div className="flex flex-wrap gap-2">
            {alts.map((alt) => (
              <span
                key={alt}
                className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
              >
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ATSSpellingRow({
  issue,
  check,
  categoryLabel,
}: {
  issue: ATSIssue;
  check?: ATSCheckResult;
  categoryLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-red-800">{issue.title}</span>
        </div>
        {check && (
          <ATSIssueActionButtons
            check={check}
            issue={issue}
            categoryLabel={categoryLabel}
          />
        )}
      </div>
      {issue.excerpt && (
        <p className="text-sm text-muted-foreground">{issue.excerpt}</p>
      )}
      {issue.alternatives && issue.alternatives.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {issue.alternatives.map((alt) => (
            <span
              key={alt}
              className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-800"
            >
              {alt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ATSRewritePair({
  issue,
  check,
  categoryLabel,
  showMagic = true,
}: {
  issue: ATSIssue;
  check?: ATSCheckResult;
  categoryLabel?: string;
  showMagic?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-4">
      {issue.excerpt && (
        <div className="flex gap-2 overflow-hidden rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-red-900 [overflow-wrap:anywhere]">
            &ldquo;{issue.excerpt}&rdquo;
          </p>
        </div>
      )}
      {issue.rewriteSuggestion ? (
        <ATSIssueSuggestionActions
          suggestion={issue.rewriteSuggestion}
          sourceContent={issue.excerpt}
          issue={issue}
          check={check}
          categoryLabel={categoryLabel}
          showMagic={showMagic}
        />
      ) : (
        check &&
        showMagic && (
          <div className="flex justify-end">
            <ATSIssueActionButtons
              check={check}
              issue={issue}
              categoryLabel={categoryLabel}
            />
          </div>
        )
      )}
    </div>
  );
}

export function ATSCredibilitySplit({
  issues,
  check,
  categoryLabel,
}: {
  issues: ATSIssue[];
  check?: ATSCheckResult;
  categoryLabel?: string;
}) {
  const positive = issues.filter(
    (i) =>
      i.kind === "credibility_positive" ||
      i.kind === "positive" ||
      i.title.toLowerCase().includes("credible"),
  );
  const risks = issues.filter(
    (i) =>
      i.kind === "credibility_risk" ||
      (!positive.includes(i) &&
        i.kind !== "credibility_positive" &&
        i.kind !== "positive"),
  );

  const showSplitLayout = positive.length > 0 && risks.length > 0;

  return (
    <div
      className={cn(
        "grid gap-4",
        showSplitLayout ? "lg:grid-cols-2" : "grid-cols-1",
      )}
    >
      {positive.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">
            What looks credible
          </p>
          <div className="space-y-3">
            {positive.map((issue, idx) => (
              <div
                key={idx}
                className="flex gap-3 rounded-xl border border-green-100 bg-green-50/50 p-4"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-foreground">{issue.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {issue.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {risks.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">
            Hiring managers may question
          </p>
          <div className="space-y-3">
            {risks.map((issue, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-foreground">
                        {issue.title}
                      </p>
                      {issue.description && (
                        <p className="text-sm text-muted-foreground">
                          {issue.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {check && (
                    <ATSIssueActionButtons
                      check={check}
                      issue={issue}
                      categoryLabel={categoryLabel}
                    />
                  )}
                </div>

                {issue.excerpt && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
                    <p className="text-sm leading-relaxed text-red-900">
                      &ldquo;{issue.excerpt}&rdquo;
                    </p>
                  </div>
                )}

                {(issue.fixBody || issue.suggestion) && (
                  <div className="rounded-lg border border-purple-100 bg-purple-50/60 px-3 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                      {issue.fixTitle || "How to fix it"}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      {issue.fixBody || issue.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ATSRiskCard({
  issue,
  check,
  categoryLabel,
}: {
  issue: ATSIssue;
  check?: ATSCheckResult;
  categoryLabel?: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex gap-2">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground">{issue.title}</p>
            {check && (
              <ATSIssueActionButtons
                check={check}
                issue={issue}
                categoryLabel={categoryLabel}
              />
            )}
          </div>
          {issue.excerpt && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
              {issue.excerpt}
            </p>
          )}
        </div>
      </div>
      {issue.interviewQuestion && (
        <div className="flex gap-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
          <div>
            <p className="text-xs font-bold text-purple-800">Q</p>
            <p className="text-sm text-purple-900">{issue.interviewQuestion}</p>
          </div>
        </div>
      )}
      {(issue.fixBody || issue.suggestion || issue.rewriteSuggestion) && (
        <div className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-bold text-amber-800">Fix</p>
            <p className="text-sm text-amber-900">
              {issue.fixBody || issue.rewriteSuggestion || issue.suggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ATSSkillBenchmarkGrid({ issues }: { issues: ATSIssue[] }) {
  const skills = issues.filter(
    (i) => i.kind === "skill_gap" || i.kind === "skill_present" || i.skillPresent !== undefined,
  );
  if (skills.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {skills.map((skill, idx) => {
        const present =
          skill.skillPresent ?? skill.kind === "skill_present";
        return (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
              present
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800",
            )}
          >
            {present ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <X className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{skill.title}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ATSSectionChecklist({
  check,
  issues,
}: {
  check?: ATSCheckResult;
  issues?: ATSIssue[];
}) {
  const fromMeta = check?.meta?.detectedSections;
  const found =
    fromMeta && fromMeta.length > 0
      ? fromMeta
      : (issues ?? check?.issues ?? [])
          .filter((i) => i.kind === "positive")
          .map((i) => i.title);

  if (found.length === 0) return null;

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/50 p-5">
      <p className="mb-3 font-semibold text-green-900">
        Essential sections found
      </p>
      <ul className="space-y-2">
        {found.map((title) => (
          <li
            key={title}
            className="flex items-center gap-2 text-sm text-green-800"
          >
            <Check className="h-4 w-4" />
            {title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ATSGenericIssueList({
  issues,
  check,
  categoryLabel,
}: {
  issues: ATSIssue[];
  check?: ATSCheckResult;
  categoryLabel?: string;
}) {
  const negatives = issues.filter(
    (i) => i.kind !== "positive" && i.kind !== "credibility_positive" && i.kind !== "skill_present",
  );

  return (
    <div className="min-w-0 space-y-4">
      {negatives.map((issue, idx) => (
        <div
          key={idx}
          className="min-w-0 space-y-3 overflow-hidden rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {(issue.severity === "fail" || !issue.severity) && issue.kind === "negative" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h4 className="break-words font-semibold text-foreground [overflow-wrap:anywhere]">
                  {issue.title}
                </h4>
                {check && (
                  <ATSIssueActionButtons
                    check={check}
                    issue={issue}
                    categoryLabel={categoryLabel}
                  />
                )}
              </div>
              <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                {issue.description}
              </p>
            </div>
          </div>
          {issue.excerpt && (
            <div className="overflow-hidden rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-900 break-words [overflow-wrap:anywhere]">
              &ldquo;{issue.excerpt}&rdquo;
            </div>
          )}
          {issue.suggestion && (
            <p className="break-words text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
              <span className="font-medium">Suggestion: </span>
              {issue.suggestion}
            </p>
          )}
          {issue.rewriteSuggestion && (
            <ATSRewritePair
              issue={issue}
              check={check}
              categoryLabel={categoryLabel}
              showMagic={false}
            />
          )}
          {issue.fixBody && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-bold uppercase text-primary">
                {issue.fixTitle || "HOW TO FIX IT"}
              </p>
              <p className="mt-1 text-sm">{issue.fixBody}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
