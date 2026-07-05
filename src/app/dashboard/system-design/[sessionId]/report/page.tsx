"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  CircleDot,
  ImageIcon,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Play,
  Scale,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  Copy,
  Download,
  Mail,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  systemDesignApi,
  type SystemDesignPracticeReport,
  type SystemDesignReportSessionLite,
} from "@/lib/api";
import { getProblemById } from "@/lib/systemDesignProblems";
import { formatDate, getScoreColor, getScoreGradient, cn } from "@/lib/utils";
import { dashboardHeroStatPalette } from "@/lib/dashboard-stat-themes";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadPDFToS3 } from "@/lib/pdf-generator";
import {
  buildSystemDesignReportPdfBlob,
  buildSystemDesignReportPdfHtml,
  generateSystemDesignReportPdfViaServer,
} from "@/lib/system-design-report-pdf-export";

const ExcalidrawBoard = dynamic(
  () => import("@/components/system-design/ExcalidrawBoard"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(320px,36vh)] w-full items-center justify-center rounded-lg border border-border bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  },
);

const reportCardClass =
  "overflow-hidden rounded-xl border border-border/60 bg-card shadow-card";
const reportCardHeaderClass = "border-b border-border/60 px-5 py-4";
const iconShellClass = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
  dashboardHeroStatPalette.iconShell,
);

const DIMENSION_BLOCKS: Array<{
  key: keyof SystemDesignPracticeReport["dimensionScores"];
  label: string;
  weightLabel: string;
  Icon: LucideIcon;
}> = [
  {
    key: "scopeRequirements",
    label: "Scope & requirements",
    weightLabel: "~15%",
    Icon: CircleDot,
  },
  {
    key: "componentArchitecture",
    label: "Component architecture",
    weightLabel: "~25%",
    Icon: LayoutGrid,
  },
  {
    key: "scalingDeepDive",
    label: "Scaling & deep dive",
    weightLabel: "~40%",
    Icon: Zap,
  },
  {
    key: "tradeoffsCommunication",
    label: "Trade-offs & communication",
    weightLabel: "~20%",
    Icon: Scale,
  },
];

