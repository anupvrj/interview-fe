"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { AboutHero } from "@/components/marketing/about-us/AboutHero";
import { AboutMissionSection } from "@/components/marketing/about-us/AboutMissionSection";
import { AboutProblemSection } from "@/components/marketing/about-us/AboutProblemSection";
import { AboutDifferentiatorsSection } from "@/components/marketing/about-us/AboutDifferentiatorsSection";
import { AboutTimelineSection } from "@/components/marketing/about-us/AboutTimelineSection";
import { AboutCtaSection, AboutFaqSection } from "@/components/marketing/about-us/AboutCtaSection";

export default function AboutPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-background selection:bg-info-muted">
      <SiteHeader />

      <main className="pt-16 sm:pt-[4.25rem]">
        <AboutHero />
        <AboutMissionSection />
        <AboutProblemSection />
        <AboutDifferentiatorsSection />
        <AboutTimelineSection />
        <AboutFaqSection />
        <AboutCtaSection />
      </main>

      <MarketingFooter />
    </div>
  );
}
