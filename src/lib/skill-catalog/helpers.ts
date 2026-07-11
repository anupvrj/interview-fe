import { CAREER_CATALOG } from "@/lib/career-catalog/catalog";
import { normalizeIndustry } from "@/lib/career-catalog/helpers";
import type { IndustryKey } from "@/lib/career-catalog/types";
import {
  ALL_SKILLS,
  getSkillsForCategories,
  INDUSTRY_SKILL_CATEGORIES,
} from "./catalog";

const industryKeyByName = new Map<string, IndustryKey>(
  CAREER_CATALOG.map((item) => [item.name, item.key]),
);

/** @deprecated Use ALL_SKILLS from skill-catalog */
export const SKILL_SUGGESTIONS = ALL_SKILLS;

export function resolveIndustryKey(industryName?: string): IndustryKey | undefined {
  const trimmed = industryName?.trim();
  if (!trimmed) return undefined;
  const normalized = normalizeIndustry(trimmed);
  return industryKeyByName.get(normalized);
}

export function getSkillsForIndustry(industryName?: string): string[] {
  const key = resolveIndustryKey(industryName);
  if (!key) return ALL_SKILLS;
  return getSkillsForCategories(INDUSTRY_SKILL_CATEGORIES[key]);
}

export function getAllSkills(): string[] {
  return ALL_SKILLS;
}

export function filterSkillSuggestions(
  query: string,
  selected: string[],
  industryName?: string,
  limit = 8,
): string[] {
  const normalizedSelected = new Set(
    selected.map((skill) => skill.trim().toLowerCase()),
  );
  const trimmed = query.trim().toLowerCase();
  const pool = getSkillsForIndustry(industryName).filter(
    (skill) => !normalizedSelected.has(skill.toLowerCase()),
  );

  if (!trimmed) {
    return pool.slice(0, limit);
  }

  return pool
    .filter((skill) => skill.toLowerCase().includes(trimmed))
    .slice(0, limit);
}

export function skillAlreadySelected(
  skill: string,
  selected: string[],
): boolean {
  const normalized = skill.trim().toLowerCase();
  return selected.some((item) => item.trim().toLowerCase() === normalized);
}
