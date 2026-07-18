"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Download,
  Loader2,
  Mail,
  Phone,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { IxCommunicationBreakdown } from "@/components/ix-score/IxCommunicationBreakdown";
import { IxOverallScoreHero } from "@/components/ix-score/IxOverallScoreHero";
import { IxReportPageHero } from "@/components/ix-score/IxReportPageHero";
import { IxReportPdfActions } from "@/components/ix-score/IxReportPdfActions";
import {
  IxSessionHistoryTable,
  type IxSessionHistoryFetchParams,
} from "@/components/ix-score/IxSessionHistoryTable";
import { HiringStatusInlineSelect } from "@/components/recruiter/HiringStatusInlineSelect";
import {
  CandidateStatusBadge,
} from "@/components/recruiter/RecruiterStatusBadges";
import {
  recruiterApi,
  type HiringStatus,
  type IxScoreSnapshot,
  type TalentCandidateDetail,
} from "@/lib/api";
import { ixReportHeroGradient } from "@/lib/ix-report-theme";
import { cn } from "@/lib/utils";

function candidateInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function CandidatePhoto({
  name,
  profilePictureUrl,
  size = "md",
  className,
}: Readonly<{
  name: string;
  profilePictureUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
}>) {
  const sizeClass =
    size === "lg"
      ? "h-24 w-24 text-2xl rounded-3xl"
      : "h-16 w-16 text-lg rounded-2xl";

  if (profilePictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profilePictureUrl}
        alt={name}
        className={cn(
          "shrink-0 object-cover ring-2 ring-[#7367F0]/15",
          sizeClass,
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br from-[#7367F0]/20 to-[#7367F0]/5 font-bold text-[#7367F0] ring-2 ring-[#7367F0]/10",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {candidateInitials(name) || "?"}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: Readonly<{
  icon: typeof Mail;
  label: string;
  value?: string | null;
}>) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams<{ clerkId: string }>();
  const clerkId = params?.clerkId;
  const [detail, setDetail] = useState<TalentCandidateDetail | null>(null);
  const [snapshot, setSnapshot] = useState<IxScoreSnapshot | null>(null);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    if (!clerkId) return;
    setLoading(true);
    try {
      const [candidate, ixReport] = await Promise.all([
        recruiterApi.getCandidate(clerkId),
        recruiterApi.getCandidateIxReport(clerkId),
      ]);
      setDetail(candidate);
      setSnapshot(ixReport.snapshot);
      setCandidateEmail(ixReport.candidate.email ?? candidate.email ?? "");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load candidate");
    } finally {
      setLoading(false);
    }
  }, [clerkId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (globalThis.window?.location.hash === "#ix-report") {
      globalThis.window.requestAnimationFrame(() => {
        document.getElementById("ix-report")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [loading, snapshot]);

  const fetchSessions = useCallback(
    (params: IxSessionHistoryFetchParams) => {
      if (!clerkId) {
        return Promise.resolve({ rows: [], total: 0 });
      }
      return recruiterApi.listCandidateSessions(clerkId, params).then((data) => ({
        rows: data.rows,
        total: data.total,
      }));
    },
    [clerkId],
  );

  const downloadResume = async () => {
    if (!clerkId) return;
    setDownloading(true);
    try {
      const { url } = await recruiterApi.getCandidateResumeUrl(clerkId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "No resume available");
    } finally {
      setDownloading(false);
    }
  };

  const shortlist = async () => {
    if (!clerkId) return;
    setShortlisting(true);
    try {
      const res = await recruiterApi.shortlist(clerkId);
      setDetail((prev) =>
        prev ? { ...prev, hiringStatus: res.hiringStatus } : prev,
      );
      toast.success("Candidate shortlisted");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not shortlist");
    } finally {
      setShortlisting(false);
    }
  };

  const updateStatus = async (status: HiringStatus) => {
    if (!clerkId || !detail?.hiringStatus || status === detail.hiringStatus) {
      return;
    }
    setSavingStatus(true);
    try {
      const res = await recruiterApi.updateHiringStatus(clerkId, status);
      setDetail((prev) =>
        prev ? { ...prev, hiringStatus: res.hiringStatus } : prev,
      );
      toast.success("Hiring status updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not update status");
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#7367F0]/20" />
          <Loader2 className="relative h-10 w-10 animate-spin text-[#7367F0]" />
        </div>
        <p className="text-sm text-muted-foreground">Loading candidate profile…</p>
      </div>
    );
  }

  if (!detail || !snapshot) {
    return (
      <div className={cn(ixReportHeroGradient, "p-8 text-center")}>
        <p className="text-sm text-muted-foreground">Candidate not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/ix-recruiter/candidates">Back to talent</Link>
        </Button>
      </div>
    );
  }

  const headerActions = (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
      {detail.hiringStatus ? (
        <HiringStatusInlineSelect
          id="candidate-hiring-status"
          value={detail.hiringStatus}
          onChange={(status) => void updateStatus(status)}
          saving={savingStatus}
          className="col-span-2 sm:col-span-1"
        />
      ) : (
        <Button
          type="button"
          disabled={shortlisting}
          onClick={() => void shortlist()}
          className="col-span-2 h-10 w-full justify-center bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:col-span-1 sm:w-auto"
        >
          {shortlisting ? (
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4 shrink-0" />
          )}
          Shortlist
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={!detail.hasResume || downloading}
        onClick={() => void downloadResume()}
        className="h-10 w-full justify-center sm:w-auto"
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4 shrink-0" />
        )}
        View Resume
      </Button>
      <Button
        asChild
        variant="outline"
        className={cn(
          "h-10 w-full justify-center sm:w-auto",
          detail.hiringStatus && "col-span-2 sm:col-span-1",
        )}
      >
        <a href="#ix-report">
          <Star className="mr-2 h-4 w-4 shrink-0" />
          View iX Report
        </a>
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/dashboard/ix-recruiter/candidates">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to talent
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <CandidatePhoto
            name={detail.name}
            profilePictureUrl={detail.profilePictureUrl}
            size="lg"
            className="h-16 w-16 rounded-2xl text-lg sm:h-24 sm:w-24 sm:rounded-3xl sm:text-2xl"
          />
          <PageHeader
            title={detail.name}
            badge="Candidate profile"
            description={detail.role || "Candidate"}
            className="min-w-0 flex-1"
          />
        </div>
        <div className="flex w-full shrink-0 sm:w-auto sm:items-center sm:justify-end">
          {headerActions}
        </div>
      </div>

      <div
        className={cn(
          ixReportHeroGradient,
          "ix-report-enter space-y-4 p-5 sm:p-6",
        )}
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Candidate details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Profile information and current job-search status
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={Mail} label="Email" value={detail.email} />
          <InfoItem icon={Phone} label="Phone" value={detail.phone} />
          <InfoItem icon={Briefcase} label="Role" value={detail.role} />
          <InfoItem
            icon={Building2}
            label="Current company"
            value={detail.company}
          />
          <InfoItem
            icon={Briefcase}
            label="Industry"
            value={detail.industry || "—"}
          />
          <InfoItem
            icon={Briefcase}
            label="Experience"
            value={
              detail.experience != null
                ? `${detail.experience} year${detail.experience === 1 ? "" : "s"}`
                : undefined
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="text-xs text-muted-foreground">
            Candidate status:
          </span>
          <CandidateStatusBadge status={detail.candidateStatus} />
        </div>
      </div>

      <div id="ix-report" className="ix-report-stagger space-y-4 sm:space-y-6">
        <IxReportPageHero
          score={snapshot.overall.average}
          title={`${detail.name}'s iX Report`}
          description="Complete performance report across opted-in interview categories — scores, communication breakdown, and session history."
          actions={
            <IxReportPdfActions
              snapshot={snapshot}
              candidateName={detail.name}
              candidateEmail={candidateEmail}
            />
          }
        />

        <IxOverallScoreHero snapshot={snapshot} viewerMode="candidate" />

        <IxCommunicationBreakdown communication={snapshot.communication} />

        <div className="ix-report-enter">
          <IxSessionHistoryTable
            title="Interviews by category"
            description="Review scored sessions by interview type. Watch recordings, open reports, or download artifacts where available."
            idPrefix="recruiter-ix"
            recruiterCandidateClerkId={clerkId}
            fetchSessions={fetchSessions}
          />
        </div>
      </div>
    </div>
  );
}
