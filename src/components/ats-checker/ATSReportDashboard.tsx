"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ATSCheckId, ATSCheckResult, ATSReportV3 } from "@/types/atsReport";
import { CATEGORY_ORDER } from "@/types/atsReport";
import { normalizeATSReportV3, reportHasJobMatch } from "@/lib/atsReportNormalize";
import { ATSScoreSidebar } from "./ATSScoreSidebar";
import { ATSCheckDetailPanel } from "./ATSCheckDetailPanel";
import { JobMatchPromoBanner } from "./JobMatchPromoBanner";

interface ATSReportDashboardProps {
  report: ATSReportV3;
  resumeId?: string | null;
  onImprove?: () => void;
  /** When false, hides the bottom Improve CTA (e.g. when actions are in page header). */
  showImproveCta?: boolean;
  onRunJobMatch?: (jobDescription: string) => void | Promise<void>;
  jobMatchRunning?: boolean;
  initialJobDescription?: string;
}

function findCheckInReport(
  report: ATSReportV3,
  checkId: ATSCheckId,
): { check: ATSCheckResult; label: string } | null {
  for (const catId of CATEGORY_ORDER) {
    const cat = report.categories[catId];
    if (!cat) continue;
    const found = cat.checks.find((c) => c.id === checkId);
    if (found) return { check: found, label: cat.label };
  }
  return null;
}

function findFirstActionableCheck(report: ATSReportV3): {
  check: ATSCheckResult;
  label: string;
} | null {
  for (const catId of CATEGORY_ORDER) {
    const cat = report.categories[catId];
    if (!cat) continue;
    const failing = cat.checks.find(
      (c) =>
        c.status !== "skipped" &&
        c.issueCount > 0 &&
        (c.status === "fail" || c.status === "warn"),
    );
    if (failing) return { check: failing, label: cat.label };
  }
  for (const catId of CATEGORY_ORDER) {
    const cat = report.categories[catId];
    if (!cat) continue;
    const first = cat.checks.find((c) => c.status !== "skipped");
    if (first) return { check: first, label: cat.label };
  }
  return null;
}

function ReportSummary({ report }: { report: ATSReportV3 }) {
  const hasContent =
    report.strengths.length > 0 ||
    report.weaknesses.length > 0 ||
    report.suggestions.length > 0;
  if (!hasContent) return null;

  return (
    <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-5 sm:grid-cols-3">
      {report.strengths.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">
            Strengths
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {report.strengths.slice(0, 4).map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}
      {report.weaknesses.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
            Weaknesses
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {report.weaknesses.slice(0, 4).map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}
      {report.suggestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
            Top suggestions
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {report.suggestions.slice(0, 4).map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function JobMatchBanner({ report }: { report: ATSReportV3 }) {
  if (!reportHasJobMatch(report)) return null;

  const jm = report.jobMatch;
  if (!jm) return null;

  const verdictStyle =
    jm.verdict === "strong"
      ? "border-green-200 bg-green-50"
      : jm.verdict === "partial"
        ? "border-amber-200 bg-amber-50"
        : "border-red-200 bg-red-50";
  const pctColor =
    jm.overallMatch >= 75
      ? "text-green-600"
      : jm.overallMatch >= 50
        ? "text-amber-600"
        : "text-red-600";

  const stats: Array<{ label: string; value: string }> = [];
  if (jm.candidateYears !== undefined) {
    stats.push({
      label: "Experience",
      value:
        jm.requiredYears != null
          ? `${jm.candidateYears} / ${jm.requiredYears}+ yrs`
          : `${jm.candidateYears} yrs`,
    });
  }
  if (jm.mustHaveCoverage !== undefined) {
    stats.push({ label: "Must-have skills", value: `${jm.mustHaveCoverage}%` });
  }
  if (jm.missingMustHaveCount !== undefined) {
    stats.push({
      label: "Missing must-haves",
      value: `${jm.missingMustHaveCount}`,
    });
  }

  return (
    <div className={cn("rounded-xl border p-5 sm:p-6", verdictStyle)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Job Match{jm.jobTitle ? ` · ${jm.jobTitle}` : ""}
            </p>
            <p className="text-lg font-bold text-foreground capitalize">
              {jm.verdict} fit for this role
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-3xl font-bold", pctColor)}>
            {jm.overallMatch}%
          </span>
          <p className="text-xs text-muted-foreground">overall match</p>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-white/70 bg-white/70 px-3 py-2"
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ATSReportDashboard({
  report,
  resumeId,
  onImprove,
  showImproveCta = true,
  onRunJobMatch,
  jobMatchRunning = false,
  initialJobDescription,
}: ATSReportDashboardProps) {
  const normalizedReport = useMemo(() => normalizeATSReportV3(report), [report]);
  const initial = useMemo(
    () => findFirstActionableCheck(normalizedReport),
    [normalizedReport],
  );
  const [selectedCheckId, setSelectedCheckId] = useState<ATSCheckId | null>(
    initial?.check.id ?? null,
  );
  const [categoryLabel, setCategoryLabel] = useState(initial?.label ?? "Content");

  const selectedCheck = useMemo(() => {
    if (!selectedCheckId) return null;
    return findCheckInReport(normalizedReport, selectedCheckId)?.check ?? null;
  }, [normalizedReport, selectedCheckId]);

  useEffect(() => {
    if (selectedCheckId && selectedCheck) return;
    const next = findFirstActionableCheck(normalizedReport);
    setSelectedCheckId(next?.check.id ?? null);
    setCategoryLabel(next?.label ?? "Content");
  }, [normalizedReport, selectedCheckId, selectedCheck]);

  const handleSelectCheck = (check: ATSCheckResult, label: string) => {
    setSelectedCheckId(check.id);
    setCategoryLabel(label);
  };

  const showJobMatch = reportHasJobMatch(normalizedReport);

  return (
    <div className="space-y-6">
      {showJobMatch ? (
        <JobMatchBanner report={normalizedReport} />
      ) : (
        <JobMatchPromoBanner
          initialJobDescription={initialJobDescription}
          loading={jobMatchRunning}
          onRunJobMatch={onRunJobMatch}
        />
      )}
      <ReportSummary report={normalizedReport} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <ATSScoreSidebar
          score={normalizedReport.score}
          issueCount={normalizedReport.issueCount}
          categories={normalizedReport.categories}
          selectedCheckId={selectedCheck?.id ?? null}
          onSelectCheck={handleSelectCheck}
        />
        <div className="rounded-xl border border-border bg-card shadow-card p-6 lg:p-8 min-h-[480px]">
          <ATSCheckDetailPanel
            check={selectedCheck}
            categoryLabel={categoryLabel}
            targetRole={normalizedReport.inferredProfile?.targetRole}
          />
        </div>
      </div>

      {report.inferredProfile && (
        <p className="text-sm text-muted-foreground text-center">
          Analyzed as{" "}
          <span className="font-medium text-foreground">
            {report.inferredProfile.targetRole}
          </span>{" "}
          ({report.inferredProfile.seniority})
          {report.mode === "tailored" && " · Tailored to job description"}
        </p>
      )}

      {showImproveCta && resumeId && onImprove && (
        <div className="text-center">
          <Button
            size="lg"
            onClick={onImprove}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Improve Your Resume
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
