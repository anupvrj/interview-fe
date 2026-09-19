"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ExternalLink,
  FileText,
  Heart,
  Loader2,
  Mic,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { ATSReportView } from "@/components/ats-checker/ATSReportView";
import { ApplicationStatusSidebar } from "@/components/job-tracker/ApplicationStatusSidebar";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppSelect } from "@/components/ui/app-select";
import { jobTrackerApi } from "@/lib/api";
import {
  PRACTICE_INTERVIEW_PATH,
  savePendingJobCapture,
} from "@/lib/extension-job-handoff";
import { appPanel, appPrimaryButton } from "@/lib/app-theme";
import { formatCompensation } from "@/lib/profile-compensation";
import { cn } from "@/lib/utils";
import { isATSReportV3 } from "@/types/atsReport";
import {
  JOB_TRACKER_TYPE_LABELS,
  formatJobTrackerDate,
  sourceLabel,
  type JobTrackerDetail,
} from "@/lib/job-tracker";
import {
  resumeEditorTabActive,
  resumeEditorTabBase,
  resumeEditorTabInactive,
  resumeEditorTabsRow,
} from "@/components/resume-editor/resumeEditorStyles";
import { useResumesQuery } from "@/hooks/queries/useResumesQuery";

type SheetTab = "overview" | "documents" | "score" | "practice";

