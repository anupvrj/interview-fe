"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadPendingJobHandoffPath } from "@/lib/extension-job-handoff";

type ResumeExtensionHandoffOptions = {
  enabled?: boolean;
  onBeforeRedirect?: () => void;
};

/**
 * After login, Clerk often lands on /dashboard (or /select-role). The Chrome
 * extension capture lives in storage — resume the tailor/practice flow.
 */
export function useResumeExtensionHandoff(
  options: ResumeExtensionHandoffOptions = {},
): void {
  const { enabled = true, onBeforeRedirect } = options;
  const router = useRouter();
  const pathname = usePathname();
  const onBeforeRedirectRef = useRef(onBeforeRedirect);
  onBeforeRedirectRef.current = onBeforeRedirect;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const go = (): boolean => {
      const path = loadPendingJobHandoffPath();
      if (!path) return false;
      if (pathname === path) return true;
      onBeforeRedirectRef.current?.();
      router.replace(path);
      return true;
    };

    if (go()) return;

    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks += 1;
      if (go() || ticks >= 8) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [enabled, pathname, router]);
}
