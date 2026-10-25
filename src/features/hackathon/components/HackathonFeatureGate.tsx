"use client";

import type { ReactNode } from "react";
import { HackathonPageLoader } from "./HackathonPageLoader";
import { FeatureUnavailable } from "@/components/features/FeatureUnavailable";
import { useHackathonFeature } from "../hooks";
import { useLoadingTimeout } from "@/lib/stuck-loading";

export function HackathonFeatureGate({
  children,
  backHref = "/",
  backLabel = "Back to home",
  showWhileLoading = false,
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Show the page right away instead of a loader (public landing: first paint matters most). */
  showWhileLoading?: boolean;
}) {
  const feature = useHackathonFeature();
  useLoadingTimeout(feature.isLoading, "hackathon availability");
  if (feature.isLoading) {
    return showWhileLoading ? children : <HackathonPageLoader />;
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