export function JobTrackerSheet({
  applicationId,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const { data: resumes = [] } = useResumesQuery();
  const [detail, setDetail] = useState<JobTrackerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<SheetTab>("overview");
  const [overviewMode, setOverviewMode] = useState<"summary" | "full">("summary");
  const [scoreLoading, setScoreLoading] = useState(false);
  const [attachResumeId, setAttachResumeId] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const skipLoadRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open || !applicationId) {
      setDetail(null);
      setTab("overview");
      skipLoadRef.current = false;
      return;
    }
    if (skipLoadRef.current) return;

    let cancelled = false;
    setLoading(true);
    jobTrackerApi
      .get(applicationId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((error: unknown) => {
        const isNotFound =
          error instanceof AxiosError && error.response?.status === 404;
        if (!cancelled && !isNotFound) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load application",
          );
        }
        if (!cancelled) onOpenChangeRef.current(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, open]);

  const atsReport = useMemo(() => {
    const raw = detail?.jobMatchSnapshot?.atsReport;
    return isATSReportV3(raw) ? raw : null;
  }, [detail?.jobMatchSnapshot?.atsReport]);

  const patchDetail = async (patch: Record<string, unknown>) => {
    if (!detail) return;
    const next = await jobTrackerApi.patch(detail.applicationId, patch);
    setDetail(next);
    onUpdated();
  };

  const toggleFavorite = async () => {
    if (!detail) return;
    await patchDetail({ isFavorite: !detail.isFavorite });
  };

  const archive = async () => {
    if (!detail) return;
    await patchDetail({ isArchived: true });
    toast.success("Application archived");
    onOpenChange(false);
    onUpdated();
  };

  const remove = async () => {
    if (!detail) return;
    setDeleteLoading(true);
    try {
      await jobTrackerApi.remove(detail.applicationId);
      skipLoadRef.current = true;
      setDetail(null);
      setDeleteOpen(false);
      onOpenChange(false);
      onDeleted();
      toast.success("Application deleted");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete application",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const attachResume = async () => {
    if (!detail || !attachResumeId) return;
    try {
      const next = await jobTrackerApi.attachResumes(detail.applicationId, [
        attachResumeId,
      ]);
      setDetail(next);
      onUpdated();
      toast.success("Resume attached");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to attach resume",
      );
    }
  };

  const detachResume = async (resumeId: string) => {
    if (!detail) return;
    try {
      const next = await jobTrackerApi.detachResume(
        detail.applicationId,
        resumeId,
      );
      setDetail(next);
      onUpdated();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to detach resume",
      );
    }
  };

  const scoreResume = async () => {
    if (!detail) return;
    const resumeId =
      detail.jobMatchSnapshot?.resumeId || detail.documents[0]?.resumeId;
    if (!resumeId) {
      toast.error("Attach a resume before scoring");
      return;
    }
    setScoreLoading(true);
    try {
      const next = await jobTrackerApi.score(detail.applicationId, resumeId);
      setDetail(next);
      onUpdated();
      toast.success("Resume score updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Scoring failed");
    } finally {
      setScoreLoading(false);
    }
  };

  const startPractice = async () => {
    if (!detail) return;
    try {
      const handoff = await jobTrackerApi.practiceInterview(
        detail.applicationId,
      );
      savePendingJobCapture({
        v: 1,
        sourceUrl: handoff.sourceUrl || "",
        title: handoff.title,
        company: handoff.company,
        location: handoff.location,
        jobDescription: handoff.jobDescription,
        capturedAt: new Date().toISOString(),
        intent: "practice-interview",
        sourceResumeId: handoff.sourceResumeId,
        jobApplicationId: handoff.jobApplicationId,
      });
      router.push(PRACTICE_INTERVIEW_PATH);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start practice interview",
      );
    }
  };

  const tabs: Array<{ id: SheetTab; label: string; icon: typeof FileText }> = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "score", label: "Resume Score", icon: Trophy },
    { id: "practice", label: "Practice", icon: Mic },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent hideClose className="p-0">
          {loading || !detail ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-border/60 px-4 py-4 sm:px-6">
                <SheetHeader className="space-y-3">
                  <div className="flex flex-col gap-3 pr-10 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <SheetTitle className="truncate text-xl">
                        {detail.title}
                      </SheetTitle>
                      <p className="truncate text-sm text-muted-foreground">
                        {detail.company}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleFavorite}
                      >
                        <Heart
                          className={cn(
                            "mr-2 h-4 w-4",
                            detail.isFavorite &&
                              "fill-[#7367F0] text-[#7367F0]",
                          )}
                        />
                        Favorite
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={archive}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-600"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </SheetHeader>

                <div className={cn(resumeEditorTabsRow, "mt-4 flex overflow-x-auto")}>
                  {tabs.map((item) => {
                    const Icon = item.icon;
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          resumeEditorTabBase,
                          "flex min-w-[7rem] items-center justify-center gap-2 whitespace-nowrap",
                          active ? resumeEditorTabActive : resumeEditorTabInactive,
                        )}
                        onClick={() => setTab(item.id)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                  {tab === "overview" ? (
                    <div className="space-y-6">
                      <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Location
                          </dt>
                          <dd className="mt-1 text-sm">
                            {detail.locationText || "N/A"} ·{" "}
                            {detail.workMode.replace("_", " ")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Job type
                          </dt>
                          <dd className="mt-1 text-sm">
                            {JOB_TRACKER_TYPE_LABELS[detail.jobType]}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Source
                          </dt>
                          <dd className="mt-1 text-sm">
                            {sourceLabel(detail.source, detail.sourceCustom)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Applied
                          </dt>
                          <dd className="mt-1 text-sm">
                            {formatJobTrackerDate(detail.appliedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Expected CTC
                          </dt>
                          <dd className="mt-1 text-sm">
                            {formatCompensation(detail.expectedCtc) || "N/A"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Job link
                          </dt>
                          <dd className="mt-1">
                            {detail.jobLink ? (
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={detail.jobLink}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View Job Posting
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-sm">N/A</span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={overviewMode === "summary" ? "default" : "outline"}
                          onClick={() => setOverviewMode("summary")}
                        >
                          Job Summary
                        </Button>
                        <Button
                          type="button"
                          variant={overviewMode === "full" ? "default" : "outline"}
                          onClick={() => setOverviewMode("full")}
                        >
                          Full Job Description
                        </Button>
                      </div>
                      <div className={cn(appPanel, "prose prose-sm max-w-none dark:prose-invert")}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {overviewMode === "summary"
                            ? detail.jobSummary ||
                              detail.jobDescription ||
                              "No job description yet."
                            : detail.jobDescription ||
                              detail.jobSummary ||
                              "No job description yet."}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {tab === "documents" ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <AppSelect
                          value={attachResumeId}
                          onChange={setAttachResumeId}
                          allowEmpty
                          emptyLabel="Select resume"
                          options={resumes.map((resume) => ({
                            value: resume.resumeId,
                            label: resume.title,
                          }))}
                          className="h-11 flex-1"
                        />
                        <Button
                          type="button"
                          className={appPrimaryButton}
                          onClick={attachResume}
                          disabled={!attachResumeId}
                        >
                          Attach resume
                        </Button>
                      </div>
                      {detail.documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No resumes attached yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {detail.documents.map((doc) => (
                            <div
                              key={doc.resumeId}
                              className={cn(
                                appPanel,
                                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                              )}
                            >
                              <div>
                                <p className="font-medium">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Attached {formatJobTrackerDate(doc.attachedAt)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link
                                    href={`/dashboard/resumes/${doc.resumeId}/edit`}
                                  >
                                    Open
                                  </Link>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => detachResume(doc.resumeId)}
                                >
                                  Detach
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {tab === "score" ? (
                    <div className="space-y-4">
                      {detail.documents.length === 0 ? (
                        <div className={cn(appPanel, "space-y-3 p-5")}>
                          <p className="font-medium">Attach a resume to score</p>
                          <p className="text-sm text-muted-foreground">
                            Link a resume in the Documents tab, then run a job match
                            score against this posting.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-3">
                            {detail.jobMatchSnapshot?.matchScore != null ? (
                              <Badge variant="info" className="text-sm">
                                {detail.jobMatchSnapshot.matchScore}% match
                              </Badge>
                            ) : null}
                            <Button
                              type="button"
                              className={appPrimaryButton}
                              onClick={scoreResume}
                              disabled={scoreLoading}
                            >
                              {scoreLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Scoring…
                                </>
                              ) : (
                                "Re-score resume"
                              )}
                            </Button>
                          </div>
                          {atsReport ? (
                            <ATSReportView
                              feedback={atsReport}
                              resumeId={detail.jobMatchSnapshot?.resumeId}
                              embedded
                              jobMatchScore={detail.jobMatchSnapshot?.matchScore}
                              initialJobDescription={detail.jobDescription}
                            />
                          ) : detail.jobMatchSnapshot ? (
                            <div className={cn(appPanel, "space-y-3 p-5")}>
                              <p className="text-lg font-semibold">
                                {detail.jobMatchSnapshot.headline ||
                                  `${detail.jobMatchSnapshot.matchScore ?? 0}% match`}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {detail.jobMatchSnapshot.matchedSkills.map(
                                  (skill) => (
                                    <Badge key={skill} variant="success">
                                      {skill}
                                    </Badge>
                                  ),
                                )}
                                {detail.jobMatchSnapshot.missingSkills.map(
                                  (skill) => (
                                    <Badge key={skill} variant="danger">
                                      {skill}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className={cn(appPanel, "p-5")}>
                              <p className="text-sm text-muted-foreground">
                                Run a score to see ATS and job match details.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : null}

                  {tab === "practice" ? (
                    <div className="space-y-4">
                      <Button
                        type="button"
                        className={appPrimaryButton}
                        onClick={startPractice}
                      >
                        Practice interview for this job
                      </Button>
                      {detail.practiceInterviews.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No practice interviews linked yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {detail.practiceInterviews.map((session) => (
                            <div
                              key={session.interviewId}
                              className={cn(
                                appPanel,
                                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                              )}
                            >
                              <div>
                                <p className="font-medium">{session.interviewId}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.reportReady
                                    ? `Completed ${formatJobTrackerDate(session.completedAt)}`
                                    : session.status}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.overallScore != null ? (
                                  <Badge variant="info">
                                    Score {session.overallScore}
                                  </Badge>
                                ) : null}
                                {session.reportReady ? (
                                  <Button asChild variant="outline" size="sm">
                                    <Link
                                      href={`/dashboard/interviews/${session.interviewId}/report`}
                                    >
                                      View report
                                    </Link>
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="min-h-0 overflow-y-auto border-t border-border/60 p-4 lg:border-l lg:border-t-0 sm:p-6">
                  <ApplicationStatusSidebar
                    detail={detail}
                    onUpdated={(next) => {
                      setDetail(next);
                      onUpdated();
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete application?"
        description="This permanently removes the job from your tracker."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteLoading}
        onConfirm={remove}
      />
    </>
  );
}
