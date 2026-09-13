import { describe, expect, it } from "vitest";
import {
  COMPARISON_ROWS,
  withLivePlanComparison,
} from "@/lib/pricingPageContent";

describe("withLivePlanComparison", () => {
  it("overlays live monthly price, credits, and audience", () => {
    const rows = withLivePlanComparison([
      {
        planId: "general_pass",
        pricing: { monthly: 749 },
        creditsIncluded: { monthly: 650 },
        metadata: { bestFor: "Everyone on a budget" },
      },
    ]);

    const pricing = rows.find((row) => row.feature === "Monthly pricing");
    const credits = rows.find(
      (row) => row.feature === "Monthly credits on renewal",
    );
    const audience = rows.find((row) => row.feature === "Target audience");

    expect(pricing?.general_pass).toBe("₹749/mo");
    expect(credits?.general_pass).toBe("650");
    expect(audience?.general_pass).toBe("Everyone on a budget");
    expect(pricing?.tech_basic).toBe(
      COMPARISON_ROWS.find((row) => row.feature === "Monthly pricing")
        ?.tech_basic,
    );
  });

  it("adds cells for any public plan id, not a hardcoded list", () => {
    const rows = withLivePlanComparison([
      {
        planId: "custom_track",
        pricing: { monthly: 499 },
        creditsIncluded: { monthly: 400 },
        metadata: { bestFor: "Custom track" },
      },
    ]);

    expect(
      rows.find((row) => row.feature === "Monthly pricing")?.custom_track,
    ).toBe("₹499/mo");
    expect(
      rows.find((row) => row.feature === "Target audience")?.custom_track,
    ).toBe("Custom track");
  });

  it("overlays live entitlements onto mapped comparison rows", () => {
    const rows = withLivePlanComparison([
      {
        planId: "general_pass",
        entitlements: {
          codingRound: true,
          systemDesign: false,
          growthTracking: false,
        },
      },
    ]);

    expect(
      rows.find((row) => row.feature === "Coding round practice")
        ?.general_pass,
    ).toBe("Unlimited (credits)");
    expect(
      rows.find((row) => row.feature === "System design practice")
        ?.general_pass,
    ).toBe("—");
    expect(
      rows.find((row) => row.feature === "Growth tracking")?.general_pass,
    ).toBe(false);
  });
});
