"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { configApi } from "@/lib/api";
import {
  applyClientCacheVersion,
  CLIENT_CACHE_VERSION_STORAGE_KEY,
  parseStoredCacheVersion,
} from "@/lib/client-cache-sync";

const POLL_INTERVAL_MS = 60_000;

export { CLIENT_CACHE_VERSION_STORAGE_KEY } from "@/lib/client-cache-sync";

export function ClientCacheVersionMonitor() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    async function checkVersion(showToast: boolean) {
      try {
        const { version } = await configApi.getClientCacheVersion();
        if (cancelled) return;

        const storedVersion = parseStoredCacheVersion(
          localStorage.getItem(CLIENT_CACHE_VERSION_STORAGE_KEY),
        );

        if (storedVersion !== null && storedVersion !== version) {
          applyClientCacheVersion(queryClient, version);
          if (showToast) {
            toast.info("App data refreshed");
          }
        } else if (storedVersion === null) {
          localStorage.setItem(CLIENT_CACHE_VERSION_STORAGE_KEY, String(version));
        }
      } catch {
        // Ignore polling errors — cache version is best-effort.
      }
    }

    void checkVersion(false);

    const interval = setInterval(() => {
      void checkVersion(true);
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkVersion(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [queryClient]);

  return null;
}
