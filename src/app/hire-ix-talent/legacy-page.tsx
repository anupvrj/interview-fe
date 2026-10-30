"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RecruiterApplyDialog } from "@/components/recruiter/RecruiterApplyDialog";
import { RecruiterLandingHero } from "@/components/marketing/recruiter/RecruiterLandingHero";
import { RecruiterLandingSections } from "@/components/marketing/recruiter/RecruiterLandingSections";

function HireIxTalentPageContent() {
  const searchParams = useSearchParams();
  const [applyOpen, setApplyOpen] = useState(false);

  const openApply = useCallback(() => {
    setApplyOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("apply") === "1") {
      setApplyOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />
      <RecruiterLandingHero onBecomeRecruiter={openApply} />
      <RecruiterLandingSections onBecomeRecruiter={openApply} />
      <MarketingFooter as="footer" />
      <RecruiterApplyDialog open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  );
}

export default function HireIxTalentPage() {
  return (
    <Suspense fallback={null}>
      <HireIxTalentPageContent />
    </Suspense>
  );
}
