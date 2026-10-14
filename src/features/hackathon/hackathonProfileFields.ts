/** Mirrors interview-core `computeHackathonProfileStatus` field checks. */

import {
  isValidPhoneForStorage,
  parseStoredPhone,
} from "@/lib/phone-utils";

export type HackathonProfileFieldSource = {
  userType?: string | null;
  industry?: string | null;
  targetJobRole?: string | null;
  affiliationInstitutionName?: string | null;
  phone?: string | null;
  currentJob?: { industry?: string | null; role?: string | null } | null;
};

const USER_TYPES = new Set(["student", "fresher", "experienced"]);

export function hackathonFieldsFromProfile(profile: HackathonProfileFieldSource) {
  const industry = profile.industry?.trim() || profile.currentJob?.industry?.trim() || "";
  const targetJobRole =
    profile.targetJobRole?.trim() || profile.currentJob?.role?.trim() || "";
  const college = profile.affiliationInstitutionName?.trim() || "";
  const userType = profile.userType;
  const phone = profile.phone?.trim() || "";
  return { userType, industry, targetJobRole, college, phone };
}

/** Step 1: profile type + contact mobile. */
export function isHackathonStep1Ready(profile: HackathonProfileFieldSource): boolean {
  const { userType, phone } = hackathonFieldsFromProfile(profile);
  if (!userType || !USER_TYPES.has(userType)) return false;
  if (!phone) return false;
  const { countryCode, localNumber } = parseStoredPhone(phone);
  return isValidPhoneForStorage(countryCode, localNumber);
}

/** First incomplete onboarding step (resume is always step 3). */
export function resolveHackathonOnboardingStep(profile: HackathonProfileFieldSource): 1 | 2 | 3 {
  if (isHackathonProfileReady(profile)) return 3;
  if (isHackathonStep1Ready(profile)) return 2;
  return 1;
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
