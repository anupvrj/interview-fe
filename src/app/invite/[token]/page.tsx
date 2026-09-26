"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { userApi, type InvitationPreview } from "@/lib/api";
import { isInstituteStaff } from "@/lib/institute-access";
import { roleHome, writeStoredRole } from "@/lib/roles";
import { ensureUserProfile } from "@/lib/ensure-user-profile";

function authHref(path: "/sign-in" | "/sign-up", token: string, email: string) {
  const redirect = `/invite/${encodeURIComponent(token)}`;
  const params = new URLSearchParams({
    redirect_url: redirect,
    email,
  });
  return `${path}?${params.toString()}`;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const token = String(params.token || "");
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [invite, setInvite] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
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
        if (invite.status === "pending") {
          await userApi.acceptInvitation(token);
        }
        const profile = await userApi.getMyProfile();
        if (cancelled) return;
        if (isInstituteStaff(profile.accessRole)) {
          writeStoredRole(user.id, "institution_admin");
          router.replace(roleHome("institution_admin", profile));
          return;
        }
        writeStoredRole(user.id, "candidate");
        router.replace(roleHome("candidate", profile));
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
            onClick={() => void signOut({ redirectUrl: `/invite/${token}` })}
          >
            Use a different account
          </Button>
        </div>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout
      title={`Join ${invite.institutionName}`}
      subtitle={`You've been invited as ${invite.roleLabel}. Continue with ${invite.email} to open the ${
        invite.isStaff ? "institute dashboard" : "candidate workspace"
      }.`}
    >
      <div className="space-y-3">
        {invite.status === "accepted" ? (
          <p className="text-sm text-muted-foreground">
            This invite was already accepted. Sign in with {invite.email} to continue.
          </p>
        ) : null}
        <Button className="h-11 w-full" asChild>
          <Link href={authHref("/sign-up", token, invite.email)}>Create account</Link>
        </Button>
        <Button variant="outline" className="h-11 w-full" asChild>
          <Link href={authHref("/sign-in", token, invite.email)}>I already have an account</Link>
        </Button>
        {invite.isStaff ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            After you join, you can switch to Candidate from the role menu anytime to
            practice interviews yourself. Institute admin access stays on this account.
          </p>
        ) : null}
      </div>
    </AuthCardLayout>
  );
}
