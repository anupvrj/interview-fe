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
  FileCheck,
  FileText,
  ImageIcon,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Palette,
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
      <div className="flex h-[min(320px,36vh)] w-full items-center justify-center rounded-lg border border-border bg-blue-50/60">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(37,99,235)]" />
      </div>
    ),
  },
);

const DIMENSION_BLOCKS: Array<{
  key: keyof SystemDesignPracticeReport["dimensionScores"];
  label: string;
  weightLabel: string;
  gradient: string;
  iconWrap: string;
  iconColor: string;
  Icon: LucideIcon;
}> = [
  {
    key: "scopeRequirements",
    label: "Scope & requirements",
    weightLabel: "~15%",
    gradient: "from-sky-50 to-white dark:from-sky-950/35 dark:to-card",
    iconWrap: "bg-sky-100 dark:bg-sky-900/40",
    iconColor: "text-sky-600 dark:text-sky-300",
    Icon: CircleDot,
  },
  {
    key: "componentArchitecture",
    label: "Component architecture",
    weightLabel: "~25%",
    gradient: "from-blue-50 to-white dark:from-blue-950/50 dark:to-card",
    iconWrap: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-[rgb(37,99,235)] dark:text-blue-300",
    Icon: LayoutGrid,
  },
  {
    key: "scalingDeepDive",
    label: "Scaling & deep dive",
    weightLabel: "~40%",
    gradient: "from-cyan-50 to-white dark:from-cyan-950/35 dark:to-card",
    iconWrap: "bg-cyan-100 dark:bg-cyan-900/40",
    iconColor: "text-cyan-700 dark:text-cyan-300",
    Icon: Zap,
  },
  {
    key: "tradeoffsCommunication",
    label: "Trade-offs & communication",
    weightLabel: "~20%",
    gradient: "from-indigo-50 to-white dark:from-indigo-950/45 dark:to-card",
    iconWrap: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-300",
    Icon: Scale,
  },
];

