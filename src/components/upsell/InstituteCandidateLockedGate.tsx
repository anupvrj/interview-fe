"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import type { InstituteCandidateLockReason } from "@/lib/institution-flags";

type Props = {
  reason: InstituteCandidateLockReason;
  instituteName?: string | null;
  featureLabel: string;
  children?: ReactNode;
};

const COPY: Record<
  InstituteCandidateLockReason,
  {
    badge: string;
    title: (instituteName: string) => string;
    description: (featureLabel: string) => string;
    ctaLabel?: string;
    ctaHref?: string;
    icon: typeof Lock;
  }
> = {
  demo: {
    badge: "Institute setup",
    title: (name) => `${name} is still being set up`,
    description: (feature) =>
      `You'll be able to use ${feature} once your institute goes live.`,
    icon: Building2,
  },
  identity_missing: {
    badge: "Identity required",
    title: () => "Verify your identity",
    description: () =>
      "Upload your institute ID card and record a face video to unlock this feature.",
    ctaLabel: "Complete identity verification",
    ctaHref: "/dashboard/identity-verification",
    icon: Shield,
  },
  identity_pending: {
    badge: "In review",
    title: () => "Identity verification in progress",
    description: () =>
      "Your identity verification is being processed. Please wait 24 to 48 hours, or reach out to your institute support.",
    icon: Shield,
  },
  identity_failed: {
    badge: "Action needed",
    title: () => "Identity verification failed",
    description: () =>
      "Your institute could not verify this credential. Record a new clip and upload your ID card again.",
    ctaLabel: "Retry identity verification",
    ctaHref: "/dashboard/identity-verification",
    icon: Shield,
  },
};

export function InstituteCandidateLockedGate({
  reason,
  instituteName,
  featureLabel,
  children,
}: Props) {
  const config = COPY[reason];
  const name = instituteName?.trim() || "Your institute";
  const Icon = config.icon;

  return (
    <div className="relative isolate min-h-[520px] overflow-hidden rounded-xl border border-border/60 bg-card sm:min-h-[600px]">
      <div
        className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-50 blur-[2px]"
        aria-hidden
      >
        {children ?? (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="h-24 rounded-xl bg-muted/60" />
            <div className="h-40 rounded-xl bg-muted/40" />
            <div className="h-40 rounded-xl bg-muted/30" />
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-background/25 backdrop-blur-[2.4px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/90 from-0% via-background/55 via-[42%] to-background/20 to-100%"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7367F0]/25 bg-card shadow-lg">
          <Icon className="h-7 w-7 text-[#7367F0]" aria-hidden />
        </div>
        <span className="mb-3 inline-flex rounded-full border border-[#7367F0]/25 bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0]">
          {config.badge}
        </span>
        <h2 className="max-w-md text-xl font-bold text-foreground sm:text-2xl">
          {config.title(name)}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {config.description(featureLabel)}
        </p>
        {config.ctaHref ? (
          <Button asChild size="lg" className={cn("mt-6", institutePrimaryClass)}>
            <Link href={config.ctaHref}>{config.ctaLabel}</Link>
          </Button>
        ) : (
          <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-card/80">
            <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
