"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { recruiterApi, type IxSessionRow } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";

export function RecruiterSessionRowActions({
  candidateClerkId,
  row,
}: Readonly<{
  candidateClerkId: string;
  row: IxSessionRow;
}>) {
  const [videoLoading, setVideoLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  if (row.status === "processing") {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const reportHref = `/dashboard/ix-recruiter/candidates/${candidateClerkId}/sessions/${encodeURIComponent(row.id)}/report?${new URLSearchParams({
    source: row.source,
    ...(row.hasVideo ? { video: "1" } : {}),
    ...(row.hasReportPdf ? { pdf: "1" } : {}),
  }).toString()}`;

  const watchVideo = async () => {
    setVideoLoading(true);
    try {
      const { videoUrl } = await recruiterApi.getCandidateSessionVideoUrl(
        candidateClerkId,
        row.id,
        row.source,
      );
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No recording available"));
    } finally {
      setVideoLoading(false);
    }
  };

  const downloadSession = async () => {
    setDownloadLoading(true);
    try {
      const kind = row.hasReportPdf ? "report" : "video";
      const { downloadUrl } = await recruiterApi.getCandidateSessionDownloadUrl(
        candidateClerkId,
        row.id,
        row.source,
        kind,
      );
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Download unavailable"));
    } finally {
      setDownloadLoading(false);
    }
  };

  const canDownload = Boolean(row.hasReportPdf || row.hasVideo);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {row.hasVideo ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={videoLoading}
          onClick={() => void watchVideo()}
        >
          {videoLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlayCircle className="h-3.5 w-3.5" />
          )}
          <span className="ml-1 hidden sm:inline">Watch</span>
        </Button>
      ) : null}
      <Button asChild variant="outline" size="sm" className="h-8 px-2">
        <Link href={reportHref}>
          <Eye className="h-3.5 w-3.5" />
          <span className="ml-1 hidden sm:inline">Report</span>
        </Link>
      </Button>
      {canDownload ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={downloadLoading}
          onClick={() => void downloadSession()}
        >
          {downloadLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span className="ml-1 hidden sm:inline">Download</span>
        </Button>
      ) : null}
    </div>
  );
}
