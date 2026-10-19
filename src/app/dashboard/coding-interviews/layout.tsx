"use client";

import type { ReactNode } from "react";
import { InstituteCandidateFeatureLock } from "@/components/upsell/InstituteCandidateFeatureLock";

export default function CodingInterviewsLayout({ children }: { children: ReactNode }) {
  return (
    <InstituteCandidateFeatureLock featureLabel="Coding round">
      {children}
    </InstituteCandidateFeatureLock>
  );
}
