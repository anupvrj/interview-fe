"use client";

import { isATSReportV3 } from "@/types/atsReport";
import type { ATSCheckId, ATSReportV3 } from "@/types/atsReport";
import type { LegacyATSFeedback } from "@/lib/api";
import { filterSuppressedChecks } from "@/lib/atsReportFilters";
import { normalizeATSReportV3 } from "@/lib/atsReportNormalize";
import { ATSReportDashboard } from "./ATSReportDashboard";
import { ATSFeedback } from "@/components/ATSFeedback";
import { ATSIssueMagicProvider } from "./ATSIssueMagicContext";
import { useMemo } from "react";

interface ATSReportViewProps {
  feedback: ATSReportV3 | LegacyATSFeedback;
  resumeId?: string;
  onImprove?: () => void;
  /** Hide checks that were addressed by Improve-from-ATS flow */
  suppressedCheckIds?: ATSCheckId[];
  onRunJobMatch?: (jobDescription: string) => void | Promise<void>;
  jobMatchRunning?: boolean;
  initialJobDescription?: string;
  /** Enable per-issue AI magic buttons (resume editor only) */
  enableIssueMagic?: boolean;
  onApplyIssueFix?: (original: string, improved: string) => boolean;
  onIgnoreIssue?: (
    check: import("@/types/atsReport").ATSCheckResult,
    issue: import("@/types/atsReport").ATSIssue,
  ) => void | Promise<void>;
}

export function ATSReportView({
  feedback,
  resumeId,
  onImprove,
  suppressedCheckIds,
  onRunJobMatch,
  jobMatchRunning,
  initialJobDescription,
  enableIssueMagic = false,
  onApplyIssueFix,
  onIgnoreIssue,
}: ATSReportViewProps) {
  const filteredReport = useMemo(() => {
    if (!isATSReportV3(feedback)) return null;

    let report = normalizeATSReportV3(feedback);
    if (suppressedCheckIds?.length) {
      report = filterSuppressedChecks(report, suppressedCheckIds);
    }
    return report;
  }, [feedback, suppressedCheckIds]);

  if (filteredReport) {
    const dashboard = (
      <ATSReportDashboard
        report={filteredReport}
        resumeId={resumeId}
        onImprove={onImprove}
        onRunJobMatch={onRunJobMatch}
        jobMatchRunning={jobMatchRunning}
        initialJobDescription={initialJobDescription}
      />
    );

    if (enableIssueMagic && resumeId) {
      return (
        <ATSIssueMagicProvider
          resumeId={resumeId}
          onApplyFix={onApplyIssueFix}
          onIgnoreIssue={onIgnoreIssue}
        >
          {dashboard}
        </ATSIssueMagicProvider>
      );
    }

    return dashboard;
  }

  return <ATSFeedback feedback={feedback as LegacyATSFeedback} />;
}
