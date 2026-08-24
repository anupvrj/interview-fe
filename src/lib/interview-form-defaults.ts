import type { User } from "@/lib/api";

/** Map profile years of experience to interview form select value. */
export function profileExperienceToFormValue(
  years: number | undefined | null,
): string {
  if (years == null || years <= 0) return "0";
  if (years >= 5) return "5";
  return String(years);
}

export type InterviewFormDefaults = {
  role: string;
  targetCompany: string;
  experience: string;
};

/** Defaults for AI mock / coding interview start forms from user profile. */
export function interviewDefaultsFromProfile(
  profile: User,
): InterviewFormDefaults {
  const role =
    profile.targetJobRole?.trim() ||
    profile.currentJob?.role?.trim() ||
    "";
  const targetCompany = profile.targetCompany?.trim() || "";
  const experience = profileExperienceToFormValue(profile.experience);

  return { role, targetCompany, experience };
}

/** Merge profile defaults into interview form state without overwriting user edits. */
export function mergeInterviewFormDefaults<T extends InterviewFormDefaults>(
  current: T,
  profile: User,
): T {
  const defaults = interviewDefaultsFromProfile(profile);
  return {
    ...current,
    role: current.role.trim() ? current.role : defaults.role,
    targetCompany: current.targetCompany.trim()
      ? current.targetCompany
      : defaults.targetCompany,
    experience:
      current.experience !== "0" || defaults.experience === "0"
        ? current.experience
        : defaults.experience,
  };
}
