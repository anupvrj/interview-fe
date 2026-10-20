"use client";

import { ExternalLink, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HACKATHON_WHATSAPP_COMMUNITY_URL, hackathonWhatsAppCommunityQrSrc } from "../whatsapp-links";

/**
 * Shown next to hackathon errors so nobody is left stuck: QR + link to the WhatsApp
 * community where they can post the problem. Self-contained colours (every placement is a
 * dark surface: interview room, hackathon dashboard), so it doesn't depend on `.hk-root`.
 */
export function HackathonHelpOnWhatsApp({
  className,
  hideQr = false,
}: Readonly<{ className?: string; hideQr?: boolean }>) {
  const url = HACKATHON_WHATSAPP_COMMUNITY_URL.trim();
  if (!url) return null;
  const qr = hackathonWhatsAppCommunityQrSrc(url);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-4 rounded-xl border border-[#25D366]/35 bg-[#25D366]/[0.07] p-4 text-center sm:flex-row sm:text-left",
        className,
      )}
    >
      {hideQr ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- small static QR
        <img
          src={qr}
          alt="QR code to join the InterviewTrix WhatsApp community"
          width={112}
          height={112}
          className="hidden size-[112px] shrink-0 rounded-lg bg-white p-1.5 sm:block"
        />
      )}
      <div className="min-w-0 space-y-2">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-white sm:justify-start">
          <MessageCircle className="size-4 shrink-0 text-[#25D366]" aria-hidden />
          Stuck? Get help on WhatsApp
        </p>
        <p className="text-xs leading-relaxed text-slate-300">
          Post your issue in our hackathon WhatsApp community with a screenshot of this screen.
          Our team replies there.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1fa855] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1b934b]"
        >
          Post on WhatsApp
          <ExternalLink className="size-3.5 opacity-80" aria-hidden />
        </a>
      </div>
    </div>
  );
}
