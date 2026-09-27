"use client";

import type { ReactNode } from "react";
import { InstituteCandidateFeatureLock } from "@/components/upsell/InstituteCandidateFeatureLock";

export default function InterviewsLayout({ children }: { children: ReactNode }) {
  return (
    <InstituteCandidateFeatureLock featureLabel="AI mock interviews">
      {children}
    </InstituteCandidateFeatureLock>
  );
}
