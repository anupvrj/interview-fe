"use client";

import React, { Suspense, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { ATSUploadHero } from "@/components/ats-checker/ATSUploadHero";
import {
  ATSChecksGrid,
  ATSHowItWorks,
  ATSSeeItInAction,
  ATSLandingCTA,
  ATSFAQ,
} from "@/components/ats-checker/landing/ATSLandingSections";
import { ATSReadySection } from "@/components/ats-checker/landing/ATSReadySection";
import { ATSHeroAnimation } from "@/components/ats-checker/landing/ATSHeroAnimation";
import { ATSHeroContent } from "@/components/ats-checker/landing/ATSHeroContent";
import { savePendingATSUpload } from "@/lib/atsCheckFlow";

export default function ATSCheckerPage() {
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
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      <section className="relative min-h-[640px] overflow-hidden px-4 pb-16 pt-28 sm:min-h-[720px] sm:px-6 sm:pb-20 sm:pt-36">
        <div className="absolute inset-0 bg-muted" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(115,103,240,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_10%_80%,rgba(115,103,240,0.08),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(115,103,240,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(115,103,240,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
            <ATSHeroContent>
              <ATSUploadHero
                onStart={handleStartAnalysis}
                uploading={uploading}
                error={uploadError}
                showSignInHint={!user}
              />
            </ATSHeroContent>

            <div className="order-last lg:order-none lg:pl-4">
              <ATSHeroAnimation />
            </div>
          </div>
        </div>
      </section>

      <ATSReadySection />
      <ATSChecksGrid />
      <ATSHowItWorks />
      <ATSSeeItInAction />
      <ATSLandingCTA />
      <ATSFAQ />

      <MarketingFooter />
    </div>
  );
}
