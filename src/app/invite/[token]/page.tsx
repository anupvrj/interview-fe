"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SignIn, SignUp, useClerk, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { userApi, type InvitationPreview } from "@/lib/api";
import { clerkAuthAppearance, clerkStaffInviteAppearance } from "@/lib/clerk-appearance";
import { isInstituteStaff } from "@/lib/institute-access";
import { writeStoredRole } from "@/lib/roles";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { persistPostAuthReturnPath } from "@/lib/post-sign-in-redirect";
import {
  INVITE_ACCEPT_LABEL,
  destinationAfterInvite,
  inviteClerkSignInProps,
  inviteClerkSignUpProps,
  inviteClerkStaffSignInProps,
  invitePagePath,
  inviteWorkspaceRole,
  isInviteSignInMode,
} from "@/lib/invite-accept";

function InviteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
    </div>
  );
}

function InviteAuthPanel({
  token,
  email,
  isStaff,
  useSignIn,
  onStartSignUp,
}: Readonly<{
  token: string;
  email: string;
  isStaff: boolean;
  useSignIn: boolean;
  onStartSignUp: () => void;
}>) {
  if (isStaff) {
    return (
      <SignIn
        {...inviteClerkStaffSignInProps(token, email)}
        appearance={clerkStaffInviteAppearance}
      />
    );
  }
  return (
    <>
      {useSignIn ? (
        <SignIn
          {...inviteClerkSignInProps(token, email)}
          appearance={clerkAuthAppearance}
        />
      ) : (
        <SignUp
          {...inviteClerkSignUpProps(token, email)}
          appearance={clerkAuthAppearance}
        />
      )}
      <p className="text-center text-sm text-muted-foreground">
        {useSignIn ? (
          <>
            Need to set up this email?{" "}
            <Link
              href={invitePagePath(token)}
              className="font-semibold text-primary hover:underline"
              onClick={onStartSignUp}
            >
              Create credentials
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={invitePagePath(token, "sign-in")}
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </>
  );
}

function AcceptInvitePageBody() {
  const params = useParams();
  const token = String(params.token || "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [invite, setInvite] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const signInMode = isInviteSignInMode(searchParams.get("mode"));
  const showAuth = started || signInMode;

  useEffect(() => {
    if (!token) return;
    persistPostAuthReturnPath(invitePagePath(token));
    let cancelled = false;
    userApi
      .getInvitation(token)
      .then((row) => {
        if (!cancelled) setInvite(row);
      })
      .catch(() => {
        if (!cancelled) setError("This invitation link is invalid or has been removed.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signedInEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const invitedEmail = invite?.email?.toLowerCase() || "";
  const emailMatches = Boolean(user && invitedEmail && signedInEmail === invitedEmail);

  useEffect(() => {
    if (!isLoaded || !user || !invite || !emailMatches) return;
    let cancelled = false;
    setBusy(true);
    void (async () => {
      try {
        await ensureUserProfile(user);
        const accepted =
          invite.status === "pending"
            ? await userApi.acceptInvitation(token)
            : invite;
        if (cancelled) return;
        const profile = await userApi.getMyProfile();
        if (cancelled) return;
        const staff =
          Boolean(accepted.isStaff) || isInstituteStaff(profile.accessRole);
        writeStoredRole(user.id, inviteWorkspaceRole(staff));
        router.replace(
          destinationAfterInvite({
            nextPath: accepted.nextPath,
            isStaff: staff,
            institutionId:
              accepted.institutionId ??
              (profile.institutionId ? String(profile.institutionId) : null),
          }),
        );
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Could not accept this invitation.";
        setError(message);
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, invite, emailMatches, token, router]);

  if (!invite && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <AuthCardLayout title="Invitation not found" subtitle={error}>
        <Button className="h-11 w-full" asChild>
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </AuthCardLayout>
    );
  }

  if (!invite) return null;

  if (busy) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
        <p className="text-sm text-muted-foreground">Opening {invite.institutionName}…</p>
      </div>
    );
  }

  if (user && !emailMatches) {
    return (
      <AuthCardLayout
        title={`Join ${invite.institutionName}`}
        subtitle={`This invite is for ${invite.email}, but you're signed in as ${user.primaryEmailAddress?.emailAddress}.`}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign out of this browser session, then continue with the invited email.
            The link will not expire when you switch accounts.
          </p>
          <Button
            className="h-11 w-full"
            onClick={() => void signOut({ redirectUrl: invitePagePath(token) })}
          >
            Use a different account
          </Button>
        </div>
      </AuthCardLayout>
    );
  }

  const destinationLabel = invite.isStaff ? "institute dashboard" : "candidate workspace";
  const staffAuthHint = invite.isStaff
    ? `Set a password or verify with a one-time code sent to ${invite.email}. Google, GitHub, and LinkedIn are not used for institute staff.`
    : `Continue with ${invite.email} to open the ${destinationLabel}.`;
  const useSignIn = invite.isStaff || signInMode || invite.status === "accepted";

  return (
    <AuthCardLayout
      title={`Join ${invite.institutionName}`}
      subtitle={`You've been invited as ${invite.roleLabel}. ${staffAuthHint}`}
    >
      <div className="space-y-3">
        {invite.status === "accepted" && !showAuth ? (
          <p className="text-sm text-muted-foreground">
            This invite was already accepted. Sign in with {invite.email} to continue.
          </p>
        ) : null}

        {showAuth ? (
          <InviteAuthPanel
            token={token}
            email={invite.email}
            isStaff={invite.isStaff}
            useSignIn={useSignIn}
            onStartSignUp={() => setStarted(true)}
          />
        ) : (
          <Button className="h-11 w-full" onClick={() => setStarted(true)}>
            {INVITE_ACCEPT_LABEL}
          </Button>
        )}

        {invite.isStaff ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            This account is for institute staff only. You will not get a candidate
            workspace from this invitation.
          </p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </AuthCardLayout>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<InviteFallback />}>
      <AcceptInvitePageBody />
    </Suspense>
  );
}
