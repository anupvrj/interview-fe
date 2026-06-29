import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Crown,
  User,
  FileEdit,
  Briefcase,
  Shield,
  Building2,
  Users,
  UsersRound,
  CalendarClock,
  Settings,
  Receipt,
  Layers,
  Code2,
  Network,
  BarChart2,
  FlaskConical,
} from "lucide-react";
import type { AccessRole } from "@/lib/api";

export type DashboardNavAccent = {
  iconBg: string;
  iconText: string;
  activeIconBg: string;
};

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  accent: DashboardNavAccent;
  locked?: boolean;
};

const accent = {
  purple: {
    iconBg: "bg-[#7367F0]/12",
    iconText: "text-[#7367F0]",
    activeIconBg: "bg-white/20",
  },
  emerald: {
    iconBg: "bg-emerald-500/12",
    iconText: "text-emerald-600",
    activeIconBg: "bg-white/20",
  },
  blue: {
    iconBg: "bg-sky-500/12",
    iconText: "text-sky-600",
    activeIconBg: "bg-white/20",
  },
  cyan: {
    iconBg: "bg-cyan-500/12",
    iconText: "text-cyan-600",
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
  rose: {
    iconBg: "bg-rose-500/12",
    iconText: "text-rose-600",
    activeIconBg: "bg-white/20",
  },
  amber: {
    iconBg: "bg-amber-500/12",
    iconText: "text-amber-600",
    activeIconBg: "bg-white/20",
  },
  orange: {
    iconBg: "bg-orange-500/12",
    iconText: "text-orange-600",
    activeIconBg: "bg-white/20",
  },
  slate: {
    iconBg: "bg-slate-500/12",
    iconText: "text-slate-600",
    activeIconBg: "bg-white/20",
  },
} as const;

const baseMenuItems: DashboardNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    accent: accent.purple,
  },
  {
    title: "AI Resume Builder",
    href: "/dashboard/resumes",
    icon: FileEdit,
    accent: accent.emerald,
  },
  {
    title: "AI Interview Practice",
    href: "/dashboard/interviews",
    icon: FileText,
    accent: accent.blue,
  },
  {
    title: "Practice Coding Round",
    href: "/dashboard/coding-interviews",
    icon: Code2,
    accent: accent.cyan,
  },
  {
    title: "Practice System Design",
    href: "/dashboard/system-design",
    icon: Network,
    accent: accent.indigo,
  },
  {
    title: "Peer Interviews",
    href: "/dashboard/peer-interviews",
    icon: UsersRound,
    accent: accent.violet,
    locked: true,
  },
  {
    title: "Job Board",
    href: "/dashboard/job-board",
    icon: Briefcase,
    accent: accent.rose,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    accent: accent.amber,
  },
  {
    title: "Subscription",
    href: "/dashboard/plan",
    icon: Crown,
    accent: accent.orange,
  },
  {
    title: "My Profile",
    href: "/dashboard/profile",
    icon: User,
    accent: accent.slate,
  },
];

export function getDashboardNavItems(
  accessRole: AccessRole | null,
  institutionId: string | null,
): DashboardNavItem[] {
  const isInstitutionAdmin = accessRole === "institution_admin";

  if (isInstitutionAdmin && institutionId) {
    const base = `/dashboard/institute/${institutionId}`;
    return [
      {
        title: "Overview",
        href: base,
        icon: LayoutDashboard,
        accent: accent.purple,
      },
      {
        title: "Candidates",
        href: `${base}/candidates`,
        icon: Users,
        accent: accent.blue,
      },
      {
        title: "Batches",
        href: `${base}/batches`,
        icon: Layers,
        accent: accent.emerald,
      },
      {
        title: "Schedules",
        href: `${base}/schedules`,
        icon: CalendarClock,
        accent: accent.cyan,
      },
      {
        title: "Analytics",
        href: `${base}/analytics`,
        icon: BarChart2,
        accent: accent.amber,
      },
      {
        title: "Institution",
        href: `${base}/settings`,
        icon: Settings,
        accent: accent.indigo,
      },
      {
        title: "Plans & Payments",
        href: `${base}/billing`,
        icon: Receipt,
        accent: accent.orange,
      },
      {
        title: "Your Profile",
        href: "/dashboard/profile",
        icon: User,
        accent: accent.slate,
      },
    ];
  }

  if (isInstitutionAdmin && !institutionId) {
    return [
      {
        title: "Institution",
        href: "/dashboard/institute",
        icon: Building2,
        accent: accent.purple,
      },
      {
        title: "Your Profile",
        href: "/dashboard/profile",
        icon: User,
        accent: accent.slate,
      },
    ];
  }

  let items = [...baseMenuItems];

  if (accessRole !== "super_admin") {
    items = items.filter(
      (item) =>
        item.href !== "/dashboard/peer-interviews" &&
        item.href !== "/dashboard/job-board",
    );
  }

  const labNavItem: DashboardNavItem = {
    title: "Agent Lab",
    href: "/dashboard/lab",
    icon: FlaskConical,
    accent: accent.violet,
  };

  const showLabInNav =
    accessRole === "super_admin" ||
    process.env.NEXT_PUBLIC_ENABLE_LAB === "true" ||
    process.env.NEXT_PUBLIC_APP_ENV === "development";

  if (showLabInNav && !items.some((i) => i.href === labNavItem.href)) {
    items.push(labNavItem);
  }

  if (accessRole === "super_admin") {
    items.push(
      {
        title: "Institution Admin",
        href: "/dashboard/institute",
        icon: Building2,
        accent: accent.indigo,
      },
      {
        title: "Super Admin",
        href: "/dashboard/super-admin",
        icon: Shield,
        accent: accent.rose,
      },
    );
  }

  return items;
}
