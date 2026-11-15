"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/** Already signed in on a sign-in/up page (a second tab, the back button): go on, no form. */
export function useRedirectIfSignedIn(destination: string): boolean {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace(destination);
  }, [isLoaded, isSignedIn, destination, router]);
  return Boolean(isLoaded && isSignedIn);
}
