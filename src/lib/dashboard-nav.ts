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
  LayoutGrid,
  Code2,
  Network,
  BarChart2,
  UserPlus,
  ClipboardList,
  Award,
  Bell,
} from "lucide-react";
import type { AccessRole, User as ApiUser } from "@/lib/api";
import { isPathAllowedForRole, type ActiveRole } from "@/lib/roles";

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
  },
  {
    title: "iX Report",
    href: "/dashboard/ix-report",
    icon: Award,
    accent: accent.purple,
  },
  {
    title: "Interviewer Dashboard",
    href: "/dashboard/peer-interviews/interviewer",
    icon: CalendarClock,
    accent: accent.cyan,
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

export function isPlatformAdmin(accessRole: AccessRole | null): boolean {
  return accessRole === "super_admin";
}

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

  if (isPlatformAdmin(accessRole)) {
    items.push(
      {
        title: "System Design Problems",
        href: "/dashboard/super-admin/system-design-problems",
        icon: LayoutGrid,
        accent: accent.indigo,
      },
      {
        title: "Coding Problems",
        href: "/dashboard/super-admin/coding-problems",
        icon: Code2,
        accent: accent.violet,
      },
      {
        title: "Peer — Interviewers",
        href: "/dashboard/super-admin/peer-interviewers",
        icon: Users,
        accent: accent.emerald,
      },
      {
        title: "Peer — Bookings",
        href: "/dashboard/super-admin/peer-bookings",
        icon: Receipt,
        accent: accent.amber,
      },
      {
        title: "iX Recruiters",
        href: "/dashboard/super-admin/ix-recruiters",
        icon: Briefcase,
        accent: accent.rose,
      },
      {
        title: "Institution Admin",
        href: "/dashboard/institute",
        icon: Building2,
        accent: accent.indigo,
      },
      {
        title: "Notification Hub",
        href: "/dashboard/super-admin/notification-hub",
        icon: Bell,
        accent: accent.violet,
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

const INTERVIEWER_DASHBOARD_NAV_ITEM: DashboardNavItem = {
  title: "Interviewer Dashboard",
  href: "/dashboard/peer-interviews/interviewer",
  icon: CalendarClock,
  accent: accent.cyan,
};

const PEER_APPLICATION_NAV_ITEM: DashboardNavItem = {
  title: "Interviewer application",
  href: "/dashboard/peer-interviews/interviewer",
  icon: CalendarClock,
  accent: accent.amber,
};

const PEER_APPLY_NAV_ITEM: DashboardNavItem = {
  title: "Become an Interviewer",
  href: "/dashboard/peer-interviews/interviewer/apply",
  icon: UserPlus,
  accent: accent.emerald,
};

function insertAfterPeerInterviews(
  items: DashboardNavItem[],
  ...extras: DashboardNavItem[]
): DashboardNavItem[] {
  if (extras.length === 0) return items;
  const peerIdx = items.findIndex(
    (item) => item.href === "/dashboard/peer-interviews",
  );
  const insertAt = peerIdx === -1 ? items.length : peerIdx + 1;
  return [...items.slice(0, insertAt), ...extras, ...items.slice(insertAt)];
}

const PEER_EARNINGS_NAV_ITEM: DashboardNavItem = {
  title: "Peer — Earnings",
  href: "/dashboard/peer-interviews/interviewer/earnings",
  icon: Receipt,
  accent: accent.violet,
};

const PEER_BOOKINGS_NAV_ITEM: DashboardNavItem = {
  title: "Peer — Bookings",
  href: "/dashboard/peer-interviews/interviewer/bookings",
  icon: ClipboardList,
  accent: accent.blue,
};

/** Scope peer nav: approved interviewers get the hub; pending users get application status only. */
export function withPeerNavItems(
  items: DashboardNavItem[],
  peer: ApiUser["peer"] | null | undefined,
): DashboardNavItem[] {
  const status = peer?.interviewerStatus;
  const isApprovedInterviewer = peer?.isInterviewer === true;

  let next = items.filter(
    (item) =>
      item.href !== "/dashboard/peer-interviews/interviewer" &&
      item.href !== "/dashboard/peer-interviews/bookings",
  );

  if (isApprovedInterviewer) {
    next = insertAfterPeerInterviews(next, INTERVIEWER_DASHBOARD_NAV_ITEM);
    const hubIdx = next.findIndex(
      (item) => item.href === INTERVIEWER_DASHBOARD_NAV_ITEM.href,
    );
    if (hubIdx !== -1) {
      const peerExtras: DashboardNavItem[] = [];
      if (!next.some((item) => item.href === PEER_BOOKINGS_NAV_ITEM.href)) {
        peerExtras.push(PEER_BOOKINGS_NAV_ITEM);
      }
      if (!next.some((item) => item.href === PEER_EARNINGS_NAV_ITEM.href)) {
        peerExtras.push(PEER_EARNINGS_NAV_ITEM);
      }
      if (peerExtras.length > 0) {
        next = [
          ...next.slice(0, hubIdx + 1),
          ...peerExtras,
          ...next.slice(hubIdx + 1),
        ];
      }
    }
  } else if (status === "pending" || status === "suspended") {
    next = insertAfterPeerInterviews(next, PEER_APPLICATION_NAV_ITEM);
  }

  const shouldShowApply =
    peer && !peer.isInterviewer && !peer.interviewerStatus;
  if (!shouldShowApply) return next;

  const profileIdx = next.findIndex(
    (item) => item.href === "/dashboard/profile",
  );
  if (profileIdx === -1) return [...next, PEER_APPLY_NAV_ITEM];

  return [
    ...next.slice(0, profileIdx + 1),
    PEER_APPLY_NAV_ITEM,
    ...next.slice(profileIdx + 1),
  ];
}

const RECRUITER_DASHBOARD_NAV_ITEM: DashboardNavItem = {
  title: "Recruiter Dashboard",
  href: "/dashboard/ix-recruiter",
  icon: Briefcase,
  accent: accent.violet,
};

const HIRE_TALENT_NAV_ITEM: DashboardNavItem = {
  title: "Hire iX Talent",
  href: "/dashboard/ix-recruiter/candidates",
  icon: UsersRound,
  accent: accent.emerald,
};

const SHORTLISTED_TALENTS_NAV_ITEM: DashboardNavItem = {
  title: "Shortlisted Talents",
  href: "/dashboard/ix-recruiter/shortlisted",
  icon: ClipboardList,
  accent: accent.blue,
};

const RECRUITER_APPLICATION_NAV_ITEM: DashboardNavItem = {
  title: "Recruiter application",
  href: "/dashboard/ix-recruiter/apply",
  icon: Briefcase,
  accent: accent.amber,
};

const RECRUITER_APPLY_NAV_ITEM: DashboardNavItem = {
  title: "Become a Recruiter",
  href: "/dashboard/ix-recruiter/apply",
  icon: UserPlus,
  accent: accent.emerald,
};

/** Scope recruiter nav: approved recruiters get the workspace; pending users get application status only. */
export function withRecruiterNavItems(
  items: DashboardNavItem[],
  recruiter: ApiUser["recruiter"] | null | undefined,
): DashboardNavItem[] {
  const status = recruiter?.recruiterStatus;
  const isApprovedRecruiter = recruiter?.isRecruiter === true;

  // Anchor recruiter entries right after the iX Report item when present.
  const anchorIdx = items.findIndex(
    (item) => item.href === "/dashboard/ix-report",
  );
  const insertAt = anchorIdx === -1 ? items.length : anchorIdx + 1;

  if (isApprovedRecruiter) {
    return [
      ...items.slice(0, insertAt),
      RECRUITER_DASHBOARD_NAV_ITEM,
      HIRE_TALENT_NAV_ITEM,
      SHORTLISTED_TALENTS_NAV_ITEM,
      ...items.slice(insertAt),
    ];
  }

  if (status === "pending" || status === "suspended") {
    return [
      ...items.slice(0, insertAt),
      RECRUITER_APPLICATION_NAV_ITEM,
      ...items.slice(insertAt),
    ];
  }

  // No recruiter profile yet — offer to apply (placed after profile).
  const profileIdx = items.findIndex(
    (item) => item.href === "/dashboard/profile",
  );
  if (profileIdx === -1) return [...items, RECRUITER_APPLY_NAV_ITEM];
  return [
    ...items.slice(0, profileIdx + 1),
    RECRUITER_APPLY_NAV_ITEM,
    ...items.slice(profileIdx + 1),
  ];
}

/**
 * Scope the sidebar to the active role. super_admin (and a null/unknown role)
 * sees every item; other roles only keep items they're allowed to open.
 */
export function filterNavByActiveRole(
  items: DashboardNavItem[],
  activeRole: ActiveRole | null,
  profile:
    | Pick<ApiUser, "institutionId" | "peer" | "recruiter">
    | null
    | undefined,
): DashboardNavItem[] {
  if (!activeRole || activeRole === "super_admin") return items;
  return items.filter((item) =>
    isPathAllowedForRole(activeRole, item.href, profile),
  );
}
