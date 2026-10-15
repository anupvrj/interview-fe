export const INSTITUTION_PRODUCT_KEYS = [
  "resume_builder",
  "ats_checker",
  "ai_interview",
  "coding_practice",
  "system_design",
  "job_tracker",
  "analytics",
  "ix_report",
  "peer_interviews",
  "api_connector",
] as const;

export type InstitutionProductKey = (typeof INSTITUTION_PRODUCT_KEYS)[number];

export const INSTITUTION_PRODUCT_LABELS: Record<InstitutionProductKey, string> = {
  resume_builder: "Resume builder",
  ats_checker: "ATS checker",
  ai_interview: "AI mock interview",
  coding_practice: "Coding round",
  system_design: "Live system design",
  job_tracker: "Job tracker",
  analytics: "Reports & analytics",
  ix_report: "iX Report",
  peer_interviews: "Peer interviews",
  api_connector: "AI connector",
};

export const INSTITUTION_PRODUCT_HINTS: Partial<Record<InstitutionProductKey, string>> = {
  peer_interviews:
    "Candidates can book peer mock interviews when this is on and included in the plan.",
  api_connector:
    "ChatGPT, Claude, Cursor, and other LLM clients. Institute staff and candidates can connect only when this is on.",
};

import type { IntegritySettings } from "@/lib/integrity/settings";

export type InstitutionFlags = {
  biometricVerification?: boolean;
  products?: Partial<Record<InstitutionProductKey, boolean>>;
  integrity?: Partial<IntegritySettings>;
};

export function defaultInstitutionProducts(): Record<InstitutionProductKey, boolean> {
  return {
    resume_builder: true,
    ats_checker: true,
    ai_interview: true,
    coding_practice: true,
    system_design: true,
    job_tracker: true,
    analytics: true,
    ix_report: true,
    peer_interviews: true,
    api_connector: false,
  };
}

export function isInstitutionProductEnabled(
  products: InstitutionFlags["products"] | undefined,
  key: string | undefined,
): boolean {
  if (!key) return true;
  if (!(INSTITUTION_PRODUCT_KEYS as readonly string[]).includes(key)) {
    return true;
  }
  const typed = key as InstitutionProductKey;
  return products?.[typed] ?? defaultInstitutionProducts()[typed];
}

export function isInstituteBiometricRequired(
  profile:
    | {
        institutionId?: string | null;
        institutionInvited?: boolean | null;
        accessRole?: string | null;
        institutionFlags?: InstitutionFlags | null;
      }
    | null
    | undefined,
): boolean {
  if (isInstituteManagedCandidate(profile)) return true;
  return Boolean(
    profile?.institutionId && profile.institutionFlags?.biometricVerification,
  );
}

export function canManagedCandidateSelfStart(
  profile:
    | {
        institutionId?: string | null;
        institutionInvited?: boolean | null;
        accessRole?: string | null;
        allowCandidateSelfStart?: boolean | null;
      }
    | null
    | undefined,
): boolean {
  if (!isInstituteManagedCandidate(profile)) return true;
  return profile?.allowCandidateSelfStart !== false;
}

export function isInstituteManagedCandidate(
  profile:
    | {
        institutionId?: string | null;
        institutionInvited?: boolean | null;
        accessRole?: string | null;
      }
    | null
    | undefined,
): boolean {
  return (
    Boolean(profile?.institutionId) &&
    (profile?.accessRole || "user") === "user" &&
    profile?.institutionInvited === true
  );
}

export type InstituteCandidateLockReason =
  | "demo"
  | "identity_missing"
  | "identity_pending"
  | "identity_failed";

export function instituteCandidateLockReason(
  profile:
    | {
        institutionId?: string | null;
        institutionInvited?: boolean | null;
        accessRole?: string | null;
        institutionMode?: string | null;
        biometricStatus?: string | null;
        institutionFlags?: InstitutionFlags | null;
      }
    | null
    | undefined,
): InstituteCandidateLockReason | null {
  if (!isInstituteManagedCandidate(profile)) return null;
  if ((profile?.institutionMode || "live") === "demo") return "demo";
  const status = profile?.biometricStatus;
  if (status === "human_verified") return null;
  if (status === "pending" || status === "in-review") return "identity_pending";
  if (status === "failed" || status === "failed_by_admin") return "identity_failed";
  return "identity_missing";
}

/** Optional identity opt-in is always available. Institute flag only requires ID + TPO. */
export function isIdentitySurfaceEnabled(
  _profile?:
    | {
        institutionId?: string | null;
        institutionFlags?: InstitutionFlags | null;
      }
    | null,
): boolean {
  return true;
}

export type BiometricEnrollmentState = "missing" | "pending" | "ready";

/** Usable matching = approved (B2C) or human_verified (TPO). */
export function biometricEnrollmentState(
  status?: string | null,
): BiometricEnrollmentState {
  if (status === "approved" || status === "human_verified") return "ready";
  if (status === "pending" || status === "in-review") return "pending";
  return "missing";
}

export function biometricEnrollmentLabel(status?: string | null): string {
  if (status === "human_verified") return "Verified";
  if (status === "approved") return "Approved";
  if (status === "in-review") return "In review";
  if (status === "pending") return "Checking";
  if (status === "failed" || status === "failed_by_admin") return "Failed";
  return "Not recorded";
}
