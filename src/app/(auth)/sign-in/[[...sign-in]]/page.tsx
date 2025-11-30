"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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
