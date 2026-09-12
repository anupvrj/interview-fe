import { QueryClient } from "@tanstack/react-query";

export const DASHBOARD_STALE_TIME_MS = 5 * 60 * 1000;
export const DASHBOARD_GC_TIME_MS = 30 * 60 * 1000;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DASHBOARD_STALE_TIME_MS,
        gcTime: DASHBOARD_GC_TIME_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
