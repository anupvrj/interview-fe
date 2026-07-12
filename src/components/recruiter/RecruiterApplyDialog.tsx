"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecruiterOnboardingForm } from "@/components/recruiter/RecruiterOnboardingForm";

const dialogShell =
  "flex w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 fixed left-[50%] top-[50%] max-h-[min(90dvh,44rem)] translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-card shadow-header";

const dialogHeaderClass =
  "items-start space-y-1.5 border-b border-border/60 px-4 pb-4 pt-5 pr-12 text-left sm:px-5";

type RecruiterApplyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecruiterApplyDialog({
  open,
  onOpenChange,
}: Readonly<RecruiterApplyDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogShell}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
            Become a Recruiter
          </DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed">
            Apply to hire verified iX Talent on InterviewTrix. Individual and
            company registrations welcome.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <RecruiterOnboardingForm
            className="max-w-none"
            onSubmitted={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
