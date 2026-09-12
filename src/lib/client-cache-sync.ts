import type { QueryClient } from "@tanstack/react-query";
import { TemplateLoader } from "@/lib/templateLoader";
import { clearAllLastGoodPages } from "@/lib/resume-pagination-last-good-cache";

export const CLIENT_CACHE_VERSION_STORAGE_KEY = "ix-client-cache-version";

export function parseStoredCacheVersion(stored: string | null): number | null {
  if (!stored) return null;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : null;
}

export function applyClientCacheVersion(
  queryClient: QueryClient,
  version: number,
): void {
  queryClient.clear();
  TemplateLoader.clearCache();
  clearAllLastGoodPages();
  localStorage.setItem(CLIENT_CACHE_VERSION_STORAGE_KEY, String(version));
}
