import { describe, expect, it } from "vitest";
import {
  isFeatureHrefVisible,
  isFeatureAccessibleForActiveRole,
  isFeatureVisibleForActiveRole,
  matchFeatureForPath,
  parseFeaturePathText,
  slugifyFeatureKey,
  splitFeatureControlPaths,
  type PlatformFeature,
} from "../platform-features";

function feature(
  partial: Partial<PlatformFeature> & Pick<PlatformFeature, "key">,
): PlatformFeature {
  return {
    name: partial.key,
    description: "",
    category: "product",
    status: "live",
    unavailableTitle: "",
    unavailableMessage: "",
    sortOrder: 1,
    routePrefixes: [],
    navHrefs: [],
    marketingHrefs: [],
    visible: true,
    accessible: true,
    ...partial,
  };
}

describe("platform feature path helpers", () => {
  it("slugifies keys", () => {
    expect(slugifyFeatureKey("Job Board")).toBe("job_board");
  });

  it("parses path text and splits dashboard vs marketing", () => {
    const paths = parseFeaturePathText(
      "/dashboard/job-board/\n/ai-job-search, /pricing",
    );
    expect(paths).toEqual([
      "/dashboard/job-board",
      "/ai-job-search",
      "/pricing",
    ]);
    expect(splitFeatureControlPaths(paths)).toEqual({
      routePrefixes: paths,
      navHrefs: ["/dashboard/job-board"],
      marketingHrefs: ["/ai-job-search", "/pricing"],
    });
  });

  it("matches the longest controlling path", () => {
    const features = [
      feature({
        key: "peer_interviews",
        routePrefixes: ["/dashboard/peer-interviews"],
        visible: true,
      }),
      feature({
        key: "peer_booking",
        routePrefixes: ["/dashboard/peer-interviews/book"],
        visible: false,
      }),
    ];
    expect(
      matchFeatureForPath(features, "/dashboard/peer-interviews/book")?.key,
    ).toBe("peer_booking");
    expect(
      isFeatureHrefVisible(
        features,
        "/dashboard/peer-interviews/book",
        "peer_interviews",
      ),
    ).toBe(false);
    expect(
      isFeatureHrefVisible(features, "/dashboard/peer-interviews", "peer_interviews"),
    ).toBe(true);
  });

  it("keeps unmatched hrefs visible", () => {
    expect(isFeatureHrefVisible([], "/dashboard/plan")).toBe(true);
    expect(isFeatureHrefVisible(undefined, "/dashboard/job-board")).toBe(true);
  });
});

describe("feature visibility for an active role view", () => {
  it("lets super admin see every status", () => {
    expect(isFeatureVisibleForActiveRole("disabled", "product", "super_admin")).toBe(
      true,
    );
  });

  it("hides enabled product features from candidates", () => {
    expect(isFeatureVisibleForActiveRole("enabled", "product", "candidate")).toBe(
      false,
    );
    expect(isFeatureVisibleForActiveRole("live", "product", "candidate")).toBe(
      true,
    );
    expect(
      isFeatureAccessibleForActiveRole("enabled", "product", "candidate"),
    ).toBe(false);
  });

  it("shows enabled features to institution admins", () => {
    expect(
      isFeatureVisibleForActiveRole("enabled", "product", "institution_admin"),
    ).toBe(true);
  });
});
