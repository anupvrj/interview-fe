"use client";

import type { ReactNode } from "react";
import { InstituteCandidateFeatureLock } from "@/components/upsell/InstituteCandidateFeatureLock";

export default function AtsCheckerLayout({ children }: { children: ReactNode }) {
  return (
    <InstituteCandidateFeatureLock featureLabel="ATS checker">
      {children}
    </InstituteCandidateFeatureLock>
  );
}
