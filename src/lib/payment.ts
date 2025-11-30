// Payment configuration and utilities

export const PLAN_CONFIG = {
  starter: {
    name: "Starter",
    price: 299,
    interviewsLimit: 3,
    period: "month",
    features: [
      "3 voice interviews per month",
      "Basic feedback (score + transcript)",
      "Teacher Assistant unlimited",
      "Progress tracking",
    ],
  },
  pro: {
    name: "Pro",
    price: 699,
    interviewsLimit: 10,
    period: "month",
    features: [
      "10 voice interviews per month",
      "Detailed behavioral analysis + action items",
      "Teacher Assistant + custom questions",
      "Progress tracking + weak area radar",
      "Priority support",
    ],
  },
  exam_pack: {
    name: "Exam Pack",
    price: 1499,
    interviewsLimit: 20,
    period: "3 months",
    features: [
      "20 voice interviews (3 months)",
      "BPSC/SSC/IBPS specialized questions",
      "Curated question bank",
      "Certification/score report",
      "Priority support",
    ],
  },
};

export type PlanId = keyof typeof PLAN_CONFIG;
