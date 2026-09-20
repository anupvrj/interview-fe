export const INSTITUTION_PRODUCT_KEYS = [
  "resume_builder",
  "ai_interview",
  "coding_practice",
  "system_design",
  "job_tracker",
  "analytics",
  "ix_report",
] as const;

export type InstitutionProductKey = (typeof INSTITUTION_PRODUCT_KEYS)[number];

export const INSTITUTION_PRODUCT_LABELS: Record<InstitutionProductKey, string> = {
  resume_builder: "Resume builder",
  ai_interview: "AI mock interview",
  coding_practice: "Coding round",
  system_design: "Live system design",
  job_tracker: "Job tracker",
  analytics: "Reports & analytics",
  ix_report: "iX Report",
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
    ai_interview: true,
    coding_practice: true,
    system_design: true,
    job_tracker: true,
    analytics: true,
    ix_report: true,
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
  return products?.[key as InstitutionProductKey] !== false;
}

export function isInstituteBiometricRequired(
  profile:
    | {
        institutionId?: string | null;
        institutionFlags?: InstitutionFlags | null;
      }
    | null
    | undefined,
): boolean {
  return Boolean(
    profile?.institutionId && profile.institutionFlags?.biometricVerification,
  );
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
