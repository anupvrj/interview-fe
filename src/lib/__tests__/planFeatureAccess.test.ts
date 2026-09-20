import { describe, expect, it } from "vitest";
import {
  entitlementsForPlatformFeature,
  highlightForPlatformFeature,
  isMarketingOnlyHighlight,
  isPlanGatedPlatformFeature,
  pickUpgradePlan,
  platformFeatureIsGranted,
  sanitizeGrantedPlatformFeatures,
  setGrantedPlatformFeature,
} from "@/lib/planFeatureAccess";

describe("plan feature access mapping", () => {
  it("maps Feature Controls keys to entitlement gates", () => {
    expect(entitlementsForPlatformFeature("coding_practice")).toEqual([
      "codingRound",
    ]);
    expect(entitlementsForPlatformFeature("resume_builder")).toEqual([
      "resumeDesign",
      "resumeDownload",
    ]);
    expect(entitlementsForPlatformFeature("ats_checker")).toEqual([
      "atsChecker",
      "atsOptimizer",
    ]);
    expect(isPlanGatedPlatformFeature("ix_recruiter")).toBe(false);
    expect(entitlementsForPlatformFeature("ix_recruiter")).toEqual([]);
  });

  it("treats coming-soon and credit lines as marketing-only", () => {
    expect(isMarketingOnlyHighlight("Personalized Job Matcher")).toBe(true);
    expect(isMarketingOnlyHighlight("Interview Scheduler")).toBe(true);
    expect(isMarketingOnlyHighlight("600 monthly credits")).toBe(true);
    expect(isMarketingOnlyHighlight("Unlimited AI Coding Round Practice")).toBe(
      false,
    );
  });

  it("grants custom Feature Controls rows from grantedPlatformFeatures", () => {
    expect(platformFeatureIsGranted({}, "job_board")).toBe(false);
    expect(
      platformFeatureIsGranted({}, "job_board", ["job_board", "coding_practice"]),
    ).toBe(true);
    expect(sanitizeGrantedPlatformFeatures(["job_board", "coding_practice", "voice_gemini"])).toEqual(
      ["job_board"],
    );
    expect(setGrantedPlatformFeature(["job_board"], "job_board", false)).toEqual(
      [],
    );
    expect(highlightForPlatformFeature("job_board", "Job Board")).toBe(
      "Job Board",
    );
  });

  it("requires every mapped entitlement to treat a Feature Controls row as granted", () => {
    expect(
      platformFeatureIsGranted(
        { resumeDesign: true, resumeDownload: false },
        "resume_builder",
      ),
    ).toBe(false);
    expect(
      platformFeatureIsGranted(
        { resumeDesign: true, resumeDownload: true },
        "resume_builder",
      ),
    ).toBe(true);
  });

  it("picks the lowest-order public plan that already has the entitlement", () => {
    const picked = pickUpgradePlan(
      [
        {
          planId: "tech_basic",
          order: 2,
          isActive: true,
          isPublic: true,
          entitlements: { codingRound: true },
        },
        {
          planId: "general_pass",
          order: 1,
          isActive: true,
          isPublic: true,
          entitlements: { codingRound: true },
        },
      ],
      "codingRound",
    );
    expect(picked?.planId).toBe("general_pass");
  });
});
