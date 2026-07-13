"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Plus,
  FileText,
  CalendarClock,
  Code2,
  Clock,
  Target,
  Percent,
  Award,
  Coins,
  LayoutGrid,
  CheckCircle,
  MessageCircle,
  PlayCircle,
  Eye,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { cn, formatDate, getScoreColor } from "@/lib/utils";
import type { PracticeSessionType } from "./usePracticeSessionGate";

type PracticeLockedGateProps = {
  type: PracticeSessionType;
  showTrialUpsell?: boolean;
  /** When set, replaces the built-in mock preview behind the blur overlay. */
  background?: ReactNode;
};

const LOCK_CONFIG: Record<
  PracticeSessionType,
  {
    badge: string;
    title: string;
    description: string;
    upgradePlan: "general_pass" | "tech_basic";
  }
> = {
  ai: {
    badge: "Trial or General Pass required",
    title: "Unlock AI Interview Practice",
    description:
      "Company-aware AI interviews, multilingual practice, scored reports, and your full interview history.",
    upgradePlan: "general_pass",
  },
  coding: {
    badge: "Trial or Tech Basic required",
    title: "Unlock Coding Round Practice",
    description:
      "Interview-style problems in the editor, AI discussion rounds, coding + discussion scores, and session history.",
    upgradePlan: "tech_basic",
  },
  system_design: {
    badge: "Trial or Tech Basic required",
    title: "Unlock System Design Practice",
    description:
      "Whiteboard sessions, voice walkthroughs, structured feedback, recordings, and your design session history.",
    upgradePlan: "tech_basic",
  },
};

const MOCK_AI_ROWS = [
  {
    title: "SDE-2 · Amazon",
    subtitle: "Screening · English · 45 min",
    session: "Mar 8, 2026",
    score: 84,
    status: "completed",
  },
  {
    title: "Product Manager · Flipkart",
    subtitle: "Screening · Hindi · 30 min",
    session: "Mar 3, 2026",
    score: 79,
    status: "completed",
  },
  {
    title: "Backend · Google",
    subtitle: "Screening · English · 40 min",
    session: "Feb 27, 2026",
    score: 76,
    status: "completed",
  },
  {
    title: "Full Stack · Startup",
    subtitle: "Screening · English · 35 min",
    session: "Feb 20, 2026",
    score: 81,
    status: "processing",
  },
];

const MOCK_CODING_ROWS = [
  {
    title: "Backend · Google",
    subtitle: "3 problems · Medium",
    session: "Mar 5, 2026",
    score: 76,
    status: "completed",
  },
  {
    title: "SDE-1 · Microsoft",
    subtitle: "3 problems · Easy",
    session: "Feb 28, 2026",
    score: 82,
    status: "completed",
  },
  {
    title: "Senior SWE · Meta",
    subtitle: "3 problems · Hard",
    session: "Feb 22, 2026",
    score: 71,
    status: "completed",
  },
];

const MOCK_SD_ROWS = [
  {
    title: "Design a URL Shortener",
    status: "completed",
    date: "2026-03-01T09:15:00.000Z",
    score: 71,
    messages: 24,
  },
  {
    title: "Design a News Feed",
    status: "completed",
    date: "2026-02-24T14:00:00.000Z",
    score: 78,
    messages: 31,
  },
  {
    title: "Design a Chat System",
    status: "active",
    date: "2026-02-18T11:30:00.000Z",
    score: null,
    messages: 12,
  },
];

function statusBadgeClass(status: string): string {
  const badges: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700",
    processing: "bg-sky-50 text-sky-700",
    active: "bg-amber-50 text-amber-700",
  };
  return badges[status] ?? badges.active;
}

