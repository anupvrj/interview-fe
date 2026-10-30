"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RecruiterApplyDialog } from "@/components/recruiter/RecruiterApplyDialog";
import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { Footer } from "@/components/marketing-2026/closing";
import {
  TalentFilm, TalentFinal, TalentHero, TalentHow, TalentLogos, TalentOutcomes, TalentStats, TalentStickyCta, TalentWhy,
} from "@/components/marketing-2026/ix-talent";
import LegacyHireIxTalentPage from "./legacy-page";

function HireIxTalentPageContent() {
  const searchParams = useSearchParams();
  const [applyOpen, setApplyOpen] = useState(false);
  const openApply = useCallback(() => setApplyOpen(true), []);

  // ?apply=1 opens the recruiter application straight away, as before
  useEffect(() => {
    if (searchParams.get("apply") === "1") setApplyOpen(true);
  }, [searchParams]);

  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <TalentHero onBecome={openApply} />
        <TalentLogos />
        <TalentStats />
        <TalentWhy />
        <TalentFilm />
        <TalentHow />
        <TalentOutcomes />
        <TalentFinal onBecome={openApply} />
      </main>
      <Footer />
      <TalentStickyCta onBecome={openApply} />
      <RecruiterApplyDialog open={applyOpen} onOpenChange={setApplyOpen} />
    </Marketing2026Shell>
  );
}

export default function HireIxTalentPage() {
  if (!isMarketing2026Enabled()) return <LegacyHireIxTalentPage />;
  return (
    <Suspense fallback={null}>
      <HireIxTalentPageContent />
    </Suspense>
  );
}
