"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, CalendarClock, Loader2, PlayCircle, Plus, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { interviewScheduleApi } from "@/lib/api";
import { readStoredRole } from "@/lib/roles";
import { cn, getInterviewCreditsUsed, scheduledInterviewCanStartNow } from "@/lib/utils";
import { instituteScheduleRoundLabel, routeAfterScheduledStart } from "@/lib/institute-schedule-round";
import {
  buildDashboardRecentSessions,
  countDashboardSessionsByFilter,
  filterDashboardSessions,
  type DashboardRecentSessionRow,
  type DashboardSessionFilter,
} from "@/lib/dashboard-recent-sessions";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { useInterviewsQuery } from "@/hooks/queries/useInterviewsQuery";
import { useSystemDesignSessionsQuery } from "@/hooks/queries/useSystemDesignSessionsQuery";
import { usePeerBookingsQuery } from "@/hooks/queries/usePeerBookingsQuery";
import { useInterviewSchedulesQuery } from "@/hooks/queries/useInterviewSchedulesQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { useDashboardTheme } from "@/components/dashboard-theme";
import { dashboardChartPrimaryFill } from "@/lib/dashboard-stat-themes";
import { DashboardHackathonBanner } from "@/features/hackathon/components/DashboardHackathonBanner";
import { IxOptInNotice } from "@/components/ix-score/IxOptInNotice";
import { InterviewTypeFilterBar } from "@/components/dashboard/InterviewTypeFilterBar";
import { RecentInterviewsList } from "@/components/dashboard/RecentInterviewsList";
import { PracticeSessionGateDialogs } from "@/components/upsell/PracticeSessionGateDialogs";
import { usePracticeSessionGate } from "@/components/upsell/usePracticeSessionGate";
import { Emblem, Mono, type EmblemKind } from "@/components/marketing-2026/primitives";
import { dash2026Scope, EASE, Eyebrow, ScoreRing } from "./ui";

const ONBOARDING_BANNER_DISMISSED_KEY = "dashboard-onboarding-banner-dismissed";
const DAYS = 14;

const KIND_LABEL: Record<DashboardRecentSessionRow["kind"], string> = {
  screening: "AI interview",
  coding: "Coding round",
  systemDesign: "System design",
  peer: "Peer interview",
};

/** The five rounds, in the order people usually take them. Hidden per platform feature flags, same as before. */
const ROUNDS: { href: string; featureKey: string; emblem: EmblemKind; title: string; d: string }[] = [
  { href: "/dashboard/interviews/new", featureKey: "ai_interview", emblem: "voice", title: "AI mock interview", d: "Realistic voice practice with instant feedback" },
  { href: "/dashboard/coding-interviews/new", featureKey: "coding_practice", emblem: "code", title: "Coding round", d: "Timed rounds on curated problem sets" },
  { href: "/dashboard/system-design/new", featureKey: "system_design", emblem: "whiteboard", title: "System design", d: "Whiteboard and a voice interviewer on one canvas" },
  { href: "/dashboard/peer-interviews/book", featureKey: "peer_booking", emblem: "peers", title: "Peer interview", d: "Live mock sessions with verified interviewers" },
  { href: "/dashboard/resumes/new", featureKey: "resume_builder", emblem: "resume", title: "Resume builder", d: "ATS-friendly templates and AI polish" },
];

