import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  AudioLines,
  LayoutGrid,
  Code2,
  Newspaper,
  Users,
  Receipt,
  Briefcase,
  Bell,
  Building2,
  FileText,
  CalendarClock,
  IndianRupee,
  Ticket,
  Shield,
} from "lucide-react";
import type { DashboardNavAccent, DashboardNavItem } from "@/lib/dashboard-nav";

export const SUPER_ADMIN_HOME = "/super-admin";

export type SuperAdminNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

const accent = {
  rose: {
    iconBg: "bg-rose-500/12",
    iconText: "text-rose-600",
    activeIconBg: "bg-white/20",
  },
  violet: {
    iconBg: "bg-violet-500/12",
    iconText: "text-violet-600",
    activeIconBg: "bg-white/20",
  },
  indigo: {
    iconBg: "bg-indigo-500/12",
    iconText: "text-indigo-600",
    activeIconBg: "bg-white/20",
  },
  blue: {
    iconBg: "bg-sky-500/12",
    iconText: "text-sky-600",
    activeIconBg: "bg-white/20",
  },
  emerald: {
    iconBg: "bg-emerald-500/12",
    iconText: "text-emerald-600",
    activeIconBg: "bg-white/20",
  },
  amber: {
    iconBg: "bg-amber-500/12",
    iconText: "text-amber-600",
    activeIconBg: "bg-white/20",
  },
} as const;

export const SUPER_ADMIN_NAV_GROUPS: SuperAdminNavGroup[] = [
  {
    label: "Platform",
    items: [
      {
        title: "Overview",
        href: SUPER_ADMIN_HOME,
        icon: LayoutDashboard,
        accent: accent.rose,
        description:
          "Signups, institutions, resumes, and completed interviews at a glance.",
      },
      {
        title: "Users",
        href: `${SUPER_ADMIN_HOME}/users`,
        icon: Users,
        accent: accent.emerald,
        description:
          "Search accounts, assign roles and institutions, and manage plans and credits.",
      },
      {
        title: "Interviews",
        href: `${SUPER_ADMIN_HOME}/interviews`,
        icon: CalendarClock,
        accent: accent.indigo,
        description:
          "Completed AI, coding, system design, and peer sessions across the platform.",
      },
      {
        title: "Resumes",
        href: `${SUPER_ADMIN_HOME}/resumes`,
        icon: FileText,
        accent: accent.blue,
        description:
          "Builder resumes on the platform, with designer name and email.",
      },
      {
        title: "Feature Controls",
        href: `${SUPER_ADMIN_HOME}/features`,
        icon: SlidersHorizontal,
        accent: accent.violet,
        description:
          "Turn product surfaces on or off. Disabled is Super Admin only; Live is everyone.",
      },
      {
        title: "Interview Integrity",
        href: `${SUPER_ADMIN_HOME}/integrity`,
        icon: Shield,
        accent: accent.rose,
        description:
          "Anti-cheat modules, report visibility, and interviewer pushback for live sessions.",
      },
      {
        title: "Voice Models",
        href: `${SUPER_ADMIN_HOME}/voice-models`,
        icon: AudioLines,
        accent: accent.indigo,
        description:
          "Choose which voice AI appears at interview start, and set credits per minute.",
      },
      {
        title: "Plans & Pricing",
        href: `${SUPER_ADMIN_HOME}/plans`,
        icon: IndianRupee,
        accent: accent.amber,
        description:
          "Edit prices, credits, and checklists. A plan appears on /pricing only when it is on sale and public.",
      },
      {
        title: "Coupons",
        href: `${SUPER_ADMIN_HOME}/coupons`,
        icon: Ticket,
        accent: accent.amber,
        description:
          "Create first-month discount codes, cap usage, and set a default welcome discount.",
      },
    ],
  },
  {
    label: "Partner",
    items: [
      {
        title: "Institutions",
        href: `${SUPER_ADMIN_HOME}/institutions`,
        icon: Building2,
        accent: accent.indigo,
        description:
          "Onboard colleges and companies, assign users, and open each partner dashboard.",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "System Design Problems",
        href: `${SUPER_ADMIN_HOME}/system-design-problems`,
        icon: LayoutGrid,
        accent: accent.indigo,
        description:
          "Manage the practice catalog, company tags, and admin ratings.",
      },
      {
        title: "Coding Problems",
        href: `${SUPER_ADMIN_HOME}/coding-problems`,
        icon: Code2,
        accent: accent.violet,
        description: "Manage the coding bank, test cases, and starter code.",
      },
      {
        title: "Blog CMS",
        href: `${SUPER_ADMIN_HOME}/blogs`,
        icon: Newspaper,
        accent: accent.blue,
        description: "Create and publish SEO blog posts for Interview Trix.",
      },
    ],
  },
  {
    label: "Marketplace",
    items: [
      {
        title: "Peer — Interviewers",
        href: `${SUPER_ADMIN_HOME}/peer-interviewers`,
        icon: Users,
        accent: accent.emerald,
        description:
          "Review applications, inspect IDs, and approve or block interviewers.",
      },
      {
        title: "Peer — Bookings",
        href: `${SUPER_ADMIN_HOME}/peer-bookings`,
        icon: Receipt,
        accent: accent.amber,
        description:
          "Approve payouts, issue refunds, and reassign interviewers.",
      },
      {
        title: "iX Recruiters",
        href: `${SUPER_ADMIN_HOME}/ix-recruiters`,
        icon: Briefcase,
        accent: accent.rose,
        description:
          "Review recruiter applications, inspect company documents, and take action.",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Notification Hub",
        href: `${SUPER_ADMIN_HOME}/notification-hub`,
        icon: Bell,
        accent: accent.violet,
        description:
          "Edit event templates, channels, and recipients without a deploy.",
      },
    ],
  },
];

