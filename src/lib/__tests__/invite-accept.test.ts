import { describe, expect, it } from "vitest";
import {
  INVITE_ACCEPT_LABEL,
  destinationAfterInvite,
  inviteClerkSignInProps,
  inviteClerkSignUpProps,
  inviteClerkStaffSignInProps,
  invitePagePath,
  inviteWorkspaceRole,
  isInviteSignInMode,
  pairedAuthHref,
} from "../invite-accept";

describe("invite accept CTA", () => {
  it("uses a single Accept invitation label, not create vs existing-account", () => {
    expect(INVITE_ACCEPT_LABEL).toBe("Accept invitation");
    expect(INVITE_ACCEPT_LABEL).not.toMatch(/create account/i);
    expect(INVITE_ACCEPT_LABEL).not.toMatch(/already have an account/i);
  });
});

describe("invite auth mode", () => {
  it("keeps Clerk sign-in on the invite page", () => {
    expect(isInviteSignInMode("sign-in")).toBe(true);
    expect(invitePagePath("abc", "sign-in")).toBe("/invite/abc?mode=sign-in");
    expect(inviteClerkSignInProps("abc", "a@x.com").signUpUrl).toBe("/invite/abc");
    expect(inviteClerkSignInProps("abc", "a@x.com").signUpUrl).not.toContain("/sign-up");
  });

  it("keeps Clerk sign-up's already-have-account link on the invite page", () => {
    const props = inviteClerkSignUpProps("abc", "a@x.com");
    expect(props.signInUrl).toBe("/invite/abc?mode=sign-in");
    expect(props.signInUrl).not.toContain("/sign-in?");
    expect(props.initialValues.emailAddress).toBe("a@x.com");
  });

  it("uses password/OTP sign-in for staff and never opens SignUp", () => {
    const props = inviteClerkStaffSignInProps("abc", "staff@x.com");
    expect(props.withSignUp).toBe(false);
    expect(props.initialValues.emailAddress).toBe("staff@x.com");
    expect("signUpUrl" in props).toBe(false);
  });
});

describe("destinationAfterInvite", () => {
  it("sends staff to the institute dashboard", () => {
    expect(
      destinationAfterInvite({
        nextPath: "/dashboard/institute/inst1",
        isStaff: true,
        institutionId: "inst1",
      }),
    ).toBe("/dashboard/institute/inst1");
    expect(inviteWorkspaceRole(true)).toBe("institution_admin");
  });

  it("sends candidates to the candidate workspace", () => {
    expect(
      destinationAfterInvite({
        nextPath: "/dashboard",
        isStaff: false,
      }),
    ).toBe("/dashboard");
    expect(inviteWorkspaceRole(false)).toBe("candidate");
  });

  it("falls back from staff flag when nextPath is missing", () => {
    expect(
      destinationAfterInvite({ isStaff: true, institutionId: "dhee" }),
    ).toBe("/dashboard/institute/dhee");
  });
});

describe("pairedAuthHref", () => {
  it("keeps invite redirect and email when Clerk bounces between sign-in and sign-up", () => {
    const redirect = "/invite/tok123";
    expect(pairedAuthHref("/sign-up", redirect, "a@x.com")).toBe(
      "/sign-up?redirect_url=%2Finvite%2Ftok123&email=a%40x.com",
    );
    expect(pairedAuthHref("/sign-in", redirect, "a@x.com")).toContain("redirect_url=");
    expect(pairedAuthHref("/sign-in", redirect, "a@x.com")).toContain("email=");
  });
});
