import type { LucideIcon } from "lucide-react";
import { Shield, Building2, CalendarClock, GraduationCap } from "lucide-react";
import type { User } from "@/lib/api";

export type ActiveRole =
  | "super_admin"
  | "institution_admin"
  | "interviewer"
  | "candidate";

export type RoleMeta = {
  role: ActiveRole;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const ROLE_META: Record<ActiveRole, RoleMeta> = {
  super_admin: {
    role: "super_admin",
    label: "Super Admin",
    description: "Full access to every dashboard, tool and admin area.",
    icon: Shield,
  },
  institution_admin: {
    role: "institution_admin",
    label: "Institution Admin",
    description: "Manage your institution, candidates, batches and billing.",
    icon: Building2,
  },
  interviewer: {
    role: "interviewer",
    label: "Interviewer",
    description: "Manage your slots, bookings and peer interview sessions.",
    icon: CalendarClock,
  },
  candidate: {
    role: "candidate",
    label: "Candidate",
    description: "Practice interviews, build resumes and book peer sessions.",
    icon: GraduationCap,
  },
};

/**
 * Roles a user is allowed to act as, ordered by precedence.
 * Frontend view-scoping only - the backend still enforces real permissions.
 */
export function deriveAvailableRoles(
  profile: Pick<User, "accessRole" | "peer"> | null | undefined,
): ActiveRole[] {
  const roles: ActiveRole[] = [];
  if (profile?.accessRole === "super_admin") roles.push("super_admin");
  if (profile?.accessRole === "institution_admin") roles.push("institution_admin");
  if (profile?.peer?.interviewerStatus === "approved") roles.push("interviewer");
  // Every logged-in user is at least a candidate.
  roles.push("candidate");
  return roles;
}

/** Where to send a user when they enter or switch into a given role. */
export function roleHome(
  role: ActiveRole,
  profile: Pick<User, "institutionId"> | null | undefined,
): string {
  switch (role) {
    case "super_admin":
      return "/dashboard";
    case "institution_admin":
      return profile?.institutionId
        ? `/dashboard/institute/${String(profile.institutionId)}`
        : "/dashboard/institute";
    case "interviewer":
      return "/dashboard/peer-interviews/interviewer";
    case "candidate":
    default:
      return "/dashboard";
  }
}

const SUPER_ADMIN_PREFIXES = ["/dashboard/super-admin"];
const INSTITUTE_PREFIXES = ["/dashboard/institute"];
const INTERVIEWER_HUB = "/dashboard/peer-interviews/interviewer";
const INTERVIEWER_APPLY = "/dashboard/peer-interviews/interviewer/apply";
const PEER_CANDIDATE_HUB = "/dashboard/peer-interviews";
const PEER_CANDIDATE_BOOKINGS = "/dashboard/peer-interviews/bookings";

/** Candidate marketplace and booking list — not for the interviewer role view. */
function isCandidatePeerMarketplacePath(pathname: string): boolean {
  return pathname === PEER_CANDIDATE_HUB || pathname === PEER_CANDIDATE_BOOKINGS;
}

/** Candidate booking page: /dashboard/peer-interviews/interviewer/:interviewerId */
function isPublicPeerInterviewerProfilePath(pathname: string): boolean {
  if (!pathname.startsWith(`${INTERVIEWER_HUB}/`)) return false;
  const segment = pathname.slice(`${INTERVIEWER_HUB}/`.length).split("/")[0];
  return /^[a-f0-9]{24}$/i.test(segment);
}

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Whether the given dashboard path is viewable under the active role.
 * super_admin can view everything. Non-dashboard paths are always allowed.
 */
export function isPathAllowedForRole(
  role: ActiveRole,
  pathname: string | null,
  profile: Pick<User, "institutionId"> | null | undefined,
): boolean {
  if (!pathname || !pathname.startsWith("/dashboard")) return true;
  if (role === "super_admin") return true;

  // Profile is always reachable from any role.
  if (
    pathname === "/dashboard/profile" ||
    pathname.startsWith("/dashboard/profile/")
  ) {
    return true;
  }

  if (role === "institution_admin") {
    const base = profile?.institutionId
      ? `/dashboard/institute/${String(profile.institutionId)}`
      : "/dashboard/institute";
    return (
      pathname === base ||
      pathname.startsWith(`${base}/`) ||
      pathname === "/dashboard/institute" ||
      pathname === "/dashboard/coding-interviews" ||
      pathname.startsWith("/dashboard/coding-interviews/")
    );
  }

  if (role === "interviewer") {
    if (isCandidatePeerMarketplacePath(pathname)) return false;
    return pathname.startsWith("/dashboard/peer-interviews");
  }

  // candidate: everything except admin, institute and interviewer management pages.
  if (matchesPrefix(pathname, SUPER_ADMIN_PREFIXES)) return false;
  if (matchesPrefix(pathname, INSTITUTE_PREFIXES)) return false;
  // Allow interviewer onboarding entry (hub redirects to apply when no profile).
  if (
    pathname === INTERVIEWER_HUB ||
    pathname === INTERVIEWER_APPLY ||
    pathname.startsWith(`${INTERVIEWER_APPLY}/`)
  ) {
    return true;
  }
  if (pathname.startsWith(`${INTERVIEWER_HUB}/`)) {
    return isPublicPeerInterviewerProfilePath(pathname);
  }
  return true;
}

const STORAGE_PREFIX = "activeRole:";

export function readStoredRole(userId: string | null | undefined): ActiveRole | null {
  if (!userId || globalThis.window === undefined) return null;
  try {
    const value = globalThis.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return (value as ActiveRole) || null;
  } catch {
    return null;
  }
}

export function writeStoredRole(
  userId: string | null | undefined,
  role: ActiveRole,
): void {
  if (!userId || globalThis.window === undefined) return;
  try {
    globalThis.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, role);
  } catch {
    /* ignore storage errors */
  }
}