/** Floating motifs aligned with dashboard AI resume builder / resumes hub (`bg-blue-50` + pale blue icons). */
function ResumeBuilderBlueBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {[...Array(8)].map((_, i) => (
        <div
          key={`rp-bg-a-${i}`}
          className="absolute"
          style={{
            left: `${(i * 15) % 100}%`,
            top: `${(i * 20) % 100}%`,
            opacity: 0.09,
            animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          <FileText className="h-12 w-12 text-blue-400 sm:h-16 sm:w-16" />
        </div>
      ))}
      {[...Array(8)].map((_, i) => (
        <div
          key={`rp-bg-b-${i}`}
          className="absolute"
          style={{
            left: `${(i * 16) % 100}%`,
            top: `${(i * 22) % 100}%`,
            opacity: 0.07,
            animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          <Palette className="h-10 w-10 text-blue-300 sm:h-14 sm:w-14" />
        </div>
      ))}
      {[...Array(6)].map((_, i) => (
        <div
          key={`rp-bg-c-${i}`}
          className="absolute"
          style={{
            left: `${(i * 20) % 100}%`,
            top: `${(i * 15) % 100}%`,
            opacity: 0.06,
            animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          <FileCheck className="h-8 w-8 text-indigo-300 sm:h-12 sm:w-12" />
        </div>
      ))}
    </div>
  );
}

function DimensionScoreCard({
  label,
  weightLabel,
  value,
  verdict,
  gradient,
  iconWrap,
  iconColor,
  Icon,
}: {
  label: string;
  weightLabel: string;
  value: number;
  verdict?: string;
  gradient: string;
  iconWrap: string;
  iconColor: string;
  Icon: LucideIcon;
}) {
  return (
    <Card className={`border-2 bg-gradient-to-br ${gradient}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconWrap}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">{label}</CardTitle>
            <CardDescription>{weightLabel} weight</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center justify-between">
          <span className={`text-3xl font-bold tabular-nums ${getScoreColor(value)}`}>
            {value}
          </span>
          <span className="text-gray-500">/ 100</span>
        </div>
        <Progress value={value} className="h-3" />
        {verdict ? (
          <p className="mt-3 text-sm leading-snug text-gray-700 dark:text-gray-300">
            {verdict}
          </p>
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
      <div className="relative min-h-screen overflow-hidden rounded-md bg-blue-50">
        <ResumeBuilderBlueBackdrop />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-[rgb(37,99,235)]" />
            <p className="text-sm font-medium text-gray-700">
              Building your detailed report…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="relative min-h-screen overflow-hidden rounded-md bg-blue-50 p-4">
        <ResumeBuilderBlueBackdrop />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <Card className="max-w-md border-2 shadow-lg shadow-blue-500/10">
          <CardContent className="pt-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Report unavailable</h3>
            <p className="mb-6 text-gray-600">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => void load()}>
                Retry
              </Button>
              <Button
                type="button"
                asChild
                className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                <Link href="/dashboard/system-design">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                  Back to hub
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
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

  const outlineCtaBtn =
    "border-2 border-[rgb(37,99,235)] font-semibold text-[rgb(37,99,235)] shadow-md transition-all hover:!border-[rgb(17,24,39)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:shadow-lg";

  return (
    <div className="relative min-h-screen overflow-hidden rounded-md bg-blue-50">
      <ResumeBuilderBlueBackdrop />
      <div className="relative z-10">
      <header className="border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <Link
            href="/dashboard/system-design"
            className="inline-flex min-w-0 shrink items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span>System design practice</span>
          </Link>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {sessionLite.recordingS3Key || sessionLite.recordingVideoUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("gap-2", outlineCtaBtn)}
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
              className={cn("gap-2", outlineCtaBtn)}
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
                  className={cn("gap-2", outlineCtaBtn)}
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
                    className="w-full gap-2 sm:flex-1"
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
                    className="w-full gap-2 sm:flex-1"
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
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Practice session report
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-[rgb(37,99,235)]">System design</span>{" "}
              <span className="text-slate-900">session report</span>
            </h1>
            <p className="break-words text-lg font-medium text-slate-700">{problemTitle}</p>
            <p className="mt-2 text-gray-600">
              Completed{" "}
              {sessionLite.completedAt ? formatDate(sessionLite.completedAt) : "recently"}
            </p>
          </div>
        </div>

        {/* Final whiteboard */}
        <Card className="mb-8 overflow-hidden border-2 bg-card shadow-lg shadow-blue-500/10">
          <Dialog>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/25">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <LayoutGrid className="h-5 w-5 text-[rgb(37,99,235)] dark:text-blue-300" aria-hidden />
                </div>
                <span className="font-semibold text-slate-900">Final whiteboard</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("shrink-0 gap-2", outlineCtaBtn, "shadow-sm")}
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
              <div className="flex h-[min(240px,28vh)] items-center justify-center rounded-lg border border-dashed border-blue-200 bg-blue-50/40 text-center text-sm text-gray-600 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-gray-400">
                No whiteboard snapshot was saved for this session.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overall score */}
        <Card className="mb-8 overflow-hidden border-2 shadow-lg shadow-blue-500/10">
          <div
            className={`h-2 bg-gradient-to-r ${getScoreGradient(report.overallScore)}`}
          />
          <CardContent className="bg-gradient-to-br from-blue-50/60 to-card p-8 dark:from-blue-950/20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Overall performance</h2>
                <p className="text-gray-600">
                  Holistic rubric score using your transcript and diagram (async evaluator).
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div
                  className={`text-6xl font-bold tabular-nums ${getScoreColor(
                    report.overallScore,
                  )}`}
                >
                  {report.overallScore}
                </div>
                <div className="text-sm text-gray-500">out of 100</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimension scores */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {DIMENSION_BLOCKS.map(
            ({ key, label, weightLabel, gradient, iconWrap, iconColor, Icon }) => (
              <DimensionScoreCard
                key={key}
                label={label}
                weightLabel={weightLabel}
                value={report.dimensionScores[key]}
                verdict={verdicts[key]?.trim() || undefined}
                gradient={gradient}
                iconWrap={iconWrap}
                iconColor={iconColor}
                Icon={Icon}
              />
            ),
          )}
        </div>

        {/* Strengths-style rows */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white dark:border-green-900/40 dark:from-green-950/30 dark:to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" aria-hidden />
                What you did well
              </CardTitle>
              <CardDescription>Evidence-backed strengths from your session.</CardDescription>
            </CardHeader>
            <CardContent>
              {report.whatYouDidWell.length ? (
                <ul className="space-y-3">
                  {report.whatYouDidWell.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
                      <span className="text-gray-700 dark:text-gray-200">{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No items listed for this report.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:border-blue-900/40 dark:from-blue-950/30 dark:to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <TrendingUp className="h-5 w-5" aria-hidden />
                Gaps in your design
              </CardTitle>
              <CardDescription>
                Missing pieces or weak justifications for this problem.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.gapsInDesign.length ? (
                <ul className="space-y-3">
                  {report.gapsInDesign.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
                      <span className="text-gray-700 dark:text-gray-200">{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No gaps listed for this report.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md shadow-blue-500/10 dark:border-blue-900/40 dark:from-blue-950/25 dark:to-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <CheckCircle2 className="h-6 w-6 text-[rgb(37,99,235)] dark:text-blue-300" aria-hidden />
                </div>
                <div>
                  <CardTitle>Technical approaches covered</CardTitle>
                  <CardDescription>Themes and techniques you demonstrated.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {report.approachesCovered.length ? (
                <ul className="space-y-3">
                  {report.approachesCovered.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(37,99,235)]" aria-hidden />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">None listed.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/20 dark:to-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/40">
                  <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-300" aria-hidden />
                </div>
                <div>
                  <CardTitle>Missed or weak areas</CardTitle>
                  <CardDescription>
                    Important angles that needed more depth for this task.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {report.approachesMissedOrWeak.length ? (
                <ul className="space-y-3">
                  {report.approachesMissedOrWeak.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">None listed.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-2 border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-white shadow-md shadow-blue-500/10 dark:border-blue-900/40 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <MessageSquare className="h-6 w-6 text-[rgb(37,99,235)] dark:text-blue-300" aria-hidden />
              </div>
              <div>
                <CardTitle>Concrete recommendations</CardTitle>
                <CardDescription>Actionable next reps tied to how you interviewed.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {report.concreteRecommendations.length ? (
              <ol className="list-decimal space-y-3 pl-5 text-gray-800 dark:text-gray-100">
                {report.concreteRecommendations.map((step) => (
                  <li key={step} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-600">No additional steps listed.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 shadow-lg shadow-blue-500/15 dark:border-blue-900/50 dark:from-blue-950/35 dark:via-indigo-950/25 dark:to-blue-950/30">
          <CardContent className="p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
              Practice another system design?
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-gray-700 dark:text-gray-300">
              Keep rehearsing problems and refining how you sketch and narrate trade-offs.
            </p>
            <Button
              size="lg"
              asChild
              className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] gap-2 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
            >
              <Link href="/dashboard/system-design">Back to system design hub</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  );
}
