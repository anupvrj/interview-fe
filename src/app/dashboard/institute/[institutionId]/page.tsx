"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarClock,
  ArrowRight,
  Building2,
  Sparkles,
  Layers,
  Coins,
  BarChart2,
  CheckCircle2,
  PlayCircle,
  Clock,
  Wallet,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import {
  InstituteLoader,
  InstitutePageHeader,
  InstituteStatCard,
  institutePanelClass,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { cn } from "@/lib/utils";

const PLAN_ORDER = ["free", "starter", "premium", "elite"] as const;

export default function InstituteOverviewPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    institution: Record<string, unknown> & { userCount?: number; maxUsers?: number | null };
    userCount: number;
    planCounts: Record<string, number>;
    scheduledPending: number;
    batchCount: number;
    totalBatchMemberSlots: number;
    scheduleCounts: { scheduled: number; started: number; cancelled: number };
    creditsPool: number;
    interviewsCompleted: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getInstitutionDashboard(institutionId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  const planTotal = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.planCounts).reduce((a, n) => a + n, 0);
  }, [data]);

  if (loading) {
    return <InstituteLoader label="Loading institution…" />;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-8 text-center text-sm text-red-900">
        Could not load institution.
      </div>
    );
  }

  const inst = data.institution;
  const maxU = inst.maxUsers != null ? inst.maxUsers : null;
  const sc = data.scheduleCounts;
  const scheduleTotal = sc.scheduled + sc.started + sc.cancelled;

  const instName =
    typeof inst.name === "string" && inst.name.trim() ? inst.name : "Overview";
  const domainStr =
    typeof inst.domain === "string" && inst.domain.trim() ? inst.domain : null;
  const contactStr =
    typeof inst.contactEmail === "string" && inst.contactEmail.trim()
      ? inst.contactEmail
      : null;

  const batchFooter =
    data.totalBatchMemberSlots > 0
      ? `${data.totalBatchMemberSlots} cohort seat${data.totalBatchMemberSlots === 1 ? "" : "s"} (sum of batch rosters)`
      : "No cohorts yet";

  return (
    <div className="space-y-8">
      <InstitutePageHeader
        badge="Institution"
        title={instName}
        description={
          <>
            {domainStr ?? "—"}
            {contactStr ? ` · ${contactStr}` : ""}
          </>
        }
      />

      <section
        className={cn(
          institutePanelClass,
          "relative overflow-hidden border-blue-200/50 bg-gradient-to-br from-blue-50/70 via-white to-slate-50/90"
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
          <div className="flex shrink-0 justify-center sm:justify-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/60 sm:h-[4.5rem] sm:w-[4.5rem]">
              <Building2 className="h-8 w-8 text-white sm:h-9 sm:w-9" strokeWidth={1.75} />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[rgb(37,99,235)]">
                Admin overview
              </p>
              <p className="mt-2 text-base leading-relaxed text-slate-600 sm:text-lg">
                Invite candidates, organize <span className="font-semibold text-slate-800">batches</span>
                , schedule interviews, and track{" "}
                <span className="font-semibold text-slate-800">plans &amp; credits</span> from one
                place.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button asChild className={cn(institutePrimaryClass, "gap-2 shadow-lg")}>
                <Link href={`/dashboard/institute/${institutionId}/candidates`}>
                  <Users className="h-4 w-4" />
                  Candidates
                </Link>
              </Button>
              <Button asChild variant="outline" className={cn(instituteSecondaryClass, "gap-2")}>
                <Link href={`/dashboard/institute/${institutionId}/batches`}>
                  <Layers className="h-4 w-4" />
                  Batches
                </Link>
              </Button>
              <Button asChild variant="outline" className={cn(instituteSecondaryClass, "gap-2")}>
                <Link href={`/dashboard/institute/${institutionId}/schedules`}>
                  <CalendarClock className="h-4 w-4" />
                  Schedules
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InstituteStatCard
          layout="horizontal"
          icon={Users}
          label="Members"
          value={data.userCount}
          footer={maxU != null ? `Cap ${maxU}` : "No member cap"}
        />
        <InstituteStatCard
          layout="horizontal"
          icon={Layers}
          label="Batches"
          value={data.batchCount}
          footer={batchFooter}
        />
        <InstituteStatCard
          layout="horizontal"
          icon={CalendarClock}
          label="Schedules (pending)"
          value={sc.scheduled}
          footer="Awaiting candidate start"
        />
        <InstituteStatCard
          layout="horizontal"
          icon={PlayCircle}
          label="Interviews in progress"
          value={sc.started}
          footer="Schedule started, session active"
        />
        <InstituteStatCard
          layout="horizontal"
          icon={CheckCircle2}
          label="Interviews completed"
          value={data.interviewsCompleted}
          footer="Finished sessions (candidates)"
        />
        <InstituteStatCard
          layout="horizontal"
          icon={Coins}
          label="Credits pool"
          value={data.creditsPool.toLocaleString()}
          footer="Sum of available credits (candidates)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          className={cn(
            institutePanelClass,
            "overflow-hidden border-blue-200/40 bg-gradient-to-br from-white to-slate-50/80"
          )}
        >
          <div className="flex gap-4 border-b border-blue-100/60 bg-gradient-to-r from-blue-50/40 to-transparent p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md ring-2 ring-blue-200/40">
              <BarChart2 className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-bold text-slate-900">Schedule activity</h2>
              <p className="text-xs text-slate-600">
                Pipeline for institution-wide interview schedules (not batch-only).
              </p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Scheduled</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{sc.scheduled}</p>
              </div>
              <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-3 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-[rgb(37,99,235)]">
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Started</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{sc.started}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wide">Cancelled</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-700">{sc.cancelled}</p>
              </div>
            </div>
            {scheduleTotal > 0 ? (
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full w-full">
                  <div
                    className="bg-slate-400/90 transition-all"
                    style={{ width: `${(sc.scheduled / scheduleTotal) * 100}%` }}
                    title="Scheduled"
                  />
                  <div
                    className="bg-[rgb(37,99,235)] transition-all"
                    style={{ width: `${(sc.started / scheduleTotal) * 100}%` }}
                    title="Started"
                  />
                  <div
                    className="bg-rose-300/90 transition-all"
                    style={{ width: `${(sc.cancelled / scheduleTotal) * 100}%` }}
                    title="Cancelled"
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-center text-sm text-slate-500">No schedules yet.</p>
            )}
            <Button
              variant="link"
              className="mt-3 h-auto w-full justify-center p-0 text-sm font-semibold text-[rgb(37,99,235)]"
              asChild
            >
              <Link href={`/dashboard/institute/${institutionId}/schedules`}>
                View all schedules <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </section>

        <section
          className={cn(
            institutePanelClass,
            "overflow-hidden border-blue-200/40 bg-gradient-to-br from-white to-slate-50/80"
          )}
        >
          <div className="flex gap-4 border-b border-blue-100/60 bg-gradient-to-r from-blue-50/40 to-transparent p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md ring-2 ring-blue-200/40">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-bold text-slate-900">Plans (candidates)</h2>
              <p className="text-xs text-slate-600">
                Distribution across member accounts{planTotal > 0 ? ` · ${planTotal} total` : ""}.
              </p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {PLAN_ORDER.map((plan) => {
              const n = data.planCounts[plan] ?? 0;
              const pct = planTotal > 0 ? Math.round((n / planTotal) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize text-slate-800">{plan}</span>
                    <span className="tabular-nums text-slate-600">
                      {n} <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[rgb(37,99,235)] to-blue-500 transition-all"
                      style={{ width: `${planTotal > 0 ? (n / planTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-6">
        <Button asChild className={cn(institutePrimaryClass, "gap-2 shadow-md")}>
          <Link href={`/dashboard/institute/${institutionId}/candidates`}>
            <Users className="h-4 w-4" />
            Manage candidates
          </Link>
        </Button>
        <Button asChild variant="outline" className={cn(instituteSecondaryClass, "gap-2")}>
          <Link href={`/dashboard/institute/${institutionId}/billing`}>
            <Wallet className="h-4 w-4" />
            Billing &amp; credits
          </Link>
        </Button>
        <Button asChild variant="outline" className={instituteSecondaryClass}>
          <Link href={`/dashboard/institute/${institutionId}/settings`}>Institution settings</Link>
        </Button>
      </div>
    </div>
  );
}
