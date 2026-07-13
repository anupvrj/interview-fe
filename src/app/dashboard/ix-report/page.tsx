"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IxOptInBanner } from "@/components/ix-score/IxOptInBanner";
import { IxOverallScoreHero } from "@/components/ix-score/IxOverallScoreHero";
import { IxCommunicationBreakdown } from "@/components/ix-score/IxCommunicationBreakdown";
import { IxSessionHistoryTable } from "@/components/ix-score/IxSessionHistoryTable";
import { IxReportPdfActions } from "@/components/ix-score/IxReportPdfActions";
import { IxReportPageHero } from "@/components/ix-score/IxReportPageHero";
import { IxReportLockedGate } from "@/components/ix-score/IxReportLockedGate";
import { useEntitlements } from "@/hooks/useEntitlements";
import { ixScoreApi, type IxScoreSnapshot } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";

function isIxEntitlementDenied(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response?.status === 403) return true;
  const msg = getApiErrorMessage(error, "");
  return /upgraded plan|upgrade/i.test(msg);
}

export default function IxReportPage() {
  const { user } = useUser();
  const { canUse, loading: entitlementsLoading, data } = useEntitlements();
  const [snapshot, setSnapshot] = useState<IxScoreSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const ixLockedByEntitlement =
    !entitlementsLoading && data != null && !canUse("ixScore");

  const load = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await ixScoreApi.getSnapshot(true);
      setSnapshot(res);
    } catch (e) {
      if (isIxEntitlementDenied(e)) {
        setAccessDenied(true);
        setSnapshot(null);
        return;
      }
      toast.error(getApiErrorMessage(e, "Failed to load iX Report"));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entitlementsLoading) return;

    if (!canUse("ixScore")) {
      setAccessDenied(true);
      setSnapshot(null);
      setLoading(false);
      return;
    }

    void load();
  }, [entitlementsLoading, data?.entitlements.ixScore]);

  const candidateName =
    user?.fullName || user?.firstName || user?.username || "Candidate";
  const candidateEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  if (loading || entitlementsLoading) {
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

  if (ixLockedByEntitlement || accessDenied) {
    return <IxReportLockedGate />;
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
