import { describe, expect, it } from "vitest";
import {
  INTERVIEWTRIX_CAPTERRA_URL,
  INTERVIEWTRIX_INSTAGRAM_PROFILE,
  INTERVIEWTRIX_LINKEDIN_COMPANY,
  INTERVIEWTRIX_PRODUCT_HUNT_URL,
  instagramShareOpenUrl,
} from "../social-links";

const TIMEOUT_MS = 15_000;

/** 403 = bot wall; still proves host resolves (not 404). */
function expectReachable(status: number) {
  expect(status).not.toBe(404);
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(500);
}

async function fetchStatus(url: string): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "InterviewTrix-Hackathon-LinkCheck/1.0" },
    });
    return res.status;
  } finally {
    clearTimeout(timer);
  }
}

describe("social outbound link health", () => {
  it(
    "LinkedIn company page responds",
    async () => {
      expectReachable(await fetchStatus(INTERVIEWTRIX_LINKEDIN_COMPANY));
    },
    TIMEOUT_MS + 2000,
  );

  it(
    "Instagram profile responds",
    async () => {
      expectReachable(await fetchStatus(INTERVIEWTRIX_INSTAGRAM_PROFILE));
    },
    TIMEOUT_MS + 2000,
  );

  it(
    "Instagram home responds (login redirect ok)",
    async () => {
      expectReachable(await fetchStatus(instagramShareOpenUrl()));
    },
    TIMEOUT_MS + 2000,
  );

  it(
    "Product Hunt and Capterra search pages respond",
    async () => {
      expectReachable(await fetchStatus(INTERVIEWTRIX_PRODUCT_HUNT_URL));
      expectReachable(await fetchStatus(INTERVIEWTRIX_CAPTERRA_URL));
    },
    TIMEOUT_MS + 4000,
  );
});
