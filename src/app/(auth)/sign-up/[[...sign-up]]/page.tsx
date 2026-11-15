"use client";

import { SignIn } from "@clerk/nextjs";
import { useRedirectIfSignedIn } from "@/hooks/useRedirectIfSignedIn";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { HackathonAuthAnalytics } from "@/features/hackathon/components/HackathonAuthAnalytics";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import {
  persistPostAuthReturnPath,
  resolvePostAuthRedirectPath,
  safeAppRedirectPath,
} from "@/lib/post-sign-in-redirect";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = safeAppRedirectPath(searchParams.get("redirect_url"));
  const afterAuth = resolvePostAuthRedirectPath(redirectUrl);
  const signedIn = useRedirectIfSignedIn(afterAuth);
  const signInHref = redirectUrl
    ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
    : "/sign-in";

  if (typeof window !== "undefined") {
    persistPostAuthReturnPath(redirectUrl);
  }

  useEffect(() => {
    persistPostAuthReturnPath(redirectUrl);
  }, [redirectUrl]);

  return (
    <AuthCardLayout
      // The same email-first flow signs existing accounts in, so the heading fits both.
      title="Continue with your email"
      subtitle="New here? We'll create your free account. Already have one? We'll sign you in."
      footer={
        <>
          <p>
            Already have an account?{" "}
            <Link
              href={signInHref}
              className="font-semibold text-primary hover:underline"
            >
              Sign in
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
      <HackathonAuthAnalytics pageType="sign_up" redirectUrl={redirectUrl}>
        {/* One email-first flow: an email that already has an account goes to its password
            (then on to where they were headed) instead of "That email address is taken". */}
        {!signedIn && (
          <SignIn
            withSignUp
            routing="path"
            path="/sign-up"
            forceRedirectUrl={afterAuth}
            fallbackRedirectUrl={afterAuth}
            signUpForceRedirectUrl={afterAuth}
            signUpFallbackRedirectUrl={afterAuth}
            appearance={clerkAuthAppearance}
          />
        )}
      </HackathonAuthAnalytics>
    </AuthCardLayout>
  );
}
