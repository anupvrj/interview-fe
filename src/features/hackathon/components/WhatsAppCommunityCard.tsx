"use client";

import { ExternalLink, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HACKATHON_WHATSAPP_COMMUNITY_URL, hackathonWhatsAppCommunityQrSrc } from "../whatsapp-links";

const COPY = {
  title: "Get hackathon updates on WhatsApp",
  body: "Deadline reminders, results and the live launch link are shared in our community first.",
  cta: "Join on WhatsApp",
  doneTitle: "Stay in the loop for the results",
  doneBody: "Winners and the live launch link are announced in our WhatsApp community first. Scan the code or tap the button to join.",
} as const;

/**
 * WhatsApp community invite for the hackathon dashboard.
 * - `strip`: slim bar with a join button (dashboard, waiting room).
 * - `qr`: QR code + button, shown after the hackathon is completed.
 */
export function WhatsAppCommunityCard({
  variant = "strip",
  className,
}: Readonly<{ variant?: "strip" | "qr"; className?: string }>) {
  const url = HACKATHON_WHATSAPP_COMMUNITY_URL.trim();
  if (!url) return null;

  const button = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="hk-btn inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap px-5 text-sm sm:w-auto"
    >
      <MessageCircle className="size-4" aria-hidden />
      {COPY.cta}
      <ExternalLink className="size-3.5 opacity-80" aria-hidden />
    </a>
  );

  if (variant === "qr") {
    const qr = hackathonWhatsAppCommunityQrSrc(url);
    return (
      <div
        className={cn(
          "relative mx-auto flex max-w-xl flex-col items-center gap-5 rounded-2xl border border-[#1f8a82]/60 bg-[#071426]/70 p-5 text-left sm:flex-row sm:p-6",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- small static QR */}
        <img
          src={qr}
          alt="QR code to join the InterviewTrix WhatsApp community"
          width={160}
          height={160}
          className="size-[150px] shrink-0 rounded-xl bg-white p-2 sm:size-[160px]"
        />
        <div className="min-w-0 space-y-3 text-center sm:text-left">
          <p className="flex items-center justify-center gap-2 text-base font-bold text-white sm:justify-start">
            <MessageCircle className="size-5 text-[#29d6a0]" aria-hidden />
            {COPY.doneTitle}
          </p>
          <p className="text-sm leading-relaxed text-[#cfdbe8]">{COPY.doneBody}</p>
          {button}
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-[#1f8a82]/55 bg-gradient-to-r from-[#0c3238]/70 to-[#071426]/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#29d6a0]/12 text-[#29d6a0] ring-1 ring-[#29d6a0]/40">
          <MessageCircle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-white">{COPY.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-[#9eb2ca]">{COPY.body}</p>
        </div>
      </div>
      {button}
    </section>
  );
}
