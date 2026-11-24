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
  loadPendingATSUpload,
  rememberGuestATSCheck,
  runGuestATSCheck,
  savePendingATSUpload,
  type GuestATSCheck,
} from "@/lib/atsCheckFlow";
import { snapshotPdfFirstPage, type PdfSnapshot } from "@/lib/pdf-snapshot";
import type { ScanFacts } from "@/lib/atsScanFacts";
import { clearScanMark, interruptedScan, markScanStarted } from "@/lib/atsGuestState";
import { scoreBucket, track } from "@/lib/analytics/productEvents";
import { isAxiosError } from "axios";

/** Worth trying again: no answer at all (offline, frozen tab) or a server error, not a 4xx. */
function isRetryable(err: unknown): boolean {
  if (!isAxiosError(err)) return false;
  const status = err.response?.status;
  return status === undefined || status >= 500;
}

/** Resolves once the page is in front and the phone is online (or after two minutes). */
function backOnline(): Promise<void> {
  return new Promise((resolve) => {
    const ready = () => document.visibilityState === "visible" && navigator.onLine;
    if (ready()) return void setTimeout(resolve, 1500);
    const check = () => {
      if (!ready()) return;
      cleanup();
      resolve();
    };
    const cleanup = () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
      clearTimeout(timer);
    };
    const timer = setTimeout(() => { cleanup(); resolve(); }, 120_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
  });
}
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
  useEffect(() => setRestoring(hasUnclaimedGuestATSCheck() || interruptedScan() !== null), []);
  /** A scan that couldn't finish (offline, server error): one tap retries with the kept PDF. */
  const [failedScan, setFailedScan] = useState<string | null>(null);
  useEffect(() => {
    if (isLoaded) track("ats_checker_opened", { surface: "public", signed_in: Boolean(user) });
  }, [isLoaded, user]);

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
      } else if (interruptedScan()) {
        // The phone froze or reloaded the tab mid-scan: carry on with the kept PDF. The
        // server joins the run still going, or has the result ready.
        void loadPendingATSUpload().then((pending) => {
          if (pending) void runGuestScan(pending.file, pending.jobDescription, { keepPending: true });
          else clearScanMark();
        });
      }
    }
    setRestoring(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once sign-in state is known
  }, [isLoaded, user, router]);

  const runGuestScan = async (file: File, jd: string, { keepPending = false } = {}) => {
    setUploadError(null);
    setFailedScan(null);
    setUploading(true);
    setGuestFile(file.name);
    setGuestSnapshot(null);
    setGuestFacts(null);
    setGuestStep(0);
    window.scrollTo({ top: 0 });
    void snapshotPdfFirstPage(file).then(setGuestSnapshot);
    if (!keepPending) {
      // A new check replaces any earlier one, so sign-up can't claim the wrong resume.
      await forgetGuestATSCheck();
      // Too big for this browser's storage only means the original PDF isn't kept.
      await savePendingATSUpload(file, jd).catch(() => {});
    }
    markScanStarted(file.name);
    const startedAt = Date.now();
    if (!keepPending) track("ats_resume_uploaded", { signed_in: false, size_kb: Math.round(file.size / 1024), has_jd: Boolean(jd.trim()) });
    const attempt = () => runGuestATSCheck(file, jd, setGuestStep, setGuestFacts);
    try {
      let check: GuestATSCheck;
      try {
        check = await attempt();
      } catch (err) {
        // Dropped connection or a frozen tab: try once more when they're back and online.
        if (!isRetryable(err)) throw err;
        await backOnline();
        check = await attempt();
      }
      rememberGuestATSCheck(check, file.name);
      setGuestResult(check);
      track("ats_analysis_completed", {
        signed_in: false,
        score_bucket: scoreBucket(check.teaser.score),
        duration_ms: Date.now() - startedAt,
        reused: Boolean(check.reused),
      });
    } catch (err) {
      setUploadError(getApiErrorMessage(err, "We couldn't check this resume. Please try again."));
      const status = isAxiosError(err) ? err.response?.status : undefined;
      track("ats_analysis_failed", {
        signed_in: false,
        reason: status === undefined ? (isAxiosError(err) ? "network" : "unknown") : status >= 500 ? "server" : "rejected",
      });
      if (isRetryable(err)) setFailedScan(file.name);
    } finally {
      clearScanMark();
      setGuestStep(null);
      setUploading(false);
    }
  };

  const retryFailedScan = async () => {
    const pending = await loadPendingATSUpload();
    if (pending) void runGuestScan(pending.file, pending.jobDescription, { keepPending: true });
    else setFailedScan(null);
  };

  const handleStartAnalysis = async (file: File, jd: string) => {
    const redirectPath = "/dashboard/ats-checker";

    setUploadError(null);
    setUploading(true);

    if (!user) {
      await runGuestScan(file, jd);
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
              track("ats_upload_new_clicked", { signed_in: false });
              void forgetGuestATSCheck();
              setGuestResult(null);
              setGuestFile(null);
              setGuestSnapshot(null);
            }}
          />
        </main>
      )}
      {!guestBusy && !guestResult && failedScan && (
        <div className="mx-auto mt-24 max-w-xl px-4 sm:px-6">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-3">
            <p className="min-w-0 text-[14px] text-foreground">
              We couldn&apos;t finish checking <span className="font-semibold">{failedScan}</span>. Your file is still here.
            </p>
            <button type="button" onClick={() => void retryFailedScan()} className="h-10 shrink-0 rounded-xl bg-primary px-4 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90">
              Try again
            </button>
          </div>
        </div>
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
