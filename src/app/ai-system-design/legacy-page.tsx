"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { SystemDesignLandingHero } from "@/components/marketing/system-design/SystemDesignLandingHero";
import { SystemDesignLandingSections } from "@/components/marketing/system-design/SystemDesignLandingSections";

export default function AiSystemDesignPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />
      <SystemDesignLandingHero />
      <SystemDesignLandingSections />
      <MarketingFooter as="footer" />
    </div>
  );
}
