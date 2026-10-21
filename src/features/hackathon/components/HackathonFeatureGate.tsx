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
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const feature = useHackathonFeature();
  useLoadingTimeout(feature.isLoading, "hackathon availability");
  if (feature.isLoading) {
    return <HackathonPageLoader />;
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
