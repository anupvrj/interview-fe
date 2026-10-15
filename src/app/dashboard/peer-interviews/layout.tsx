"use client";

import type { ReactNode } from "react";
import { InstituteCandidateFeatureLock } from "@/components/upsell/InstituteCandidateFeatureLock";

export default function PeerInterviewsLayout({ children }: { children: ReactNode }) {
  return (
    <InstituteCandidateFeatureLock featureLabel="Peer interviews">
      {children}
    </InstituteCandidateFeatureLock>
  );
}
