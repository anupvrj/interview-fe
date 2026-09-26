import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Layers,
  CalendarClock,
  BarChart2,
  Settings,
  Receipt,
  Building2,
  Trophy,
  FileBarChart,
} from "lucide-react";
import type { DashboardNavAccent } from "@/lib/dashboard-nav";

const accent = {
  rose: {
    iconBg: "bg-rose-500/12",
    iconText: "text-rose-600",
    activeIconBg: "bg-white/20",
  },
  emerald: {
    iconBg: "bg-emerald-500/12",
    iconText: "text-emerald-600",
    activeIconBg: "bg-white/20",
  },
  indigo: {
    iconBg: "bg-indigo-500/12",
    iconText: "text-indigo-600",
    activeIconBg: "bg-white/20",
  },
  violet: {
    iconBg: "bg-violet-500/12",
    iconText: "text-violet-600",
    activeIconBg: "bg-white/20",
  },
  blue: {
    iconBg: "bg-sky-500/12",
    iconText: "text-sky-600",
    activeIconBg: "bg-white/20",
  },
  amber: {
    iconBg: "bg-amber-500/12",
    iconText: "text-amber-600",
    activeIconBg: "bg-white/20",
  },
} as const;

export type InstituteNavItem = {
  segment: string;
  title: string;
  icon: LucideIcon;
  accent: DashboardNavAccent;
  description: string;
  group: string;
};

/** Path segments after `/dashboard/institute/:id` (empty = overview). */
export const INSTITUTE_NAV_ITEMS: InstituteNavItem[] = [
  {
    segment: "",
    title: "Overview",
    icon: LayoutDashboard,
    accent: accent.rose,
    description:
      "Members, batches, schedules, credits, and interview activity at a glance.",
    group: "Institution",
  },
  {
    segment: "candidates",
    title: "Candidates",
    icon: Users,
    accent: accent.emerald,
    description:
      "Invite learners, assign plans, schedule interviews, and review identity.",
    group: "Institution",
  },
  {
    segment: "batches",
    title: "Batches",
    icon: Layers,
    accent: accent.indigo,
    description: "Organize cohorts, bulk schedules, performance, and reports.",
    group: "Institution",
  },
  {
    segment: "schedules",
    title: "Schedules",
    icon: CalendarClock,
    accent: accent.violet,
    description: "Pending and upcoming interviews across your institution.",
    group: "Institution",
  },
  {
    segment: "analytics",
    title: "Analytics",
    icon: BarChart2,
    accent: accent.blue,
    description: "Trends, outcomes, batch performance, and top performers.",
    group: "Institution",
  },
  {
    segment: "settings",
    title: "Institution settings",
    icon: Settings,
    accent: accent.amber,
    description: "Profile, team roles, and organization details.",
    group: "Institution",
  },
  {
    segment: "billing",
    title: "Plans & payments",
    icon: Receipt,
    accent: accent.emerald,
    description: "Seat quotas, plan usage, and payment history.",
    group: "Institution",
  },
];

type NestedRule = {
  pattern: RegExp;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: DashboardNavAccent;
  backSegment: string;
  backLabel: string;
};

const NESTED: NestedRule[] = [
  {
    pattern: /\/batches\/[^/]+\/report$/,
    title: "Batch report",
    description: "Export and visualize cohort performance.",
    icon: FileBarChart,
    accent: accent.indigo,
    backSegment: "batches",
    backLabel: "Batches",
  },
  {
    pattern: /\/batches\/[^/]+\/runs\/[^/]+$/,
    title: "Interview round",
    description: "Participants, scores, and round settings.",
    icon: CalendarClock,
    accent: accent.indigo,
    backSegment: "batches",
    backLabel: "Batch",
  },
  {
    pattern: /\/batches\/[^/]+$/,
    title: "Batch detail",
    description: "Members, schedules, leaderboard, and exports.",
    icon: Layers,
    accent: accent.indigo,
    backSegment: "batches",
    backLabel: "Batches",
  },
  {
    pattern: /\/candidates\/[^/]+\/reports/,
    title: "Candidate reports",
    description: "Interview history and scores.",
    icon: Trophy,
    accent: accent.emerald,
    backSegment: "candidates",
    backLabel: "Candidates",
  },
];

export type InstituteResolvedPage = {
  group: string;
  icon: LucideIcon;
  accent: DashboardNavAccent;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  institutionBase?: string;
};

export function institutePathParts(pathname: string | null): {
  institutionId: string | null;
  rest: string;
} {
  const path = pathname || "";
  const m = path.match(/^\/dashboard\/institute\/([^/]+)(\/.*)?$/);
  if (!m) return { institutionId: null, rest: "" };
  const rest = (m[2] || "").replace(/^\//, "");
  return { institutionId: m[1], rest };
}

function matchNavItem(rest: string): InstituteNavItem {
  const first = rest.split("/")[0] || "";
  const found =
    INSTITUTE_NAV_ITEMS.find((i) => i.segment === first) ??
    INSTITUTE_NAV_ITEMS.find((i) => i.segment === "")!;
  return found;
}

export function resolveInstitutePage(pathname: string | null): InstituteResolvedPage {
  const { institutionId, rest } = institutePathParts(pathname);
  const base = institutionId
    ? `/dashboard/institute/${institutionId}`
    : "/dashboard/institute";

  const nested = NESTED.find((r) => r.pattern.test(pathname || ""));
  const nav = matchNavItem(rest);

  if (nested && institutionId) {
    const backHref =
      nested.backSegment === "batches" && rest.includes("/batches/")
        ? `${base}/batches/${rest.split("/")[1]}`
        : `${base}/${nested.backSegment}`;

    return {
      group: "Institution",
      icon: nested.icon,
      accent: nested.accent,
      title: nested.title,
      description: nested.description,
      backHref,
      backLabel: nested.backLabel,
      institutionBase: base,
    };
  }

  return {
    group: nav.group,
    icon: nav.icon,
    accent: nav.accent,
    title: nav.title,
    description: nav.description,
    institutionBase: base,
  };
}

export function instituteHubIcon() {
  return Building2;
}
