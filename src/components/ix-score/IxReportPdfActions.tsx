"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { IxScoreSnapshot } from "@/lib/api";
import { ixScoreApi } from "@/lib/api";
import { appPrimaryButton } from "@/lib/app-theme";
import { generateIxReportPdfViaServer } from "@/lib/ix-report-pdf-export";
import { getApiErrorMessage } from "@/lib/api-error-message";

type IxReportPdfActionsProps = {
  snapshot: IxScoreSnapshot;
  candidateName: string;
  candidateEmail?: string;
  showEmailAction?: boolean;
};

export function IxReportPdfActions({
  snapshot,
  candidateName,
  candidateEmail = "",
  showEmailAction = true,
}: IxReportPdfActionsProps) {
  const [openingPdf, setOpeningPdf] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  const ensureStoredPdf = async (): Promise<void> => {
    const existing = await ixScoreApi.getReportPdfShareUrl();
    if (existing.stored) return;

    await generateIxReportPdfViaServer({
      snapshot,
      candidateName,
      candidateEmail,
    });
  };

  const resolveShareUrl = async (): Promise<string> => {
    await ensureStoredPdf();
    const after = await ixScoreApi.getReportPdfShareUrl();
    if (after.stored) return after.shareUrl;
    throw new Error("Could not prepare share link");
  };

  const openPdf = async () => {
    setOpeningPdf(true);
    try {
      const { downloadUrl } = await generateIxReportPdfViaServer({
        snapshot,
        candidateName,
        candidateEmail,
      });
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to open PDF report"));
    } finally {
      setOpeningPdf(false);
    }
  };

  const emailShare = async () => {
    setShareBusy(true);
    try {
      const shareUrl = await resolveShareUrl();
      const subject = `iX Report — ${candidateName}`;
      const body = `iX Report PDF (link expires in 7 days):\n\n${shareUrl}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not prepare share link"));
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        className={appPrimaryButton}
        disabled={openingPdf}
        onClick={() => void openPdf()}
      >
        {openingPdf ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="mr-2 h-4 w-4" />
        )}
        Download Report
      </Button>
      {showEmailAction ? (
        <Button
          type="button"
          variant="outline"
          disabled={shareBusy}
          onClick={() => void emailShare()}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email report
        </Button>
      ) : null}
    </div>
  );
}
