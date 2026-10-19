"use client";

import { useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { setAuthTokenGetter } from "@/lib/api";
import { getQueryClient } from "@/lib/query-client";
import { CLIENT_CACHE_VERSION_STORAGE_KEY } from "@/lib/client-cache-sync";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  /** Last signed-in user seen in this tab — lets us tell "signed out" apart from "guest visit". */
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      lastUserIdRef.current = user.id;
      localStorage.setItem("clerk-user-id", user.id);
      setAuthTokenGetter(() => getToken());
    } else if (isLoaded && !user) {
      // Only wipe cached data when someone was signed in (now, or a stale id from an
      // expired session whose header may have gone out on early requests). A plain guest
      // visit has nothing private cached, and clear() would silently cancel in-flight
      // public queries (they then stay "fetching" forever — e.g. the site popup).
      const hadUser = lastUserIdRef.current !== null || localStorage.getItem("clerk-user-id") !== null;
      lastUserIdRef.current = null;
      localStorage.removeItem("clerk-user-id");
      localStorage.removeItem(CLIENT_CACHE_VERSION_STORAGE_KEY);
      setAuthTokenGetter(() => Promise.resolve(null));
      if (hadUser) getQueryClient().clear();
    }
  }, [isLoaded, user, getToken]);

  return <>{children}</>;
}
