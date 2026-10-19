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

/** Fields the user has changed, including clearing a prefilled value. */
export type InterviewFormEdits = {
  role?: boolean;
  targetCompany?: boolean;
  experience?: boolean;
};

/** Merge profile defaults into interview form state without overwriting user edits. */
export function mergeInterviewFormDefaults<T extends InterviewFormDefaults>(
  current: T,
  profile: User,
  edits?: InterviewFormEdits,
): T {
  const defaults = interviewDefaultsFromProfile(profile);
  return {
    ...current,
    role: edits?.role
      ? current.role
      : current.role.trim()
        ? current.role
        : defaults.role,
    targetCompany: edits?.targetCompany
      ? current.targetCompany
      : current.targetCompany.trim()
        ? current.targetCompany
        : defaults.targetCompany,
    experience: edits?.experience
      ? current.experience
      : current.experience !== "0" || defaults.experience === "0"
        ? current.experience
        : defaults.experience,
  };
}

/** Chrome-extension job capture wins over profile defaults for role and company. */
export function applyJobCaptureToInterviewForm<T extends InterviewFormDefaults>(
  current: T,
  capture: { title?: string; company?: string },
): T {
  const title = capture.title?.trim() ?? "";
  const company = capture.company?.trim() ?? "";
  return {
    ...current,
    role: title || current.role,
    targetCompany: company || current.targetCompany,
  };
}
