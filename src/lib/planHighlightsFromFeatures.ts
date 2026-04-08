import type { PlanFeatures } from "@/lib/payment";
import type { PlanRecord } from "@/lib/planRecord";

/**
 * Canonical bullet copy is `plan.highlights` from the API (seeded from
 * interview-core `constants/plansSeedData.ts`). If missing (legacy documents),
 * bullets are derived from `features`.
 */
export function getPlanMarketingHighlights(plan: PlanRecord): string[] {
  if (plan.highlights && plan.highlights.length > 0) {
    return plan.highlights;
  }
  return getPlanHighlightsFromFeatures(plan.features);
}

/**
 * Marketing bullets derived only from plan.features (fallback if highlights not stored).
 */
export function getPlanHighlightsFromFeatures(features: PlanFeatures): string[] {
  const highlights: string[] = [];

  if (features.freeInterviews) {
    highlights.push(
      `${features.freeInterviews.count} free ${features.freeInterviews.duration}-min interviews`,
    );
  }

  if (features.additionalInterviews) {
    highlights.push(
      `${features.additionalInterviews.count} additional ${features.additionalInterviews.duration}-min interviews`,
    );
  }

  if (features.resumeBuilder?.enabled) {
    if (features.resumeBuilder.resumesIncluded === -1) {
      const cost = features.resumeBuilder.costPerResume;
      if (cost > 0) {
        highlights.push(
          `Unlimited resumes (${cost} credits/resume)`,
        );
      } else {
        highlights.push("Unlimited resumes");
      }
    } else {
      highlights.push(
        `${features.resumeBuilder.resumesIncluded} resume${features.resumeBuilder.resumesIncluded > 1 ? "s" : ""} included`,
      );
    }
  }

  if (features.atsScoring?.detailed) {
    highlights.push("Detailed ATS score");
  } else if (features.atsScoring?.basic) {
    highlights.push("Basic ATS score");
  }

  if (features.jobRecommendations) {
    if (features.jobRecommendations.daily === -1) {
      highlights.push("Unlimited job recommendations");
    } else {
      highlights.push(
        `${features.jobRecommendations.daily} daily job recommendations`,
      );
    }
  }

  if (features.realInterviews) {
    highlights.push(
      `${features.realInterviews.count} real interviews with top engineers`,
    );
  }

  if (features.prioritySupport) {
    highlights.push("Priority support");
  }

  if (features.customQuestions) {
    highlights.push("Custom interview questions");
  }

  if (features.behavioralAnalysis) {
    highlights.push("Behavioral analysis");
  }

  return highlights;
}
