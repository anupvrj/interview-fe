/**
 * Resume templates Super Admin turned off, and the order every template list shows.
 * Disabled templates are hidden from every picker; resumes already using one keep
 * rendering with it. With no saved order each list keeps its own built-in order.
 */
"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { configApi, type ResumeTemplateAvailability } from "@/lib/api";
import { withListOverrides } from "@/lib/resume-template-overrides";

export type { ResumeTemplateAvailability };

export const RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY = ["resume-template-availability"] as const;

const CACHE_MS = 30_000;
const NONE: ResumeTemplateAvailability = { disabledTemplateIds: [], templateOrder: [], overrides: {} };
let cached: { value: ResumeTemplateAvailability; at: number } | null = null;
let inFlight: Promise<ResumeTemplateAvailability> | null = null;

/** Never throws: if the lookup fails, nothing is hidden or reordered (the backend still blocks disabled picks). */
export async function fetchResumeTemplateAvailability(): Promise<ResumeTemplateAvailability> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  // Template lists load every template at once: share one request instead of sending one each.
  if (inFlight) return inFlight;
  const request: Promise<ResumeTemplateAvailability> = configApi
    .getResumeTemplateAvailability()
    .then((value) => {
      if (inFlight === request) cached = { value, at: Date.now() };
      return value;
    })
    .catch(() => cached?.value ?? NONE)
    .finally(() => {
      if (inFlight === request) inFlight = null;
    });
  inFlight = request;
  return request;
}

export async function fetchDisabledResumeTemplateIds(): Promise<string[]> {
  return (await fetchResumeTemplateAvailability()).disabledTemplateIds;
}

export function forgetResumeTemplateAvailability(): void {
  cached = null;
  inFlight = null; // a reply already on its way may predate the change being checked for
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

/** Sort by Super Admin's order; ids it doesn't know keep their place after the known ones. */
export function orderResumeTemplates<T extends { id: string }>(
  templates: T[],
  order: readonly string[],
): T[] {
  if (order.length === 0) return templates;
  const position = new Map(order.map((id, index) => [id, index]));
  return templates
    .map((template, index) => ({ template, index, at: position.get(template.id) ?? order.length + index }))
    .sort((a, b) => a.at - b.at || a.index - b.index)
    .map(({ template }) => template);
}

/**
 * What a template list should show: enabled templates (plus `keepId`), in display order,
 * with Super Admin's name / category / description edits.
 */
export function arrangeResumeTemplates<T extends { id: string }>(
  templates: T[],
  availability: Pick<ResumeTemplateAvailability, "disabledTemplateIds" | "templateOrder"> &
    Partial<Pick<ResumeTemplateAvailability, "overrides">> | null | undefined,
  keepId?: string | null,
): T[] {
  if (!availability) return templates;
  return orderResumeTemplates(
    filterSelectableTemplates(templates, availability.disabledTemplateIds, keepId),
    availability.templateOrder,
  ).map((t) => withListOverrides(t, availability.overrides));
}

/** A template's name as lists show it: Super Admin's edit, else `fallback`. */
export function templateDisplayName(
  templateId: string | null | undefined,
  fallback: string,
  overrides: ResumeTemplateAvailability["overrides"] | null | undefined,
): string {
  return (templateId && overrides?.[templateId]?.name) || fallback;
}

/**
 * `initial` (fetched on the server for public pages) shows the right list on first paint;
 * the browser still refreshes it so a change made a moment ago shows up.
 */
export function useResumeTemplateAvailability(
  initial?: ResumeTemplateAvailability | null,
): ResumeTemplateAvailability & { ready: boolean } {
  const query = useQuery({
    queryKey: RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY,
    queryFn: fetchResumeTemplateAvailability,
    staleTime: CACHE_MS,
    initialData: initial ?? undefined,
    initialDataUpdatedAt: 0,
  });
  // the lookup never fails (it falls back to "nothing hidden"), so ready = it has answered once
  return { ...(query.data ?? NONE), ready: query.data !== undefined };
}

export function useDisabledResumeTemplateIds(): string[] {
  return useResumeTemplateAvailability().disabledTemplateIds;
}

/** `name(id, fallback)`: a template's name with Super Admin's edit (re-renders when edits load). */
export function useTemplateDisplayName(): (templateId: string | null | undefined, fallback: string) => string {
  const { overrides } = useResumeTemplateAvailability();
  return useCallback(
    (templateId: string | null | undefined, fallback: string) => templateDisplayName(templateId, fallback, overrides),
    [overrides],
  );
}
