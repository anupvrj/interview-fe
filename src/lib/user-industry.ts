import type { User } from "@/lib/api";
import {
  INDUSTRY_NAMES,
  isKnownIndustry,
  normalizeIndustry,
  PROFILE_INDUSTRIES,
} from "@/lib/career-catalog";

export { INDUSTRY_NAMES, PROFILE_INDUSTRIES } from "@/lib/career-catalog";

export function resolveUserIndustry(
  user?: Pick<User, "industry" | "industries" | "currentJob"> | null,
): string {
  const candidates = [
    user?.industry,
    user?.currentJob?.industry,
    ...(user?.industries ?? []),
  ];

  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const normalized = normalizeIndustry(trimmed);
    if (isKnownIndustry(normalized)) return normalized;
  }

  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (trimmed) return normalizeIndustry(trimmed);
  }

  return "";
}

/** Migrate legacy skills stored in the industries array. */
export function partitionLegacyProfileSkills(
  industries: string[] = [],
  skills: string[] = [],
): string[] {
  const industrySet = new Set(INDUSTRY_NAMES);
  const legacySkills = industries.filter((item) => {
    const normalized = normalizeIndustry(item);
    return !industrySet.has(normalized);
  });
  const mergedSkills = [...skills];
  const seen = new Set(mergedSkills.map((skill) => skill.toLowerCase()));
  for (const skill of legacySkills) {
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    mergedSkills.push(skill);
  }
  return mergedSkills;
}
