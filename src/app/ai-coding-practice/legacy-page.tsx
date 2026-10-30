"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { CodingPracticeLandingHero } from "@/components/marketing/coding-practice/CodingPracticeLandingHero";
import { CodingPracticeLandingSections } from "@/components/marketing/coding-practice/CodingPracticeLandingSections";

export default function AiCodingPracticePage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />
      <CodingPracticeLandingHero />
      <CodingPracticeLandingSections />
      <MarketingFooter as="footer" />
    </div>
  );
}
