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

describe("validateHackathonSocialPostUrl — links the apps hand out today", () => {
  it("accepts LinkedIn share-sheet short links, feed URNs (also %-encoded) and country hosts", () => {
    expect(validateHackathonSocialPostUrl("linkedin", "https://lnkd.in/gNJq6xZ8")).toBe("https://lnkd.in/gNJq6xZ8");
    expect(validateHackathonSocialPostUrl("linkedin", "https://www.linkedin.com/feed/update/urn%3Ali%3Aactivity%3A7123456789012345678")).toBe(
      "https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678",
    );
    expect(validateHackathonSocialPostUrl("linkedin", "in.linkedin.com/posts/anup_x-activity-7123456789012345678-AbCd")).toBe(
      "https://www.linkedin.com/posts/anup_x-activity-7123456789012345678-AbCd",
    );
  });

  it("accepts Instagram username-path links, Share-button links and instagr.am", () => {
    expect(validateHackathonSocialPostUrl("instagram", "https://www.instagram.com/anup.kumar_/p/CxYz12AbC/?img_index=1")).toBe("https://www.instagram.com/p/CxYz12AbC");
    expect(validateHackathonSocialPostUrl("instagram", "https://www.instagram.com/share/reel/_9kzVvBTb/")).toBe("https://www.instagram.com/share/reel/_9kzVvBTb");
    expect(validateHackathonSocialPostUrl("instagram", "https://instagr.am/p/C1abcdEFG/")).toBe("https://www.instagram.com/p/C1abcdEFG");
  });

  it("says which box a link belongs in, and why a profile or story isn't a post", () => {
    expect(() => validateHackathonSocialPostUrl("linkedin", "https://www.instagram.com/p/Cabcdef123/")).toThrow(/That's an Instagram link/);
    expect(() => validateHackathonSocialPostUrl("instagram", "https://lnkd.in/gNJq6xZ8")).toThrow(/That's a LinkedIn link/);
    expect(() => validateHackathonSocialPostUrl("linkedin", "https://www.linkedin.com/in/anupkumar/")).toThrow(/not your post/);
    expect(() => validateHackathonSocialPostUrl("instagram", "https://www.instagram.com/stories/interviewtrix/3123456789/")).toThrow(/story, not a post/);
  });
});
