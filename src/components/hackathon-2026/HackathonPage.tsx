"use client";

import "./hackathon.css";
import { HackathonAgenda } from "@/components/hackathon-2026/HackathonAgenda";
import { HackathonFaq } from "@/components/hackathon-2026/HackathonFaq";
import { HackathonFinalCta } from "@/components/hackathon-2026/HackathonFinalCta";
import { HackathonFooter } from "@/components/hackathon-2026/HackathonFooter";
import { HackathonHeader } from "@/components/hackathon-2026/HackathonHeader";
import { HackathonHero } from "@/components/hackathon-2026/HackathonHero";
import { HackathonParticipate } from "@/components/hackathon-2026/HackathonParticipate";
import { HackathonPrizes } from "@/components/hackathon-2026/HackathonPrizes";
import { HackathonRegisterProvider } from "@/components/hackathon-2026/HackathonRegisterContext";

export function HackathonPage() {
  return (
    <HackathonRegisterProvider>
      <div className="hk-root min-h-screen scroll-smooth antialiased">
        <div className="hk-aurora" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <HackathonHeader />
        <main className="relative z-[1]">
          <HackathonHero />
          <HackathonParticipate />
          <HackathonPrizes />
          <HackathonAgenda />
          <HackathonFaq />
          <HackathonFinalCta />
        </main>
        <HackathonFooter />
      </div>
    </HackathonRegisterProvider>
  );
}
