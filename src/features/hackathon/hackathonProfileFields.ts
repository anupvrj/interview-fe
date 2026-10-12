/** Mirrors interview-core `computeHackathonProfileStatus` field checks. */

export type HackathonProfileFieldSource = {
  userType?: string | null;
  industry?: string | null;
  targetJobRole?: string | null;
  affiliationInstitutionName?: string | null;
  currentJob?: { industry?: string | null; role?: string | null } | null;
};

export function hackathonFieldsFromProfile(profile: HackathonProfileFieldSource) {
  const industry = profile.industry?.trim() || profile.currentJob?.industry?.trim() || "";
  const targetJobRole =
    profile.targetJobRole?.trim() || profile.currentJob?.role?.trim() || "";
  const college = profile.affiliationInstitutionName?.trim() || "";
  const userType = profile.userType;
  return { userType, industry, targetJobRole, college };
}

export function isHackathonProfileReady(profile: HackathonProfileFieldSource): boolean {
  const { userType, industry, targetJobRole, college } = hackathonFieldsFromProfile(profile);
  if (!userType || (userType !== "student" && userType !== "fresher" && userType !== "experienced")) {
    return false;
  }
  if (userType === "student") {
    return Boolean(targetJobRole && college);
  }
  return Boolean(industry && targetJobRole);
}

export function completeOnboardingPayloadFromProfile(profile: HackathonProfileFieldSource) {
  const { userType, industry, targetJobRole, college } = hackathonFieldsFromProfile(profile);
  return {
    userType: userType as "student" | "fresher" | "experienced",
    industry: userType === "student" ? undefined : industry,
    targetJobRole,
    affiliationInstitutionName: userType === "student" ? college : undefined,
  };
}
