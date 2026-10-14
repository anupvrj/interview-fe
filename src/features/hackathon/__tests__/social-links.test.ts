import { describe, expect, it } from "vitest";
import { HACKATHON_SOCIALS } from "@/lib/hackathon-2026-content";
import {
  buildLinkedInShareComposeUrl,
  buildLinkedInShareOffsiteUrl,
  buildShareCaptionForClipboard,
  hackathonPublicShareUrl,
  hackathonSharePageUrl,
  INTERVIEWTRIX_CAPTERRA_URL,
  INTERVIEWTRIX_INSTAGRAM_PROFILE,
  INTERVIEWTRIX_LINKEDIN_COMPANY,
  INTERVIEWTRIX_PRODUCT_HUNT_URL,
  instagramShareOpenUrl,
} from "../social-links";

describe("social-links", () => {
  it("buildLinkedInShareComposeUrl prefills feed text with caption and link", () => {
    const page = "https://interviewtrix.com/hiring-games-hackathon-2026";
    const url = buildLinkedInShareComposeUrl("Hello hackathon", page);
    expect(url).toContain("shareActive=true");
    expect(url).toContain(encodeURIComponent("Hello hackathon"));
    expect(url).toContain(encodeURIComponent(page));
    expect(url.length).toBeLessThan(2048);
  });

  it("hackathonPublicShareUrl uses production origin on localhost", () => {
    expect(hackathonPublicShareUrl("/hiring-games-hackathon-2026", "http://localhost:3001")).toBe(
      "https://interviewtrix.com/hiring-games-hackathon-2026",
    );
    expect(hackathonPublicShareUrl("/hiring-games-hackathon-2026", "https://interviewtrix.com")).toBe(
      "https://interviewtrix.com/hiring-games-hackathon-2026",
    );
  });

  it("buildLinkedInShareOffsiteUrl encodes the page URL once", () => {
    const page = "https://interviewtrix.com/hiring-games-hackathon-2026";
    const url = buildLinkedInShareOffsiteUrl(page);
    expect(url).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(page)}`,
    );
    expect(url.length).toBeLessThan(2048);
  });

  it("buildShareCaptionForClipboard joins caption and link", () => {
    expect(buildShareCaptionForClipboard("Hello", "https://example.com/x")).toBe("Hello\n\nhttps://example.com/x");
  });

  it("hackathonSharePageUrl joins origin and path", () => {
    expect(hackathonSharePageUrl("/hiring-games-hackathon-2026", "http://localhost:3001")).toBe(
      "http://localhost:3001/hiring-games-hackathon-2026",
    );
    expect(hackathonSharePageUrl("hiring-games-hackathon-2026", "https://interviewtrix.com")).toBe(
      "https://interviewtrix.com/hiring-games-hackathon-2026",
    );
  });

  it("profile constants match hackathon landing socials", () => {
    expect(INTERVIEWTRIX_LINKEDIN_COMPANY).toBe(HACKATHON_SOCIALS.find((s) => s.icon === "linkedin")?.href);
    expect(INTERVIEWTRIX_INSTAGRAM_PROFILE).toBe(HACKATHON_SOCIALS.find((s) => s.icon === "instagram")?.href);
    expect(INTERVIEWTRIX_LINKEDIN_COMPANY.startsWith("https://")).toBe(true);
    expect(INTERVIEWTRIX_INSTAGRAM_PROFILE.startsWith("https://")).toBe(true);
  });

  it("instagram share opens main site (no create/select picker)", () => {
    expect(instagramShareOpenUrl()).toBe("https://www.instagram.com/");
  });

  it("review links use canonical Product Hunt product and Capterra search", () => {
    expect(INTERVIEWTRIX_PRODUCT_HUNT_URL).toBe("https://www.producthunt.com/products/interview-trix");
    expect(INTERVIEWTRIX_CAPTERRA_URL).toMatch(/^https:\/\/www\.capterra\.com\//);
  });
});
