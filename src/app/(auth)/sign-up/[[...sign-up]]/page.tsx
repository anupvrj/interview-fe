"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import { storePostSignInReturnUrl } from "@/lib/post-sign-in-redirect";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  const signInHref = redirectUrl
    ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
    : "/sign-in";

  useEffect(() => {
    if (redirectUrl) {
      storePostSignInReturnUrl(redirectUrl);
    }
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
        afterSignUpUrl="/onboarding"
        appearance={clerkAuthAppearance}
      />
    </AuthCardLayout>
  );
}
