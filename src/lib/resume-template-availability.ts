/**
 * Resume templates Super Admin turned off. Disabled templates are hidden from every
 * picker; resumes already using one keep rendering with it.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/lib/api";

export const RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY = ["resume-template-availability"] as const;

const CACHE_MS = 30_000;
let cached: { ids: string[]; at: number } | null = null;

/** Never throws: if the lookup fails, nothing is hidden (the backend still blocks disabled picks). */
export async function fetchDisabledResumeTemplateIds(): Promise<string[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.ids;
  try {
    const ids = await configApi.getDisabledResumeTemplateIds();
    cached = { ids, at: Date.now() };
    return ids;
  } catch {
    return cached?.ids ?? [];
  }
}

export function forgetResumeTemplateAvailability(): void {
  cached = null;
}

/** Drop disabled templates; `keepId` (the resume's current template) always stays. */
export function filterSelectableTemplates<T extends { id: string }>(
  templates: T[],
  disabledIds: readonly string[],
  keepId?: string | null,
): T[] {
  if (disabledIds.length === 0) return templates;
  const off = new Set(disabledIds);
  return templates.filter((t) => !off.has(t.id) || t.id === keepId);
}

export function useDisabledResumeTemplateIds(): string[] {
  const query = useQuery({
    queryKey: RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY,
    queryFn: fetchDisabledResumeTemplateIds,
    staleTime: CACHE_MS,
  });
  return query.data ?? [];
}
