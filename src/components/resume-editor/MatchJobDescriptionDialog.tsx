"use client";

import { useEffect, useState } from "react";
import { Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getJobDescriptionOverflow,
  trimJobDescriptionForSend,
} from "@/lib/job-description-limits";

const MIN_JD_LENGTH = 50;

export function MatchJobDescriptionDialog({
  open,
  onOpenChange,
  onSubmit,
  applying = false,
  initialJobDescription = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (jobDescription: string) => void | Promise<void>;
  applying?: boolean;
  initialJobDescription?: string;
}) {
  const [jobDescription, setJobDescription] = useState(initialJobDescription);

  useEffect(() => {
    if (open) {
      setJobDescription(initialJobDescription);
    }
  }, [open, initialJobDescription]);

  const trimmedLength = jobDescription.trim().length;
  const tooShort = trimmedLength < MIN_JD_LENGTH;
  const overflow = getJobDescriptionOverflow(jobDescription);
  const overLimit = overflow > 0;

  const handleSubmit = () => {
    if (tooShort || applying) return;
    void onSubmit(trimJobDescriptionForSend(jobDescription));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (applying) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Match with job description
          </DialogTitle>
          <DialogDescription>
            Paste the job description and AI will rewrite your resume
            section-by-section — profile summary, skills, experience bullets,
            projects, and certifications — to align with the role. This updates
            the current resume; you can undo it anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <label
            htmlFor="match-jd-textarea"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Job description
          </label>
          <Textarea
            id="match-jd-textarea"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the full job description here (role, responsibilities, required skills, experience, etc.)"
            className="min-h-[240px] resize-y"
            disabled={applying}
          />
          {overLimit ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {overflow.toLocaleString()} extra characters will be trimmed
              (won&apos;t affect quality).
            </p>
          ) : (
            <p
              className={cn(
                "mt-2 text-xs",
                tooShort ? "text-muted-foreground" : "text-primary",
              )}
            >
              {tooShort
                ? `Add at least ${MIN_JD_LENGTH} characters (${trimmedLength}/${MIN_JD_LENGTH}).`
                : `${trimmedLength} characters — ready to tailor.`}
            </p>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={tooShort || applying}
            className="bg-gradient-to-r from-purple-600 to-primary text-white"
          >
            {applying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tailoring resume…
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Tailor my resume
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
