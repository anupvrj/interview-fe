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

  if (isPositive) return null;

  const handleIgnore = async () => {
    setLoading(true);
    try {
      await onIgnoreIssue(check, issue);
      toast.success("Marked as fixed. It won't appear on the next ATS scan.");
    } catch (error) {
      console.error("Error ignoring ATS issue:", error);
      toast.error("Could not mark this issue as fixed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ATSIconActionButton
      label="Mark fixed"
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
