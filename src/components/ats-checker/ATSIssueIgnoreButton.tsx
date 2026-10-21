"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";
import { ATSIconActionButton } from "./ATSIconActionButton";
import { useATSIssueMagic } from "./ATSIssueMagicContext";

interface ATSIssueIgnoreButtonProps {
  check: ATSCheckResult;
  issue: ATSIssue;
}

export function ATSIssueIgnoreButton({ check, issue }: ATSIssueIgnoreButtonProps) {
  const { enabled, onIgnoreIssue } = useATSIssueMagic();
  const [loading, setLoading] = useState(false);

  if (!enabled || !onIgnoreIssue) return null;

  const isPositive =
    issue.kind === "positive" ||
    issue.kind === "credibility_positive" ||
    issue.kind === "skill_present";

  // "Analysis incomplete" is a notice to re-run the check, not a finding to dismiss.
  if (isPositive || issue.title === "Analysis incomplete") return null;

  const handleIgnore = async () => {
    setLoading(true);
    try {
      await onIgnoreIssue(check, issue);
      toast.success("Dismissed — it won't count against your score or come back on the next check.");
    } catch (error) {
      console.error("Error ignoring ATS issue:", error);
      toast.error("Couldn't dismiss this. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ATSIconActionButton
      label="Dismiss"
      variant="outline"
      className="text-muted-foreground hover:text-foreground"
      onClick={() => void handleIgnore()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
    </ATSIconActionButton>
  );
}
