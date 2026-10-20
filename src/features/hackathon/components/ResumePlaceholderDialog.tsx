"use client";

import Link from "next/link";
import { AlertTriangle, PencilLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { HackathonHelpOnWhatsApp } from "./HackathonHelpOnWhatsApp";

const ghostButton =
  "hk-btn-ghost inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-transparent px-5 text-[15px] font-semibold text-white transition-colors hover:border-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 sm:w-auto";
const primaryButton =
  "hk-btn inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 text-[15px] sm:w-auto";

/**
 * The server refused to score/submit because the resume still has sample data
 * ("Your Name", "Sample Job 1", …). Lists every field and sends them to the builder.
 */
export function ResumePlaceholderDialog({
  open,
  onOpenChange,
  issues,
  fixHref,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: string[];
  fixHref: string | null;
}>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#020810]/80"
        className={`hk-root hk-modal ${hackathonReelFontVars} max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg gap-0 overflow-y-auto border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none sm:max-w-2xl lg:max-h-[94dvh] lg:max-w-6xl`}
      >
        {/* Desktop: icon beside the title so the list, not the header, gets the height. */}
        <DialogHeader className="space-y-3 border-b border-[#27547d]/60 px-5 pb-4 pt-6 text-center sm:px-6 lg:flex lg:flex-row lg:items-center lg:gap-4 lg:space-y-0 lg:px-8 lg:py-4 lg:text-left">
          <span className="mx-auto grid size-14 shrink-0 place-items-center rounded-2xl bg-[#2e2410]/70 text-[#ffc44d] ring-1 ring-[#ffc44d]/40 lg:mx-0 lg:size-12">
            <AlertTriangle className="size-7 lg:size-6" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
              Your resume still has sample data
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-[#9eb2ca]">
              These fields still show the placeholder content your resume started with. Replace them
              with your own details, then submit again.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-5 py-5 sm:px-6 lg:px-8 lg:py-4">
          <ul className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#ffc44d]/25 bg-[#1a1608]/60 px-4 py-3 text-left text-sm text-[#ffe6a8] sm:grid sm:max-h-none sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 sm:space-y-0 sm:overflow-visible lg:grid-cols-3 lg:gap-y-1.5">
            {issues.map((message) => (
              <li key={message} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#ffc44d]" aria-hidden />
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop: WhatsApp help and the actions share one row. */}
        <div className="flex flex-col gap-4 border-t border-[#27547d]/60 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-3">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center lg:order-2 lg:shrink-0">
            <button type="button" className={ghostButton} onClick={() => onOpenChange(false)}>
              Close
            </button>
            {fixHref ? (
              <Link href={fixHref} className={primaryButton}>
                <PencilLine className="size-4" aria-hidden />
                Fix my resume
              </Link>
            ) : null}
          </div>
          {/* QR card on phones/tablets; compact row on desktop to keep everything on screen. */}
          <HackathonHelpOnWhatsApp className="lg:hidden" />
          <HackathonHelpOnWhatsApp hideQr className="hidden lg:order-1 lg:flex lg:max-w-2xl lg:items-center lg:py-3" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
