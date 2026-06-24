"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ATSCheckId, ATSCheckResult, ATSMatchMeta } from "@/types/atsReport";
import {
  ATSFAQAccordion,
  ATSGenericIssueList,
  ATSIssueHero,
  ATSSectionChecklist,
  ATSSpellingRow,
  ATSStatCounters,
  ATSSynonymRow,
  ATSRewritePair,
} from "./shared";
import { PeerBenchmarkingPanel } from "./PeerBenchmarkingPanel";
import { CredibilityPanel } from "./CredibilityPanel";
import { InterviewRisksPanel } from "./InterviewRisksPanel";
import { dedupeQuantifyingIssues } from "@/lib/atsIssueDedup";

function MatchMeta({ meta }: { meta: ATSMatchMeta }) {
  const pct = meta.matchPercent ?? 0;
  const hasChips =
    (meta.matched?.length ?? 0) > 0 ||
    (meta.missing?.length ?? 0) > 0 ||
    (meta.partial?.length ?? 0) > 0;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      {(meta.requiredLabel || meta.foundLabel) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {meta.requiredLabel && (
            <div>
              <span className="text-muted-foreground">Required: </span>
              <span className="font-semibold">{meta.requiredLabel}</span>
            </div>
          )}
          {meta.foundLabel && (
            <div>
              <span className="text-muted-foreground">Your resume: </span>
              <span className="font-semibold">{meta.foundLabel}</span>
            </div>
          )}
        </div>
      )}
      {meta.matchPercent !== undefined && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Match</span>
            <span
              className={cn(
                "font-bold",
                pct >= 80
                  ? "text-green-600"
                  : pct >= 50
                    ? "text-amber-600"
                    : "text-red-600",
              )}
            >
              {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                pct >= 80
                  ? "bg-green-500"
                  : pct >= 50
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      {meta.verdict && (
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
            meta.verdict === "strong"
              ? "bg-green-100 text-green-800"
              : meta.verdict === "partial"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800",
          )}
        >
          {meta.verdict} fit
        </span>
      )}
      {hasChips && (
        <div className="space-y-3">
          {(meta.matched?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-green-700">
                Matched ({meta.matched!.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meta.matched!.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(meta.missing?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-red-700">
                Missing ({meta.missing!.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meta.missing!.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CheckPanelRouterProps {
  check: ATSCheckResult;
  targetRole?: string;
  categoryLabel?: string;
  compact?: boolean;
}

export function CheckPanelRouter({
  check,
  targetRole,
  categoryLabel,
  compact: _compact = false,
}: CheckPanelRouterProps) {
  if (check.status === "skipped") {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
        <Lock className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>{check.issues[0]?.description || "This check is not available."}</p>
      </div>
    );
  }

  if (check.id === "peerBenchmarking") {
    return (
      <PeerBenchmarkingPanel check={check} targetRole={targetRole} />
    );
  }

  if (check.id === "credibility") {
    return (
      <CredibilityPanel check={check} categoryLabel={categoryLabel} />
    );
  }

  if (check.id === "interviewRisks") {
    return (
      <InterviewRisksPanel check={check} categoryLabel={categoryLabel} />
    );
  }

  const negativeIssues = check.issues.filter(
    (i) =>
      i.kind !== "positive" &&
      i.kind !== "credibility_positive" &&
      i.kind !== "skill_present",
  );
  const heroVariant =
    check.status === "pass" && negativeIssues.length === 0
      ? "success"
      : negativeIssues.length >= 3
        ? "warn"
        : negativeIssues.length > 0
          ? "info"
          : "success";

  const renderBody = () => {
    const id = check.id as ATSCheckId;

    switch (id) {
      case "quantifyingImpact":
        return (
          <div className="space-y-4">
            {dedupeQuantifyingIssues(check.issues).map((issue, idx) => (
              <ATSRewritePair
                key={`${issue.excerpt || issue.rewriteSuggestion || issue.title}-${idx}`}
                issue={issue}
                check={check}
                categoryLabel={categoryLabel}
              />
            ))}
          </div>
        );

      case "repetition":
        return (
          <div className="space-y-3">
            {check.issues.map((issue, idx) => (
              <ATSSynonymRow
                key={idx}
                issue={issue}
                check={check}
                categoryLabel={categoryLabel}
              />
            ))}
          </div>
        );

      case "spellingGrammar":
        return (
          <div className="space-y-3">
            {check.issues.map((issue, idx) => (
              <ATSSpellingRow
                key={idx}
                issue={issue}
                check={check}
                categoryLabel={categoryLabel}
              />
            ))}
          </div>
        );

      case "skillEvidence":
        return (
          <div className="space-y-4">
            <ATSGenericIssueList
              issues={check.issues}
              check={check}
              categoryLabel={categoryLabel}
            />
          </div>
        );

      case "essentialSections":
        return (
          <div className="space-y-4">
            <ATSSectionChecklist check={check} issues={check.issues} />
            <ATSGenericIssueList
              issues={check.issues}
              check={check}
              categoryLabel={categoryLabel}
            />
          </div>
        );

      case "bulletsConsistency":
        if (check.issueCount === 0) {
          return (
            <div className="rounded-xl border border-green-100 bg-green-50 p-6 text-center">
              <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="font-medium text-green-800">No issues found</p>
            </div>
          );
        }
        return (
          <ATSGenericIssueList
            issues={check.issues.map((i) => ({
              ...i,
              description:
                i.wordCount != null
                  ? `${i.description} (${i.wordCount} words)`
                  : i.description,
            }))}
            check={check}
            categoryLabel={categoryLabel}
          />
        );

      default:
        return (
          <ATSGenericIssueList
            issues={check.issues}
            check={check}
            categoryLabel={categoryLabel}
          />
        );
    }
  };

  return (
    <div className="min-w-0 space-y-5 overflow-hidden sm:space-y-6">
      {(check.summary || check.issueCount > 0 || check.status === "pass") && (
        <ATSIssueHero
          summary={check.summary}
          issueCount={negativeIssues.length}
          variant={heroVariant}
        />
      )}

      {check.parseRate !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Parse Rate</span>
            <span
              className={cn(
                "font-bold",
                check.parseRate >= 85 ? "text-green-600" : "text-amber-600",
              )}
            >
              {check.parseRate}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                check.parseRate >= 85 ? "bg-green-500" : "bg-amber-500",
              )}
              style={{ width: `${check.parseRate}%` }}
            />
          </div>
        </div>
      )}

      {check.meta && <MatchMeta meta={check.meta} />}

      <ATSStatCounters stats={check.summary?.stats} />

      {renderBody()}

      <ATSFAQAccordion faq={check.faq} />
    </div>
  );
}
