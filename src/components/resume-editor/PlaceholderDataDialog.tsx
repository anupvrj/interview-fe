"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResumePlaceholderIssue } from "@/lib/resume-placeholder-check";

const MAX_LISTED = 8;

/**
 * Shown before a download / hackathon submit.
 * - With issues: sample data is still in the resume ("Your Name", "Sample Job 1", …).
 * - Without issues: a soft reminder that AI helped write it, so the user reviews it.
 */
export function PlaceholderDataDialog({
  open,
  onOpenChange,
  issues,
  onEdit,
  onDownloadAnyway,
  downloadLabel,
  onDontRemindAgain,
  onGoToHackathon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: ResumePlaceholderIssue[];
  onEdit: () => void;
  /** Omit to hide the escape hatch (e.g. hackathon submission with sample data). */
  onDownloadAnyway?: () => void;
  downloadLabel?: string;
  /** Soft reminder only: called when the user ticks "don't remind me" and continues. */
  onDontRemindAgain?: () => void;
  /** Hackathon only: leave without submitting and go back to the hackathon dashboard. */
  onGoToHackathon?: () => void;
}) {
  const review = issues.length === 0;
  const listed = issues.slice(0, MAX_LISTED);
  const more = issues.length - listed.length;
  const [dontRemind, setDontRemind] = useState(false);

  useEffect(() => {
    if (open) setDontRemind(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          {review ? (
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" aria-hidden />
            </div>
          ) : (
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <AlertTriangle className="size-5" aria-hidden />
            </div>
          )}
          <DialogTitle>
            {review ? "Give your resume a final read" : "Your resume still has sample data"}
          </DialogTitle>
          <DialogDescription>
            {review
              ? "This resume was designed and optimised with AI. Before you send it, make sure every detail — job titles, dates, numbers, skills and links — is accurate and true for you."
              : "These fields still show the placeholder content the resume started with. Recruiters will see them exactly as written — replace them with your own details first."}
          </DialogDescription>
        </DialogHeader>

        {review ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-primary"
              checked={dontRemind}
              onChange={(e) => setDontRemind(e.target.checked)}
            />
            I&apos;ve reviewed it — don&apos;t remind me again for this resume
          </label>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            {listed.map((issue) => (
              <li key={`${issue.field}-${issue.message}`} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                <span>{issue.message}</span>
              </li>
            ))}
            {more > 0 ? (
              <li className="pl-3.5 text-amber-800 dark:text-amber-200">
                …and {more} more {more === 1 ? "field" : "fields"}
              </li>
            ) : null}
          </ul>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {review ? (
            <>
              <Button variant="outline" onClick={onEdit}>
                Review again
              </Button>
              {onDownloadAnyway ? (
                <Button
                  onClick={() => {
                    if (dontRemind) onDontRemindAgain?.();
                    onDownloadAnyway();
                  }}
                >
                  {downloadLabel ?? "Download"}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {onGoToHackathon ? (
                <Button variant="outline" onClick={onGoToHackathon}>
                  Go to Hackathon
                </Button>
              ) : null}
              {onDownloadAnyway ? (
                <Button variant="outline" onClick={onDownloadAnyway}>
                  {downloadLabel ?? "Download anyway"}
                </Button>
              ) : null}
              <Button onClick={onEdit}>Fix my resume</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
