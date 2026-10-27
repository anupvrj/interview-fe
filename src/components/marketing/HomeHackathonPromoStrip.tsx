"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HackathonBrandPrizeHighlight } from "@/components/marketing/HackathonBrandPrizeHighlight";
import {
  HackathonLaunchEventProvider,
  useHackathonLaunchEventOptional,
} from "@/components/hackathon-2026/HackathonLaunchEventContext";
import { HackathonRegisterProvider, useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";
import { useHackathonMember } from "@/features/hackathon/returningMember";
import { HackathonSlugProvider, useHackathonFeature, useHackathonPublic } from "@/features/hackathon/hooks";
import { CTA_LABELS } from "@/features/hackathon/copy";
import { isHackathonSignupClosedForNewParticipants } from "@/features/hackathon/hackathonRegistration";
import { hackathonDashboardPath } from "@/features/hackathon/config";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";
import { pad2, useCountdown } from "@/features/site-popups/useCountdown";
import "@/features/site-popups/site-popups.css";
import { HOME_HACKATHON_PROMO } from "./homeHackathonPromoContent";
import { useAuth } from "@clerk/nextjs";

function PromoStripInner() {
  const feature = useHackathonFeature();
  const pub = useHackathonPublic();
  const { openRegister, label, disabled } = useHackathonRegister();
  const launch = useHackathonLaunchEventOptional();
  const { isSignedIn } = useAuth();
  const { member } = useHackathonMember();
  const event = pub.data;

  const promoteLaunch =
    event != null && isHackathonSignupClosedForNewParticipants(event, false) && event.phase !== "ended";

  const upcoming = event?.phase === "upcoming";
  const countdownTarget = promoteLaunch
    ? HOME_HACKATHON_PROMO.launchAt
    : event && event.phase !== "ended"
      ? upcoming
        ? event.startsAt
        : event.endsAt
      : null;
  const countdownLabel = promoteLaunch
    ? HOME_HACKATHON_PROMO.launchCountdownLabel
    : upcoming
      ? "Starts in"
      : "Ends in";
  const clockOffsetMs = event
    ? new Date(event.serverNow).getTime() - (pub.dataUpdatedAt || Date.now())
    : 0;
  const parts = useCountdown(countdownTarget, clockOffsetMs);

  if (feature.isLoading || pub.isLoading) return null;
  if (!feature.accessible || !event || event.phase === "ended") return null;

  const c = HOME_HACKATHON_PROMO;
  const challengeHref = member && isSignedIn ? hackathonDashboardPath(c.slug) : c.landingPath;

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
                {promoteLaunch ? c.launchEyebrow : c.eyebrow}
              </span>
              <h2 className="ixp-title ixp-title-sm ixp-home-title">
                {promoteLaunch ? c.launchTitle : c.title}
                {(promoteLaunch ? c.launchTitleAccent : c.titleAccent) ? (
                  <span className="ixp-grad"> {promoteLaunch ? c.launchTitleAccent : c.titleAccent}</span>
                ) : null}
              </h2>
              <p className="ixp-body ixp-home-body">{promoteLaunch ? c.launchBody : c.body}</p>
              {!promoteLaunch ? <HackathonBrandPrizeHighlight className="ixp-home-brand-prize" /> : null}
            </div>

            <div className="ixp-home-banner-meta">
              {!promoteLaunch ? (
                <>
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
                </>
              ) : null}
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
              {promoteLaunch ? (
                <button
                  type="button"
                  onClick={() => launch?.openLaunchRegister()}
                  className="ixp-btn ixp-btn-md ixp-home-cta"
                >
                  <span>{CTA_LABELS.registerForEvent}</span>
                  <ArrowRight className="ixp-btn-arrow" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => openRegister("other")}
                  className="ixp-btn ixp-btn-md ixp-home-cta"
                >
                  <span>{label || c.primaryLabel}</span>
                  <ArrowRight className="ixp-btn-arrow" aria-hidden />
                </button>
              )}
              <Link href={promoteLaunch ? challengeHref : c.landingPath} className="ixp-ghost ixp-home-ghost">
                {promoteLaunch ? c.secondaryChallengeLabel : c.secondaryLabel}
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
      <HackathonLaunchEventProvider>
        <HackathonRegisterProvider>
          <PromoStripInner />
        </HackathonRegisterProvider>
      </HackathonLaunchEventProvider>
    </HackathonSlugProvider>
  );
}
