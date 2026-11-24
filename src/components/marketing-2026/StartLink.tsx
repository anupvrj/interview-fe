"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
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
  if (PUBLIC_STARTS.test(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <>
      <SignedIn>
        <Link href={href} className={className}>
          {children}
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href={signUpTo(href)} className={className}>
          {children}
        </Link>
      </SignedOut>
    </>
  );
}
