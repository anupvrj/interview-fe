"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { InterviewerApplyDialog } from "@/components/peer/InterviewerApplyDialog";
import { InterviewerLandingHero } from "@/components/marketing/interviewer/InterviewerLandingHero";
import { InterviewerLandingSections } from "@/components/marketing/interviewer/InterviewerLandingSections";

function BecomePeerInterviewerPageContent() {
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
      <InterviewerLandingHero onBecomeInterviewer={openApply} />
      <InterviewerLandingSections onBecomeInterviewer={openApply} />
      <MarketingFooter as="footer" />
      <InterviewerApplyDialog open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  );
}

export default function BecomePeerInterviewerPage() {
  return (
    <Suspense fallback={null}>
      <BecomePeerInterviewerPageContent />
    </Suspense>
  );
}
