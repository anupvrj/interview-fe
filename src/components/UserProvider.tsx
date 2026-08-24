"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { setAuthTokenGetter } from "@/lib/api";
import { getQueryClient } from "@/lib/query-client";
import { CLIENT_CACHE_VERSION_STORAGE_KEY } from "@/lib/client-cache-sync";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      setAuthTokenGetter(() => getToken());
    } else if (isLoaded && !user) {
      localStorage.removeItem("clerk-user-id");
      localStorage.removeItem(CLIENT_CACHE_VERSION_STORAGE_KEY);
      setAuthTokenGetter(() => Promise.resolve(null));
      getQueryClient().clear();
    }
  }, [isLoaded, user, getToken]);

  return <>{children}</>;
}
