"use client";

import type { ReactNode } from "react";
import { InstituteCandidateFeatureLock } from "@/components/upsell/InstituteCandidateFeatureLock";

export default function ResumesLayout({ children }: { children: ReactNode }) {
  return (
    <InstituteCandidateFeatureLock featureLabel="Resume builder">
      {children}
    </InstituteCandidateFeatureLock>
  );
}
