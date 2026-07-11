"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InterviewReportAnalysis } from "@/components/institution/InterviewReportAnalysis";
import {
  recruiterApi,
  type InterviewReport,
  type RecruiterSessionReportPayload,
  type RecruiterSessionSource,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { ixScoreColorClass } from "@/lib/ix-score-colors";
import { cn, formatDate } from "@/lib/utils";

function isRecruiterSessionSource(value: string | null): value is RecruiterSessionSource {
  return (
    value === "ai" ||
    value === "coding" ||
    value === "system_design" ||
    value === "peer"
  );
}

function PeerScoreGrid({
  overall,
  technical,
  behavioural,
  communication,
  comments,
}: Readonly<{
  overall?: number | null;
  technical?: number | null;
  behavioural?: number | null;
  communication?: number | null;
  comments?: string | null;
}>) {
  const tiles = [
    { label: "Overall", value: overall },
    { label: "Technical", value: technical },
    { label: "Behavioural", value: behavioural },
    { label: "Communication", value: communication },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-card">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-[#7367F0]/10 bg-[#7367F0]/[0.04] p-4 text-center"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p
              className={cn(
                "mt-2 text-2xl font-bold tabular-nums",
                tile.value != null
                  ? ixScoreColorClass(tile.value)
                  : "text-muted-foreground",
              )}
            >
              {tile.value != null ? `${tile.value}/100` : "—"}
            </p>
          </div>
        ))}
      </div>
      {comments ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Interviewer comments
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {comments}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function RecruiterCandidateSessionReportPage() {
  const params = useParams<{ clerkId: string; sessionId: string }>();
  const searchParams = useSearchParams();
  const candidateClerkId = params?.clerkId ?? "";
  const sessionId = params?.sessionId ?? "";
  const sourceParam = searchParams.get("source");
  const source = isRecruiterSessionSource(sourceParam) ? sourceParam : null;
  const hasVideo = searchParams.get("video") === "1";
  const hasReportPdf = searchParams.get("pdf") === "1";

  const [payload, setPayload] = useState<RecruiterSessionReportPayload | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const load = useCallback(async () => {
    if (!candidateClerkId || !sessionId || !source) return;
    setLoading(true);
    try {
      const data = await recruiterApi.getCandidateSessionReport(
        candidateClerkId,
        sessionId,
        source,
      );
      setPayload(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load interview report"));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [candidateClerkId, sessionId, source]);

  useEffect(() => {
    void load();
  }, [load]);

  const backHref = `/dashboard/ix-recruiter/candidates/${candidateClerkId}#ix-report`;

  const watchVideo = async () => {
    if (!source) return;
    setVideoLoading(true);
    try {
      const { videoUrl } = await recruiterApi.getCandidateSessionVideoUrl(
        candidateClerkId,
        sessionId,
        source,
      );
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No recording available"));
    } finally {
      setVideoLoading(false);
    }
  };

  const downloadArtifact = async (kind: "report" | "video") => {
    if (!source) return;
    setDownloadLoading(true);
    try {
      const { downloadUrl } = await recruiterApi.getCandidateSessionDownloadUrl(
        candidateClerkId,
        sessionId,
        source,
        kind,
      );
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Download unavailable"));
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!source) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Missing or invalid session type.
        </p>
        <Button asChild variant="outline">
          <Link href={backHref}>Back to candidate</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Interview report not available.
        </p>
        <Button asChild variant="outline">
          <Link href={backHref}>Back to candidate</Link>
        </Button>
      </div>
    );
  }

  const headerActions =
    hasVideo || hasReportPdf ? (
      <div className="flex flex-wrap gap-2">
        {hasVideo ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={videoLoading}
            onClick={() => void watchVideo()}
          >
            {videoLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Watch video
          </Button>
        ) : null}
        {hasReportPdf ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={downloadLoading}
            onClick={() => void downloadArtifact("report")}
          >
            {downloadLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download report
          </Button>
        ) : null}
        {hasVideo ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={downloadLoading}
            onClick={() => void downloadArtifact("video")}
          >
            <Download className="mr-2 h-4 w-4" />
            Download video
          </Button>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to candidate
        </Link>
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Interview report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Candidate session · {source.replace(/_/g, " ")}
          </p>
        </div>
        {headerActions ? headerActions : null}
      </div>

      {payload.kind === "interview" ? (
        <InterviewReportAnalysis report={payload.report as InterviewReport} />
      ) : null}

      {payload.kind === "system_design" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              System design practice
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {String(payload.session.problemId ?? "Session")}
            </p>
            {payload.session.completedAt ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Completed {formatDate(String(payload.session.completedAt))}
              </p>
            ) : null}
          </div>
          <PeerScoreGrid
            overall={Number(payload.report.overallScore ?? payload.session.score)}
            technical={
              typeof payload.report.dimensionScores === "object" &&
              payload.report.dimensionScores &&
              "technicalDepth" in payload.report.dimensionScores
                ? Number(
                    (payload.report.dimensionScores as Record<string, unknown>)
                      .technicalDepth,
                  )
                : null
            }
            behavioural={
              typeof payload.report.dimensionScores === "object" &&
              payload.report.dimensionScores &&
              "tradeoffs" in payload.report.dimensionScores
                ? Number(
                    (payload.report.dimensionScores as Record<string, unknown>)
                      .tradeoffs,
                  )
                : null
            }
            communication={
              typeof payload.report.dimensionScores === "object" &&
              payload.report.dimensionScores &&
              "communication" in payload.report.dimensionScores
                ? Number(
                    (payload.report.dimensionScores as Record<string, unknown>)
                      .communication,
                  )
                : null
            }
            comments={
              typeof payload.report.summary === "string"
                ? payload.report.summary
                : null
            }
          />
        </div>
      ) : null}

      {payload.kind === "peer" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Peer interview
            </p>
            <p className="mt-2 text-lg font-semibold capitalize text-foreground">
              {String(payload.booking.interviewType ?? "Peer session").replace(
                /_/g,
                " ",
              )}
            </p>
            {payload.booking.updatedAt ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Updated {formatDate(String(payload.booking.updatedAt))}
              </p>
            ) : null}
          </div>
          <PeerScoreGrid
            overall={
              payload.report?.overallScore ??
              (payload.booking.interviewerCandidateScore as { overall?: number })
                ?.overall
            }
            technical={
              payload.report?.categoryScores?.technical ??
              (payload.booking.interviewerCandidateScore as { technical?: number })
                ?.technical
            }
            behavioural={
              payload.report?.categoryScores?.behavioral ??
              (payload.booking.interviewerCandidateScore as { behaviour?: number })
                ?.behaviour
            }
            communication={
              payload.report?.categoryScores?.communication ??
              (payload.booking.interviewerCandidateScore as {
                communication?: number;
              })?.communication
            }
            comments={
              payload.report?.pass2Analysis?.overallSummary ??
              (payload.booking.interviewerCandidateScore as { comments?: string })
                ?.comments ??
              null
            }
          />
        </div>
      ) : null}
    </div>
  );
}
