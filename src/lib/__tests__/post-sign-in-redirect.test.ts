import { describe, expect, it } from "vitest";
import {
  safeAppRedirectPath,
  shouldRedirectUnauthorizedToSignIn,
} from "@/lib/post-sign-in-redirect";

describe("safeAppRedirectPath", () => {
  it("allows in-app OAuth consent paths", () => {
    expect(
      safeAppRedirectPath(
        "/connector/oauth/consent?request_id=oauthreq_abc",
      ),
    ).toBe("/connector/oauth/consent?request_id=oauthreq_abc");
  });

  it("rejects off-site redirects", () => {
    expect(safeAppRedirectPath("https://evil.example/phish")).toBeNull();
    expect(safeAppRedirectPath("//evil.example/phish")).toBeNull();
  });
});

describe("shouldRedirectUnauthorizedToSignIn", () => {
  it("does not bounce ChatGPT OAuth consent or the sign-in page", () => {
    expect(
      shouldRedirectUnauthorizedToSignIn("/connector/oauth/consent"),
    ).toBe(false);
    expect(shouldRedirectUnauthorizedToSignIn("/sign-in")).toBe(false);
    expect(
      shouldRedirectUnauthorizedToSignIn(
        "/dashboard",
        "/connector/v1/oauth/requests/oauthreq_abc",
      ),
    ).toBe(false);
  });

  it("still sends other 401s to sign-in", () => {
    expect(shouldRedirectUnauthorizedToSignIn("/dashboard/resumes")).toBe(
      true,
    );
  });
});
