export const INVITE_ACCEPT_LABEL = "Accept invitation";

export type InviteDestination = {
  nextPath?: string | null;
  isStaff?: boolean;
  institutionId?: string | null;
};

export function invitePagePath(token: string, mode?: "sign-in"): string {
  const base = `/invite/${encodeURIComponent(token)}`;
  if (mode === "sign-in") return `${base}?mode=sign-in`;
  return base;
}

export function isInviteSignInMode(mode: string | null | undefined): boolean {
  return mode === "sign-in";
}

export function destinationAfterInvite(invite: InviteDestination): string {
  const next = invite.nextPath?.trim();
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  if (invite.isStaff && invite.institutionId) {
    return `/dashboard/institute/${invite.institutionId}`;
  }
  return "/dashboard";
}

export function inviteWorkspaceRole(isStaff: boolean): "institution_admin" | "candidate" {
  return isStaff ? "institution_admin" : "candidate";
}

export function inviteClerkSignUpProps(token: string, email: string) {
  const after = invitePagePath(token);
  return {
    routing: "hash" as const,
    forceRedirectUrl: after,
    fallbackRedirectUrl: after,
    signInUrl: invitePagePath(token, "sign-in"),
    signInForceRedirectUrl: after,
    signInFallbackRedirectUrl: after,
    initialValues: { emailAddress: email },
  };
}

export function inviteClerkSignInProps(token: string, email: string) {
  const after = invitePagePath(token);
  return {
    routing: "hash" as const,
    forceRedirectUrl: after,
    fallbackRedirectUrl: after,
    signUpUrl: after,
    signUpForceRedirectUrl: after,
    signUpFallbackRedirectUrl: after,
    initialValues: { emailAddress: email },
  };
}

/** Staff already have a Clerk user. Accept is sign-in + password / OTP, never SignUp. */
export function inviteClerkStaffSignInProps(token: string, email: string) {
  const after = invitePagePath(token);
  return {
    routing: "hash" as const,
    withSignUp: false as const,
    forceRedirectUrl: after,
    fallbackRedirectUrl: after,
    initialValues: { emailAddress: email },
  };
}

export function pairedAuthHref(
  path: "/sign-in" | "/sign-up",
  redirectUrl: string | null | undefined,
  email?: string,
): string {
  const params = new URLSearchParams();
  if (redirectUrl) params.set("redirect_url", redirectUrl);
  if (email?.trim()) params.set("email", email.trim());
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
