"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";
import { HACKATHON_SIGNUP_CLOSED, REGISTRATION_CLOSED_NOTE } from "../copy";
import "@/features/hackathon/components/hackathon-dashboard-reel.css";

export function HackathonRegistrationClosedModal({
  open,
  onOpenChange,
  onRegisterForEvent,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, shows launch-event copy and primary CTA (new signup blocked). */
  onRegisterForEvent?: () => void;
}>) {
  const launchFlow = Boolean(onRegisterForEvent);
  const copy = launchFlow ? HACKATHON_SIGNUP_CLOSED : { title: "Registration is closed", message: REGISTRATION_CLOSED_NOTE, launchCta: "", dismiss: "Got it" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={cn("hk-hackathon-dialog-overlay z-[100] bg-[#020810]/80 backdrop-blur-sm")}
        className={cn(
          hackathonReelFontVars,
          "hk-root hk-modal hk-hackathon-dialog fixed left-1/2 top-1/2 z-[101] max-h-[90svh] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-0 overflow-y-auto border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none sm:max-w-lg [&>button]:hidden",
        )}
      >
        <div className="px-5 py-6 text-center sm:px-6 sm:py-7">
          <div className="hk-signup-closed-emoji-wrap mx-auto mb-4 grid size-[4.25rem] place-items-center rounded-full bg-[#1a2438]/80 ring-1 ring-[#ffc44d]/20">
            <span className="hk-signup-closed-emoji text-[2.65rem]" aria-hidden>
              😢
            </span>
          </div>
          <DialogTitle className="text-xl font-bold leading-snug text-white">{copy.title}</DialogTitle>
          <DialogDescription className="mt-3 text-[15px] leading-relaxed text-[#cfdbe8]">{copy.message}</DialogDescription>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center">
            {launchFlow ? (
              <button
                type="button"
                className="hk-btn inline-flex min-h-12 flex-1 items-center justify-center px-4 text-sm font-semibold"
                onClick={() => {
                  onRegisterForEvent?.();
                  onOpenChange(false);
                }}
              >
                {HACKATHON_SIGNUP_CLOSED.launchCta}
              </button>
            ) : null}
            <button
              type="button"
              className={cn(
                "inline-flex min-h-12 items-center justify-center rounded-xl border border-[#27547d] bg-[#0b2142] px-4 text-sm font-medium text-[#dbe9f8]",
                launchFlow ? "flex-1" : "w-full",
              )}
              onClick={() => onOpenChange(false)}
            >
              {copy.dismiss}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
