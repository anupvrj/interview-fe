"use client";

import { useAdoptHackathonDarkTheme } from "@/components/dashboard-theme";
import "./hackathon.css";
import "./hackathon-reel.css";
import { HackathonAgenda } from "@/components/hackathon-2026/HackathonAgenda";
import { HackathonFaq } from "@/components/hackathon-2026/HackathonFaq";
import { HackathonFinalCta } from "@/components/hackathon-2026/HackathonFinalCta";
import { HackathonFooter } from "@/components/hackathon-2026/HackathonFooter";
import { HackathonLandingAnalytics } from "@/components/hackathon-2026/HackathonLandingAnalytics";
import { HackathonHeader } from "@/components/hackathon-2026/HackathonHeader";
import { HackathonHero } from "@/components/hackathon-2026/HackathonHero";
import { HackathonParticipate } from "@/components/hackathon-2026/HackathonParticipate";
import { HackathonPrizes } from "@/components/hackathon-2026/HackathonPrizes";
import { HackathonTimeline } from "@/components/hackathon-2026/HackathonTimeline";
import { HackathonWho } from "@/components/hackathon-2026/HackathonWho";
import { HackathonLaunchEventProvider } from "@/components/hackathon-2026/HackathonLaunchEventContext";
import { HackathonLaunchTeaser } from "@/components/hackathon-2026/HackathonLaunchTeaser";
import { HackathonRegisterProvider } from "@/components/hackathon-2026/HackathonRegisterContext";
import { HackathonFeatureGate } from "@/features/hackathon/components/HackathonFeatureGate";
import { HACKATHON_SLUG } from "@/features/hackathon/config";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";

export function HackathonPage() {
  useAdoptHackathonDarkTheme();
  return (
    <HackathonSlugProvider slug={HACKATHON_SLUG}>
      <HackathonFeatureGate showWhileLoading>
        <HackathonLaunchEventProvider>
          <HackathonRegisterProvider>
          {/* Static on purpose: most visitors arrive from an Instagram ad, whose in-app browser
              flickers on animation, blur and scroll effects — so none here (see .hk-static). */}
          <div className="hk-root hk-static min-h-screen antialiased">
            <HackathonLandingAnalytics />
            <HackathonHeader />
            <main className="relative z-[1]">
              <HackathonHero />
              <HackathonPrizes />
              <HackathonParticipate />
              <HackathonTimeline />
              <HackathonAgenda />
              <HackathonLaunchTeaser />
              <HackathonWho />
              <HackathonFaq />
              <HackathonFinalCta />
            </main>
            <HackathonFooter />
          </div>
          </HackathonRegisterProvider>
        </HackathonLaunchEventProvider>
      </HackathonFeatureGate>
    </HackathonSlugProvider>
  );
}
