import type { ResumeTemplateAvailability } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
const CACHE_SECONDS = process.env.NODE_ENV === "development" ? 0 : 60;

/**
 * Super Admin's template settings for a public page's first paint. Null when the API is
 * slow or down: the page then shows its built-in list and the browser fetches the settings.
 */
export async function fetchResumeTemplateAvailabilityOnServer(): Promise<ResumeTemplateAvailability | null> {
  try {
    const res = await fetch(`${API_URL}/config/resume-templates`, {
      next: { tags: ["resume-templates"], revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Partial<ResumeTemplateAvailability> };
    return {
      disabledTemplateIds: json.data?.disabledTemplateIds ?? [],
      templateOrder: json.data?.templateOrder ?? [],
      overrides: json.data?.overrides ?? {},
    };
  } catch {
    return null;
  }
}
