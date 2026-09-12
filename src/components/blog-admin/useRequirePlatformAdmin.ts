"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { isPlatformAdmin } from "@/lib/dashboard-nav";

export function useRequirePlatformAdmin() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const verify = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.replace("/sign-in");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile = await ensureUserProfile(user);
      if (!isPlatformAdmin(profile.accessRole ?? null)) {
        router.replace("/dashboard");
        return;
      }
      setAuthorized(true);
    } catch {
      setAuthorized(false);
      setError("Could not verify admin access. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user, router]);

  useEffect(() => {
    void verify();
  }, [verify, attempt]);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  return {
    authorized,
    loading: !isLoaded || loading,
    error,
    retry,
  };
}
