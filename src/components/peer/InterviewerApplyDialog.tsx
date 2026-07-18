"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterviewerOnboardingForm } from "@/components/peer/InterviewerOnboardingForm";
import { peerApi, type PeerInterviewType } from "@/lib/api";

const dialogShell =
  "flex w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 fixed left-[50%] top-[50%] max-h-[min(90dvh,44rem)] translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-card shadow-header";

const dialogHeaderClass =
  "items-start space-y-1.5 border-b border-border/60 px-4 pb-4 pt-5 pr-12 text-left sm:px-5";

type InterviewerApplyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InterviewerApplyDialog({
  open,
  onOpenChange,
}: Readonly<InterviewerApplyDialogProps>) {
  const { user } = useUser();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    peerApi
      .listInterviewTypes()
      .then(setTypes)
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogShell}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
            Become a Peer Interviewer
          </DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed">
            Apply to conduct live mock interviews on InterviewTrix. Set your
            pricing, publish slots, and earn from completed sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <InterviewerOnboardingForm
              types={types}
              initialName={user?.fullName || undefined}
              showHeader={false}
              className="max-w-none"
              onSubmitted={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
