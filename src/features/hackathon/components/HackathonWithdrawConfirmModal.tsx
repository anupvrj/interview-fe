"use client";

import { Loader2, UserX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hkSecondaryButton } from "./ResumeChallenge";

type HackathonWithdrawConfirmModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
}>;

const REMOVED_ITEMS = [
  "Your hackathon registration for this event",
  "Resume submission and ATS snapshot for this hackathon",
  "AI interview attempts tied to this hackathon",
  "Social challenge links you submitted",
] as const;

export function HackathonWithdrawConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
}: HackathonWithdrawConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent
        overlayClassName="bg-[#020810]/75"
        className="max-h-[min(90vh,640px)] w-[calc(100%-2rem)] max-w-xl gap-0 overflow-hidden border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none"
      >
        <DialogHeader className="space-y-2 border-b border-[#27547d]/60 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <UserX className="size-5 text-[#ff6f9f]" aria-hidden />
            Remove from hackathon?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#9eb2ca]">
            This permanently deletes your entry for this event. Your InterviewTrix account, main profile, and resumes
            outside this hackathon are not affected. You can register again from scratch afterward.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7189a6]">What will be removed</p>
          <ul className="space-y-2 rounded-lg border border-[#27547d]/80 bg-[#040b17] px-3 py-3 text-sm leading-relaxed text-[#cfdbe8]">
            {REMOVED_ITEMS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#ff6f9f]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-[#27547d]/60 px-5 py-4 sm:flex-col sm:space-x-0">
          <p className="w-full text-center text-xs leading-relaxed text-[#7189a6]">
            This action cannot be undone. You will leave the hackathon immediately.
          </p>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={`${hkSecondaryButton} w-full sm:w-auto`}
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#8a2f57]/80 bg-[linear-gradient(135deg,#5a1636,#3a0f26)] px-5 text-sm font-semibold text-[#ffb8d0] shadow-[0_8px_24px_rgba(90,22,54,0.35)] transition-colors hover:border-[#ff6f9f]/60 hover:text-white disabled:opacity-60 sm:w-auto"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Removing…
                </>
              ) : (
                "Yes, remove me"
              )}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
