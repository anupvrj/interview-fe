"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  BarChart3,
  Eye,
  Video,
  FileText,
  Target,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { userApi, adminApi } from "@/lib/api";
import { canViewInstitutePage } from "@/lib/institute-access";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstituteTableShell,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { InstituteCandidateReportsHero } from "@/components/institute/InstituteCandidateReportsHero";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { toast } from "sonner";
import { cn, formatDate, getScoreColor } from "@/lib/utils";

function initialsFrom(name: string | undefined, email: string | undefined): string {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts.at(0)?.[0] ?? "";
      const b = parts.at(-1)?.[0] ?? "";
      return `${a}${b}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0] || "?";
  return local.slice(0, 2).toUpperCase();
}

export default function InstitutionCandidateReportsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clerkId = params.clerkId as string;
  const institutionId = params.institutionId as string;
  const nameQ = searchParams.get("name") || "";
  const emailQ = searchParams.get("email") || "";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [interviewPreview, setInterviewPreview] = useState<any | null>(null);
  const [resumePreview, setResumePreview] = useState<any | null>(null);
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadProfile();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (profile && canViewInstitutePage(profile, institutionId, "candidates") && clerkId) {
      loadData();
    }
  }, [profile, clerkId, institutionId, router]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const p = await userApi.getMyProfile();
      setProfile(p);
      if (!canViewInstitutePage(p, institutionId, "candidates")) {
        router.replace("/dashboard");
        return;
      }
    } catch {
      router.replace("/dashboard");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, res] = await Promise.all([
        adminApi.getUserInterviews(clerkId),
        adminApi.getUserResumes(clerkId),
      ]);
      setInterviews(inv);
      setResumes(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openResumePreview = async (resumeId: string) => {
    setResumePreviewLoading(true);
    setResumePreview(null);
    try {
      const data = await adminApi.getResumeForAdmin(resumeId);
      setResumePreview(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load resume");
    } finally {
      setResumePreviewLoading(false);
    }
  };

  const openVideo = async (interviewId: string) => {
    try {
      const { videoUrl } = await adminApi.getInterviewVideoUrl(interviewId);
      window.open(videoUrl, "_blank");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load video");
    }
  };

  const performanceSummary = (() => {
    const withScore = interviews.filter(
      (i: any) =>
        i.report?.overallScore != null && !Number.isNaN(Number(i.report.overallScore)),
    );
    const scores = withScore.map((i: any) => Number(i.report.overallScore));
    const avg =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null;
    const completed = interviews.filter((i: any) => i.status === "completed").length;
    return {
      avg,
      scoredCount: scores.length,
      totalInterviews: interviews.length,
      completed,
    };
  })();

  const displayName = nameQ || "Candidate";
  const candidatesHref = `/dashboard/institute/${institutionId}/candidates`;

  if (!profile) {
    return <InstituteLoader />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <Button
        variant="outline"
        size="sm"
        asChild
        className={cn(instituteSecondaryClass, "h-9 gap-2 px-3")}
      >
        <Link href={candidatesHref}>
          <ArrowLeft className="h-4 w-4" />
          Candidates
        </Link>
      </Button>

      <InstituteCandidateReportsHero
        candidateName={displayName}
        email={emailQ}
        avgScore={loading ? null : performanceSummary.avg}
        totalInterviews={loading ? 0 : performanceSummary.totalInterviews}
        completedInterviews={loading ? 0 : performanceSummary.completed}
        resumeCount={loading ? 0 : resumes.length}
        loading={loading}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
          <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border/60 bg-card shadow-card">
            <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <DashboardStatCard
              theme="violet"
              label="Avg. interview score"
              icon={Target}
              value={
                performanceSummary.avg != null ? performanceSummary.avg : "—"
              }
              progress={
                performanceSummary.avg != null
                  ? Math.round(performanceSummary.avg)
                  : undefined
              }
              hint={
                <span>
                  Across {performanceSummary.scoredCount} scored session
                  {performanceSummary.scoredCount === 1 ? "" : "s"}
                </span>
              }
            />
            <DashboardStatCard
              theme="sky"
              label="Total interviews"
              icon={BarChart3}
              value={performanceSummary.totalInterviews}
              hint={<span>All practice sessions</span>}
            />
            <DashboardStatCard
              theme="purple"
              label="Completed"
              icon={CheckCircle2}
              value={performanceSummary.completed}
              hint={<span>Finished interviews</span>}
            />
            <DashboardStatCard
              theme="emerald"
              label="Resumes on file"
              icon={FileCheck}
              value={resumes.length}
              hint={<span>Uploaded documents</span>}
            />
          </div>

          <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Resumes
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Uploaded resumes for this candidate
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {resumes.length === 0 ? (
                <div className="px-4 py-6 sm:px-6">
                  <InstituteEmptyState
                    icon={FileText}
                    title="No resumes yet"
                    description="This candidate has not uploaded a resume."
                  />
                </div>
              ) : (
                <InstituteTableShell>
                  <Table className="w-full min-w-[560px]">
                    <TableHeader>
                      <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                        <TableHead className="pl-6 font-semibold text-foreground">
                          Title
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Updated
                        </TableHead>
                        <TableHead className="pr-6 text-right font-semibold text-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumes.map((r: any) => (
                        <TableRow
                          key={r.resumeId}
                          className="group border-border align-middle transition-colors hover:bg-muted/40"
                        >
                          <TableCell className="pl-6">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                                {initialsFrom(r.title, emailQ)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">
                                  {r.title || "Untitled resume"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  Resume document
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(r.updatedAt)}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(instituteSecondaryClass, "h-8 gap-1.5")}
                              onClick={() => openResumePreview(r.resumeId)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View resume
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </InstituteTableShell>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Interviews
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Open the full analysis for any completed session
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {interviews.length === 0 ? (
                <div className="px-4 py-6 sm:px-6">
                  <InstituteEmptyState
                    icon={BarChart3}
                    title="No interviews yet"
                    description="This candidate has not completed any AI interview practice sessions."
                  />
                </div>
              ) : (
                <InstituteTableShell>
                  <Table className="w-full min-w-[760px]">
                    <TableHeader>
                      <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                        <TableHead className="pl-6 font-semibold text-foreground">
                          Role
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Company
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Score
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Status
                        </TableHead>
                        <TableHead className="pr-6 text-right font-semibold text-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((inv: any) => {
                        const role = inv.metadata?.role ?? "Interview";
                        return (
                          <TableRow
                            key={inv.interviewId}
                            className="group border-border align-middle transition-colors hover:bg-muted/40"
                          >
                            <TableCell className="pl-6">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                                  {initialsFrom(role, emailQ)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-foreground">
                                    {role}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {inv.interviewId}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDate(inv.createdAt)}
                            </TableCell>
                            <TableCell className="max-w-[140px] truncate text-muted-foreground">
                              {inv.metadata?.targetCompany ?? "—"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-semibold",
                                  getScoreColor(inv.report?.overallScore ?? 0),
                                )}
                              >
                                {inv.report?.overallScore ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs capitalize text-muted-foreground">
                              {inv.status}
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <div className="flex flex-nowrap items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className={cn(
                                    instituteSecondaryClass,
                                    "h-8 w-8 shrink-0 p-0",
                                  )}
                                  onClick={() => setInterviewPreview(inv)}
                                  title="Details"
                                  aria-label="Interview details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className={cn(
                                    instituteSecondaryClass,
                                    "h-8 w-8 shrink-0 p-0",
                                  )}
                                  asChild
                                  title="View report"
                                  aria-label="View report"
                                >
                                  <Link
                                    href={`/dashboard/institute/${institutionId}/candidates/${clerkId}/reports/${inv.interviewId}?${new URLSearchParams({
                                      ...(nameQ && { name: nameQ }),
                                      ...(emailQ && { email: emailQ }),
                                    }).toString()}`}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                {inv.session?.s3VideoKey ? (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                      instituteSecondaryClass,
                                      "h-8 w-8 shrink-0 p-0",
                                    )}
                                    onClick={() => openVideo(inv.interviewId)}
                                    title="Watch video"
                                    aria-label="Watch video"
                                  >
                                    <Video className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </InstituteTableShell>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={!!interviewPreview}
        onOpenChange={(o) => !o && setInterviewPreview(null)}
      >
        <DialogContent className="border-border/80 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Interview details</DialogTitle>
            <DialogDescription>
              Session metadata for this practice interview.
            </DialogDescription>
          </DialogHeader>
          {interviewPreview && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Interview ID</dt>
                <dd className="font-mono text-xs">{interviewPreview.interviewId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Role</dt>
                <dd>{interviewPreview.metadata?.role ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Target company</dt>
                <dd>{interviewPreview.metadata?.targetCompany ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Experience (years)</dt>
                <dd>{interviewPreview.metadata?.experience ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>
                  {interviewPreview.metadata?.interviewDuration != null
                    ? `${interviewPreview.metadata.interviewDuration} min`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{interviewPreview.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDate(interviewPreview.createdAt)}</dd>
              </div>
              {interviewPreview.report?.overallScore != null && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Overall score</dt>
                  <dd
                    className={cn(
                      "font-bold",
                      getScoreColor(interviewPreview.report.overallScore),
                    )}
                  >
                    {interviewPreview.report.overallScore}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resumePreview || resumePreviewLoading}
        onOpenChange={(o) => {
          if (!o) {
            setResumePreview(null);
            setResumePreviewLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-border/80">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {resumePreview?.title ?? "Resume"}
            </DialogTitle>
            <DialogDescription>
              Read-only preview · Template {resumePreview?.templateId ?? ""}
            </DialogDescription>
          </DialogHeader>
          {resumePreviewLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
            </div>
          )}
          {resumePreview && !resumePreviewLoading && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="font-semibold text-foreground">
                  {resumePreview.content?.personalInfo?.fullName ?? "—"}
                </p>
                <p className="text-muted-foreground">
                  {resumePreview.content?.personalInfo?.email ?? ""}{" "}
                  {resumePreview.content?.personalInfo?.phone
                    ? ` · ${resumePreview.content.personalInfo.phone}`
                    : ""}
                </p>
              </div>
              {resumePreview.profileSummary && (
                <div>
                  <h5 className="mb-1 font-medium text-foreground">Summary</h5>
                  <p className="whitespace-pre-wrap text-foreground">
                    {typeof resumePreview.profileSummary === "string"
                      ? resumePreview.profileSummary.replace(/<[^>]+>/g, " ")
                      : ""}
                  </p>
                </div>
              )}
              {Array.isArray(resumePreview.content?.experience) &&
                resumePreview.content.experience.length > 0 && (
                  <div>
                    <h5 className="mb-1 font-medium text-foreground">Experience</h5>
                    <ul className="list-inside list-disc space-y-1 text-foreground">
                      {resumePreview.content.experience.slice(0, 8).map((ex: any) => (
                        <li key={ex.id}>
                          {ex.position} at {ex.company}{" "}
                          {ex.startDate
                            ? `(${ex.startDate}${ex.endDate ? ` – ${ex.endDate}` : ""})`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {Array.isArray(resumePreview.content?.education) &&
                resumePreview.content.education.length > 0 && (
                  <div>
                    <h5 className="mb-1 font-medium text-foreground">Education</h5>
                    <ul className="list-inside list-disc text-foreground">
                      {resumePreview.content.education.slice(0, 5).map((ed: any) => (
                        <li key={ed.id}>
                          {ed.degree} — {ed.institution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
