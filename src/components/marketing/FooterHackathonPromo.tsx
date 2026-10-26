"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HackathonBrandPrizeHighlight } from "@/components/marketing/HackathonBrandPrizeHighlight";
import { HackathonLaunchEventProvider } from "@/components/hackathon-2026/HackathonLaunchEventContext";
import { HackathonRegisterProvider, useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";
import { HackathonSlugProvider, useHackathonFeature, useHackathonPublic } from "@/features/hackathon/hooks";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";
import { pad2, useCountdown } from "@/features/site-popups/useCountdown";
import "@/features/site-popups/site-popups.css";
import { FOOTER_HACKATHON_PROMO } from "./footerHackathonPromoContent";

function FooterPromoInner() {
  const feature = useHackathonFeature();
  const pub = useHackathonPublic();
  const { openRegister, label, disabled } = useHackathonRegister();
  const event = pub.data;

  const upcoming = event?.phase === "upcoming";
  const countdownTarget =
    event && event.phase !== "ended"
      ? upcoming
        ? event.startsAt
        : event.endsAt
      : null;
  const countdownLabel = upcoming ? "Starts in" : "Closes in";
  const clockOffsetMs = event
    ? new Date(event.serverNow).getTime() - (pub.dataUpdatedAt || Date.now())
    : 0;
  const parts = useCountdown(countdownTarget, clockOffsetMs);

  if (feature.isLoading || pub.isLoading) return null;
  if (!feature.accessible || !event || event.phase === "ended") return null;

  const c = FOOTER_HACKATHON_PROMO;

  return (
    <div
      className={cn("ixp-root ixp-home-strip ixp-footer-strip", hackathonReelFontVars)}
      aria-label="Hackathon promotion"
    >
      <div className="ixp-panel ixp-home-banner ixp-footer-banner">
        <div className="ixp-footer-banner-grid">
          <div className="ixp-home-banner-copy min-w-0">
            <span className="ixp-eyebrow">
              <i aria-hidden />
              {c.eyebrow}
            </span>
            <h2 className="ixp-title ixp-title-sm ixp-home-title ixp-footer-title">
              {c.title}
              {c.titleAccent ? (
                <>
                  <span className="hidden sm:inline"> — </span>
                  <span className="ixp-grad block sm:inline">{c.titleAccent}</span>
                </>
              ) : null}
            </h2>
            <HackathonBrandPrizeHighlight className="ixp-footer-brand-prize" showCredits />
          </div>

          <div className="ixp-footer-banner-aside">
            {parts && !parts.done ? (
              <div className="ixp-cd-inline ixp-footer-countdown" role="timer" aria-live="off">
                <span className="ixp-cd-inline-label">{countdownLabel}</span>
                <span className="ixp-cd-inline-digits">
                  {(
                    [
                      [parts.days, "d"],
                      [parts.hours, "h"],
                      [parts.minutes, "m"],
                      [parts.seconds, "s"],
                    ] as const
                  ).map(([value, unit]) => (
                    <span key={unit}>
                      {pad2(value)}
                      <small>{unit}</small>
                    </span>
                  ))}
                </span>
              </div>
            ) : null}

            <div className="ixp-home-banner-actions ixp-footer-actions">
              <button
                type="button"
                disabled={disabled}
                onClick={() => openRegister("other")}
                className="ixp-btn ixp-btn-md ixp-home-cta"
              >
                <span>{label || c.primaryLabel}</span>
                <ArrowRight className="ixp-btn-arrow" aria-hidden />
              </button>
              <Link href={c.landingPath} className="ixp-ghost ixp-home-ghost text-center sm:text-left">
                {c.secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FooterHackathonPromo() {
  return (
    <HackathonSlugProvider slug={FOOTER_HACKATHON_PROMO.slug}>
      <HackathonRegisterProvider>
        <FooterPromoInner />
      </HackathonRegisterProvider>
    </HackathonSlugProvider>
  );
}
