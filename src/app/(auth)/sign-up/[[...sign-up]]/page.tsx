"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthCardLayout
      title="Get started free"
      subtitle="Create your account and start practicing today"
      footer={
        <>
          <p>
            Already have an account?{" "}
            <Link
              href="/sign-in"
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
