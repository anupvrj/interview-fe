"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { setAuthTokenGetter } from "@/lib/api";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      setAuthTokenGetter(() => getToken());
    } else if (isLoaded && !user) {
      localStorage.removeItem("clerk-user-id");
      setAuthTokenGetter(() => Promise.resolve(null));
    }
  }, [isLoaded, user, getToken]);

  return <>{children}</>;
}
