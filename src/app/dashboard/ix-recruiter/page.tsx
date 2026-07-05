"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Loader2,
  PauseCircle,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { UpdateHiringStatusDialog } from "@/components/recruiter/UpdateHiringStatusDialog";
import { HiringStatusBadge } from "@/components/recruiter/RecruiterStatusBadges";
import {
  recruiterApi,
  type HiringStatus,
  type PeerPaginated,
  type RecruiterDashboardStats,
  type ShortlistedCandidateRow,
} from "@/lib/api";
import { appCard, appFilterBar } from "@/lib/app-theme";
import { HIRING_STATUS_LABELS, ixScoreTone } from "@/lib/recruiter";
import { cn } from "@/lib/utils";

const HIRING_STATUS_OPTIONS = Object.entries(HIRING_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const EMPTY: PeerPaginated<ShortlistedCandidateRow> = {
  items: [],
  page: 1,
  pageSize: 15,
  total: 0,
  totalPages: 1,
};

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<RecruiterDashboardStats | null>(null);
  const [data, setData] =
    useState<PeerPaginated<ShortlistedCandidateRow>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] =
    useState<ShortlistedCandidateRow | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchPage = useCallback(async (page: number, hiringStatus: string) => {
    setLoading(true);
    try {
      const res = await recruiterApi.listShortlisted({
        page,
        pageSize: 15,
        hiringStatus: hiringStatus || undefined,
      });
      setData(res);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await recruiterApi.getDashboard());
    } catch {
      /* handled by profile gate */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await recruiterApi.getMyProfile();
        if (profile?.status !== "approved") {
          router.replace("/dashboard/ix-recruiter/apply");
          return;
        }
        setChecking(false);
        await Promise.all([loadStats(), fetchPage(1, "")]);
      } catch {
        router.replace("/dashboard/ix-recruiter/apply");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFilterChange = (value: string) => {
    setFilter(value);
    void fetchPage(1, value);
  };

  const downloadResume = async (clerkId: string) => {
    setDownloading(clerkId);
    try {
      const { url } = await recruiterApi.getCandidateResumeUrl(clerkId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "No resume available");
    } finally {
      setDownloading(null);
    }
  };

  const saveStatus = async (status: HiringStatus) => {
    if (!statusTarget) return;
    setSavingStatus(true);
    try {
      await recruiterApi.updateHiringStatus(statusTarget.clerkId, status);
      toast.success("Hiring status updated");
      setStatusTarget(null);
      await Promise.all([loadStats(), fetchPage(data.page, filter)]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not update status");
    } finally {
      setSavingStatus(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Dashboard"
        badge="iX Talent"
        description="Track your hiring pipeline and discover new candidates."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/ix-recruiter/shortlisted">
                <ClipboardList className="mr-2 h-4 w-4" />
                Shortlisted Talents
              </Link>
            </Button>
            <Button
              asChild
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              <Link href="/dashboard/ix-recruiter/candidates">
                <Search className="mr-2 h-4 w-4" />
                Hire iX Talent
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <DashboardStatCard
          theme="sky"
          label="Shortlisted"
          value={stats?.shortlisted ?? 0}
          icon={Users}
        />
        <DashboardStatCard
          theme="purple"
          label="Interviewing"
          value={stats?.interviewing ?? 0}
          icon={BadgeCheck}
        />
        <DashboardStatCard
          theme="amber"
          label="On-Hold"
          value={stats?.on_hold ?? 0}
          icon={PauseCircle}
        />
        <DashboardStatCard
          theme="emerald"
          label="Hired"
          value={stats?.hired ?? 0}
          icon={CheckCircle2}
        />
      </div>

      <div className={cn(appFilterBar, "flex flex-wrap items-end gap-3")}>
        <div className="w-full space-y-1.5 sm:w-64">
          <p className="text-sm font-medium text-foreground">Hiring status</p>
          <AppSelect
            value={filter}
            onChange={onFilterChange}
            allowEmpty
            emptyLabel="All statuses"
            options={HIRING_STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className={cn(appCard, "overflow-hidden")}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No shortlisted candidates yet.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard/ix-recruiter/candidates">
                Find candidates
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                    <th className="px-5 py-3 text-left">Candidate</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Current company</th>
                    <th className="px-5 py-3 text-left">iX Score</th>
                    <th className="px-5 py-3 text-left">Hiring status</th>
                    <th className="w-[120px] min-w-[120px] whitespace-nowrap px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr
                      key={c.clerkId}
                      className="border-b border-border/60 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.email}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {c.role || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {c.company || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "text-base font-semibold",
                            ixScoreTone(c.ixScore),
                          )}
                        >
                          {c.ixScore != null ? c.ixScore : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <HiringStatusBadge status={c.hiringStatus} />
                      </td>
                      <td className="w-[120px] min-w-[120px] whitespace-nowrap px-5 py-3.5">
                        <div className="flex flex-nowrap items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="Update hiring status"
                            aria-label="Update hiring status"
                            onClick={() => setStatusTarget(c)}
                          >
                            <BadgeCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="Download resume"
                            aria-label="Download resume"
                            disabled={!c.hasResume || downloading === c.clerkId}
                            onClick={() => void downloadResume(c.clerkId)}
                          >
                            {downloading === c.clerkId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            asChild
                            size="icon"
                            className="h-8 w-8 shrink-0 bg-[#7367F0] text-white hover:bg-[#6e62e5]"
                          >
                            <Link
                              href={`/dashboard/ix-recruiter/candidates/${c.clerkId}`}
                              title="View candidate"
                              aria-label="View candidate"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {data.total} candidate{data.total === 1 ? "" : "s"}
              </p>
              {data.totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => void fetchPage(data.page - 1, filter)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= data.totalPages}
                    onClick={() => void fetchPage(data.page + 1, filter)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <UpdateHiringStatusDialog
        open={statusTarget !== null}
        candidateName={statusTarget?.name ?? ""}
        current={statusTarget?.hiringStatus ?? null}
        saving={savingStatus}
        onClose={() => setStatusTarget(null)}
        onSave={(status) => void saveStatus(status)}
      />
    </div>
  );
}
