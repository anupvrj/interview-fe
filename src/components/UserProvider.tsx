"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Store userId in localStorage for API calls
      localStorage.setItem("clerk-user-id", user.id);
    } else if (isLoaded && !user) {
      // Clear userId if user is not signed in
      localStorage.removeItem("clerk-user-id");
    }
  }, [isLoaded, user]);

  return <>{children}</>;
}
