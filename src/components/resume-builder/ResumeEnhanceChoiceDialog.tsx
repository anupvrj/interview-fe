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
import { appCard, appOutlineButton } from "@/lib/app-theme";
import { resumeBuilderPrimaryButton } from "@/components/resume-builder/resumeBuilderStyles";

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
      <DialogContent className={cn(appCard, "sm:max-w-md border-primary/20")}>
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_2px_10px_rgba(115,103,240,0.35)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold text-foreground">
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
            className={cn(appOutlineButton, "min-w-[140px]")}
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
