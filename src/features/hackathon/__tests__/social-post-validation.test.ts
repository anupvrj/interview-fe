import { describe, expect, it } from "vitest";
import { SocialPostUrlError, validateHackathonSocialPostUrl } from "../social-post-validation";

describe("validateHackathonSocialPostUrl (only: a link is given)", () => {
  it("accepts any web link, adding https:// when missing", () => {
    expect(validateHackathonSocialPostUrl("linkedin", "https://lnkd.in/gNJq6xZ8")).toBe("https://lnkd.in/gNJq6xZ8");
    expect(validateHackathonSocialPostUrl("instagram", "www.instagram.com/p/CxYz12AbC/")).toBe("https://www.instagram.com/p/CxYz12AbC/");
    expect(validateHackathonSocialPostUrl("instagram", "https://www.instagram.com/share/reel/_9kzVvBTb/")).toBe("https://www.instagram.com/share/reel/_9kzVvBTb/");
  });

  it("asks for the link when a field is empty or isn't a link", () => {
    for (const value of ["", "   ", "javascript:alert(1)", "not a link"]) {
      expect(() => validateHackathonSocialPostUrl("instagram", value)).toThrow(SocialPostUrlError);
    }
    expect(() => validateHackathonSocialPostUrl("linkedin", "")).toThrow("Paste the link to your LinkedIn post.");
  });
});
