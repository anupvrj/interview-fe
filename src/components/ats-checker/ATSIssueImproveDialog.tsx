"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  Copy,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [editedContent, setEditedContent] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const suggestionSectionRef = useRef<HTMLDivElement>(null);
  const scrollToSuggestionAfterRegenerate = useRef(false);

  const scrollToSuggestion = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        suggestionSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }, []);

  const generate = useCallback(async () => {
    if (!resumeId) return;

    scrollToSuggestionAfterRegenerate.current = true;
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
      setEditedContent(result.improvedContent);
      setSourceContent(result.sourceContent);
    } catch (error: unknown) {
      console.error("Error improving ATS issue:", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        "Could not generate improved content. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [resumeId, check.id, categoryLabel, issue, userPrompt]);

  useEffect(() => {
    if (!open || !resumeId) return;

    setImprovedContent("");
    setEditedContent("");
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
          setEditedContent(result.improvedContent);
          setSourceContent(result.sourceContent);
        }
      } catch (error: unknown) {
        console.error("Error improving ATS issue:", error);
        if (!cancelled) {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ||
            "Could not generate improved content. Please try again.";
          toast.error(message);
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

  useEffect(() => {
    if (!open || loading || !improvedContent) return;
    if (!scrollToSuggestionAfterRegenerate.current) return;

    scrollToSuggestionAfterRegenerate.current = false;
    scrollToSuggestion();
  }, [open, loading, improvedContent, scrollToSuggestion]);

  const handleCopy = async () => {
    const text = editedContent.trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    const text = editedContent.trim();
    if (!text || !onApplyFix) return;

    const original = sourceContent || issue.excerpt || issue.rewriteSuggestion || "";
    const applied = onApplyFix(original, text);
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
      <DialogContent
        overlayClassName="z-[80]"
        className="z-[80] flex max-h-[min(85dvh,640px)] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-4 text-left sm:px-6">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI fix for this feedback
          </DialogTitle>
          <DialogDescription>
            {check.label} · {issue.title}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6">
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
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/25">
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

          <div ref={suggestionSectionRef} className="space-y-2 scroll-mt-4">
            <Label
              htmlFor="ats-issue-ai-suggestion"
              className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300"
            >
              AI suggestion
            </Label>
            {loading ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-6 text-sm text-muted-foreground dark:border-green-900/40 dark:bg-green-950/25">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating improved content…
              </div>
            ) : improvedContent ? (
              <Textarea
                id="ats-issue-ai-suggestion"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={5}
                className="min-h-[120px] border-green-200 bg-green-50 text-sm text-green-900 dark:border-green-900/40 dark:bg-green-950/25 dark:text-green-100"
                placeholder="Edit the AI suggestion before inserting into your resume."
              />
            ) : (
              <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-6 text-sm text-muted-foreground">
                No suggestion generated yet.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
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
              disabled={!editedContent.trim() || loading}
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
                disabled={!editedContent.trim() || loading || inserted}
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
