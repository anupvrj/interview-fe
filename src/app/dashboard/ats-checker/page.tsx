"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isATSReportV3, resumeApi } from "@/lib/api";
import {
  clearPendingATSUpload,
  loadPendingATSUpload,
  pendingUploadToFile,
  rerunATSAnalysis,
  runATSAnalysis,
} from "@/lib/atsCheckFlow";
import { ATSReportDashboard } from "@/components/ats-checker/ATSReportDashboard";
import { ATSProcessingView, ATS_IMPROVE_STEPS } from "@/components/ats-checker/ATSProcessingView";
import { ATSDashboardUploadView } from "@/components/ats-checker/ATSDashboardUploadView";
import { ATSImproveTemplatePicker } from "@/components/ats-checker/ATSImproveTemplatePicker";
import { cn } from "@/lib/utils";
import type { ATSReportV3 } from "@/types/atsReport";

type Step = "upload" | "processing" | "results" | "improving" | "template";

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

  const [step, setStep] = useState<Step>("upload");
  const [uploading, setUploading] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [report, setReport] = useState<ATSReportV3 | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [improveStep, setImproveStep] = useState(0);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>();

  const loadExistingReport = useCallback(async (id: string) => {
    try {
      const resume = await resumeApi.get(id);
      if (resume.atsFeedback && isATSReportV3(resume.atsFeedback)) {
        setReport(resume.atsFeedback);
        setResumeId(id);
        setJobDescription(resume.atsScoringContext?.lastJobDescription || "");
        setStep("results");
      }
    } catch {
      /* show upload */
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

      try {
        const result = await runATSAnalysis(
          user.id,
          file,
          jd,
          setProcessingStep,
        );
        setReport(result.report);
        setResumeId(result.resumeId);
        setStep("results");
        router.replace(`/dashboard/ats-checker?resumeId=${result.resumeId}`, {
          scroll: false,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to process resume.";
        setError(message);
        setStep("upload");
        setResumeId(null);
      } finally {
        setUploading(false);
      }
    },
    [user, router],
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

    const pending = loadPendingATSUpload();
    if (pending) {
      clearPendingATSUpload();
      const file = pendingUploadToFile(pending);
      void executeAnalysis(file, pending.jobDescription);
    }
  }, [
    isLoaded,
    user,
    router,
    queryResumeId,
    loadExistingReport,
    executeAnalysis,
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

    setImproving(true);
    setError(null);
    setStep("improving");
    setImproveStep(0);

    const stepTimer = window.setInterval(() => {
      setImproveStep((s) => Math.min(s + 1, ATS_IMPROVE_STEPS.length - 1));
    }, 3500);

    try {
      const updated = await resumeApi.improveFromATS(resumeId, {
        jobDescription: jobDescription.trim().length > 50 ? jobDescription : undefined,
      });
      setCurrentTemplateId(updated.templateId);
      if (updated.atsFeedback && isATSReportV3(updated.atsFeedback)) {
        setReport(updated.atsFeedback);
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

  const handleTemplateComplete = (templateId?: string) => {
    if (!resumeId) return;
    router.push(
      `/dashboard/resumes/${resumeId}/edit?view=ats&improved=1${
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      {step === "upload" && (
        <ATSDashboardUploadView
          onStart={handleStartAnalysis}
          uploading={uploading}
          error={error}
        />
      )}

      {step === "processing" && (
        <ATSProcessingView
          currentStep={processingStep}
          fileName={fileName}
          hasJobDescription={jobDescription.trim().length > 50}
        />
      )}

      {step === "improving" && (
        <ATSProcessingView
          currentStep={improveStep}
          hasJobDescription={jobDescription.trim().length > 50}
          steps={ATS_IMPROVE_STEPS}
          headerLabel="Improving your resume"
        />
      )}

      {step === "template" && resumeId && (
        <ATSImproveTemplatePicker
          resumeId={resumeId}
          currentTemplateId={currentTemplateId}
          onComplete={handleTemplateComplete}
        />
      )}

      {step === "results" && report && (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Your ATS Report
              </h1>
              <p className="mt-1 text-muted-foreground">
                {report.issueCount} issues found across{" "}
                {Object.keys(report.categories).length} categories
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                size="lg"
                onClick={() => void handleImproveScore()}
                disabled={improving || !resumeId}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Improve your resume
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleRerun}
                disabled={rerunning || !resumeId}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", rerunning && "animate-spin")}
                />
                Re-run ATS check
              </Button>
              <Button size="lg" variant="outline" onClick={handleCheckAnother}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Check another resume
              </Button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <ATSReportDashboard
            report={report}
            resumeId={resumeId}
            showImproveCta={false}
            onRunJobMatch={handleRunJobMatch}
            jobMatchRunning={rerunning}
            initialJobDescription={jobDescription}
          />
        </div>
      )}
    </div>
  );
}
