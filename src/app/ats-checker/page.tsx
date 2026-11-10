"use client";

import React, { Suspense, useEffect, useState } from "react";
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
import {
  forgetGuestATSCheck,
  hasUnclaimedGuestATSCheck,
  loadGuestATSCheck,
  rememberGuestATSCheck,
  runGuestATSCheck,
  savePendingATSUpload,
  type GuestATSCheck,
} from "@/lib/atsCheckFlow";
import { snapshotPdfFirstPage, type PdfSnapshot } from "@/lib/pdf-snapshot";
import type { ScanFacts } from "@/lib/atsScanFacts";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { ATSProcessingView } from "@/components/ats-checker/ATSProcessingView";
import { ATSGuestResult } from "@/components/ats-checker/ATSGuestResult";

export default function ATSCheckerPage() {
  if (!isMarketing2026Enabled()) return <LegacyATSCheckerPage />;
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ATSCheckerPageContent />
    </Suspense>
  );
}

function ATSCheckerPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [guestStep, setGuestStep] = useState<number | null>(null);
  const [guestFile, setGuestFile] = useState<string | null>(null);
  const [guestSnapshot, setGuestSnapshot] = useState<PdfSnapshot | null>(null);
  const [guestFacts, setGuestFacts] = useState<ScanFacts | null>(null);
  const [guestResult, setGuestResult] = useState<GuestATSCheck | null>(null);

  // Their check survives a refresh, the back button, or a trip to sign-up and back. Signed in
  // with one still waiting (they signed in from the nav): straight to it in their account.
  // Until sign-in state loads, a waiting check shows a loader, not a flash of the landing page.
  const [restoring, setRestoring] = useState(false);
  useEffect(() => setRestoring(hasUnclaimedGuestATSCheck()), []);
  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      if (hasUnclaimedGuestATSCheck()) {
        router.replace("/dashboard/ats-checker");
        return;
      }
    } else {
      const stored = loadGuestATSCheck();
      if (stored) {
        setGuestResult(stored.check);
        setGuestFile(stored.fileName ?? null);
      }
    }
    setRestoring(false);
  }, [isLoaded, user, router]);

  const handleStartAnalysis = async (file: File, jd: string) => {
    const redirectPath = "/dashboard/ats-checker";

    setUploadError(null);
    setUploading(true);

    if (!user) {
      // Too big for this browser's storage only means the original PDF isn't kept.
      setGuestFile(file.name);
      setGuestSnapshot(null);
      setGuestFacts(null);
      setGuestStep(0);
      window.scrollTo({ top: 0 });
      void snapshotPdfFirstPage(file).then(setGuestSnapshot);
      // A new check replaces any earlier one, so sign-up can't claim the wrong resume.
      await forgetGuestATSCheck();
      await savePendingATSUpload(file, jd).catch(() => {});
      try {
        const check = await runGuestATSCheck(file, jd, setGuestStep, setGuestFacts);
        rememberGuestATSCheck(check, file.name);
        setGuestResult(check);
      } catch (err) {
        setUploadError(getApiErrorMessage(err, "We couldn't check this resume. Please try again."));
      } finally {
        setGuestStep(null);
        setUploading(false);
      }
      return;
    }

    try {
      await savePendingATSUpload(file, jd);
    } catch {
      setUploadError("Failed to prepare your resume. Please try again.");
      setUploading(false);
      return;
    }

    router.push(redirectPath);
  };

  const guestBusy = guestStep !== null || restoring;

  return (
    <Marketing2026Shell>
      <Nav />
      {restoring && guestStep === null && (
        <main className="flex min-h-[70vh] items-center justify-center px-4 pt-28">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading your report" />
        </main>
      )}
      {guestStep !== null && (
        <main className="px-4 pb-20 pt-28 sm:px-6">
          <ATSProcessingView currentStep={guestStep ?? 0} fileName={guestFile ?? undefined} snapshot={guestSnapshot} facts={guestFacts} />
        </main>
      )}
      {!guestBusy && guestResult && (
        <main className="px-4 pb-20 pt-28 sm:px-6">
          <ATSGuestResult
            teaser={guestResult.teaser}
            report={guestResult.report}
            content={guestResult.content}
            sectionOrder={guestResult.sectionOrder}
            token={guestResult.token}
            improved={guestResult.improved}
            fileName={guestFile ?? undefined}
            onCheckAnother={() => {
              void forgetGuestATSCheck();
              setGuestResult(null);
              setGuestFile(null);
              setGuestSnapshot(null);
            }}
          />
        </main>
      )}
      {!guestBusy && !guestResult && <main>
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
      </main>}
      <Footer />
      {!guestBusy && !guestResult && <AtsStickyCta />}
    </Marketing2026Shell>
  );
}