function DimensionScoreCard({
  label,
  weightLabel,
  value,
  verdict,
  Icon,
}: {
  label: string;
  weightLabel: string;
  value: number;
  verdict?: string;
  Icon: LucideIcon;
}) {
  return (
    <Card className={reportCardClass}>
      <CardHeader className={reportCardHeaderClass}>
        <div className="flex items-center gap-3">
          <div className={iconShellClass}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold leading-snug">{label}</CardTitle>
            <CardDescription>{weightLabel} weight</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className={cn("text-3xl font-bold tabular-nums", getScoreColor(value))}>
            {value}
          </span>
          <span className="text-muted-foreground">/ 100</span>
        </div>
        <Progress value={value} className="h-2.5" />
        {verdict ? (
          <p className="mt-3 text-sm leading-snug text-muted-foreground">{verdict}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function SystemDesignPracticeReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SystemDesignPracticeReport | null>(null);
  const [sessionLite, setSessionLite] =
    useState<SystemDesignReportSessionLite | null>(null);
  const [error, setError] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await systemDesignApi.getPracticeReport(sessionId);
      setReport(data.report);
      setSessionLite(data.session);
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      const message =
        typeof msg === "string" ? msg : "Could not load your report.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const problemTitle = sessionLite
    ? getProblemById(sessionLite.problemId)?.title ?? sessionLite.problemId
    : "…";

  const wbJson = sessionLite?.whiteboardSnapshot?.trim();

  async function openRecording() {
    if (!sessionLite?.sessionId) return;
    try {
      const { videoUrl } = await systemDesignApi.getRecordingPlaybackUrl(
        sessionLite.sessionId,
      );
      if (!videoUrl?.trim()) {
        toast.error("Recording unavailable");
        return;
      }
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open recording.");
    }
  }

  if (loading && !report) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#7367F0]" />
          <p className="text-sm font-medium text-muted-foreground">
            Building your detailed report…
          </p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <Card className={cn(reportCardClass, "max-w-md")}>
          <CardContent className="pt-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">Report unavailable</h3>
            <p className="mb-6 text-muted-foreground">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={instituteSecondaryClass}
                onClick={() => void load()}
              >
                Retry
              </Button>
              <Button type="button" asChild className={institutePrimaryClass}>
                <Link href="/dashboard/system-design">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                  Back to hub
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report || !sessionLite) return null;

  const verdicts = report.dimensionVerdicts ?? {};

  const candidateDisplayName =
    user?.fullName || user?.firstName || "Candidate";

  const pdfOpts = (): {
    problemTitle: string;
    completedAtIso?: string | null;
    candidateName: string;
  } => ({
    problemTitle,
    completedAtIso: sessionLite.completedAt ?? null,
    candidateName: candidateDisplayName,
  });

  const downloadPDF = async () => {
    setPdfDownloading(true);
    try {
      const html = buildSystemDesignReportPdfHtml(report, pdfOpts());
      const { downloadUrl, s3Key } = await generateSystemDesignReportPdfViaServer({
        sessionId,
        htmlContent: html,
      });
      setSessionLite((s) =>
        s ? { ...s, reportPdfS3Key: s3Key } : s,
      );
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (serverErr) {
      console.warn(
        "[system-design report] Server PDF failed, client fallback:",
        serverErr,
      );
      const blob = buildSystemDesignReportPdfBlob(report, pdfOpts());
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-design-report-${sessionId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Saved PDF locally (server preview unavailable)");
    } finally {
      setPdfDownloading(false);
    }
  };

  const resolveShareUrl = async (): Promise<string> => {
    const existing = await systemDesignApi.getPracticeReportPdfShareUrl(sessionId);
    if (existing.stored) {
      return existing.shareUrl;
    }
    try {
      const html = buildSystemDesignReportPdfHtml(report, pdfOpts());
      const { s3Key } = await generateSystemDesignReportPdfViaServer({
        sessionId,
        htmlContent: html,
      });
      const after = await systemDesignApi.getPracticeReportPdfShareUrl(sessionId);
      if (after.stored) {
        setSessionLite((s) => (s ? { ...s, reportPdfS3Key: s3Key } : s));
        return after.shareUrl;
      }
    } catch (serverErr) {
      console.warn(
        "[system-design report] Server PDF for share failed, fallback:",
        serverErr,
      );
    }

    const blob = buildSystemDesignReportPdfBlob(report, pdfOpts());
    if (!blob) {
      throw new Error("Could not generate PDF");
    }
    const { uploadUrl, s3Key } =
      await systemDesignApi.getPracticeReportPdfUploadUrl(sessionId);
    await uploadPDFToS3(blob, uploadUrl);
    const { downloadUrl } = await systemDesignApi.confirmPracticeReportPdfUpload(
      sessionId,
      s3Key,
    );
    setSessionLite((s) => (s ? { ...s, reportPdfS3Key: s3Key } : s));
    return downloadUrl;
  };

  const copyReportLink = async () => {
    setShareBusy(true);
    try {
      const url = await resolveShareUrl();
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not prepare share link");
    } finally {
      setShareBusy(false);
    }
  };

  const openEmailShare = async () => {
    setShareBusy(true);
    try {
      const shareUrl = await resolveShareUrl();
      const subjectPlain = `System design report — ${problemTitle}`;
      const bodyPlain = `System design practice report PDF (link expires in 7 days):\n\n${shareUrl}`;

      const mobileUa =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      if (mobileUa) {
        window.location.href = `mailto:?subject=${encodeURIComponent(subjectPlain)}&body=${encodeURIComponent(bodyPlain)}`;
        return;
      }

      const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subjectPlain)}&body=${encodeURIComponent(bodyPlain)}`;
      const opened = window.open(
        gmailCompose,
        "_blank",
        "noopener,noreferrer",
      );
      if (!opened) {
        toast.error(
          "Could not open a new tab (popup blocked). Allow popups for this site or use Copy link.",
        );
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not prepare share link");
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard/system-design"
              className="mb-3 inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span>System design practice</span>
            </Link>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#7367F0]/15 bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Practice session report
            </div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              System design session report
            </h1>
            <p className="break-words font-medium text-foreground">{problemTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Completed{" "}
              {sessionLite.completedAt ? formatDate(sessionLite.completedAt) : "recently"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {sessionLite.recordingS3Key || sessionLite.recordingVideoUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("gap-2", instituteSecondaryClass)}
                onClick={openRecording}
              >
                <Play className="h-4 w-4 shrink-0" aria-hidden />
                Recording
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("gap-2", instituteSecondaryClass)}
              disabled={pdfDownloading}
              onClick={() => void downloadPDF()}
            >
              {pdfDownloading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {pdfDownloading ? "Generating…" : "Download PDF"}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-2", instituteSecondaryClass)}
                >
                  <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share system design report</DialogTitle>
                  <DialogDescription>
                    Shares a PDF download link from cloud storage. If a PDF has not
                    been generated yet, it is built once and stored; later shares reuse
                    the same file. Links expire after 7 days. On desktop, Email opens
                    Gmail in your browser; on phones, your mail app.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full gap-2 sm:flex-1", instituteSecondaryClass)}
                    disabled={shareBusy}
                    onClick={() => void copyReportLink()}
                  >
                    {shareBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    Copy link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full gap-2 sm:flex-1", instituteSecondaryClass)}
                    disabled={shareBusy}
                    onClick={() => void openEmailShare()}
                  >
                    {shareBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Mail className="h-4 w-4" aria-hidden />
                    )}
                    Email
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

        {/* Final whiteboard */}
        <Card className={reportCardClass}>
          <Dialog>
            <div className={cn("flex flex-wrap items-center justify-between gap-2", reportCardHeaderClass)}>
              <div className="flex items-center gap-2">
                <div className={iconShellClass}>
                  <LayoutGrid className="h-5 w-5" aria-hidden />
                </div>
                <span className="font-semibold text-foreground">Final whiteboard</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("shrink-0 gap-2", instituteSecondaryClass)}
                    disabled={!wbJson}
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
                    View architecture
                  </Button>
                </DialogTrigger>
              </div>
            </div>
            <DialogContent className="flex h-[85vh] max-w-[min(1180px,96vw)] flex-col gap-0 overflow-hidden p-0">
              <DialogHeader className="shrink-0 border-b px-4 py-3">
                <DialogTitle>{problemTitle} — diagram</DialogTitle>
              </DialogHeader>
              <div className="relative min-h-0 flex-1 px-3 pb-3 pt-0">
                {wbJson ? (
                  <div className="h-full">
                    <ExcalidrawBoard
                      sessionId={sessionId}
                      initialSnapshotJson={wbJson}
                      readOnly
                      hideMainMenu
                    />
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
          <CardContent className="p-3">
            {wbJson ? (
              <div className="h-[min(280px,32vh)] w-full lg:h-[min(320px,36vh)]">
                <ExcalidrawBoard
                  sessionId={sessionId}
                  initialSnapshotJson={wbJson}
                  readOnly
                  hideMainMenu
                />
              </div>
            ) : (
              <div className="flex h-[min(240px,28vh)] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground dark:border-border dark:bg-muted/20 ">
                No whiteboard snapshot was saved for this session.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overall score */}
        <Card className={reportCardClass}>
          <div
            className={`h-1 bg-gradient-to-r ${getScoreGradient(report.overallScore)}`}
          />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">Overall performance</h2>
                <p className="text-muted-foreground">
                  Holistic rubric score using your transcript and diagram (async evaluator).
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div
                  className={cn(
                    "text-5xl font-bold tabular-nums sm:text-6xl",
                    getScoreColor(report.overallScore),
                  )}
                >
                  {report.overallScore}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimension scores */}
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
          {DIMENSION_BLOCKS.map(({ key, label, weightLabel, Icon }) => (
            <DimensionScoreCard
              key={key}
              label={label}
              weightLabel={weightLabel}
              value={report.dimensionScores[key]}
              verdict={verdicts[key]?.trim() || undefined}
              Icon={Icon}
            />
          ))}
        </div>

        {/* Strengths-style rows */}
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
          <Card className={cn(reportCardClass, "border-emerald-200/40")}>
            <CardHeader className={reportCardHeaderClass}>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-emerald-700">
                <CheckCircle className="h-5 w-5" aria-hidden />
                What you did well
              </CardTitle>
              <CardDescription>Evidence-backed strengths from your session.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {report.whatYouDidWell.length ? (
                <ul className="space-y-3">
                  {report.whatYouDidWell.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                      <span className="text-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No items listed for this report.</p>
              )}
            </CardContent>
          </Card>

          <Card className={reportCardClass}>
            <CardHeader className={reportCardHeaderClass}>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#7367F0]">
                <TrendingUp className="h-5 w-5" aria-hidden />
                Gaps in your design
              </CardTitle>
              <CardDescription>
                Missing pieces or weak justifications for this problem.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {report.gapsInDesign.length ? (
                <ul className="space-y-3">
                  {report.gapsInDesign.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" aria-hidden />
                      <span className="text-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No gaps listed for this report.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
          <Card className={reportCardClass}>
            <CardHeader className={reportCardHeaderClass}>
              <div className="flex items-center gap-3">
                <div className={iconShellClass}>
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Technical approaches covered</CardTitle>
                  <CardDescription>Themes and techniques you demonstrated.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {report.approachesCovered.length ? (
                <ul className="space-y-3">
                  {report.approachesCovered.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-foreground">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" aria-hidden />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None listed.</p>
              )}
            </CardContent>
          </Card>

          <Card className={reportCardClass}>
            <CardHeader className={reportCardHeaderClass}>
              <div className="flex items-center gap-3">
                <div className={cn(iconShellClass, "text-amber-600")}>
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Missed or weak areas</CardTitle>
                  <CardDescription>
                    Important angles that needed more depth for this task.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {report.approachesMissedOrWeak.length ? (
                <ul className="space-y-3">
                  {report.approachesMissedOrWeak.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-foreground">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None listed.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className={reportCardClass}>
          <CardHeader className={reportCardHeaderClass}>
            <div className="flex items-center gap-3">
              <div className={iconShellClass}>
                <MessageSquare className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Concrete recommendations</CardTitle>
                <CardDescription>Actionable next reps tied to how you interviewed.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {report.concreteRecommendations.length ? (
              <ol className="list-decimal space-y-3 pl-5 text-foreground">
                {report.concreteRecommendations.map((step) => (
                  <li key={step} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No additional steps listed.</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border border-[#7367F0]/15 bg-gradient-to-br from-[#7367F0]/[0.06] via-card to-[#7367F0]/[0.04] shadow-card">
          <CardContent className="p-6 text-center sm:p-8">
            <h2 className="mb-3 text-xl font-bold text-foreground sm:text-2xl">
              Practice another system design?
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-muted-foreground">
              Keep rehearsing problems and refining how you sketch and narrate trade-offs.
            </p>
            <Button size="lg" asChild className={institutePrimaryClass}>
              <Link href="/dashboard/system-design">Back to system design hub</Link>
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
