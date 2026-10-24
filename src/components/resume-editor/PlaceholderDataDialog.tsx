"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Sparkles, Wand2 } from "lucide-react";
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
const FIELD_LABELS: Record<string, string> = {
  "personalInfo.fullName": "name",
  "personalInfo.portfolio": "job title",
  "personalInfo.email": "email",
};
const fieldLabel = (issue: ResumePlaceholderIssue) => FIELD_LABELS[issue.field] ?? issue.message.split(/[:—]/)[0].trim().toLowerCase();

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
  cleanup,
  onRemoveSamples,
  removeAndContinueLabel,
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
  /**
   * What "Remove sample entries" would do: `undefined` while it's being worked out, `null` when
   * unavailable. `remaining` is sample data only the user can fix (their name, email…).
   */
  cleanup?: { removed: string[]; remaining: ResumePlaceholderIssue[] } | null;
  onRemoveSamples?: () => void;
  /** Button text when removing leaves nothing to fix ("Remove samples & submit"). */
  removeAndContinueLabel?: string;
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
      <DialogContent className="sm:max-w-xl [&>*]:min-w-0">
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
          <>
          {onRemoveSamples && cleanup === undefined ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Checking what we can clean up for you…
            </p>
          ) : null}
          {onRemoveSamples && cleanup && cleanup.removed.length > 0 ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
              <p className="flex items-center gap-1.5 font-semibold">
                <Wand2 className="size-4 text-primary" aria-hidden /> Quick fix
              </p>
              <p className="mt-1 text-muted-foreground">
                We can remove the sample entries you haven&apos;t edited: {cleanup.removed.slice(0, 6).join(", ")}
                {cleanup.removed.length > 6 ? ` and ${cleanup.removed.length - 6} more` : ""}. You can undo this.
              </p>
              {cleanup.remaining.length > 0 ? (
                <p className="mt-2 text-muted-foreground">
                  You&apos;ll still need to type your own {[...new Set(cleanup.remaining.map(fieldLabel))].join(", ")}.
                </p>
              ) : null}
            </div>
          ) : null}
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
          </>
        )}

        <DialogFooter className="gap-2 sm:flex-wrap sm:gap-2">
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
              {onRemoveSamples && cleanup && cleanup.removed.length > 0 ? (
                <>
                  <Button variant="outline" onClick={onEdit}>Fix it myself</Button>
                  <Button onClick={onRemoveSamples}>
                    <Wand2 className="mr-1.5 size-4" aria-hidden />
                    {cleanup.remaining.length === 0 ? (removeAndContinueLabel ?? "Remove samples") : "Remove sample entries"}
                  </Button>
                </>
              ) : (
                <Button onClick={onEdit}>Fix my resume</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
