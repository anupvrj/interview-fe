"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HackathonBrandPrizeHighlight } from "@/components/marketing/HackathonBrandPrizeHighlight";
import { HackathonRegisterProvider, useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";
import { HackathonSlugProvider, useHackathonFeature, useHackathonPublic } from "@/features/hackathon/hooks";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";
import { pad2, useCountdown } from "@/features/site-popups/useCountdown";
import "@/features/site-popups/site-popups.css";
import { HOME_HACKATHON_PROMO } from "./homeHackathonPromoContent";

function PromoStripInner() {
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
  // Short so label + timer stay on one line on phones.
  const countdownLabel = upcoming ? "Starts in" : "Ends in";
  const clockOffsetMs = event
    ? new Date(event.serverNow).getTime() - (pub.dataUpdatedAt || Date.now())
    : 0;
  const parts = useCountdown(countdownTarget, clockOffsetMs);

  if (feature.isLoading || pub.isLoading) return null;
  if (!feature.accessible || !event || event.phase === "ended") return null;

  const c = HOME_HACKATHON_PROMO;

  return (
    <section
      className={cn("ixp-root ixp-home-strip", hackathonReelFontVars)}
      aria-label="Hackathon promotion"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ixp-panel ixp-home-banner">
          <div className="ixp-home-banner-grid">
            <div className="ixp-home-banner-copy">
              <span className="ixp-eyebrow">
                <i aria-hidden />
                {c.eyebrow}
              </span>
              <h2 className="ixp-title ixp-title-sm ixp-home-title">
                {c.title}
                {c.titleAccent ? <span className="ixp-grad"> {c.titleAccent}</span> : null}
              </h2>
              <p className="ixp-body ixp-home-body">{c.body}</p>
              <HackathonBrandPrizeHighlight className="ixp-home-brand-prize" />
            </div>

            <div className="ixp-home-banner-meta">
              <p className="ixp-price ixp-price-sm">
                <span className="ixp-price-now">{c.priceNow}</span>
                <span className="ixp-price-was">
                  <span className="sr-only">was </span>
                  {c.priceOriginal}
                </span>
              </p>
              <p className="ixp-home-pool-line">
                <span className="ixp-prize-label">{c.prizeLabel}</span>
                <span className="ixp-prize-value ixp-home-pool-value">{c.prizeValue}</span>
              </p>
              {parts && !parts.done ? (
                <div className="ixp-cd-inline ixp-home-cd" role="timer" aria-live="off">
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
            </div>

            <div className="ixp-home-banner-actions">
              <button
                type="button"
                disabled={disabled}
                onClick={() => openRegister("other")}
                className="ixp-btn ixp-btn-md ixp-home-cta"
              >
                <span>{label || c.primaryLabel}</span>
                <ArrowRight className="ixp-btn-arrow" aria-hidden />
              </button>
              <Link href={c.landingPath} className="ixp-ghost ixp-home-ghost">
                {c.secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeHackathonPromoStrip() {
  return (
    <HackathonSlugProvider slug={HOME_HACKATHON_PROMO.slug}>
      <HackathonRegisterProvider>
        <PromoStripInner />
      </HackathonRegisterProvider>
    </HackathonSlugProvider>
  );
}
