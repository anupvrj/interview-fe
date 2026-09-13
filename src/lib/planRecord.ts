import type { PlanFeatures } from "@/lib/payment";
import type { PlanEntitlements } from "@/lib/planFeatureAccess";

/** Shape of plan documents returned by GET /api/plans (Mongo `plans` collection). */
export interface PlanRecord {
  _id?: string;
  planId: string;
  name: string;
  displayName: string;
  description: string;
  minCreditsRequired?: number;
  pricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  creditsIncluded: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  features: PlanFeatures;
  /** From GET /plans when seeded with highlights (see interview-core constants/plansSeedData.ts). */
  highlights?: string[];
  isActive?: boolean;
  isPublic?: boolean;
  isPopular: boolean;
  planType?: string;
  color: string;
  icon: string;
  order: number;
  entitlements?: Partial<PlanEntitlements>;
  grantedPlatformFeatures?: string[];
  metadata?: {
    comingSoonHighlights?: string[];
    bestFor?: string;
    tags?: string[];
  };
}

/** Super Admin catalog document (includes inactive / private plans). */
export type AdminPlanRecord = PlanRecord & {
  isActive: boolean;
  isPublic: boolean;
  entitlements?: Partial<PlanEntitlements>;
};
