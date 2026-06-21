"use client";

import { useMemo, useState } from "react";
import { Check, CheckCheck, Copy, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";
import { ATSFAQAccordion } from "./shared";

function extractBenchmarkSkills(
  check: ATSCheckResult,
): Array<{ name: string; present: boolean }> {
  if (check.meta?.benchmarkSkills?.length) {
    return check.meta.benchmarkSkills;
  }

  const matched = check.meta?.matched ?? [];
  const missing = check.meta?.missing ?? [];
  if (matched.length > 0 || missing.length > 0) {
    return [
      ...matched.map((name) => ({ name, present: true })),
      ...missing.map((name) => ({ name, present: false })),
    ];
  }

  return check.issues
    .filter(
      (issue) =>
        issue.kind === "skill_gap" ||
        issue.kind === "skill_present" ||
        issue.skillPresent !== undefined,
    )
    .map((issue: ATSIssue & { name?: string }) => ({
      name: (issue.title || issue.name || "").trim(),
      present: issue.skillPresent ?? issue.kind === "skill_present",
    }))
    .filter((skill) => skill.name.length > 0);
}

interface PeerBenchmarkingPanelProps {
  check: ATSCheckResult;
  targetRole?: string;
}

export function PeerBenchmarkingPanel({
  check,
  targetRole,
}: PeerBenchmarkingPanelProps) {
  const [copied, setCopied] = useState(false);

  const skills = useMemo(() => extractBenchmarkSkills(check), [check]);
  const missingSkills = skills.filter((skill) => !skill.present);
  const role =
    check.meta?.targetRole || targetRole || "your target role";
  const uniqueness =
    check.meta?.uniquenessPercent ??
    check.meta?.matchPercent ??
    check.summary?.stats?.uniquenessPercent;
  const experienceYears = check.meta?.experienceYears;
  const experienceHeadline = check.meta?.experienceHeadline;
  const experienceDetail = check.meta?.experienceDetail;

  const missingCount =
    missingSkills.length ||
    check.meta?.missing?.length ||
    check.summary?.stats?.missingSkills ||
    0;

  const headsUpText =
    missingCount > 0
      ? `Your profile is missing ${missingCount} key skill${missingCount > 1 ? "s" : ""} for the ${role} role. Closing those gaps will make you more competitive.`
      : `Your skill coverage aligns well with typical ${role} profiles. Keep highlighting measurable achievements to stay competitive.`;

  const copyMissingSkills = async () => {
    const names =
      missingSkills.length > 0
        ? missingSkills.map((skill) => skill.name)
        : check.meta?.missing ?? [];
    if (names.length === 0) return;
    await navigator.clipboard.writeText(names.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Comparing your profile against peers in the{" "}
        <span className="font-semibold text-foreground">{role}</span> space.
        Benchmarking helps identify where you stand in the competitive landscape.
      </p>

      <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Users className="h-7 w-7 text-primary" />
            {missingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {missingCount > 9 ? "!" : missingCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              <span className="text-primary">Heads up!</span> {headsUpText}
            </p>
          </div>
        </div>
      </div>

      {skills.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-base font-bold text-foreground">
            Typical Skills in this Role
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
                  skill.present
                    ? "border-green-200 bg-green-50/80 text-green-900"
                    : "border-red-200 bg-red-50/80 text-red-900",
                )}
              >
                {skill.present ? (
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{skill.name}</span>
              </div>
            ))}
          </div>
          {missingSkills.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                onClick={() => void copyMissingSkills()}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {copied ? (
                  <>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Copied missing skills
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Add All Skills to My Resume
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : missingCount > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Skill details are unavailable in this cached report. Re-run the ATS
          check to see the full peer skills breakdown.
        </div>
      ) : null}

      {uniqueness != null && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h4 className="text-base font-bold text-foreground">
            Uniqueness & Differentiation
          </h4>
          <p className="text-sm text-muted-foreground">
            Many {role} resumes look similar. Stand out by highlighting clear
            achievements and measurable results instead of only listing
            responsibilities.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <span>Criteria Uniqueness</span>
              <span className="text-foreground">{uniqueness}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  uniqueness >= 70
                    ? "bg-green-500"
                    : uniqueness >= 45
                      ? "bg-rose-400"
                      : "bg-red-500",
                )}
                style={{ width: `${Math.min(100, Math.max(0, uniqueness))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {(experienceYears != null ||
        experienceHeadline ||
        experienceDetail) && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h4 className="text-base font-bold text-foreground">
            Experience Benchmark
          </h4>
          {experienceYears != null && (
            <span className="inline-flex rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-sky-800">
              {Math.round(experienceYears)} years
            </span>
          )}
          {experienceYears != null && (
            <p className="text-xs text-muted-foreground">
              Based on your resume history
            </p>
          )}
          {experienceHeadline && (
            <p className="font-semibold text-foreground">
              {experienceHeadline}
            </p>
          )}
          {experienceDetail && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {experienceDetail}
            </p>
          )}
        </div>
      )}

      <ATSFAQAccordion faq={check.faq} />
    </div>
  );
}
