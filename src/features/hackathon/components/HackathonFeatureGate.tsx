"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { FeatureUnavailable } from "@/components/features/FeatureUnavailable";
import { useHackathonFeature } from "../hooks";

export function HackathonFeatureGate({
  children,
  backHref = "/",
  backLabel = "Back to home",
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const feature = useHackathonFeature();
  if (feature.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }
  if (!feature.accessible) {
    return (
      <FeatureUnavailable
        title={feature.unavailableTitle}
        message={feature.unavailableMessage}
        backHref={backHref}
        backLabel={backLabel}
      />
    );
  }
  return children;
}
