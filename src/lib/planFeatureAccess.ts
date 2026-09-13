export const PLAN_GATED_PLATFORM_FEATURES = [
  "ai_interview",
  "coding_practice",
  "system_design",
  "resume_builder",
  "ats_checker",
  "ix_report",
  "analytics",
  "peer_interviews",
] as const;

export type PlanGatedPlatformFeature =
  (typeof PLAN_GATED_PLATFORM_FEATURES)[number];

export type EntitlementFeature =
  | "aiMockInterview"
  | "codingRound"
  | "systemDesign"
  | "behavioralMock"
  | "resumeDesign"
  | "resumeDownload"
  | "atsChecker"
  | "atsOptimizer"
  | "oneClickResumeOptimizer"
  | "detailedInterviewReport"
  | "ixScore"
  | "ixCertifiedBadge"
  | "growthTracking"
  | "targetCompanyPractice"
  | "advancedAiModels"
  | "whiteboard"
  | "peerInterviewBooking"
  | "freePeerInterviewsPerPeriod";

export type PlanEntitlements = {
  [K in EntitlementFeature]: K extends "freePeerInterviewsPerPeriod"
    ? number
    : boolean;
};

export const PLATFORM_FEATURE_TO_ENTITLEMENTS: Record<
  PlanGatedPlatformFeature,
  EntitlementFeature[]
> = {
  ai_interview: ["aiMockInterview"],
  coding_practice: ["codingRound"],
  system_design: ["systemDesign"],
  resume_builder: ["resumeDesign", "resumeDownload"],
  ats_checker: ["atsChecker", "atsOptimizer"],
  ix_report: ["ixScore"],
  analytics: ["growthTracking"],
  peer_interviews: ["peerInterviewBooking"],
};

export const ENTITLEMENT_TO_HIGHLIGHT: Partial<
  Record<EntitlementFeature, string>
> = {
  aiMockInterview: "Unlimited AI Mock Interviews",
  codingRound: "Unlimited AI Coding Round Practice",
  systemDesign: "Unlimited Live System Design Practice",
  resumeDesign: "Unlimited Resume Design",
  resumeDownload: "Download Resume",
  atsChecker: "ATS Checker & Optimizer",
  atsOptimizer: "ATS Checker & Optimizer",
  ixScore: "iX Score & iX Certified Badge",
  ixCertifiedBadge: "iX Score & iX Certified Badge",
  growthTracking: "Growth Tracking",
  peerInterviewBooking: "Peer Interview",
  behavioralMock: "Behavioural Mock Interviews",
  oneClickResumeOptimizer: "One Click Resume Optimizer",
  detailedInterviewReport: "Detailed Interview Report",
  whiteboard: "White Board Drawing",
  targetCompanyPractice: "Target Company Practice",
  advancedAiModels: "Advanced & fine-tuned AI",
};

export function emptyPlanEntitlements(): PlanEntitlements {
  return {
    aiMockInterview: false,
    codingRound: false,
    systemDesign: false,
    behavioralMock: false,
    resumeDesign: false,
    resumeDownload: false,
    atsChecker: false,
    atsOptimizer: false,
    oneClickResumeOptimizer: false,
    detailedInterviewReport: false,
    ixScore: false,
    ixCertifiedBadge: false,
    growthTracking: false,
    targetCompanyPractice: false,
    advancedAiModels: false,
    whiteboard: false,
    peerInterviewBooking: false,
    freePeerInterviewsPerPeriod: 0,
  };
}

export function mergePlanEntitlements(
  partial?: Partial<PlanEntitlements>,
): PlanEntitlements {
  return { ...emptyPlanEntitlements(), ...partial };
}

export const PLAN_CAPABILITY_ENTITLEMENTS: EntitlementFeature[] = [
  "behavioralMock",
  "oneClickResumeOptimizer",
  "detailedInterviewReport",
  "whiteboard",
  "targetCompanyPractice",
  "advancedAiModels",
];

export const CAPABILITY_LABELS: Record<string, string> = {
  behavioralMock: "Behavioural mock interviews",
  oneClickResumeOptimizer: "One-click resume optimizer",
  detailedInterviewReport: "Detailed interview report",
  whiteboard: "Whiteboard drawing",
  targetCompanyPractice: "Target company practice",
  advancedAiModels: "Advanced & fine-tuned AI",
};

const PLAN_GATED_SET = new Set<string>(PLAN_GATED_PLATFORM_FEATURES);
const PLATFORM_FEATURE_KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;
const MAX_GRANTED_PLATFORM_FEATURES = 80;

export function isPlanGatedPlatformFeature(
  key: string,
): key is PlanGatedPlatformFeature {
  return PLAN_GATED_SET.has(key);
}

export function entitlementsForPlatformFeature(
  key: string,
): EntitlementFeature[] {
  if (!isPlanGatedPlatformFeature(key)) return [];
  return PLATFORM_FEATURE_TO_ENTITLEMENTS[key];
}

