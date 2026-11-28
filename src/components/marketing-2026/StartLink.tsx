"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useHydrated } from "@/hooks/useHydrated";
import { signUpTo } from "./cta";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

/** Tools anyone can use before signing up: the link goes there directly for everyone. */
const PUBLIC_STARTS = /^\/(resume-builder|ats-checker)(\/|$|\?)/;

/**
 * Logged-in users go to the product flow; everyone else signs up and lands back there,
 * except for tools that work signed out (the public builder asks for sign-up itself).
 */
export function StartLink({ href, className, children }: Props) {
  const { isSignedIn } = useAuth();
  const hydrated = useHydrated();
  if (PUBLIC_STARTS.test(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  // Rendered for everyone (it's in the server HTML); the sign-up link until we know the visitor
  // is signed in, so the server and the first client pass match.
  return (
    <Link href={hydrated && isSignedIn ? href : signUpTo(href)} className={className}>
      {children}
    </Link>
  );
}
