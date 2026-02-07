/**
 * Payment Configuration and Plan Details
 * 
 * Credit-based pricing system
 * 1 CREDIT = 1 INR
 * 
 * Credit Costs:
 * - Interview: 5 credits per minute
 * - Resume creation: 30 credits per resume design
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
  
  // Credit expiry (in days, null for never expires)
  creditExpiry: number | null;
  
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
  
  // Marketing
  bestFor?: string;
  highlights: string[];
}

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    displayName: "Free Plan",
    description: "Perfect for trying out the platform",
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
    creditExpiry: null,
    features: {
      freeInterviews: {
        count: 2,
        duration: 30,
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
    color: "from-gray-500 to-gray-600",
    icon: "Sparkles",
    isPopular: false,
    order: 1,
    bestFor: "Students & Beginners",
    highlights: [
      "2 free 30-min mock interviews",
      "1 resume (lifetime free)",
      "Basic ATS score",
      "Unlimited downloads",
      "Basic job recommendations",
    ],
  },
  
  starter: {
    id: "starter",
    name: "Starter",
    displayName: "Starter Plan",
    description: "Great for active job seekers",
    minCreditsRequired: 500,
    pricing: {
      monthly: 500,
      quarterly: 1400, // ~7% discount
      yearly: 5000, // ~17% discount
    },
    creditsIncluded: {
      monthly: 500,
      quarterly: 1400,
      yearly: 5000,
    },
    creditExpiry: 60, // 60 days
    features: {
      freeInterviews: {
        count: 2,
        duration: 30,
      },
      additionalInterviews: {
        count: 2,
        duration: 30,
      },
      interviewCostPerMinute: 5,
      resumeBuilder: {
        enabled: true,
        resumesIncluded: -1, // unlimited
        costPerResume: 30,
      },
      atsScoring: {
        basic: true,
        detailed: true,
        unlimited: true,
      },
      jobRecommendations: {
        daily: 10,
        refreshLimit: 1,
      },
      prioritySupport: false,
      customQuestions: false,
      behavioralAnalysis: false,
      progressTracking: true,
    },
    color: "from-blue-500 to-blue-600",
    icon: "Zap",
    isPopular: false,
    order: 2,
    savings: {
      quarterly: 7,
      yearly: 17,
    },
    bestFor: "Job Seekers",
    highlights: [
      "2 free + 2 additional 30-min interviews",
      "Resume Builder Pro (30 credits/resume)",
      "Detailed ATS score",
      "Credits expire in 60 days",
      "10 daily job recommendations",
    ],
  },
  
  premium: {
    id: "premium",
    name: "Premium",
    displayName: "Premium Plan",
    description: "Best for serious interview preparation",
    minCreditsRequired: 1999,
    pricing: {
      monthly: 1999,
      quarterly: 5500, // ~8% discount
      yearly: 20000, // ~17% discount
    },
    creditsIncluded: {
      monthly: 1999,
      quarterly: 5500,
      yearly: 20000,
    },
    creditExpiry: 120, // 120 days
    features: {
      freeInterviews: {
        count: 2,
        duration: 30,
      },
      additionalInterviews: {
        count: 5,
        duration: 60,
      },
      interviewCostPerMinute: 5,
      resumeBuilder: {
        enabled: true,
        resumesIncluded: -1,
        costPerResume: 30,
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
    order: 3,
    savings: {
      quarterly: 8,
      yearly: 17,
    },
    bestFor: "Professionals",
    highlights: [
      "2 free + 5 additional 60-min interviews",
      "Resume Builder Pro (30 credits/resume)",
      "Detailed ATS score",
      "Credits expire in 120 days",
      "20 daily job recommendations (3 refreshes)",
      "Priority support",
    ],
  },
  
  elite: {
    id: "elite",
    name: "Elite",
    displayName: "Elite Plan",
    description: "Ultimate package for career advancement",
    minCreditsRequired: 5999,
    pricing: {
      monthly: 5999,
      quarterly: 16500, // ~8% discount
      yearly: 60000, // ~17% discount
    },
    creditsIncluded: {
      monthly: 5999,
      quarterly: 16500,
      yearly: 60000,
    },
    creditExpiry: null, // Never expires
    features: {
      freeInterviews: {
        count: 2,
        duration: 30,
      },
      additionalInterviews: {
        count: 10,
        duration: 60,
      },
      interviewCostPerMinute: 5,
      resumeBuilder: {
        enabled: true,
        resumesIncluded: -1,
        costPerResume: 30,
      },
      atsScoring: {
        basic: true,
        detailed: true,
        unlimited: true,
      },
      jobRecommendations: {
        daily: -1, // unlimited
        refreshLimit: -1, // unlimited
      },
      realInterviews: {
        count: 2,
        description: "Real interviews with top engineers from tier 1 & 2 companies",
      },
      prioritySupport: true,
      customQuestions: true,
      behavioralAnalysis: true,
      progressTracking: true,
    },
    color: "from-purple-600 to-purple-700",
    icon: "Crown",
    isPopular: false,
    order: 4,
    savings: {
      quarterly: 8,
      yearly: 17,
    },
    bestFor: "Career Changers",
    highlights: [
      "2 free + 10 additional 60-min interviews",
      "Resume Builder Pro (30 credits/resume)",
      "Detailed ATS score",
      "Credits NEVER expire",
      "Unlimited job recommendations",
      "2 real interviews with top engineers",
      "Priority support",
    ],
  },
};

export type PlanId = keyof typeof PLAN_CONFIG;

/**
 * Credit cost calculations
 */
export const CREDIT_COSTS = {
  INTERVIEW_PER_MINUTE: 5,
  RESUME_CREATION: 30,
  
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
 * Get all active plans (excluding free)
 */
export function getActivePlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIG)
    .filter(plan => plan.id !== "free")
    .sort((a, b) => a.order - b.order);
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
