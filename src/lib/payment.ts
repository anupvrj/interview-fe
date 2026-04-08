/**
 * Payment Configuration and Plan Details
 * 
 * Credit-based pricing system
 * 1 CREDIT = 1 INR
 * 
 * Credit Costs:
 * - Interview: 5 credits per minute
 * - Resume builder: no credits deducted (included with plan access)
 */

export interface PlanFeatures {
  // Interview features
  freeInterviews: {
    count: number;
    duration: number; // in minutes
  };
  additionalInterviews?: {
    count: number;
    duration: number;
  };
  interviewCostPerMinute: number;
  
  // Resume Builder
  resumeBuilder: {
    enabled: boolean;
    resumesIncluded: number; // -1 for unlimited
    costPerResume: number;
  };
  
  // ATS Scoring
  atsScoring: {
    basic: boolean;
    detailed: boolean;
    unlimited: boolean;
  };
  
  // Job Recommendations
  jobRecommendations: {
    daily: number;
    refreshLimit: number; // -1 for unlimited
  };
  
  // Real Interviews (Elite only)
  realInterviews?: {
    count: number;
    description: string;
  };
  
  // Additional features
  prioritySupport: boolean;
  customQuestions: boolean;
  behavioralAnalysis: boolean;
  progressTracking: boolean;
}

export interface PlanConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  
  // Minimum credits required to purchase
  minCreditsRequired: number;
  
  // Pricing by billing cycle (in INR)
  pricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  
  // Credits included by billing cycle
  creditsIncluded: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };

  // Features
  features: PlanFeatures;
  
  // Display
  color: string;
  icon: string;
  isPopular: boolean;
  order: number;
  
  // Savings
  savings?: {
    quarterly: number; // percentage
    yearly: number; // percentage
  };
  
  // Marketing (bestFor etc. — bullet copy lives in DB only; see interview-core constants/plansSeedData.ts)
  bestFor?: string;
  /** If true, hide Razorpay checkout — contact sales or admin assignment */
  contactSalesOnly?: boolean;
}

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    displayName: "Free",
    description: "Best for quick practice & exploration",
    minCreditsRequired: 0,
    pricing: {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
    },
    creditsIncluded: {
      monthly: 1000,
      quarterly: 1000,
      yearly: 1000,
    },
    features: {
      freeInterviews: {
        count: 3,
        duration: 15,
      },
      interviewCostPerMinute: 5,
      resumeBuilder: {
        enabled: true,
        resumesIncluded: 1,
        costPerResume: 0,
      },
      atsScoring: {
        basic: true,
        detailed: false,
        unlimited: false,
      },
      jobRecommendations: {
        daily: 5,
        refreshLimit: 0,
      },
      prioritySupport: false,
      customQuestions: false,
      behavioralAnalysis: false,
      progressTracking: true,
    },
    color: "from-slate-500 to-slate-600",
    icon: "Sparkles",
    isPopular: false,
    order: 1,
    bestFor: "Exploration",
  },

  premium: {
    id: "premium",
    name: "Premium",
    displayName: "Premium",
    description: "Unlimited practice across all scenarios",
    minCreditsRequired: 1999,
    pricing: {
      monthly: 1999,
      quarterly: 5500,
      yearly: 20000,
    },
    creditsIncluded: {
      monthly: 4000,
      quarterly: 11000,
      yearly: 40000,
    },
    features: {
      freeInterviews: {
        count: 999,
        duration: 30,
      },
      interviewCostPerMinute: 5,
      resumeBuilder: {
        enabled: true,
        resumesIncluded: -1,
        costPerResume: 0,
      },
      atsScoring: {
        basic: true,
        detailed: true,
        unlimited: true,
      },
      jobRecommendations: {
        daily: 20,
        refreshLimit: 3,
      },
      prioritySupport: true,
      customQuestions: true,
      behavioralAnalysis: true,
      progressTracking: true,
    },
    color: "from-blue-600 to-blue-700",
    icon: "Trophy",
    isPopular: true,
    order: 2,
    savings: {
      quarterly: 8,
      yearly: 17,
    },
    bestFor: "Individuals",
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    displayName: "Enterprise",
    description: "For organizations & teams",
    minCreditsRequired: 0,
    pricing: {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
    },
    creditsIncluded: {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
    },
    contactSalesOnly: true,
    features: {
      freeInterviews: {
        count: 999,
        duration: 30,
      },
      interviewCostPerMinute: 5,
      resumeBuilder: {
        enabled: true,
        resumesIncluded: -1,
        costPerResume: 0,
      },
      atsScoring: {
        basic: true,
        detailed: true,
        unlimited: true,
      },
      jobRecommendations: {
        daily: -1,
        refreshLimit: -1,
      },
      prioritySupport: true,
      customQuestions: true,
      behavioralAnalysis: true,
      progressTracking: true,
    },
    color: "from-slate-700 to-slate-900",
    icon: "Building2",
    isPopular: false,
    order: 3,
    bestFor: "Organizations",
  },
};

export type PlanId = keyof typeof PLAN_CONFIG;

/**
 * Credit cost calculations
 */
export const CREDIT_COSTS = {
  INTERVIEW_PER_MINUTE: 5,
  /** Resume builder does not charge credits (0). */
  RESUME_CREATION: 0,

  // Helper functions
  calculateInterviewCost: (durationMinutes: number): number => {
    return durationMinutes * CREDIT_COSTS.INTERVIEW_PER_MINUTE;
  },

  calculateResumeCost: (): number => {
    return CREDIT_COSTS.RESUME_CREATION;
  },
};

/**
 * Get plan by ID
 */
export function getPlan(planId: string): PlanConfig | undefined {
  return PLAN_CONFIG[planId];
}

/**
 * Paid plans for marketing (Free + Premium + Enterprise ordering)
 */
export function getActivePlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIG).sort((a, b) => a.order - b.order);
}

/** Self-serve Razorpay checkout — Premium only */
export function getSelfServeCheckoutPlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIG).filter((p) => p.id === "premium");
}

/**
 * Calculate savings percentage
 */
export function calculateSavings(
  monthlyPrice: number,
  discountedPrice: number,
  months: number
): number {
  const fullPrice = monthlyPrice * months;
  const savings = ((fullPrice - discountedPrice) / fullPrice) * 100;
  return Math.round(savings);
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Format credits
 */
export function formatCredits(amount: number): string {
  return `${amount.toLocaleString("en-IN")} credits`;
}
