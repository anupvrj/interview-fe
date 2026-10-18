"use client";

import { useEffect } from "react";
import "./hackathon.css";
import "./hackathon-reel.css";
import { HackathonAgenda } from "@/components/hackathon-2026/HackathonAgenda";
import { HackathonFaq } from "@/components/hackathon-2026/HackathonFaq";
import { HackathonFinalCta } from "@/components/hackathon-2026/HackathonFinalCta";
import { HackathonFooter } from "@/components/hackathon-2026/HackathonFooter";
import { HackathonLandingAnalytics } from "@/components/hackathon-2026/HackathonLandingAnalytics";
import { HackathonHeader } from "@/components/hackathon-2026/HackathonHeader";
import { HackathonHero } from "@/components/hackathon-2026/HackathonHero";
import { HackathonScrollRail } from "@/components/hackathon-2026/HackathonHud";
import { HackathonParticipate } from "@/components/hackathon-2026/HackathonParticipate";
import { HackathonPrizes } from "@/components/hackathon-2026/HackathonPrizes";
import { HackathonTimeline } from "@/components/hackathon-2026/HackathonTimeline";
import { HackathonWho } from "@/components/hackathon-2026/HackathonWho";
import { HackathonRegisterProvider } from "@/components/hackathon-2026/HackathonRegisterContext";
import { HackathonSocialProofToast } from "@/components/hackathon-2026/HackathonSocialProofToast";
import { HackathonFeatureGate } from "@/features/hackathon/components/HackathonFeatureGate";
import { HACKATHON_SLUG } from "@/features/hackathon/config";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";

function HackathonIntroComplete() {
  useEffect(() => {
    const root = document.querySelector(".hk-root");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.classList.add("hk-intro-complete");
      return;
    }
    // Longest hero stagger (~1000ms) + hk-enter duration (~900ms)
    const id = window.setTimeout(() => root.classList.add("hk-intro-complete"), 2200);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}

export function HackathonPage() {
  return (
    <HackathonSlugProvider slug={HACKATHON_SLUG}>
      <HackathonFeatureGate>
        <HackathonRegisterProvider>
          <div className="hk-root min-h-screen scroll-smooth antialiased">
            <HackathonIntroComplete />
            <HackathonLandingAnalytics />
            <div className="hk-aurora" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <HackathonScrollRail />
            <HackathonHeader />
            <main className="relative z-[1]">
              <HackathonHero />
              <HackathonPrizes />
              <HackathonParticipate />
              <HackathonTimeline />
              <HackathonAgenda />
              <HackathonWho />
              <HackathonFaq />
              <HackathonFinalCta />
            </main>
            <HackathonFooter />
            <HackathonSocialProofToast />
          </div>
        </HackathonRegisterProvider>
      </HackathonFeatureGate>
    </HackathonSlugProvider>
  );
}