export function flattenSuperAdminNav(): DashboardNavItem[] {
  return SUPER_ADMIN_NAV_GROUPS.flatMap((group) => group.items);
}

export function isSuperAdminNavItemActive(
  href: string,
  pathname: string | null,
): boolean {
  if (!pathname) return false;
  if (href === SUPER_ADMIN_HOME) {
    return pathname === SUPER_ADMIN_HOME;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type SuperAdminCrumb = {
  label: string;
  href?: string;
};

export type SuperAdminResolvedPage = {
  group: string;
  navTitle: string;
  navHref: string;
  icon: LucideIcon;
  accent: DashboardNavAccent;
  title: string;
  description: string;
  crumbs: SuperAdminCrumb[];
  backHref?: string;
  backLabel?: string;
};

type NestedPageRule = {
  pattern: RegExp;
  title: string;
  description: string;
  crumb: string;
};

const NESTED_PAGES: NestedPageRule[] = [
  {
    pattern: /^\/super-admin\/users\/[^/]+\/reports\/[^/]+\/?$/,
    title: "Interview report",
    description: "Full scoring report for this interview session.",
    crumb: "Report",
  },
  {
    pattern: /^\/super-admin\/users\/[^/]+\/?$/,
    title: "User",
    description:
      "Resumes, practice interviews, and coding practice sessions.",
    crumb: "User",
  },
  {
    pattern: /^\/super-admin\/interviews\/system-design\/[^/]+\/?$/,
    title: "System design report",
    description: "Session report and candidate details.",
    crumb: "Report",
  },
  {
    pattern: /^\/super-admin\/coding-problems\/new\/?$/,
    title: "New coding problem",
    description: "Create a problem with public and hidden test cases.",
    crumb: "New",
  },
  {
    pattern: /^\/super-admin\/coding-problems\/[^/]+\/edit\/?$/,
    title: "Edit coding problem",
    description: "Update statement, tests, and starter code.",
    crumb: "Edit",
  },
  {
    pattern: /^\/super-admin\/coding-problems\/[^/]+\/playground\/?$/,
    title: "Playground",
    description: "Run the problem as a candidate would.",
    crumb: "Playground",
  },
  {
    pattern: /^\/super-admin\/system-design-problems\/new\/?$/,
    title: "Add system design problem",
    description: "Create a new practice problem for the candidate hub.",
    crumb: "New",
  },
  {
    pattern: /^\/super-admin\/system-design-problems\/[^/]+\/edit\/?$/,
    title: "Edit system design problem",
    description: "Update prompt, companies, and admin rating.",
    crumb: "Edit",
  },
  {
    pattern: /^\/super-admin\/blogs\/new\/?$/,
    title: "New blog post",
    description: "Write SEO-optimized content. Drafts auto-save.",
    crumb: "New",
  },
  {
    pattern: /^\/super-admin\/blogs\/[^/]+\/edit\/?$/,
    title: "Edit blog post",
    description: "Update SEO content and publish state.",
    crumb: "Edit",
  },
  {
    pattern: /^\/super-admin\/peer-bookings\/[^/]+\/?$/,
    title: "Booking",
    description:
      "Review booking details, manage payout, issue refunds, or reassign the interviewer.",
    crumb: "Booking",
  },
  {
    pattern: /^\/super-admin\/coupons\/[^/]+\/?$/,
    title: "Coupon redemptions",
    description: "Users, plans, and first-month amounts for this discount code.",
    crumb: "Redemptions",
  },
];

export function matchSuperAdminNav(
  pathname: string | null,
): { group: string; item: DashboardNavItem } {
  const path = pathname || SUPER_ADMIN_HOME;
  let matched: { group: string; item: DashboardNavItem } | null = null;

  for (const group of SUPER_ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (!isSuperAdminNavItemActive(item.href, path)) continue;
      if (
        !matched ||
        item.href.length > matched.item.href.length ||
        item.href === SUPER_ADMIN_HOME
      ) {
        if (item.href === SUPER_ADMIN_HOME && path !== SUPER_ADMIN_HOME) {
          continue;
        }
        matched = { group: group.label, item };
      }
    }
  }

  return (
    matched ?? {
      group: SUPER_ADMIN_NAV_GROUPS[0].label,
      item: SUPER_ADMIN_NAV_GROUPS[0].items[0],
    }
  );
}

export function resolveSuperAdminPage(
  pathname: string | null,
): SuperAdminResolvedPage {
  const path = pathname || SUPER_ADMIN_HOME;
  const { group, item } = matchSuperAdminNav(path);
  const nested = NESTED_PAGES.find((rule) => rule.pattern.test(path));

  const crumbs: SuperAdminCrumb[] = nested
    ? [
        { label: group },
        { label: item.title, href: item.href },
        { label: nested.crumb },
      ]
    : [{ label: group }, { label: item.title }];

  return {
    group,
    navTitle: item.title,
    navHref: item.href,
    icon: item.icon,
    accent: item.accent,
    title: nested?.title ?? item.title,
    description: nested?.description ?? item.description ?? "",
    crumbs,
    backHref: nested ? item.href : undefined,
    backLabel: nested ? item.title : undefined,
  };
}
