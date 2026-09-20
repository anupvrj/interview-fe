"use client";

import Link from "next/link";
import { biometricEnrollmentState } from "@/lib/institution-flags";

function TwitterStyleTick() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="#1D9BF0"
        d="M12 2.15 14.28 4l2.78.42.42 2.78L20 9.5l-1.25 2.5L20 14.5l-2.52 2.3-.42 2.78-2.78.42L12 21.85 9.72 20l-2.78-.42-.42-2.78L4 14.5l1.25-2.5L4 9.5l2.52-2.3.42-2.78 2.78-.42L12 2.15Z"
      />
      <path
        d="M7.7 12.15 10.4 14.8 16.3 8.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileBiometricMark({
  status,
}: Readonly<{ status?: string | null }>) {
  const state = biometricEnrollmentState(status);

  if (state === "ready") {
    return (
      <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-sm font-medium text-[#1D9BF0]">
        <TwitterStyleTick />
        <span className="min-w-0 break-words">Biometric verified</span>
      </span>
    );
  }

  if (state === "pending") {
    return (
      <Link
        href="/dashboard/identity-verification"
        className="inline-flex h-9 shrink-0 items-center rounded-full border border-border/70 bg-muted/70 px-3 text-xs font-semibold text-muted-foreground"
      >
        Checking…
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/identity-verification"
      className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#1D9BF0] px-3 text-xs font-semibold text-white hover:bg-[#1A8CD8]"
    >
      Verify now
    </Link>
  );
}
