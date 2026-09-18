import { CAREER_CATALOG } from "./catalog";
import type { IndustryDefinition, SelectOption } from "./types";

/** Map legacy profile industry strings to canonical catalog names. */
export const LEGACY_INDUSTRY_ALIASES: Record<string, string> = {
  "IT/Software": "Technology",
  "IT Services": "IT Services",
  Finance: "Fintech",
  Healthcare: "Others",
  Education: "Others",
  Manufacturing: "Others",
  Retail: "E-commerce",
  Consulting: "Others",
  "E-commerce": "E-commerce",
  Telecommunications: "Technology",
  Automotive: "Others",
  "Real Estate": "Others",
  "Media & Entertainment": "Sales Marketing",
  Other: "Others",
};

const catalogByName = new Map<string, IndustryDefinition>(
  CAREER_CATALOG.map((item) => [item.name, item]),
);

export const INDUSTRY_NAMES = CAREER_CATALOG.map((item) => item.name);

/** @deprecated Use INDUSTRY_NAMES from career-catalog */
export const PROFILE_INDUSTRIES = INDUSTRY_NAMES;

export function getIndustryDefinition(
  name: string,
): IndustryDefinition | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return (
    catalogByName.get(trimmed) ??
    catalogByName.get(normalizeIndustry(trimmed))
  );
}

export function normalizeIndustry(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (catalogByName.has(trimmed)) return trimmed;
  return LEGACY_INDUSTRY_ALIASES[trimmed] ?? trimmed;
}

export function isKnownIndustry(value: string): boolean {
  const normalized = normalizeIndustry(value);
  return catalogByName.has(normalized);
}

export function getRolesForIndustry(industryName: string): string[] {
  const definition = getIndustryDefinition(industryName);
  return definition ? [...definition.roles] : [];
}

export function getAllJobRoles(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const industry of CAREER_CATALOG) {
    for (const role of industry.roles) {
      const key = role.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(role);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function isKnownJobRole(role: string, industryName?: string): boolean {
  const trimmed = role.trim();
  if (!trimmed) return false;
  if (industryName?.trim()) {
    return getRolesForIndustry(industryName).some(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );
  }
  return getAllJobRoles().some(
    (item) => item.toLowerCase() === trimmed.toLowerCase(),
  );
}

export function industrySelectOptions(): SelectOption[] {
  return CAREER_CATALOG.map((item) => ({ value: item.name, label: item.name }));
}

export function filterJobRoleSuggestions(
  query: string,
  industryName?: string,
  limit = 10,
): string[] {
  const roles = industryName?.trim()
    ? getRolesForIndustry(industryName)
    : getAllJobRoles();
  const trimmed = (query ?? "").trim().toLowerCase();
  const pool = trimmed
    ? roles.filter((role) => role.toLowerCase().includes(trimmed))
    : roles;
  return pool.slice(0, limit);
}

export function jobRoleSelectOptions(industryName?: string): SelectOption[] {
  const roles = industryName?.trim()
    ? getRolesForIndustry(industryName)
    : getAllJobRoles();
  return roles.map((role) => ({ value: role, label: role }));
}

/** Shape compatible with legacy PeerIndustry API responses. */
export function toPeerIndustryList(): Array<{
  key: string;
  name: string;
  roles: string[];
  order: number;
}> {
  return CAREER_CATALOG.map((item) => ({
    key: item.key,
    name: item.name,
    roles: [...item.roles],
    order: item.order,
  }));
}
