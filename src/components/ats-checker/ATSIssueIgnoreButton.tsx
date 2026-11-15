"use client";

import { useState } from "react";
import { CheckCircle2, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";
import { Button } from "@/components/ui/button";
import { useATSIssueMagic } from "./ATSIssueMagicContext";

interface ATSIssueIgnoreButtonProps {
  check: ATSCheckResult;
  issue: ATSIssue;
}

export function ATSIssueIgnoreButton({ check, issue }: ATSIssueIgnoreButtonProps) {
  const { enabled, onIgnoreIssue } = useATSIssueMagic();
  const [busy, setBusy] = useState<"fixed" | "ignored" | null>(null);

  if (!enabled || !onIgnoreIssue) return null;

  const isPositive =
    issue.kind === "positive" ||
    issue.kind === "credibility_positive" ||
    issue.kind === "skill_present";

  // "Analysis incomplete" is a notice to re-run the check, not a finding to dismiss.
  if (isPositive || issue.title === "Analysis incomplete") return null;

  const setAside = async (as: "fixed" | "ignored") => {
    setBusy(as);
    try {
      await onIgnoreIssue(check, issue);
      toast.success(
        as === "fixed"
          ? "Marked as fixed. Your score updates when your resume changes."
          : "Ignored. Your score updates when your resume changes.",
      );
    } catch (error) {
      console.error("Error ignoring ATS issue:", error);
      toast.error("Couldn't update this. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={() => void setAside("fixed")} className="h-8 rounded-lg px-2 text-[12.5px] font-semibold text-primary hover:bg-primary/10 hover:text-primary">
        {busy === "fixed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Mark as fixed
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={() => void setAside("ignored")} className="h-8 rounded-lg px-2 text-[12.5px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
        {busy === "ignored" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
        Ignore
      </Button>
    </div>
  );
}
