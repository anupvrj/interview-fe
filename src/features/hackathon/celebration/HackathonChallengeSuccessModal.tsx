"use client";

import { ExternalLink, MessageCircle, PartyPopper } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HACKATHON_WHATSAPP_COMMUNITY_URL,
  hackathonWhatsAppCommunityQrUrl,
} from "../whatsapp-links";
import { HACKATHON_CHALLENGE_SUCCESS_COPY } from "./celebrationCopy";
import { HackathonConfettiLayer } from "./HackathonConfettiLayer";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";

type HackathonChallengeSuccessModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function HackathonChallengeSuccessModal({ open, onOpenChange }: HackathonChallengeSuccessModalProps) {
  const communityUrl = HACKATHON_WHATSAPP_COMMUNITY_URL.trim();
  const qrSrc = communityUrl ? hackathonWhatsAppCommunityQrUrl(communityUrl) : null;
  const copy = HACKATHON_CHALLENGE_SUCCESS_COPY;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <HackathonConfettiLayer active={open} />
      <DialogContent
        overlayClassName="bg-[#020810]/80"
        className={`hk-root hk-modal ${hackathonReelFontVars} relative max-h-[min(92vh,720px)] w-[calc(100%-1.5rem)] max-w-2xl gap-0 overflow-hidden border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none`}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-90"
          aria-hidden
        >
          <span className="hk-celebration-sparkle absolute left-[12%] top-[18%] size-2 rounded-full bg-[#ffc44d]" />
          <span className="hk-celebration-sparkle absolute right-[15%] top-[22%] size-1.5 rounded-full bg-[#29d6a0] [animation-delay:0.4s]" />
          <span className="hk-celebration-sparkle absolute left-[20%] bottom-[30%] size-2 rounded-full bg-[#6fc0ff] [animation-delay:0.8s]" />
          <span className="hk-celebration-sparkle absolute right-[22%] bottom-[28%] size-1.5 rounded-full bg-[#ff6f9f] [animation-delay:1.1s]" />
        </div>

        <DialogHeader className="relative space-y-3 border-b border-[#27547d]/60 px-5 py-5 text-left sm:px-6">
          <DialogTitle className="flex items-start gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            <PartyPopper className="mt-1 size-8 shrink-0 text-[#ffc44d]" aria-hidden />
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#cfdbe8] sm:text-[15px]">
            {copy.body}
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="hk-modal-panel rounded-xl border border-[#27547d]/70 bg-[#040b17]/80 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-white">{copy.whyJoinTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9eb2ca]">{copy.whyJoinBody}</p>
          </section>

          <section className="rounded-xl border border-[#1f8a82]/60 bg-gradient-to-b from-[#0c3238]/40 to-[#071426]/80 p-4 sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <p className="hk-pill-m flex items-center gap-2 text-sm font-semibold text-white">
                  <MessageCircle className="size-4 text-[#29d6a0]" aria-hidden />
                  WhatsApp Community
                </p>
                <p className="text-xs leading-relaxed text-[#9eb2ca] sm:text-sm">
                  Tap below on mobile, or scan the QR code on desktop to join.
                </p>
                {communityUrl ? (
                  <a
                    href={communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hk-btn inline-flex h-11 w-full px-5 text-sm sm:w-auto"
                  >
                    {copy.communityCta}
                    <ExternalLink className="size-4 opacity-90" aria-hidden />
                  </a>
                ) : (
                  <p className="text-xs text-[#ffc44d]">{copy.communityMissing}</p>
                )}
              </div>
              {qrSrc ? (
                <div className="flex shrink-0 flex-col items-center gap-2 self-center sm:self-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external QR API */}
                  <img
                    src={qrSrc}
                    alt=""
                    width={200}
                    height={200}
                    className="size-[140px] rounded-lg border border-[#27547d]/80 bg-white p-1.5 sm:size-[168px]"
                  />
                  <p className="hk-pill-m text-center text-[11px] font-medium uppercase tracking-wide text-[#7189a6]">
                    Scan to join
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
