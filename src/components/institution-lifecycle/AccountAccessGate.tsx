"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { userApi, type MyAccessState } from "@/lib/api";

/**
 * Sends blocked users to /account-blocked right after sign-in (the API interceptor
 * covers later requests). Demo and identity messaging now live on feature pages
 * as fade overlays.
 */
export function AccountAccessGate() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [access, setAccess] = useState<MyAccessState | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    userApi
      .getMyAccess()
      .then((a) => {
        if (!cancelled) {
          setAccess(a);
          if (!a.allowed) {
            router.replace(`/account-blocked${a.code ? `?code=${encodeURIComponent(a.code)}` : ""}`);
          }
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, router]);

  if (!access?.allowed) return null;
  return null;
}
