"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import {
  persistPostAuthReturnPath,
  resolvePostAuthRedirectPath,
  safeAppRedirectPath,
} from "@/lib/post-sign-in-redirect";
import { pairedAuthHref } from "@/lib/invite-accept";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = safeAppRedirectPath(searchParams.get("redirect_url"));
  const afterAuth = resolvePostAuthRedirectPath(redirectUrl);
  const emailPrefill = searchParams.get("email")?.trim() || undefined;
  const signInHref = pairedAuthHref("/sign-in", redirectUrl, emailPrefill);

  if (typeof window !== "undefined") {
    persistPostAuthReturnPath(redirectUrl);
  }

  useEffect(() => {
    persistPostAuthReturnPath(redirectUrl);
  }, [redirectUrl]);

  return (
    <AuthCardLayout
      title="Get started free"
      subtitle="Create your account and start practicing today"
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
      <SignUp
        routing="path"
        path="/sign-up"
        forceRedirectUrl={afterAuth}
        fallbackRedirectUrl={afterAuth}
        signInUrl={signInHref}
        signInForceRedirectUrl={afterAuth}
        signInFallbackRedirectUrl={afterAuth}
        initialValues={emailPrefill ? { emailAddress: emailPrefill } : undefined}
        appearance={clerkAuthAppearance}
      />
    </AuthCardLayout>
  );
}