function MockInterviewTable({ rows }: { rows: typeof MOCK_AI_ROWS }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border/70">
            {["Interview", "Session", "Score", "Status", "Actions"].map(
              (header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]"
                >
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.title}-${row.session}`}
              className="border-b border-border/60 last:border-b-0"
            >
              <td className="px-5 py-3.5 align-top">
                <p className="truncate text-sm font-semibold text-foreground">
                  {row.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.subtitle}
                </p>
              </td>
              <td className="px-5 py-3.5 align-top">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.session}
                </p>
              </td>
              <td className="px-5 py-3.5 align-top">
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    getScoreColor(row.score),
                  )}
                >
                  {row.score}
                  <span className="text-xs font-normal text-muted-foreground">
                    /100
                  </span>
                </p>
              </td>
              <td className="px-5 py-3.5 align-top">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    statusBadgeClass(row.status),
                  )}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-5 py-3.5 align-top">
                <div className="flex gap-1">
                  <span
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "h-8 w-8",
                    )}
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                  </span>
                  <span
                    className={cn(
                      buttonVariants({ size: "icon" }),
                      institutePrimaryClass,
                      "h-8 w-8",
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AiInterviewLockedPreview() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <DashboardStatCard
          theme="emerald"
          label="Total Interviews"
          value={6}
          icon={FileText}
          hint={
            <>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Screening sessions</span>
            </>
          }
        />
        <DashboardStatCard
          theme="violet"
          label="Average Score"
          value="79/100"
          icon={Target}
          progress={79}
          hint={
            <>
              <Percent className="h-3.5 w-3.5 shrink-0" />
              <span>Out of 100</span>
            </>
          }
        />
        <DashboardStatCard
          theme="sky"
          label="Completed"
          value={5}
          icon={Award}
          hint={
            <>
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Finished interviews</span>
            </>
          }
        />
        <DashboardStatCard
          theme="amber"
          label="Credits used"
          value={6}
          icon={Coins}
          hint={
            <>
              <Coins className="h-3.5 w-3.5 shrink-0" />
              <span>From billed sessions</span>
            </>
          }
        />
      </div>

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Interview history
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Spin up AI Interview Practice tailored to role + company to
                populate this history tab.
              </CardDescription>
            </div>
            <Button className={institutePrimaryClass} tabIndex={-1}>
              <Plus className="mr-2 h-4 w-4" />
              Start New Interview
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#7367F0] px-4 py-2 text-sm font-semibold text-white shadow-md">
              <FileText className="h-4 w-4 shrink-0" />
              Screening history
              <span className="rounded-full bg-card/20 px-2 py-0.5 text-xs font-bold">
                6
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-2 text-sm font-semibold text-muted-foreground">
              <CalendarClock className="h-4 w-4 shrink-0" />
              Scheduled
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <MockInterviewTable rows={MOCK_AI_ROWS} />
        </CardContent>
      </Card>
    </div>
  );
}

function CodingLockedPreview() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <DashboardStatCard
          theme="emerald"
          label="Total sessions"
          value={3}
          icon={Code2}
          hint={
            <>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>All time</span>
            </>
          }
        />
        <DashboardStatCard
          theme="violet"
          label="Average score"
          value="76/100"
          icon={Target}
          progress={76}
          hint={
            <>
              <Percent className="h-3.5 w-3.5 shrink-0" />
              <span>Out of 100</span>
            </>
          }
        />
        <DashboardStatCard
          theme="sky"
          label="Completed"
          value={3}
          icon={Award}
          hint={
            <>
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Finished sessions</span>
            </>
          }
        />
        <DashboardStatCard
          theme="amber"
          label="Credits used"
          value={3}
          icon={Coins}
          hint={
            <>
              <Coins className="h-3.5 w-3.5 shrink-0" />
              <span>From billed sessions</span>
            </>
          }
        />
      </div>

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Coding round history
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Start a session to see it here.
              </CardDescription>
            </div>
            <Button className={institutePrimaryClass} tabIndex={-1}>
              <Plus className="mr-2 h-4 w-4" />
              Start new session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <MockInterviewTable rows={MOCK_CODING_ROWS} />
        </CardContent>
      </Card>
    </div>
  );
}

function SystemDesignLockedPreview() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <DashboardStatCard theme="emerald" label="Sessions" value={3} icon={LayoutGrid} />
        <DashboardStatCard theme="sky" label="Completed" value={2} icon={CheckCircle} />
        <DashboardStatCard
          theme="violet"
          label="Average score"
          value="74.5"
          icon={Target}
          progress={74}
        />
      </div>

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                System design history
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Continue an in-progress session or open a completed review.
              </CardDescription>
            </div>
            <Button className={institutePrimaryClass} tabIndex={-1}>
              Start New Session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {MOCK_SD_ROWS.map((row) => (
              <div
                key={row.title}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {row.title}
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        row.status === "completed"
                          ? "border-green-200 bg-green-100 text-green-700"
                          : "border-yellow-200 bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatDate(row.date)}</span>
                    <span>
                      Score:{" "}
                      <span className="font-medium text-foreground">
                        {row.score ?? "—"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {row.messages} messages
                    </span>
                  </div>
                </div>
                <Button size="sm" className={cn(institutePrimaryClass, "h-8")} tabIndex={-1}>
                  {row.status === "active" ? "Continue" : "View Report"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const PREVIEW_BY_TYPE: Record<PracticeSessionType, () => ReactNode> = {
  ai: AiInterviewLockedPreview,
  coding: CodingLockedPreview,
  system_design: SystemDesignLockedPreview,
};

export function PracticeLockedGate({
  type,
  showTrialUpsell = false,
  background,
}: PracticeLockedGateProps) {
  const config = LOCK_CONFIG[type];
  const Preview = PREVIEW_BY_TYPE[type];
  const primaryHref = showTrialUpsell
    ? "/dashboard?trial_offer=1"
    : `/checkout?plan=${config.upgradePlan}`;
  const primaryLabel = showTrialUpsell ? "Start free trial" : "Upgrade & unlock";

  return (
    <div className="relative isolate min-h-[520px] overflow-hidden rounded-xl border border-border/60 bg-card sm:min-h-[600px]">
      <div
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
        aria-hidden
      >
        {background ?? (
          <div className="p-4 sm:p-6">
            <Preview />
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-background/25 backdrop-blur-[2.4px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/90 from-0% via-background/55 via-[42%] to-background/20 to-100%"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7367F0]/25 bg-card shadow-lg">
          <Lock className="h-7 w-7 text-[#7367F0]" aria-hidden />
        </div>
        <span className="mb-3 inline-flex rounded-full border border-[#7367F0]/25 bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0]">
          {config.badge}
        </span>
        <h2 className="max-w-md text-xl font-bold text-foreground sm:text-2xl">
          {config.title}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {config.description}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            className="bg-[#7367F0] shadow-lg shadow-[#7367F0]/20 hover:bg-[#6358d8]"
            asChild
          >
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-card/90" asChild>
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
