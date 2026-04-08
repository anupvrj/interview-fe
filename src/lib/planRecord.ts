import type { PlanFeatures } from "@/lib/payment";

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
  isPopular: boolean;
  color: string;
  icon: string;
  order: number;
}