export function sanitizeGrantedPlatformFeatures(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of keys) {
    const key = String(raw ?? "")
      .trim()
      .toLowerCase();
    if (!PLATFORM_FEATURE_KEY_PATTERN.test(key)) continue;
    if (key.startsWith("voice_")) continue;
    if (isPlanGatedPlatformFeature(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= MAX_GRANTED_PLATFORM_FEATURES) break;
  }
  return out;
}

export function setGrantedPlatformFeature(
  granted: string[] | undefined,
  key: string,
  on: boolean,
): string[] {
  const next = new Set(sanitizeGrantedPlatformFeatures(granted));
  const normalized = String(key ?? "")
    .trim()
    .toLowerCase();
  if (on) next.add(normalized);
  else next.delete(normalized);
  return sanitizeGrantedPlatformFeatures([...next]);
}

export function highlightForEntitlement(
  key: EntitlementFeature,
): string | undefined {
  return ENTITLEMENT_TO_HIGHLIGHT[key];
}

export function isMarketingOnlyHighlight(line: string): boolean {
  const text = line.replace(/\s+/g, " ").trim().toLowerCase();
  if (!text) return true;
  if (/^\d[\d,]*\s*credits?\b/.test(text)) return true;
  const mapped = Object.values(ENTITLEMENT_TO_HIGHLIGHT).some(
    (highlight) => highlight.toLowerCase() === text,
  );
  return !mapped;
}

export function highlightForPlatformFeature(
  key: string,
  fallbackName?: string,
): string | undefined {
  for (const entitlement of entitlementsForPlatformFeature(key)) {
    const line = highlightForEntitlement(entitlement);
    if (line) return line;
  }
  const name = String(fallbackName ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return name || undefined;
}

export function platformFeatureIsGranted(
  entitlements: Partial<PlanEntitlements> | undefined,
  key: string,
  grantedPlatformFeatures?: string[],
): boolean {
  const mapped = entitlementsForPlatformFeature(key);
  if (mapped.length > 0) {
    if (!entitlements) return false;
    return mapped.every((entitlement) => {
      const value = entitlements[entitlement];
      if (typeof value === "number") return value > 0;
      return Boolean(value);
    });
  }
  return sanitizeGrantedPlatformFeatures(grantedPlatformFeatures).includes(
    String(key ?? "")
      .trim()
      .toLowerCase(),
  );
}

export function entitlementValueAllowsAccess(
  entitlements: Partial<PlanEntitlements> | undefined,
  feature: EntitlementFeature,
): boolean {
  const value = entitlements?.[feature];
  if (typeof value === "number") return value > 0;
  return Boolean(value);
}

export const FALLBACK_UPGRADE_TARGETS: Partial<
  Record<EntitlementFeature, string>
> = {
  oneClickResumeOptimizer: "general_pass",
  detailedInterviewReport: "general_pass",
  ixScore: "general_pass",
  codingRound: "tech_basic",
  systemDesign: "tech_basic",
  whiteboard: "tech_basic",
  behavioralMock: "general_pass",
  growthTracking: "tech_pro",
  aiMockInterview: "general_pass",
};

export type UpgradePlanSource = {
  planId: string;
  displayName?: string;
  name?: string;
  order?: number;
  isActive?: boolean;
  isPublic?: boolean;
  entitlements?: Partial<PlanEntitlements>;
};

export function pickUpgradePlan(
  plans: UpgradePlanSource[],
  feature: EntitlementFeature,
): UpgradePlanSource | null {
  const eligible = plans
    .filter((plan) => plan.isActive !== false && plan.isPublic !== false)
    .filter((plan) => entitlementValueAllowsAccess(plan.entitlements, feature))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return eligible[0] ?? null;
}

export const COMPARISON_ENTITLEMENT_ROWS: Record<
  string,
  { feature: EntitlementFeature; included: string | true }
> = {
  "AI mock interviews": {
    feature: "aiMockInterview",
    included: "Unlimited (credits)",
  },
  "Coding round practice": {
    feature: "codingRound",
    included: "Unlimited (credits)",
  },
  "System design practice": {
    feature: "systemDesign",
    included: "Unlimited (credits)",
  },
  "White board drawing": { feature: "whiteboard", included: true },
  "Unlimited resume design": { feature: "resumeDesign", included: true },
  "Unlimited ATS checker": { feature: "atsChecker", included: true },
  "Unlimited ATS optimizer": { feature: "atsOptimizer", included: true },
  "One click resume optimizer": {
    feature: "oneClickResumeOptimizer",
    included: true,
  },
  "Detailed interview report": {
    feature: "detailedInterviewReport",
    included: true,
  },
  "Growth tracking": { feature: "growthTracking", included: true },
  "Target company practice": {
    feature: "targetCompanyPractice",
    included: true,
  },
  "Behavioural mock interviews": { feature: "behavioralMock", included: true },
  "Advanced & fine-tuned AI": { feature: "advancedAiModels", included: true },
};
