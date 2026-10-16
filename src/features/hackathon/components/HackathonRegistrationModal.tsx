"use client";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CTA_LABELS } from "../copy";
import { cn } from "@/lib/utils";

export type HackathonRegistrationModalPhase = "registering" | "success";

type HackathonRegistrationModalProps = Readonly<{
  phase: HackathonRegistrationModalPhase | null;
  onGoToChallenge?: () => void;
}>;

const BODY_MIN_H = "min-h-[15.5rem]";

export function HackathonRegistrationModal({ phase, onGoToChallenge }: HackathonRegistrationModalProps) {
  const open = phase !== null;
  const success = phase === "success";

  return (
    <Dialog open={open}>
      <DialogContent
        overlayClassName="bg-[#020810]/75"
        className="w-[calc(100%-2rem)] max-w-[22rem] gap-0 overflow-hidden border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none sm:max-w-[24rem] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          <div
            className={cn(
              "flex flex-col items-center justify-center px-6 pb-2 pt-9 text-center sm:px-8 sm:pt-10",
              BODY_MIN_H,
            )}
          >
            <div
              className={cn(
                "mb-6 grid size-[4.5rem] shrink-0 place-items-center rounded-full border-2",
                success
                  ? "border-[#29d6a0]/55 bg-[#0b2e28]/80"
                  : "border-[#3aa6ff]/45 bg-[#0d2550]/80",
              )}
            >
              {success ? (
                <CheckCircle2 className="size-10 text-[#29d6a0]" strokeWidth={2.25} aria-hidden />
              ) : (
                <Loader2 className="size-10 animate-spin text-[#6fc0ff]" aria-hidden />
              )}
            </div>

            <DialogTitle className="text-balance text-xl font-extrabold leading-tight tracking-tight text-white sm:text-[1.35rem]">
              {success ? "You're registered!" : "Registering for hackathon"}
            </DialogTitle>

            <DialogDescription className="mt-3 max-w-[17.5rem] text-pretty text-sm leading-relaxed text-[#9eb2ca] sm:max-w-[19rem]">
              {success
                ? "Your spot is confirmed. Open your challenge dashboard when you're ready."
                : "Securing your spot — this only takes a moment."}
            </DialogDescription>
          </div>

          <div className="border-t border-[#27547d]/60 px-6 py-5 sm:px-8">
            <div className="flex min-h-12 items-center justify-center">
              {success ? (
                <button type="button" onClick={onGoToChallenge} className="hk-btn h-12 w-full px-6 text-sm">
                  {CTA_LABELS.goToChallenges}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              ) : (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7189a6]">Please wait</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