function greeting(d: Date) {
  const h = d.getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function CandidateHome() {
  const { theme } = useDashboardTheme();
  const reduce = useReducedMotion();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const roleCtx = useActiveRole();
  const profile = roleCtx?.profile ?? null;
  const roleReady = roleCtx?.ready ?? false;
  const { data: interviews = [], isLoading: interviewsLoading } = useInterviewsQuery();
  const { data: systemDesignSessions = [] } = useSystemDesignSessionsQuery();
  const { data: peerBookings = [] } = usePeerBookingsQuery();
  const { data: scheduledInterviews = [] } = useInterviewSchedulesQuery();
  const { invalidate } = useDashboardInvalidation();
  const { isNavHrefVisible } = usePlatformFeatures();
  const { startPracticeSession, checkingSubscription, ...practiceGate } = usePracticeSessionGate();
  const profileCompletion = profile?.profileCompletionPercentage ?? 0;

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<DashboardSessionFilter>("all");
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(null);
  /** null = not read yet (avoid flash); false = show banner; true = dismissed */
  const [bannerDismissed, setBannerDismissed] = useState<boolean | null>(null);
  const [videoUnavailableOpen, setVideoUnavailableOpen] = useState(false);

  const sessions = useMemo(
    () => buildDashboardRecentSessions({ interviews, systemDesignSessions, peerBookings }).sort((a, b) => +new Date(b.sortAt) - +new Date(a.sortAt)),
    [interviews, systemDesignSessions, peerBookings],
  );
  const counts = useMemo(() => countDashboardSessionsByFilter(sessions), [sessions]);
  const filtered = useMemo(() => filterDashboardSessions(sessions, filter), [sessions, filter]);
  const rounds = ROUNDS.filter((r) => isNavHrefVisible(r.href, r.featureKey));

  // last 14 days, one row per day
  const daily = useMemo(() => {
    const now = new Date();
    const keys = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (DAYS - 1 - i));
      return d.toISOString().slice(0, 10);
    });
    const map = new Map(keys.map((day) => [day, { day, sessions: 0, scoreTotal: 0, scored: 0, credits: 0 }]));
    for (const inv of interviews) {
      const row = map.get(new Date(inv.createdAt).toISOString().slice(0, 10));
      if (!row) continue;
      row.sessions += 1;
      const s = inv.report?.overallScore;
      if (typeof s === "number" && Number.isFinite(s)) { row.scored += 1; row.scoreTotal += s; }
      const credits = getInterviewCreditsUsed(inv);
      if (credits != null) row.credits += credits;
    }
    return keys.map((day) => {
      const r = map.get(day)!;
      return {
        ...r,
        label: new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        avgScore: r.scored ? Math.round(r.scoreTotal / r.scored) : null,
      };
    });
  }, [interviews]);

  const stats = useMemo(() => {
    const completed = interviews.filter((i) => i.status === "completed");
    const scored = completed.map((i) => i.report?.overallScore).filter((s): s is number => typeof s === "number");
    return {
      avg: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
      completedPct: interviews.length ? Math.round((completed.length / interviews.length) * 100) : null,
      activeDays: daily.filter((d) => d.sessions > 0).length,
      credits: daily.reduce((n, d) => n + d.credits, 0),
    };
  }, [interviews, daily]);

  useEffect(() => {
    try {
      setBannerDismissed(sessionStorage.getItem(ONBOARDING_BANNER_DISMISSED_KEY) === "1");
    } catch {
      setBannerDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!roleReady || !user || !profile) return;
    if (readStoredRole(user.id) === "institution_admin" && profile.institutionId) {
      router.replace(`/dashboard/institute/${String(profile.institutionId)}`);
    }
  }, [roleReady, user, profile, router]);

  if (!isLoaded || !roleReady || (interviewsLoading && interviews.length === 0)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleStartScheduled = async (scheduleId: string) => {
    try {
      setStartingScheduleId(scheduleId);
      const payload = await interviewScheduleApi.start(scheduleId);
      await invalidate(["interviewSchedules", "interviews", "entitlements"]);
      const path = routeAfterScheduledStart(payload);
      if (!path) throw new Error("Could not open this scheduled interview.");
      router.push(path);
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          "Could not start interview. You may need a saved resume, or the scheduled time is not open yet (starts 24 hours before).",
      );
    } finally {
      setStartingScheduleId(null);
    }
  };

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });
  const now = new Date();
  const first = user?.firstName || "there";
  const last = sessions[0];
  const lastHref = last?.reportHref ?? last?.continueHref ?? last?.detailsHref;
  const nextStep = !last
    ? "Your first round is two minutes away. Pick a format below and say your first answer out loud."
    : last.score != null
      ? `Your last round, ${last.title}, scored ${last.score}/100. Run it again while the feedback is fresh.`
      : `Your last round, ${last.title}, is waiting on its report. Open it, or start the next one.`;
  const chartFill = dashboardChartPrimaryFill[theme];
  const axis = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
  const tooltip = {
    contentStyle: { borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 },
    cursor: { fill: "hsl(var(--muted) / .5)" },
  };

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      {/* ── Hero: the greeting, the next step, and the last round at a glance */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_15%_10%,rgba(115,103,240,.14),transparent_70%),radial-gradient(35%_55%_at_90%_20%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div>
            <motion.div {...rise(0)}>
              <Eyebrow>{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }).toUpperCase()}</Eyebrow>
            </motion.div>
            <motion.h1 {...rise(0.08)} className="text-balance mt-5 text-[34px] font-black leading-[1.02] tracking-[-0.05em] text-foreground sm:text-[44px] xl:text-[52px]">
              {greeting(now)},{" "}
              <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">{first}.</span>
            </motion.h1>
            <motion.p {...rise(0.18)} className="text-balance mt-4 max-w-[58ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
              {nextStep}
            </motion.p>
            <motion.div {...rise(0.28)} className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={checkingSubscription}
                onClick={() => startPracticeSession("ai", { path: "/dashboard/interviews/new" })}
                className="h-11 rounded-xl px-5 text-[14.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90"
              >
                {checkingSubscription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Start a mock interview
              </Button>
              {lastHref ? (
                <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-[14.5px]">
                  <Link href={lastHref}>Open last round <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-[14.5px]">
                  <Link href="/dashboard/resumes/new">Build my resume</Link>
                </Button>
              )}
            </motion.div>
          </div>

          {/* last round card */}
          <motion.div {...rise(0.32)} className="rounded-2xl border border-border bg-background/70 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
            <Mono className="text-[11px] text-muted-foreground">LAST ROUND</Mono>
            {last ? (
              <div className="mt-3 flex items-center gap-4">
                {last.score != null ? (
                  <ScoreRing score={Math.round(last.score)} />
                ) : (
                  <div className="grid size-[112px] shrink-0 place-items-center rounded-full border-2 border-dashed border-border text-center">
                    <Mono className="text-[10.5px] text-muted-foreground">REPORT<br />PENDING</Mono>
                  </div>
                )}
                <div className="min-w-0">
                  <Mono className="text-[10.5px] text-primary">{KIND_LABEL[last.kind].toUpperCase()}</Mono>
                  <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{last.title}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {new Date(last.sortAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {lastHref && (
                    <Link href={lastHref} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                      {last.reportHref ? "Read the report" : "Open"} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-4">
                <Emblem kind="spark" tone={theme === "dark" ? "dark" : "light"} />
                <p className="text-[13.5px] leading-snug text-muted-foreground">No rounds yet. Your first score shows up here the moment it&apos;s ready.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* stats strip */}
        <motion.div {...rise(0.4)} className="relative grid grid-cols-2 divide-border border-t border-border md:grid-cols-4 md:divide-x [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
          {[
            ["Rounds taken", String(sessions.length), "all formats"],
            ["Average score", stats.avg != null ? `${stats.avg}` : "—", stats.avg != null ? "AI interviews, out of 100" : "after your first report"],
            ["Active days", `${stats.activeDays}/${DAYS}`, "last two weeks"],
            ["Completed", stats.completedPct != null ? `${stats.completedPct}%` : "—", "rounds you finished"],
          ].map(([k, v, d]) => (
            <div key={k} className="border-border px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className="mt-1 block text-[24px] tracking-tight text-foreground">{v}</Mono>
              <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <DashboardHackathonBanner />
      <IxOptInNotice />

      {/* ── Scheduled by an institution */}
      {scheduledInterviews.length > 0 && (
        <section className="rounded-[18px] border border-amber-300/60 bg-card p-5 dark:border-amber-500/30 md:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300"><CalendarClock className="h-5 w-5" /></span>
            <div>
              <h2 className="text-[18px] font-bold tracking-tight text-foreground">Scheduled interviews</h2>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                Your institution scheduled these for you. You can start from 24 hours before the scheduled time until the expire deadline (if set). A saved resume is required.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {scheduledInterviews.map((s) => {
              const { canStart, reason } = scheduledInterviewCanStartNow(s.scheduledAt, s.expiresAt);
              const busy = startingScheduleId === String(s._id);
              return (
                <div key={s._id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{s.role}</p>
                    <Mono className="text-[11px] text-primary">{instituteScheduleRoundLabel(s.roundType).toUpperCase()}</Mono>
                    <p className="text-[13px] text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}{s.targetCompany ? ` · ${s.targetCompany}` : ""}</p>
                    {s.expiresAt && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Start by {new Date(s.expiresAt).toLocaleString()}</p>}
                    {s.notes && <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>}
                    {!canStart && reason === "too_early" && (
                      <p className="mt-1 text-xs text-muted-foreground">Opens {new Date(new Date(s.scheduledAt).getTime() - 24 * 60 * 60 * 1000).toLocaleString()}</p>
                    )}
                    {!canStart && reason === "expired" && <p className="mt-1 text-xs text-red-600">Past expire deadline</p>}
                  </div>
                  <Button className="shrink-0 gap-2 rounded-xl bg-amber-600 hover:bg-amber-700" onClick={() => handleStartScheduled(String(s._id))} disabled={busy || !canStart}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                    Start interview
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Profile nudge */}
      {profileCompletion < 100 && bannerDismissed === false && (
        <div className="flex items-center gap-4 rounded-[18px] border border-border bg-card px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-foreground">
              <b className="font-semibold">Your profile is {profileCompletion}% done.</b>{" "}
              <span className="text-muted-foreground">The rest helps every round ask about your real work.</span>
            </p>
            <div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-lg"><Link href="/dashboard/profile">Finish profile</Link></Button>
          <button
            type="button"
            aria-label="Dismiss reminder"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              try { sessionStorage.setItem(ONBOARDING_BANNER_DISMISSED_KEY, "1"); } catch { /* ignore */ }
              setBannerDismissed(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Practise */}
      {rounds.length > 0 && (
        <section aria-label="Practice options">
          <Eyebrow>PRACTISE</Eyebrow>
          <h2 className="mt-3 text-[24px] font-extrabold tracking-[-0.035em] text-foreground md:text-[28px]">Pick a round.</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {rounds.map((r, i) => (
              <motion.div key={r.href} {...rise(0.1 + i * 0.05)}>
                <Link
                  href={r.href}
                  className="group flex h-full flex-col rounded-[18px] border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Emblem kind={r.emblem} tone={theme === "dark" ? "dark" : "light"} />
                  <h3 className="mt-4 text-[16px] font-bold tracking-tight text-foreground">{r.title}</h3>
                  <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted-foreground">{r.d}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                    Start <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Last 14 days: one measure per chart */}
      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-[18px] border border-border bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <Mono className="text-[11px] text-muted-foreground">LAST {DAYS} DAYS</Mono>
              <h3 className="mt-1 text-[17px] font-bold tracking-tight text-foreground">AI interview sessions</h3>
            </div>
            <Mono className="text-[13px] text-muted-foreground">{daily.reduce((n, d) => n + d.sessions, 0)} total</Mono>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
                <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
                <Tooltip {...tooltip} formatter={(v: number) => [v, "Sessions"]} />
                <Bar dataKey="sessions" name="Sessions" fill={chartFill} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[18px] border border-border bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <Mono className="text-[11px] text-muted-foreground">LAST {DAYS} DAYS</Mono>
              <h3 className="mt-1 text-[17px] font-bold tracking-tight text-foreground">Average score</h3>
            </div>
            <Mono className="text-[13px] text-muted-foreground">out of 100</Mono>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={axis} tickLine={false} axisLine={false} />
                <Tooltip {...tooltip} cursor={{ stroke: "hsl(var(--border))" }} formatter={(v: number) => [`${v}/100`, "Average score"]} />
                <Line type="monotone" dataKey="avgScore" name="Average score" stroke="#1F8FFF" strokeWidth={2} connectNulls dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {stats.credits > 0 ? <>Credits used in this window: <Mono className="text-foreground">{stats.credits}</Mono></> : "Days without a scored round are skipped."}
          </p>
        </div>
      </section>

      {/* ── Every round */}
      <section className="overflow-hidden rounded-[18px] border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 md:px-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Eyebrow>RECENT ROUNDS</Eyebrow>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground">Every round, with its score and report.</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InterviewTypeFilterBar value={filter} onChange={(next) => { setFilter(next); setCurrentPage(1); }} counts={counts} />
            <Button asChild variant="outline" className="h-9 rounded-lg px-3 text-[13px]"><Link href="/dashboard/interviews">View all</Link></Button>
          </div>
        </div>
        <RecentInterviewsList
          sessionRows={filtered}
          currentPage={currentPage}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          onVideoUnavailable={() => setVideoUnavailableOpen(true)}
          emptyDescription="Start an AI interview, coding round, system design session, or book a peer interview."
        />
      </section>

      <Dialog open={videoUnavailableOpen} onOpenChange={setVideoUnavailableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No video available</DialogTitle>
            <DialogDescription>
              This interview does not have a recording, or the video could not be loaded. If you just finished the interview, try again in a few minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setVideoUnavailableOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PracticeSessionGateDialogs {...practiceGate} />
    </div>
  );
}
