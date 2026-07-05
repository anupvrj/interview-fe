"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { userApi, adminApi } from "@/lib/api";
import { formatDate, getScoreColor } from "@/lib/utils";

function isCodingPractice(inv: { metadata?: { interviewKind?: string } }): boolean {
  return inv.metadata?.interviewKind === "coding_practice";
}

export default function SuperAdminUserViewPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const nameQ = searchParams.get("name") || "";
  const emailQ = searchParams.get("email") || "";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [interviewPreview, setInterviewPreview] = useState<any | null>(null);
  const [resumePreview, setResumePreview] = useState<any | null>(null);
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  const backParams = new URLSearchParams();
  if (nameQ) backParams.set("name", nameQ);
  if (emailQ) backParams.set("email", emailQ);
  const backSuffix = backParams.toString() ? `?${backParams.toString()}` : "";

  const reportBase = `/dashboard/super-admin/users/${encodeURIComponent(userId)}/reports`;

  const { practiceInterviews, codingInterviews } = useMemo(() => {
    const practice: any[] = [];
    const coding: any[] = [];
    for (const inv of interviews) {
      if (isCodingPractice(inv)) coding.push(inv);
      else practice.push(inv);
    }
    return { practiceInterviews: practice, codingInterviews: coding };
  }, [interviews]);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadProfile();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (profile?.accessRole === "super_admin" && userId) {
      loadData();
    }
  }, [profile, userId, router]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const p = await userApi.getMyProfile();
      setProfile(p);
      if (p.accessRole !== "super_admin") {
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
        adminApi.getUserInterviews(userId),
        adminApi.getUserResumes(userId),
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
      alert(err?.response?.data?.message || "Failed to load resume");
    } finally {
      setResumePreviewLoading(false);
    }
  };

  const openVideo = async (interviewId: string) => {
    try {
      const { videoUrl } = await adminApi.getInterviewVideoUrl(interviewId);
      window.open(videoUrl, "_blank");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to load video");
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

  const displayName = nameQ || "User";

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1">
          <Link href="/dashboard/super-admin">
            <ArrowLeft className="h-4 w-4" />
            Super admin
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-foreground">
          <BarChart3 className="h-7 w-7 text-primary" />
          User — {displayName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {emailQ || "—"} · Resumes, practice interviews, and coding practice sessions
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Avg. interview score
              </p>
              <p
                className={`text-2xl font-bold ${
                  performanceSummary.avg != null
                    ? getScoreColor(performanceSummary.avg)
                    : "text-muted-foreground"
                }`}
              >
                {performanceSummary.avg != null ? performanceSummary.avg : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Across {performanceSummary.scoredCount} scored session
                {performanceSummary.scoredCount === 1 ? "" : "s"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total sessions
              </p>
              <p className="text-2xl font-bold text-foreground">
                {performanceSummary.totalInterviews}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Completed
              </p>
              <p className="text-2xl font-bold text-foreground">
                {performanceSummary.completed}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resumes on file
              </p>
              <p className="text-2xl font-bold text-foreground">{resumes.length}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumes</CardTitle>
              <CardDescription>Resumes created or uploaded by this user</CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resumes yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumes.map((r: any) => (
                        <TableRow key={r.resumeId}>
                          <TableCell className="font-medium">{r.title}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(r.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResumePreview(r.resumeId)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View resume
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Practice interviews</CardTitle>
              <CardDescription>
                AI Interview Practice (non-coding). Open report or recording when available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {practiceInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No practice interviews yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {practiceInterviews.map((inv: any) => (
                        <TableRow key={inv.interviewId}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(inv.createdAt)}
                          </TableCell>
                          <TableCell>{inv.metadata?.role ?? "—"}</TableCell>
                          <TableCell className="max-w-[140px] truncate text-muted-foreground">
                            {inv.metadata?.targetCompany ?? "—"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${getScoreColor(
                                inv.report?.overallScore ?? 0,
                              )}`}
                            >
                              {inv.report?.overallScore ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">
                            {inv.status}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setInterviewPreview(inv)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Details
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`${reportBase}/${encodeURIComponent(inv.interviewId)}${backSuffix}`}
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  View report
                                </Link>
                              </Button>
                              {inv.session?.s3VideoKey ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openVideo(inv.interviewId)}
                                >
                                  <Video className="h-3 w-3" />
                                </Button>
                              ) : (
                                <span className="px-2 text-xs text-muted-foreground">No video</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coding practice round</CardTitle>
              <CardDescription>
                Practice coding sessions with DSA problems and discussion. Report and recording
                when the session was completed and processed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {codingInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No coding practice sessions yet</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codingInterviews.map((inv: any) => (
                        <TableRow key={inv.interviewId}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(inv.createdAt)}
                          </TableCell>
                          <TableCell>{inv.metadata?.role ?? "—"}</TableCell>
                          <TableCell className="max-w-[140px] truncate text-muted-foreground">
                            {inv.metadata?.targetCompany ?? "—"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${getScoreColor(
                                inv.report?.overallScore ?? 0,
                              )}`}
                            >
                              {inv.report?.overallScore ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">
                            {inv.status}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setInterviewPreview(inv)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Details
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`${reportBase}/${encodeURIComponent(inv.interviewId)}${backSuffix}`}
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  View report
                                </Link>
                              </Button>
                              {inv.session?.s3VideoKey ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openVideo(inv.interviewId)}
                                >
                                  <Video className="h-3 w-3" />
                                </Button>
                              ) : (
                                <span className="px-2 text-xs text-muted-foreground">No video</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={!!interviewPreview}
        onOpenChange={(o) => !o && setInterviewPreview(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Interview details</DialogTitle>
          </DialogHeader>
          {interviewPreview && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Type</dt>
                <dd>
                  {isCodingPractice(interviewPreview)
                    ? "Coding practice"
                    : "Practice interview"}
                </dd>
              </div>
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
                <dt className="text-muted-foreground">Language</dt>
                <dd>{interviewPreview.metadata?.language ?? "—"}</dd>
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
                    className={`font-bold ${getScoreColor(
                      interviewPreview.report.overallScore,
                    )}`}
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
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{resumePreview?.title ?? "Resume"}</DialogTitle>
            <DialogDescription>
              Read-only preview · Template {resumePreview?.templateId ?? ""}
            </DialogDescription>
          </DialogHeader>
          {resumePreviewLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {resumePreview && !resumePreviewLoading && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border bg-muted/20 p-3">
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
