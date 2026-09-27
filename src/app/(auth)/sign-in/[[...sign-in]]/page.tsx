"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import {
  persistPostAuthReturnPath,
  resolvePostAuthRedirectPath,
  safeAppRedirectPath,
} from "@/lib/post-sign-in-redirect";
import { pairedAuthHref } from "@/lib/invite-accept";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = safeAppRedirectPath(searchParams.get("redirect_url"));
  const afterAuth = resolvePostAuthRedirectPath(redirectUrl);
  const emailPrefill = searchParams.get("email")?.trim() || undefined;
  const signUpHref = pairedAuthHref("/sign-up", redirectUrl, emailPrefill);

  // Persist before paint so a fast Google/SSO click does not drop the extension return path.
  if (typeof window !== "undefined") {
    persistPostAuthReturnPath(redirectUrl);
  }

  useEffect(() => {
    persistPostAuthReturnPath(redirectUrl);
  }, [redirectUrl]);

  return (
    <AuthCardLayout
      title="Welcome back"
      subtitle="Sign in to continue your interview prep journey"
      footer={
        <>
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href={signUpHref}
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </>
      }
    >
      <SignIn
        routing="path"
        path="/sign-in"
        forceRedirectUrl={afterAuth}
        fallbackRedirectUrl={afterAuth}
        signUpUrl={signUpHref}
        signUpForceRedirectUrl={afterAuth}
        signUpFallbackRedirectUrl={afterAuth}
        initialValues={emailPrefill ? { emailAddress: emailPrefill } : undefined}
        appearance={clerkAuthAppearance}
      />
    </AuthCardLayout>
  );
}
