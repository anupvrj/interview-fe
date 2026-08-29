"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ResumeBuilderProcessingView } from "@/components/resume-builder/ResumeBuilderProcessingView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resumeApi, type Resume } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { appCard, appOutlineButton, appPrimaryButton } from "@/lib/app-theme";
import {
  FROM_JOB_TAILORING_MESSAGES,
  MIN_JOB_DESCRIPTION_CHARS,
  clearPendingJobCapture,
  loadPendingJobCapture,
  normalizeCapturedJob,
  savePendingJobCapture,
  tailoredResumeTitle,
  type PendingJobCapture,
} from "@/lib/extension-job-handoff";
import {
  getJobDescriptionOverflow,
  trimJobDescriptionForSend,
} from "@/lib/job-description-limits";
import { useResumesQuery } from "@/hooks/queries/useResumesQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { cn } from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { AddToChromeButton } from "@/components/chrome-extension/AddToChromeButton";

function ResumeSourcePicker({
  loading,
  resumes,
  selectedResumeId,
  onSelect,
}: Readonly<{
  loading: boolean;
  resumes: Resume[];
  selectedResumeId: string;
  onSelect: (resumeId: string) => void;
}>) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your resumes…
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          You don’t have a resume yet. Build one first — this job description
          will stay filled in.
        </p>
        <Button asChild className={appPrimaryButton}>
          <Link href="/dashboard/resumes/new">Build a resume first</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
      {resumes.map((resume) => {
        const selected = resume.resumeId === selectedResumeId;
        const label = resume.title || "Untitled resume";
        return (
          <label
            key={resume.resumeId}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
              selected
                ? "border-primary bg-primary/5"
                : "border-border/80 hover:border-primary/40",
            )}
          >
            <input
              type="radio"
              name="source-resume"
              className="mt-1"
              checked={selected}
              aria-label={label}
              onChange={() => onSelect(resume.resumeId)}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {resume.isDefault ? "Default · " : ""}
                Updated {new Date(resume.updatedAt).toLocaleDateString()}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function sortResumesForPicker(resumes: Resume[]): Resume[] {
  return [...resumes].sort((a, b) => {
    if (Boolean(a.isDefault) !== Boolean(b.isDefault)) {
      return a.isDefault ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function FromJobResumePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { data: resumes = [], isLoading: resumesLoading } = useResumesQuery();
  const { invalidate } = useDashboardInvalidation();

  const [capture, setCapture] = useState<PendingJobCapture | null>(null);
  const [captureReady, setCaptureReady] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem("clerk-user-id", user.id);
  }, [isLoaded, user]);

  useEffect(() => {
    const apply = (next: PendingJobCapture | null) => {
      if (!next) return false;
      const normalized = normalizeCapturedJob(next);
      setCapture(normalized);
      return true;
    };

    if (apply(loadPendingJobCapture())) {
      setCaptureReady(true);
      return;
    }

    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks += 1;
      if (apply(loadPendingJobCapture()) || ticks >= 20) {
        window.clearInterval(timer);
        setCaptureReady(true);
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, []);

  const sortedResumes = useMemo(() => sortResumesForPicker(resumes), [resumes]);

  useEffect(() => {
    if (selectedResumeId || sortedResumes.length === 0) return;
    setSelectedResumeId(sortedResumes[0].resumeId);
  }, [selectedResumeId, sortedResumes]);

  useEffect(() => {
    if (!creating) {
      setMessageIndex(0);
      return;
    }
    const last = FROM_JOB_TAILORING_MESSAGES.length - 1;
    const interval = window.setInterval(() => {
      setMessageIndex((prev) => (prev >= last ? prev : prev + 1));
    }, 4000);
    return () => window.clearInterval(interval);
  }, [creating]);

  const overflow = getJobDescriptionOverflow(capture?.jobDescription ?? "");
  const jdTooShort =
    (capture?.jobDescription.trim().length ?? 0) < MIN_JOB_DESCRIPTION_CHARS;
  let jdHint: string | null = null;
  if (jdTooShort) {
    jdHint = `Add at least ${MIN_JOB_DESCRIPTION_CHARS} characters so we can tailor the resume.`;
  } else if (overflow > 0) {
    jdHint = `${overflow.toLocaleString()} extra characters will be trimmed.`;
  }

  const updateCapture = (patch: Partial<PendingJobCapture>) => {
    setCapture((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      savePendingJobCapture(next);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!capture || !selectedResumeId || jdTooShort || creating) return;
    setError(null);
    try {
      const limit = await resumeApi.checkResumeLimit();
      if (!limit.allowed) {
        setShowLimitModal(true);
        return;
      }

      setCreating(true);
      const jobDescription = trimJobDescriptionForSend(capture.jobDescription);
      const copyTitle = tailoredResumeTitle(capture.title, capture.company);

      const created = await resumeApi.duplicate(selectedResumeId, copyTitle);
      try {
        const result = await resumeApi.tailorToJobDescription(created.resumeId, {
          jobDescription,
        });
        await resumeApi.update(created.resumeId, {
          title: copyTitle,
          content: result.content,
          profileSummary: result.profileSummary,
          sectionOrder: result.sectionOrder,
          atsScoringContext: {
            lastJobDescription: jobDescription,
          },
          pdfS3Key: "",
        });
      } catch (tailorError) {
        try {
          await resumeApi.delete(created.resumeId);
        } catch {
          /* keep the copy if delete fails */
        }
        throw tailorError;
      }

      clearPendingJobCapture();
      await invalidate(["resumes"]);
      router.push(`/dashboard/resumes/${created.resumeId}/edit`);
    } catch (err) {
      setCreating(false);
      setError(getApiErrorMessage(err, "Failed to tailor your resume. Please try again."));
    }
  };

  if (!captureReady || !isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (creating) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Tailoring your resume"
          description="We’re creating a new copy so your original resume stays untouched."
        />
        <ResumeBuilderProcessingView
          label={tailoredResumeTitle(capture?.title, capture?.company)}
          messageIndex={messageIndex}
          messages={FROM_JOB_TAILORING_MESSAGES}
        />
      </div>
    );
  }

  if (!capture) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="No job captured yet"
          description="Open the InterviewTrix extension on a job posting, then choose Tailor resume."
        />
        <div className={cn(appCard, "space-y-4 p-5 sm:p-6")}>
          <p className="text-sm text-muted-foreground">
            The extension reads the current tab only when you click it. After
            you capture a job, you’ll land back here to pick a source resume.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddToChromeButton />
            <Button asChild variant="outline" className={appOutlineButton}>
              <Link href="/dashboard/resumes">Back to resumes</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Tailor a resume to this job"
        description="We’ll create a new copy from the resume you pick. Your original is never overwritten."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className={cn(appCard, "min-w-0 p-5 sm:p-6")}>
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                {capture.title || "Job from Chrome"}
              </h2>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {capture.company ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {capture.company}
                  </span>
                ) : null}
                {capture.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {capture.location}
                  </span>
                ) : null}
              </div>
              {capture.sourceUrl ? (
                <a
                  href={capture.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open original posting
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>

          {capture.details && Object.keys(capture.details).length > 0 ? (
            <dl className="mb-4 grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
              {Object.entries(capture.details).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <label
            htmlFor="from-job-jd"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Job description
          </label>
          <Textarea
            id="from-job-jd"
            value={capture.jobDescription}
            onChange={(e) => updateCapture({ jobDescription: e.target.value })}
            className="min-h-[220px] resize-y text-sm"
          />
          {jdHint ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {jdHint}
            </p>
          ) : null}
        </section>

        <section className={cn(appCard, "min-w-0 p-5 sm:p-6")}>
          <h2 className="text-base font-semibold text-foreground">
            Source resume
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the resume to copy. We’ll tailor the new version to this job.
          </p>

          <ResumeSourcePicker
            loading={resumesLoading}
            resumes={sortedResumes}
            selectedResumeId={selectedResumeId}
            onSelect={setSelectedResumeId}
          />

          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}

          {sortedResumes.length > 0 ? (
            <Button
              className={cn(appPrimaryButton, "mt-5 h-11 w-full")}
              disabled={creating || jdTooShort || !selectedResumeId}
              onClick={() => void handleCreate()}
            >
              Create tailored resume
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </section>
      </div>

      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="border border-[#7367F0]/20 bg-card shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Resume limit reached
            </DialogTitle>
            <DialogDescription className="text-left text-muted-foreground pt-1">
              You’ve used all the resumes included in your current plan. Upgrade
              to create a tailored copy of this job.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 pt-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowLimitModal(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLimitModal(false);
                router.push("/dashboard/plan");
              }}
              className={institutePrimaryClass}
            >
              Upgrade plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
