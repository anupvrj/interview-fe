"use client";

import React, { Suspense, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ATSUploadHero } from "@/components/ats-checker/ATSUploadHero";
import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { Faq, FinalCta, Footer } from "@/components/marketing-2026/closing";
import { MK26_ROUTES } from "@/components/marketing-2026/cta";
import { ATS_FAQ } from "@/components/marketing-2026/ats-checker-faq";
import { AtsAfter, AtsChecks, AtsDemo, AtsHero, AtsStepsSection, AtsStickyCta, AtsTicker } from "@/components/marketing-2026/ats-checker";
import LegacyATSCheckerPage from "./legacy-page";
import { savePendingATSUpload } from "@/lib/atsCheckFlow";

export default function ATSCheckerPage() {
  if (!isMarketing2026Enabled()) return <LegacyATSCheckerPage />;
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ATSCheckerPageContent />
    </Suspense>
  );
}

function ATSCheckerPageContent() {
  const { user } = useUser();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleStartAnalysis = async (file: File, jd: string) => {
    const redirectPath = "/dashboard/ats-checker";

    setUploadError(null);
    setUploading(true);

    try {
      await savePendingATSUpload(file, jd);
    } catch {
      setUploadError("Failed to prepare your resume. Please try again.");
      setUploading(false);
      return;
    }

    if (!user) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`,
      );
      return;
    }

    router.push(redirectPath);
  };

  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <AtsHero
          upload={
            <ATSUploadHero
              onStart={handleStartAnalysis}
              uploading={uploading}
              error={uploadError}
              showSignInHint={!user}
            />
          }
        />
        <AtsTicker />
        <AtsStepsSection />
        <AtsDemo />
        <AtsChecks />
        <AtsAfter />
        <Faq items={ATS_FAQ} title="ATS checker, answered." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Build my resume, free" secondary="Start my free mock interview" primaryHref={MK26_ROUTES.startResume} secondaryHref={MK26_ROUTES.startInterview} />
      </main>
      <Footer />
      <AtsStickyCta />
    </Marketing2026Shell>
  );
}
