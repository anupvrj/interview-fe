"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { atsGuestApi, isATSReportV3, resumeApi, userApi } from "@/lib/api";
import { applyPersistedJobMatchScore } from "@/lib/atsReportNormalize";
import { insightsFromAtsReport } from "@/lib/ats-insights";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialUpsellDialog } from "@/components/upsell/TrialUpsellDialog";
import { UpgradeUpsellDialog } from "@/components/upsell/UpgradeUpsellDialog";
import { useUpsellState } from "@/components/upsell/useUpsellState";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import {
  ATS_RESUME_TEMPLATE_ID,
  applyGuestATSTemplate,
  attachPendingPDF,
  clearPendingATSUpload,
  forgetGuestATSCheck,
  loadGuestATSToken,
  loadPendingATSUpload,
  rerunATSAnalysis,
  runATSAnalysis,
} from "@/lib/atsCheckFlow";
import { ATSReportWorkspace } from "@/components/ats-checker/ATSReportWorkspace";
import { ATSProcessingView, ATS_IMPROVE_STEPS } from "@/components/ats-checker/ATSProcessingView";
import { ATSDashboardUploadView } from "@/components/ats-checker/ATSDashboardUploadView";
import { ATSImproveTemplatePicker } from "@/components/ats-checker/ATSImproveTemplatePicker";
import { renderPdfPages, snapshotPdfFirstPage, type PdfPage, type PdfSnapshot } from "@/lib/pdf-snapshot";
import type { ScanFacts } from "@/lib/atsScanFacts";
import type { ATSCheckResult, ATSIssue, ATSReportV3 } from "@/types/atsReport";
import { isAxiosError } from "axios";
import { forgetGuestCheck } from "@/lib/atsGuestState";

/** A claim that failed for a reason other than "expired" (network, deploy) is tried again. */
const CLAIM_ATTEMPTS = 3;

type Step = "opening" | "upload" | "processing" | "results" | "improving" | "template";

export default function DashboardATSCheckerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <DashboardATSCheckerContent />
    </Suspense>
  );
}

function DashboardATSCheckerContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryResumeId = searchParams.get("resumeId");

  const [step, setStep] = useState<Step>(() => (loadGuestATSToken() ? "opening" : "upload"));
  const [uploading, setUploading] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [report, setReport] = useState<ATSReportV3 | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [resumeTitle, setResumeTitle] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  /** The claim keeps failing (not expired): their check is still safe, they can try again. */
  const [claimFailed, setClaimFailed] = useState(false);
  const [claimSlow, setClaimSlow] = useState(false);
  const booted = useRef(false);
  const [improving, setImproving] = useState(false);
  const [improveStep, setImproveStep] = useState(0);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>();
  const [snapshot, setSnapshot] = useState<PdfSnapshot | null>(null);
  const [facts, setFacts] = useState<ScanFacts | null>(null);
  /** The PDF they just uploaded, as they designed it; a reloaded report shows our rebuild. */
  const [originalPdf, setOriginalPdf] = useState<PdfPage[] | null>(null);
  const [templateSource, setTemplateSource] = useState<"improve" | "report">("improve");
  const [trialUpsellOpen, setTrialUpsellOpen] = useState(false);
  const [upgradeUpsellOpen, setUpgradeUpsellOpen] = useState(false);
  const { canUse } = useEntitlements();
  const { needsTrial, getUpgradeTarget, data: entitlements } = useUpsellState();
  const globalOptimizerEnabled = canUse("oneClickResumeOptimizer");
  const upgradeTarget = getUpgradeTarget("oneClickResumeOptimizer");

  const loadExistingReport = useCallback(async (id: string) => {
    try {
      const resume = await resumeApi.get(id);
      if (resume.atsFeedback && isATSReportV3(resume.atsFeedback)) {
        setReport(
          applyPersistedJobMatchScore(
            resume.atsFeedback,
            resume.jobMatchScore,
          ),
        );
        setResumeId(id);
        setResumeTitle(resume.title);
        setCurrentTemplateId(resume.templateId);
        setJobDescription(resume.atsScoringContext?.lastJobDescription || "");
        setStep("results");
      } else {
        setStep("upload");
      }
    } catch {
      setStep("upload");
    }
  }, []);

  const executeAnalysis = useCallback(
    async (file: File, jd: string) => {
      if (!user) return;

      setError(null);
      setUploading(true);
      setStep("processing");
      setProcessingStep(0);
      setFileName(file.name);
      setJobDescription(jd);
      setSnapshot(null);
      setFacts(null);
      setOriginalPdf(null);
      void snapshotPdfFirstPage(file).then(setSnapshot);
      void renderPdfPages(file).then(setOriginalPdf);

      try {
        const result = await runATSAnalysis(
          user.id,
          file,
          jd,
          setProcessingStep,
          setFacts,
        );
        void clearPendingATSUpload();
        setReport(result.report);
        setResumeId(result.resumeId);
        setResumeTitle(file.name.replace(/\.pdf$/i, ""));
        setCurrentTemplateId(ATS_RESUME_TEMPLATE_ID);
        setStep("results");
        router.replace(`/dashboard/ats-checker?resumeId=${result.resumeId}`, {
          scroll: false,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to process resume.";
        void clearPendingATSUpload();
        setError(message);
        setStep("upload");
        setResumeId(null);
      } finally {
        setUploading(false);
      }
    },
    [user, router],
  );

  const claimGuestCheck = useCallback(
    async (token: string) => {
      // Already checked: nothing is being analysed, so no scan screen, just the way to the editor.
      setStep("opening");
      setClaimFailed(false);
      setClaimSlow(false);
      // Putting in the AI rewrite and scoring it takes a while; say so instead of spinning.
      const slow = window.setTimeout(() => setClaimSlow(true), 3000);
      try {
        for (let attempt = 1; ; attempt++) {
          try {
            const { resumeId: claimedId } = await atsGuestApi.claim(token);
            void userApi.sendWelcomeSignup("candidate").catch(() => {});
            await attachPendingPDF(claimedId);
            await applyGuestATSTemplate(claimedId);
            await forgetGuestATSCheck();
            router.replace(`/dashboard/resumes/${claimedId}/edit?view=ats`);
            return;
          } catch (err) {
            const expired = isAxiosError(err) && err.response?.status === 404;
            if (expired) break;
            if (attempt >= CLAIM_ATTEMPTS) {
              // Keep the token and the PDF: "Try again" (or a refresh) picks up from here.
              setClaimFailed(true);
              return;
            }
            await new Promise((r) => setTimeout(r, 1500 * attempt));
          }
        }
        // Expired: the PDF, when we still have it, is simply checked again. No re-upload.
        const pending = await loadPendingATSUpload();
        // The expired check is gone; its PDF stays until the new check is done.
        forgetGuestCheck();
        if (pending) {
          void executeAnalysis(pending.file, pending.jobDescription);
        } else {
          setError("Your earlier check has expired. Please upload your resume again.");
          setStep("upload");
        }
      } finally {
        window.clearTimeout(slow);
      }
    },
    [router, executeAnalysis],
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace(
        `/sign-in?redirect_url=${encodeURIComponent("/dashboard/ats-checker")}`,
      );
      return;
    }

    if (queryResumeId) {
      loadExistingReport(queryResumeId);
      return;
    }

    // Once per visit: a second run (strict mode, a re-render) would claim or analyse twice.
    if (booted.current) return;
    booted.current = true;

    // Signed up for the report of a check they just ran: it's ready, no second wait.
    const guestToken = loadGuestATSToken();
    if (guestToken) {
      void claimGuestCheck(guestToken);
      return;
    }

    // A PDF handed over from the public page, or one whose scan a refresh interrupted.
    void loadPendingATSUpload().then((pending) => {
      if (pending) void executeAnalysis(pending.file, pending.jobDescription);
    });
  }, [
    isLoaded,
    user,
    router,
    queryResumeId,
    loadExistingReport,
    executeAnalysis,
    claimGuestCheck,
  ]);

  const handleStartAnalysis = async (file: File, jd: string) => {
    await executeAnalysis(file, jd);
  };

  const handleRerun = async () => {
    if (!resumeId || rerunning) return;
    setRerunning(true);
    setError(null);
    setStep("processing");
    setProcessingStep(0);

    const stepTimer = window.setInterval(() => {
      setProcessingStep((s) => Math.min(s + 1, 3));
    }, 900);

    try {
      const updated = await rerunATSAnalysis(resumeId, jobDescription);
      setReport(updated);
      setProcessingStep(3);
      setStep("results");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to re-run ATS check.";
      setError(message);
      setStep("results");
    } finally {
      window.clearInterval(stepTimer);
      setRerunning(false);
    }
  };

  const handleImproveScore = async () => {
    if (!resumeId || improving) return;

    if (!globalOptimizerEnabled) {
      if (needsTrial) {
        setTrialUpsellOpen(true);
      } else {
        setUpgradeUpsellOpen(true);
      }
      return;
    }

    setImproving(true);
    setTemplateSource("improve");
    setError(null);
    setStep("improving");
    setImproveStep(0);

    const stepTimer = window.setInterval(() => {
      setImproveStep((s) => Math.min(s + 1, ATS_IMPROVE_STEPS.length - 1));
    }, 3500);

    try {
      const jdForOptimize =
        jobDescription.trim().length > 50 ? jobDescription.trim() : undefined;
      const updated = await resumeApi.improveFromATS(resumeId, {
        jobDescription: jdForOptimize,
        matchInsights: report ? insightsFromAtsReport(report) : undefined,
      });
      setCurrentTemplateId(updated.templateId);
      // The words changed, so their original PDF no longer matches the findings.
      setOriginalPdf(null);
      if (updated.atsFeedback && isATSReportV3(updated.atsFeedback)) {
        setReport(
          applyPersistedJobMatchScore(
            updated.atsFeedback,
            updated.jobMatchScore,
          ),
        );
      }
      setImproveStep(ATS_IMPROVE_STEPS.length - 1);
      setStep("template");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to improve resume.";
      setError(message);
      setStep("results");
    } finally {
      window.clearInterval(stepTimer);
      setImproving(false);
    }
  };

  const handleIgnoreIssue = async (check: ATSCheckResult, issue: ATSIssue) => {
    if (!resumeId) return;
    const updated = await resumeApi.ignoreATSIssue(resumeId, { checkId: check.id, issue });
    if (updated.atsFeedback && isATSReportV3(updated.atsFeedback)) {
      setReport(applyPersistedJobMatchScore(updated.atsFeedback, updated.jobMatchScore));
    }
  };

  const handleRestoreSetAside = async () => {
    if (!resumeId) return;
    const updated = await resumeApi.restoreIgnoredATSIssues(resumeId);
    if (updated.atsFeedback && isATSReportV3(updated.atsFeedback)) {
      setReport(applyPersistedJobMatchScore(updated.atsFeedback, updated.jobMatchScore));
    }
  };

  const handleChooseTemplate = async () => {
    if (!resumeId) return;
    try {
      const resume = await resumeApi.get(resumeId);
      setCurrentTemplateId(resume.templateId);
    } catch {
      /* the picker still works without a current template */
    }
    setTemplateSource("report");
    setStep("template");
  };

  const handleTemplateComplete = (templateId?: string) => {
    if (!resumeId) return;
    router.push(
      `/dashboard/resumes/${resumeId}/edit?view=ats${templateSource === "improve" ? "&improved=1" : ""}${
        templateId ? `&template=${encodeURIComponent(templateId)}` : ""
      }`,
    );
  };

  const handleRunJobMatch = async (jd: string) => {
    if (!resumeId || rerunning) return;

    setRerunning(true);
    setError(null);
    setJobDescription(jd);
    setStep("processing");
    setProcessingStep(0);

    const stepTimer = window.setInterval(() => {
      setProcessingStep((s) => Math.min(s + 1, 3));
    }, 900);

    try {
      const updated = await rerunATSAnalysis(resumeId, jd);
      setReport(updated);
      setProcessingStep(3);
      setStep("results");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to run Job Match analysis.";
      setError(message);
      setStep("results");
      throw err instanceof Error ? err : new Error(message);
    } finally {
      window.clearInterval(stepTimer);
      setRerunning(false);
    }
  };

  const handleCheckAnother = () => {
    setOriginalPdf(null);
    setStep("upload");
    setReport(null);
    setResumeId(null);
    setJobDescription("");
    setFileName(undefined);
    setError(null);
    router.replace("/dashboard/ats-checker", { scroll: false });
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      {step === "upload" && (
        <ATSDashboardUploadView
          onStart={handleStartAnalysis}
          uploading={uploading}
          error={error}
        />
      )}

      {step === "opening" && !claimFailed && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-[15px] font-semibold text-foreground">Opening your resume…</p>
          {claimSlow && (
            <p className="max-w-sm text-[14px] text-muted-foreground">
              Putting the improvements into your resume. Almost there.
            </p>
          )}
        </div>
      )}

      {step === "opening" && claimFailed && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-[17px] font-semibold text-foreground">We couldn&apos;t open your report just now</p>
          <p className="max-w-sm text-[14px] text-muted-foreground">
            Your check is saved. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              const token = loadGuestATSToken();
              if (token) void claimGuestCheck(token);
              else setStep("upload");
            }}
            className="h-11 rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      )}

      {step === "processing" && (
        <ATSProcessingView currentStep={processingStep} fileName={fileName} snapshot={snapshot} facts={facts} />
      )}

      {step === "improving" && (
        <ATSProcessingView
          currentStep={improveStep}
          steps={ATS_IMPROVE_STEPS}
          headerLabel="Improving your resume"
        />
      )}

      {step === "template" && resumeId && (
        <ATSImproveTemplatePicker
          resumeId={resumeId}
          currentTemplateId={currentTemplateId}
          source={templateSource}
          onComplete={handleTemplateComplete}
        />
      )}

      {step === "results" && report && resumeId && (
        <ATSReportWorkspace
          report={report}
          resumeId={resumeId}
          resumeTitle={resumeTitle}
          templateName={TEMPLATES_CATALOG.find((t) => t.id === currentTemplateId)?.name}
          error={error}
          improveUnlocked={globalOptimizerEnabled}
          improving={improving}
          rerunning={rerunning}
          onImprove={() => void handleImproveScore()}
          onChooseTemplate={() => void handleChooseTemplate()}
          onIgnoreIssue={handleIgnoreIssue}
          onRestoreSetAside={handleRestoreSetAside}
          originalPdf={originalPdf}
          onRerun={() => void handleRerun()}
          onCheckAnother={handleCheckAnother}
          onRunJobMatch={handleRunJobMatch}
          initialJobDescription={jobDescription}
        />
      )}

      <TrialUpsellDialog
        open={trialUpsellOpen}
        onOpenChange={setTrialUpsellOpen}
        variant="feature_locked"
        hasPurchasedTrial={
          entitlements ? !entitlements.canPurchaseTrial : false
        }
      />
      <UpgradeUpsellDialog
        open={upgradeUpsellOpen}
        onOpenChange={setUpgradeUpsellOpen}
        title="One-click optimizer"
        description="Apply AI fixes to your entire resume in one click. Included in trial and paid plans."
        targetPlan={upgradeTarget?.plan ?? "general_pass"}
      />
    </div>
  );
}
