"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCheck,
  Copy,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resumeApi } from "@/lib/api";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";
import { ATSIconActionButton } from "./ATSIconActionButton";
import { useATSIssueMagic } from "./ATSIssueMagicContext";
import { AIContentPromptField } from "@/components/resume-editor/AIContentPromptField";

interface ATSIssueImproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  check: ATSCheckResult;
  issue: ATSIssue;
  categoryLabel?: string;
}

export function ATSIssueImproveDialog({
  open,
  onOpenChange,
  check,
  issue,
  categoryLabel,
}: ATSIssueImproveDialogProps) {
  const { resumeId, onApplyFix } = useATSIssueMagic();
  const [loading, setLoading] = useState(false);
  const [improvedContent, setImprovedContent] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");

  const generate = useCallback(async () => {
    if (!resumeId) return;

    setLoading(true);
    setCopied(false);
    setInserted(false);
    try {
      const result = await resumeApi.improveATSIssue(resumeId, {
        checkId: check.id,
        categoryLabel,
        issue,
        userPrompt: userPrompt.trim() || undefined,
      });
      setImprovedContent(result.improvedContent);
      setSourceContent(result.sourceContent);
    } catch (error) {
      console.error("Error improving ATS issue:", error);
      toast.error("Could not generate improved content. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [resumeId, check.id, categoryLabel, issue, userPrompt]);

  useEffect(() => {
    if (!open || !resumeId) return;

    setImprovedContent("");
    setSourceContent("");
    setUserPrompt("");
    setCopied(false);
    setInserted(false);

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await resumeApi.improveATSIssue(resumeId, {
          checkId: check.id,
          categoryLabel,
          issue,
        });
        if (!cancelled) {
          setImprovedContent(result.improvedContent);
          setSourceContent(result.sourceContent);
        }
      } catch (error) {
        console.error("Error improving ATS issue:", error);
        if (!cancelled) {
          toast.error("Could not generate improved content. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, resumeId, check.id, categoryLabel, issue]);

  const handleCopy = async () => {
    if (!improvedContent) return;
    await navigator.clipboard.writeText(improvedContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!improvedContent || !onApplyFix) return;

    const original = sourceContent || issue.excerpt || issue.rewriteSuggestion || "";
    const applied = onApplyFix(original, improvedContent);
    if (applied) {
      setInserted(true);
      toast.success("Inserted into resume");
      onOpenChange(false);
    } else {
      toast.error(
        "Could not find matching text in your resume. Copy the suggestion and paste it manually.",
      );
    }
  };

  const canInsert =
    !!onApplyFix &&
    !!(sourceContent || issue.excerpt || issue.rewriteSuggestion);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI fix for this feedback
          </DialogTitle>
          <DialogDescription>
            {check.label} · {issue.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Feedback
            </p>
            <p className="mt-1 text-sm text-foreground">{issue.description}</p>
            {issue.suggestion && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Suggestion: </span>
                {issue.suggestion}
              </p>
            )}
          </div>

          {(sourceContent || issue.excerpt) && (
            <div className="rounded-lg border border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/25 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-[#fd7070]">
                Current content
              </p>
              <p className="mt-1 text-sm text-red-900 dark:text-[#fd7070]">
                {sourceContent || issue.excerpt}
              </p>
            </div>
          )}

          <AIContentPromptField
            id="ats-issue-ai-prompt"
            value={userPrompt}
            onChange={setUserPrompt}
            disabled={loading}
          />

          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/40 dark:bg-green-950/25">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
              AI suggestion
            </p>
            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating improved content…
              </div>
            ) : improvedContent ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-green-900 dark:text-green-100">
                {improvedContent}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No suggestion generated yet.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void generate()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Regenerate with instructions
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleCopy()}
              disabled={!improvedContent || loading}
            >
              {copied ? (
                <CheckCheck className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy
            </Button>
            {canInsert && (
              <Button
                type="button"
                size="sm"
                onClick={handleInsert}
                disabled={!improvedContent || loading || inserted}
              >
                Insert into resume
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ATSIssueMagicButtonProps {
  check: ATSCheckResult;
  issue: ATSIssue;
  categoryLabel?: string;
}

export function ATSIssueMagicButton({
  check,
  issue,
  categoryLabel,
}: ATSIssueMagicButtonProps) {
  const { enabled } = useATSIssueMagic();
  const [open, setOpen] = useState(false);

  if (!enabled) return null;

  const isPositive =
    issue.kind === "positive" ||
    issue.kind === "credibility_positive" ||
    issue.kind === "skill_present";

  if (isPositive) return null;

  return (
    <>
      <ATSIconActionButton
        label="AI fix"
        variant="ghost"
        className="text-primary hover:bg-primary/10 hover:text-primary"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
      </ATSIconActionButton>
      <ATSIssueImproveDialog
        open={open}
        onOpenChange={setOpen}
        check={check}
        issue={issue}
        categoryLabel={categoryLabel}
      />
    </>
  );
}
