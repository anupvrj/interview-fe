// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackEvent = vi.fn();
vi.mock("../analytics/gtag", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { scoreBucket, track } from "../analytics/productEvents";

beforeEach(() => {
  trackEvent.mockReset();
  sessionStorage.clear();
});

describe("product events", () => {
  it("sends the event with one journey id for the whole tab session", () => {
    track("ats_checker_opened", { surface: "public", signed_in: false });
    track("ats_upload_new_clicked", { signed_in: false });
    const [first, second] = trackEvent.mock.calls.map((c) => c[1].journey_id);
    expect(first).toMatch(/[0-9a-f-]{36}/);
    expect(second).toBe(first);
  });

  it("buckets scores instead of sending exact per-person numbers", () => {
    expect([scoreBucket(25), scoreBucket(59), scoreBucket(60), scoreBucket(88), scoreBucket(100)]).toEqual(["0-39", "40-59", "60-74", "75-89", "90-100"]);
  });
});
