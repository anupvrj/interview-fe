import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(37 99 235 / var(--tw-text-opacity, 1))' }}>
            Get Started Free
          </h1>
          <p className="text-gray-600">
            Create your account and start practicing today
          </p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          afterSignUpUrl="/onboarding"
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
