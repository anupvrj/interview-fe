"use client";

import Link from "next/link";
import { ArrowRight, Brain, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIst, formatProfileMissing } from "../copy";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { HACKATHON_PRIZES } from "@/lib/hackathon-2026-content";
import {
  HACKATHON_FEATURE_KEY,
  HACKATHON_SLUG,
  hackathonDashboardPath,
  hackathonLandingPath,
  hackathonProfilePath,
} from "../config";
import { useHackathonMe, usePublishedHackathons } from "../hooks";
import { isHackathonRegistered } from "../hackathonRegistration";
import { pickDashboardHackathon } from "../pickDashboardHackathon";
import { DashboardHackathonBanner2026 } from "./DashboardHackathonBanner2026";
import "./DashboardHackathonBanner.css";

const primaryBtn =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1677ff] px-4 text-sm font-semibold text-white hover:bg-[#3a8fff] sm:w-auto";

export function DashboardHackathonBanner() {
  const { isVisible } = usePlatformFeatures();
  const published = usePublishedHackathons();
  const event = pickDashboardHackathon(published.data ?? []);
  const me = useHackathonMe(event?.slug, { enabled: Boolean(event?.slug) });

  if (!isVisible(HACKATHON_FEATURE_KEY) || published.isError || me.isError || !event) return null;

  const participant = me.data?.participant ?? null;
  const registered = !me.waitingForMe && isHackathonRegistered(me.data);
  const completed = Boolean(
    registered && (me.data?.progress.completed || participant?.status === "completed"),
  );
  const profileReady = Boolean(me.data?.profile.complete);
  const missing = me.data?.profile.missing ?? [];
  const needsDetails = registered && !profileReady && !completed;
  const started = participant?.status === "in_progress";
  const canRegister = !me.waitingForMe && !registered && !event.isFull;
  const dashboardHref = hackathonDashboardPath(event.slug);
  const landingHref = hackathonLandingPath(event.slug);
  const profileHref = hackathonProfilePath(event.slug);
  const live = event.phase === "live";

  let message = live
    ? "It’s live now. Register and start the hackathon from here."
    : event.slug === HACKATHON_SLUG
      ? HACKATHON_PRIZES.registerPitch
      : "Register now — challenges unlock when the event starts.";
  if (event.isFull && !registered) {
    message = "Spots are full for this event.";
  } else if (needsDetails) {
    message = `Add ${formatProfileMissing(missing)} to ${live ? "start the hackathon" : "be ready when it starts"}.`;
  } else if (registered && !live) {
    message = "You’re registered. Challenges unlock when the hackathon starts.";
  } else if (registered && live && started) {
    message = "You’re already in. Continue where you left off.";
  } else if (registered && live && !completed) {
    message = "Your profile is ready. Start the hackathon now.";
  } else if (completed && live) {
    message = "The event is still live. Open the hackathon page to see your run.";
  }

  const when = live
    ? event.endsAt
      ? `Closes ${formatIst(event.endsAt)}`
      : null
    : event.startsAt
      ? `Starts ${formatIst(event.startsAt)}`
      : null;

  let cta: { href: string; label: string } | null = null;
  if (!me.waitingForMe) {
    if (needsDetails) {
      cta = {
        href: profileHref,
        label: missing.includes("resume") ? "Add resume & details" : "Complete your profile",
      };
    } else if (canRegister && live) {
      cta = { href: dashboardHref, label: "Register And Win" };
    } else if (canRegister) {
      cta = { href: landingHref, label: "Register And Win" };
    } else if (registered && live && !completed) {
      cta = { href: dashboardHref, label: started ? "Continue hackathon" : "Start hackathon" };
    } else if (registered && !live) {
      cta = { href: dashboardHref, label: "Go to hackathon" };
    } else if (registered && live && completed) {
      cta = { href: dashboardHref, label: "Go to the Hackathon page" };
    }
  }

  if (event.slug === HACKATHON_SLUG) {
    return (
      <DashboardHackathonBanner2026
        live={live}
        message={message}
        when={when}
        cta={cta}
        spotsLeft={event.spotsLeft}
      />
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-sky-400/25 bg-[linear-gradient(135deg,#071426_0%,#0b2a4a_55%,#123a63_100%)] px-4 py-4 text-white shadow-card sm:px-5 sm:py-5",
        live && "hk-dash-live-card border-emerald-300/40",
      )}
    >
      {live ? (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden bg-emerald-400/30" aria-hidden>
          <span className="hk-dash-live-sheen absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        </span>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
                live
                  ? "border-emerald-300/60 bg-emerald-400/20 text-emerald-100"
                  : "border-sky-300/40 bg-sky-400/10 text-sky-200",
              )}
            >
              {live ? (
                <>
                  <span className="relative flex size-2" aria-hidden>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75 motion-reduce:animate-none" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
                  </span>
                  <Flag className="hk-dash-live-flag size-3.5" aria-hidden />
                  Live now
                </>
              ) : (
                <>
                  <Brain className="size-3" aria-hidden />
                  Upcoming Hackathon
                </>
              )}
            </span>
            {event.spotsLeft != null && event.spotsLeft > 0 && event.spotsLeft < 20 ? (
              <span className="text-xs text-sky-200/80">
                {event.spotsLeft} spot{event.spotsLeft === 1 ? "" : "s"} left
              </span>
            ) : null}
          </div>
          <h2 className="text-lg font-bold leading-tight sm:text-xl">{event.title}</h2>
          <p className="text-pretty text-sm leading-relaxed text-sky-100/90 sm:max-w-xl">{message}</p>
          {when ? <p className="text-xs text-sky-200/70">{when}</p> : null}
        </div>

        {cta ? (
          <div className="flex w-full shrink-0 sm:w-auto sm:pt-0.5">
            <Link href={cta.href} className={cn(primaryBtn, "whitespace-nowrap")}>
              {cta.label}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
