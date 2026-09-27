/** Institution dashboard access helpers (mirror backend RBAC). */

export const INSTITUTE_STAFF_ROLES = [
  "institution_admin",
  "institution_moderator",
  "institution_interview_manager",
] as const;

export type InstituteStaffRole = (typeof INSTITUTE_STAFF_ROLES)[number];

export function isInstituteStaff(accessRole: string | null | undefined): boolean {
  return (INSTITUTE_STAFF_ROLES as readonly string[]).includes(
    String(accessRole || ""),
  );
}

export function canAccessInstituteShell(
  accessRole: string | null | undefined,
): boolean {
  return accessRole === "super_admin" || isInstituteStaff(accessRole);
}

export type InstituteNavSegment =
  | "overview"
  | "candidates"
  | "batches"
  | "schedules"
  | "analytics"
  | "settings"
  | "billing";

export function canAccessInstituteNav(
  accessRole: string | null | undefined,
  segment: InstituteNavSegment,
): boolean {
  if (accessRole === "super_admin") return true;
  if (!isInstituteStaff(accessRole)) return false;
  const role = accessRole as InstituteStaffRole;
  switch (segment) {
    case "overview":
    case "analytics":
      return true;
    case "candidates":
      return true;
    case "batches":
    case "schedules":
      return (
        role === "institution_admin" ||
        role === "institution_interview_manager"
      );
    case "billing":
    case "settings":
      return role === "institution_admin";
    default:
      return false;
  }
}

export function instituteRoleCanInviteCandidates(
  accessRole: string | null | undefined,
): boolean {
  return accessRole === "super_admin" || accessRole === "institution_admin";
}

export function instituteRoleCanManageBatches(
  accessRole: string | null | undefined,
): boolean {
  return (
    accessRole === "super_admin" ||
    accessRole === "institution_admin" ||
    accessRole === "institution_interview_manager"
  );
}

export function instituteStaffInstitutionMatches(
  accessRole: string | null | undefined,
  userInstitutionId: string | null | undefined,
  routeInstitutionId: string,
): boolean {
  if (accessRole === "super_admin") return true;
  if (!isInstituteStaff(accessRole)) return false;
  if (!userInstitutionId) return false;
  return String(userInstitutionId) === routeInstitutionId;
}

/** Redirect to /dashboard when false. */
export function canViewInstitutePage(
  profile: { accessRole?: string; institutionId?: string } | null | undefined,
  routeInstitutionId: string,
  segment: InstituteNavSegment,
): boolean {
  if (!profile?.accessRole) return false;
  if (!canAccessInstituteShell(profile.accessRole)) return false;
  if (!canAccessInstituteNav(profile.accessRole, segment)) return false;
  return instituteStaffInstitutionMatches(
    profile.accessRole,
    profile.institutionId,
    routeInstitutionId,
  );
}
