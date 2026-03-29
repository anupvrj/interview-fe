"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { ArrowLeft, Check, Code, Briefcase, Award, Target, Zap, Users } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Code className="absolute text-blue-200 opacity-20 w-16 h-16 animate-float" style={{ top: '10%', left: '5%', animationDelay: '0s', animationDuration: '20s' }} />
        <Briefcase className="absolute text-indigo-200 opacity-20 w-12 h-12 animate-float" style={{ top: '20%', right: '10%', animationDelay: '2s', animationDuration: '25s' }} />
        <Award className="absolute text-purple-200 opacity-20 w-14 h-14 animate-float" style={{ top: '60%', left: '8%', animationDelay: '4s', animationDuration: '22s' }} />
        <Target className="absolute text-blue-200 opacity-20 w-10 h-10 animate-float" style={{ top: '80%', right: '15%', animationDelay: '1s', animationDuration: '18s' }} />
        <Zap className="absolute text-indigo-200 opacity-20 w-12 h-12 animate-float" style={{ top: '40%', right: '5%', animationDelay: '3s', animationDuration: '24s' }} />
        <Users className="absolute text-purple-200 opacity-20 w-16 h-16 animate-float" style={{ top: '70%', left: '15%', animationDelay: '5s', animationDuration: '21s' }} />
        <Code className="absolute text-blue-200 opacity-20 w-10 h-10 animate-float" style={{ top: '30%', left: '20%', animationDelay: '6s', animationDuration: '19s' }} />
        <Award className="absolute text-indigo-200 opacity-20 w-14 h-14 animate-float" style={{ top: '50%', right: '20%', animationDelay: '2.5s', animationDuration: '23s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        {/* Left Side - Logo and Content (Hidden on mobile, visible on desktop) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-end px-8 xl:px-12 py-12 pr-8 xl:pr-16">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center mb-12 hover:opacity-90 transition-opacity">
            <InterviewTrixLogo
              variant="onLightBg"
              className="h-12 lg:h-14 w-auto"
              priority
            />
          </Link>

          <p className="text-sm text-gray-600 mb-2">Start your journey</p>
          <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Get Started Free
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Create your account and start practicing today
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium">AI-powered mock interviews</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium">ATS-optimized resume builder</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium">Instant performance feedback</span>
            </div>
          </div>
        </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-4 lg:py-12">
        <div className="w-full max-w-md">
          {/* Mobile Header (Visible only on mobile) */}
          <div className="lg:hidden text-center mb-8">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center justify-center mb-6 hover:opacity-90 transition-opacity">
              <InterviewTrixLogo
                variant="onLightBg"
                className="h-10 w-auto"
                priority
              />
            </Link>
            
            <p className="text-sm text-gray-600 mb-2">Start your journey</p>
            <h1 className="text-xl font-bold text-gray-900 mb-8">
              Sign Up to Interview Trix
            </h1>
          </div>


          {/* Clerk Sign Up Component */}
          <div className="lg:mt-8">
            <SignUp
              routing="path"
              path="/sign-up"
              afterSignUpUrl="/onboarding"
              appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent w-full [padding:1.05rem]",
                main: "p-0",
                  header: "hidden",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-normal shadow-sm hover:shadow transition-all rounded-lg h-12 w-full flex items-center justify-center gap-2",
                  socialButtonsBlockButtonText: "font-normal text-sm flex items-center",
                  socialButtonsIconButton: 
                    "bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all w-full h-12",
                  socialButtons: "flex flex-col gap-3 w-full",
                  socialButtonsProviderIcon: "w-4 h-4",
                  dividerLine: "bg-gray-300",
                  dividerText: "text-gray-500 text-xs font-normal",
                  dividerRow: "my-6",
                  formButtonPrimary:
                    "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow transition-all rounded-lg h-12 w-full normal-case",
                  formFieldInput:
                    "border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-white h-12 text-sm px-4",
                  formFieldLabel: "text-gray-700 font-normal text-sm mb-1.5",
                  formFieldLabelRow: "mb-1",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-normal hover:underline text-sm",
                  identityPreviewText: "text-gray-700 font-normal",
                  formResendCodeLink: "text-blue-600 hover:text-blue-700 font-normal hover:underline",
                  otpCodeFieldInput: "border border-gray-300 focus:border-blue-500 rounded-lg h-12",
                  formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
                  formFieldAction: "text-sm text-blue-600 hover:text-blue-700 font-normal hover:underline",
                  footer: "hidden",
                  formFieldRow: "mb-4",
                },
                layout: {
                  socialButtonsPlacement: "bottom",
                  socialButtonsVariant: "blockButton",
                  showOptionalFields: false,
                },
              }}
            />
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Back to Home Button */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) translateX(10px) rotate(5deg);
          }
          50% {
            transform: translateY(-40px) translateX(-10px) rotate(-5deg);
          }
          75% {
            transform: translateY(-20px) translateX(10px) rotate(3deg);
          }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
