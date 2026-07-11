"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IxOptInBanner } from "@/components/ix-score/IxOptInBanner";
import { IxOverallScoreHero } from "@/components/ix-score/IxOverallScoreHero";
import { IxCommunicationBreakdown } from "@/components/ix-score/IxCommunicationBreakdown";
import { IxSessionHistoryTable } from "@/components/ix-score/IxSessionHistoryTable";
import { IxReportPdfActions } from "@/components/ix-score/IxReportPdfActions";
import { IxReportPageHero } from "@/components/ix-score/IxReportPageHero";
import { ixScoreApi, type IxScoreSnapshot } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";

export default function IxReportPage() {
  const { user } = useUser();
  const [snapshot, setSnapshot] = useState<IxScoreSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await ixScoreApi.getSnapshot(true);
      setSnapshot(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to load iX Report"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const candidateName =
    user?.fullName || user?.firstName || user?.username || "Candidate";
  const candidateEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#7367F0]/20" />
          <Loader2 className="relative h-10 w-10 animate-spin text-[#7367F0]" />
        </div>
        <p className="text-sm text-muted-foreground">Loading your iX Report…</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="space-y-4">
        <IxReportPageHero score={null} />
        <p className="text-sm text-muted-foreground">
          Unable to load your iX Report. Try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="ix-report-stagger space-y-4 sm:space-y-6">
      <IxReportPageHero
        score={snapshot.overall.average}
        actions={
          <IxReportPdfActions
            snapshot={snapshot}
            candidateName={candidateName}
            candidateEmail={candidateEmail}
            showEmailAction={false}
          />
        }
      />

      <IxOptInBanner optIns={snapshot.optIns} onSaved={setSnapshot} />

      <IxOverallScoreHero snapshot={snapshot} />

      <IxCommunicationBreakdown communication={snapshot.communication} />

      <div className="ix-report-enter">
        <IxSessionHistoryTable />
      </div>
    </div>
  );
}
