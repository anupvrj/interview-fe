"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { signUpTo } from "./cta";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

/** Logged-in users go to the product flow; everyone else signs up and lands back there. */
export function StartLink({ href, className, children }: Props) {
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
