"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, ChevronUp, Target } from "lucide-react";
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
  /** Use stacked layout tuned for narrow panels (e.g. resume editor split view) */
  embedded?: boolean;
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
  const sections = [
    {
      id: "strengths",
      label: "Strengths",
      items: report.strengths.slice(0, 4),
      labelClass: "text-green-700 dark:text-green-300",
      countClass: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    },
    {
      id: "weaknesses",
      label: "Weaknesses",
      items: report.weaknesses.slice(0, 4),
      labelClass: "text-red-700 dark:text-[#fd7070]",
      countClass: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-[#fd7070]",
    },
    {
      id: "suggestions",
      label: "Top suggestions",
      items: report.suggestions.slice(0, 4),
      labelClass: "text-primary",
      countClass: "bg-primary/10 text-primary",
    },
  ].filter((section) => section.items.length > 0);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (sections.length === 0) return null;

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      {sections.map((section, index) => {
        const isOpen = expanded[section.id] === true;
        return (
          <div
            key={section.id}
            className={index > 0 ? "border-t border-border/60" : undefined}
          >
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 text-xs font-bold uppercase tracking-wide",
                  section.labelClass,
                )}
              >
                {section.label}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                  section.countClass,
                )}
              >
                {section.items.length}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {isOpen && (
              <ul className="space-y-1.5 border-t border-border/40 px-4 pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">
                {section.items.map((item, i) => (
                  <li key={`${section.id}-${i}`} className="break-words">
                    • {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function JobMatchBanner({ report }: { report: ATSReportV3 }) {
  if (!reportHasJobMatch(report)) return null;

  const jm = report.jobMatch;
  if (!jm) return null;

  const verdictStyle =
    jm.verdict === "strong"
      ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/25"
      : jm.verdict === "partial"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25"
        : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/25";
  const pctColor =
    jm.overallMatch >= 75
      ? "text-green-600 dark:text-green-400"
      : jm.overallMatch >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-[#fd7070]";

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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
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
              className="rounded-lg border border-white/70 bg-card/70 px-3 py-2"
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
  embedded = false,
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
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const shouldScrollToDetailRef = useRef(false);

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

  useEffect(() => {
    if (!shouldScrollToDetailRef.current || !selectedCheckId || !selectedCheck) {
      return;
    }
    shouldScrollToDetailRef.current = false;

    const scrollToDetail = () => {
      const el = detailPanelRef.current;
      if (!el) return;

      if (embedded) {
        let parent: HTMLElement | null = el.parentElement;
        while (parent) {
          const { overflowY } = getComputedStyle(parent);
          if (/(auto|scroll|overlay)/.test(overflowY)) {
            const parentRect = parent.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            parent.scrollTo({
              top: parent.scrollTop + (elRect.top - parentRect.top) - 12,
              behavior: "smooth",
            });
            return;
          }
          parent = parent.parentElement;
        }
        return;
      }

      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToDetail);
    });
  }, [embedded, selectedCheckId, selectedCheck]);

  const handleSelectCheck = (check: ATSCheckResult, label: string) => {
    shouldScrollToDetailRef.current = true;
    setSelectedCheckId(check.id);
    setCategoryLabel(label);
  };

  const showJobMatch = reportHasJobMatch(normalizedReport);

  return (
    <div className="min-w-0 space-y-6 overflow-hidden">
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
      <div
        className={cn(
          "grid min-w-0 gap-4",
          embedded
            ? "grid-cols-1 2xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]"
            : "grid-cols-1 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]",
        )}
      >
        <div className="min-w-0">
          <ATSScoreSidebar
            score={normalizedReport.score}
            issueCount={normalizedReport.issueCount}
            categories={normalizedReport.categories}
            selectedCheckId={selectedCheck?.id ?? null}
            onSelectCheck={handleSelectCheck}
            compact={embedded}
          />
        </div>
        <div
          ref={detailPanelRef}
          id="ats-check-detail-panel"
          className={cn(
            "min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-card scroll-mt-4",
            embedded ? "p-4 sm:p-5" : "p-4 sm:p-6 lg:p-8",
            embedded ? "min-h-0" : "min-h-[320px] sm:min-h-[400px]",
          )}
        >
          <ATSCheckDetailPanel
            check={selectedCheck}
            categoryLabel={categoryLabel}
            targetRole={normalizedReport.inferredProfile?.targetRole}
            compact={embedded}
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
