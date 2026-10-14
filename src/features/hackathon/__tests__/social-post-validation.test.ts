import { describe, expect, it } from "vitest";
import { SocialPostUrlError, validateHackathonSocialPostUrl } from "../social-post-validation";

function expectInvalid(platform: "linkedin" | "instagram", url: string) {
  expect(() => validateHackathonSocialPostUrl(platform, url)).toThrow(SocialPostUrlError);
}

describe("validateHackathonSocialPostUrl (aligned with interview-core socialValidator)", () => {
  it("accepts LinkedIn post URLs", () => {
    expect(
      validateHackathonSocialPostUrl(
        "linkedin",
        "https://linkedin.com/posts/anup_mock-interview-activity-7123456789012345678-AbCd/?utm_source=share",
      ),
    ).toBe("https://www.linkedin.com/posts/anup_mock-interview-activity-7123456789012345678-AbCd");
  });

  it("accepts LinkedIn feed update URNs", () => {
    expect(
      validateHackathonSocialPostUrl(
        "linkedin",
        "https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/",
      ),
    ).toBe("https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678");
  });

  it("rejects LinkedIn profile and company URLs", () => {
    expectInvalid("linkedin", "https://www.linkedin.com/in/anupkumar/");
    expectInvalid("linkedin", "https://www.linkedin.com/company/interviewtrix/");
  });

  it("rejects malformed LinkedIn URNs without numeric id", () => {
    expectInvalid("linkedin", "https://www.linkedin.com/feed/update/urn:li:activity:");
  });

  it("accepts Instagram posts and normalizes reels path", () => {
    expect(validateHackathonSocialPostUrl("instagram", "https://instagram.com/p/CxYz12AbC/?igsh=abc")).toBe(
      "https://www.instagram.com/p/CxYz12AbC",
    );
    expect(validateHackathonSocialPostUrl("instagram", "https://www.instagram.com/reels/CxYz12AbC/")).toBe(
      "https://www.instagram.com/reel/CxYz12AbC",
    );
  });

  it("rejects Instagram profiles", () => {
    expectInvalid("instagram", "https://www.instagram.com/interviewtrix/");
  });
});
