"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCheck,
  Copy,
  Pencil,
  Replace,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";
import { ATSIconActionButton } from "./ATSIconActionButton";
import { ATSIssueImproveDialog } from "./ATSIssueImproveDialog";
import { ATSIssueIgnoreButton } from "./ATSIssueIgnoreButton";
import { useATSIssueMagic } from "./ATSIssueMagicContext";

interface ATSIssueSuggestionActionsProps {
  suggestion: string;
  sourceContent?: string;
  issue: ATSIssue;
  check?: ATSCheckResult;
  categoryLabel?: string;
  showMagic?: boolean;
}

export function ATSIssueSuggestionActions({
  suggestion,
  sourceContent,
  issue,
  check,
  categoryLabel,
  showMagic = true,
}: ATSIssueSuggestionActionsProps) {
  const { enabled, onApplyFix } = useATSIssueMagic();
  const [editedContent, setEditedContent] = useState(suggestion);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [magicOpen, setMagicOpen] = useState(false);

  useEffect(() => {
    setEditedContent(suggestion);
    setIsEditing(false);
    setCopied(false);
  }, [suggestion]);

  const canInsert =
    enabled && !!onApplyFix && !!(sourceContent || issue.excerpt?.trim());

  const showAiFix =
    showMagic &&
    enabled &&
    check &&
    issue.kind !== "positive" &&
    issue.kind !== "credibility_positive" &&
    issue.kind !== "skill_present";

  const handleCopy = async () => {
    if (!editedContent.trim()) return;
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!onApplyFix || !editedContent.trim()) return;
    const original = sourceContent || issue.excerpt || "";
    if (!original.trim()) {
      toast.error("No source text found to replace. Copy and paste manually.");
      return;
    }
    const applied = onApplyFix(original, editedContent.trim());
    if (applied) {
      toast.success("Inserted into resume");
      setIsEditing(false);
    } else {
      toast.error(
        "Could not find matching text in your resume. Copy and paste manually.",
      );
    }
  };

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-lg border border-green-100 bg-green-50 px-3 py-3">
      <div className="relative z-10 flex flex-wrap items-center justify-end gap-0.5 overflow-visible">
        <ATSIconActionButton
          label={copied ? "Copied" : "Copy"}
          variant="outline"
          className="border-green-200 bg-white/80 text-green-900 hover:bg-green-100"
          onClick={() => void handleCopy()}
          disabled={!editedContent.trim()}
        >
          {copied ? (
            <CheckCheck className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </ATSIconActionButton>

        <ATSIconActionButton
          label={isEditing ? "Done editing" : "Edit"}
          variant="outline"
          className="border-green-200 bg-white/80 text-green-900 hover:bg-green-100"
          onClick={() => setIsEditing((prev) => !prev)}
        >
          {isEditing ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Pencil className="h-3.5 w-3.5" />
          )}
        </ATSIconActionButton>

        {canInsert && (
          <ATSIconActionButton
            label="Insert into resume"
            variant="default"
            className="bg-green-700 text-white hover:bg-green-800"
            onClick={handleInsert}
            disabled={!editedContent.trim()}
          >
            <Replace className="h-3.5 w-3.5" />
          </ATSIconActionButton>
        )}

        {showAiFix && check && (
          <>
            <ATSIssueIgnoreButton check={check} issue={issue} />
            <ATSIconActionButton
              label="AI fix"
              variant="ghost"
              className="text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => setMagicOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
            </ATSIconActionButton>
            <ATSIssueImproveDialog
              open={magicOpen}
              onOpenChange={setMagicOpen}
              check={check}
              issue={issue}
              categoryLabel={categoryLabel}
            />
          </>
        )}
      </div>

      <div className="flex min-w-0 items-start gap-2">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[72px] min-w-0 flex-1 border-green-200 bg-white text-sm text-green-900"
            rows={3}
          />
        ) : (
          <p className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sm leading-relaxed text-green-900 [overflow-wrap:anywhere]">
            {editedContent}
          </p>
        )}
      </div>
    </div>
  );
}
