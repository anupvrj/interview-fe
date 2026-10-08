"use client";

import type { ReactNode } from "react";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { instituteCandidateLockReason } from "@/lib/institution-flags";
import { InstituteCandidateLockedGate } from "@/components/upsell/InstituteCandidateLockedGate";

export function InstituteCandidateFeatureLock({
  featureLabel,
  children,
}: {
  featureLabel: string;
  children: ReactNode;
}) {
  const profile = useActiveRole()?.profile;
  const reason = instituteCandidateLockReason(profile);
  if (!reason) return <>{children}</>;
  return (
    <InstituteCandidateLockedGate
      reason={reason}
      instituteName={profile?.institutionName}
      featureLabel={featureLabel}
    >
      {children}
    </InstituteCandidateLockedGate>
  );
}
