"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Store redirect_url in localStorage so onboarding can use it
    const redirectUrl = searchParams.get("redirect_url");
    if (redirectUrl) {
      localStorage.setItem("resumeBuilderReturnUrl", redirectUrl);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(37 99 235 / var(--tw-text-opacity, 1))' }}>
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue your interview prep journey
          </p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          afterSignInUrl="/onboarding"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90",
              card: "shadow-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
