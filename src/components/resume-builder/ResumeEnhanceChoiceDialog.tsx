"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { resumeBuilderOutlineButton, resumeBuilderPrimaryButton } from "@/components/resume-builder/resumeBuilderStyles";
import { dash2026Scope } from "@/components/dashboard-2026/ui";

interface ResumeEnhanceChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkip: () => void;
  onEnhance: () => void;
}

export function ResumeEnhanceChoiceDialog({
  open,
  onOpenChange,
  onSkip,
  onEnhance,
}: Readonly<ResumeEnhanceChoiceDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dash2026Scope, "rounded-[22px] border border-border bg-card p-6 sm:max-w-md sm:p-7")}>
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-primary shadow-[0_12px_26px_-16px_rgba(75,63,208,.6)] dark:from-primary/20 dark:to-sky-500/10">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-[22px] font-extrabold tracking-[-0.03em] text-foreground">
            Rewrite and enhance this resume?
          </DialogTitle>
          <DialogDescription className="pt-1 text-center text-muted-foreground">
            AI can rephrase your uploaded resume so it reads more clearly and
            professionally. Or keep the original wording as uploaded.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className={cn(resumeBuilderOutlineButton, "min-w-[140px]")}
            onClick={() => {
              onOpenChange(false);
              onSkip();
            }}
          >
            Skip and Continue
          </Button>
          <Button
            type="button"
            className={cn(resumeBuilderPrimaryButton, "min-w-[180px]")}
            onClick={() => {
              onOpenChange(false);
              onEnhance();
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Rewrite and Enhance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
