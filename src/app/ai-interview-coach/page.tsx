"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { InterviewCoachLandingHero } from "@/components/marketing/interview-coach/InterviewCoachLandingHero";
import { InterviewCoachLandingSections } from "@/components/marketing/interview-coach/InterviewCoachLandingSections";

export default function InterviewCoachPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />
      <InterviewCoachLandingHero />
      <InterviewCoachLandingSections />
      <MarketingFooter as="footer" />
    </div>
  );
}
