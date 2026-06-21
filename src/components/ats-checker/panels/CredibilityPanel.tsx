"use client";

import { Check, X } from "lucide-react";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";
import { ATSFAQAccordion } from "./shared";
import { ATSIssueMagicButton } from "../ATSIssueImproveDialog";
import { ATSIssueIgnoreButton } from "../ATSIssueIgnoreButton";

function CredibilityRiskCard({
  issue,
  check,
  categoryLabel,
}: {
  issue: ATSIssue;
  check: ATSCheckResult;
  categoryLabel?: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex gap-3">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold leading-snug text-foreground">
            {issue.title}
          </p>
          {issue.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {issue.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 pl-7">
        <ATSIssueIgnoreButton check={check} issue={issue} />
        <ATSIssueMagicButton
          check={check}
          issue={issue}
          categoryLabel={categoryLabel}
        />
      </div>

      {issue.excerpt && (
        <div className="rounded-lg border border-red-100 bg-red-50/80 px-3 py-2.5">
          <p className="break-words text-sm leading-relaxed text-red-900">
            &ldquo;{issue.excerpt}&rdquo;
          </p>
        </div>
      )}

      {(issue.fixBody || issue.suggestion) && (
        <div className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-800">
            {issue.fixTitle || "How to fix it"}
          </p>
          <p className="mt-1.5 break-words text-sm leading-relaxed text-foreground">
            {issue.fixBody || issue.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}

interface CredibilityPanelProps {
  check: ATSCheckResult;
  categoryLabel?: string;
}

export function CredibilityPanel({
  check,
  categoryLabel,
}: CredibilityPanelProps) {
  const positive = check.issues.filter(
    (i) =>
      i.kind === "credibility_positive" ||
      i.kind === "positive" ||
      i.title.toLowerCase().includes("credible"),
  );
  const risks = check.issues.filter(
    (i) =>
      i.kind === "credibility_risk" ||
      i.kind === "interview_risk" ||
      i.kind === "negative" ||
      (!positive.includes(i) &&
        i.kind !== "credibility_positive" &&
        i.kind !== "positive" &&
        i.kind !== "skill_present"),
  );

  const strongTrustSignal =
    check.summary?.strongTrustSignal || positive[0]?.description;
  const mainCredibilityRisk =
    check.summary?.mainCredibilityRisk || risks[0]?.description;
  const hasSummary = !!(strongTrustSignal || mainCredibilityRisk);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        This check evaluates whether your resume reads as trustworthy and
        believable to a hiring manager. It looks for signals such as logical
        career progression, responsibilities that match your job titles,
        realistic achievements, and skills supported by actual experience.
      </p>

      {hasSummary && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground">
            Summary analysis
          </p>
          <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6">
            <ul className="space-y-4">
              {strongTrustSignal && (
                <li className="flex gap-3 text-sm leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-green-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-wide text-green-800">
                      Strong trust signal
                    </span>
                    <span className="mt-1 block text-green-950">
                      {strongTrustSignal}
                    </span>
                  </span>
                </li>
              )}
              {mainCredibilityRisk && (
                <li className="flex gap-3 text-sm leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-wide text-amber-800">
                      Main credibility risk
                    </span>
                    <span className="mt-1 block text-amber-950">
                      {mainCredibilityRisk}
                    </span>
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {positive.length === 0 && risks.length === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
          <p className="font-medium text-green-800">
            Your resume reads as credible and trustworthy.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {positive.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              What looks credible
            </p>
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 sm:p-6">
              <ul className="space-y-3">
                {positive.map((issue, idx) => {
                  const text = issue.description || issue.title;
                  const showTitle =
                    issue.title &&
                    issue.description &&
                    !issue.title.toLowerCase().includes("credible") &&
                    issue.title !== issue.description;

                  return (
                    <li
                      key={idx}
                      className="flex gap-3 text-sm leading-relaxed text-green-900"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-green-600"
                      />
                      <span className="min-w-0 flex-1">
                        {showTitle ? (
                          <>
                            <span className="font-semibold text-green-950">
                              {issue.title}
                            </span>
                            <span className="text-green-900">
                              {" "}
                              — {issue.description}
                            </span>
                          </>
                        ) : (
                          text
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
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
                <CredibilityRiskCard
                  key={idx}
                  issue={issue}
                  check={check}
                  categoryLabel={categoryLabel}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ATSFAQAccordion faq={check.faq} />
    </div>
  );
}
