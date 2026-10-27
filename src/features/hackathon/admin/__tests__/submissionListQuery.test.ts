import { describe, expect, it } from "vitest";
import {
  buildSubmissionsListQueryString,
  parseSubmissionsListSearchParams,
  participantDetailHref,
  resolveAdminReturnTo,
} from "../submissionListQuery";

describe("submissionListQuery", () => {
  it("round-trips filters in the URL", () => {
    const sp = new URLSearchParams(
      "q=alice&status=in_progress&social=pending&video=yes&sort=ats&page=2&challenges=ch_a,ch_b",
    );
    const parsed = parseSubmissionsListSearchParams(sp);
    expect(parsed.q).toBe("alice");
    expect(parsed.status).toBe("in_progress");
    expect(parsed.socialReview).toBe("pending");
    expect(parsed.missingVideo).toBe("yes");
    expect(parsed.sort).toBe("ats");
    expect(parsed.page).toBe(2);
    expect(parsed.passedChallenges).toEqual(["ch_a", "ch_b"]);
    const again = parseSubmissionsListSearchParams(new URLSearchParams(buildSubmissionsListQueryString(parsed).slice(1)));
    expect(again).toEqual(parsed);
  });

  it("embeds returnTo on participant detail links", () => {
    const href = participantDetailHref("hk1", "hp1", {
      q: "",
      status: "all",
      socialReview: "all",
      missingVideo: "all",
      sort: "recent",
      page: 3,
      passedChallenges: ["ch1"],
    });
    expect(href).toContain("returnTo=");
    expect(decodeURIComponent(href)).toContain("/submissions?page=3");
    expect(decodeURIComponent(href)).toContain("challenges=ch1");
  });

  it("resolveAdminReturnTo rejects external URLs", () => {
    expect(resolveAdminReturnTo("https://evil.com", "/fallback")).toBe("/fallback");
    expect(resolveAdminReturnTo("/super-admin/hackathons/x/submissions?page=2", "/fallback")).toContain("submissions");
  });
});
