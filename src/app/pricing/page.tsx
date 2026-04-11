"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Sparkles, User, Mic, Brain, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { NavigationMenu } from "@/components/NavigationMenu";
import { MarketingFooter } from "@/components/MarketingFooter";
import { PricingPlansBlock } from "@/components/PricingPlansBlock";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white scroll-smooth selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        <div
          className="sm:hidden h-1"
          style={{
            backgroundColor: "rgb(37 99 235 / var(--tw-bg-opacity, 1))",
          }}
        ></div>

        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-4">
                <div className="sm:hidden">
                  <NavigationMenu />
                </div>

                <Link
                  href="/"
                  className="flex items-center hover:opacity-80 transition-opacity mx-auto sm:mx-0"
                >
                  <InterviewTrixLogo
                    variant="onLightBg"
                    className="h-7 w-auto sm:hidden"
                    priority
                  />
                  <InterviewTrixLogo
                    className="hidden sm:block h-8 lg:h-10 w-auto"
                    priority
                  />
                </Link>

                <div className="flex items-center gap-3 sm:hidden">
                  <SignedOut>
                    <Link href="/sign-in" className="p-1">
                      <User className="w-5 h-5 text-slate-900" />
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-6 h-6",
                        },
                      }}
                    />
                  </SignedIn>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 sm:gap-6">
                <NavigationMenu />
                <SignedOut>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm px-2 sm:px-4"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all text-xs sm:text-sm px-4 py-2"
                    >
                      Get Started
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className="hidden md:block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm px-2 sm:px-4"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10",
                      },
                    }}
                  />
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden relative">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)",
          }}
        ></div>

        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(8)].map((_, i) => {
            const positions = [
              { left: "5%", top: "10%" },
              { left: "25%", top: "5%" },
              { left: "45%", top: "15%" },
              { left: "65%", top: "8%" },
              { left: "85%", top: "12%" },
              { left: "15%", top: "25%" },
              { left: "55%", top: "30%" },
              { left: "75%", top: "22%" },
            ];
            return (
              <div
                key={`mic-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${5 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            );
          })}
          {[...Array(8)].map((_, i) => {
            const positions = [
              { left: "10%", top: "50%" },
              { left: "30%", top: "45%" },
              { left: "50%", top: "55%" },
              { left: "70%", top: "48%" },
              { left: "90%", top: "52%" },
              { left: "20%", top: "65%" },
              { left: "60%", top: "70%" },
              { left: "80%", top: "62%" },
            ];
            return (
              <div
                key={`brain-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${6 + (i % 2) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                <Brain className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
            );
          })}
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-white">
              Choose Your Plan
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Flexible pricing plans designed to help you ace your interviews
            </p>
          </div>
        </div>
      </section>

      {/* Main Content — plans from GET /plans (database) */}
      <div className="container mx-auto px-4 pt-8 pb-16 max-w-6xl">
        <PricingPlansBlock showHeading={false} />
      </div>

      {/* Credit Information */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              How Credits Work
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Interviews</h3>
                <p className="text-sm text-gray-600">5 credits per minute</p>
                <p className="text-xs text-gray-500 mt-1">
                  30-min = 150 credits
                  <br />
                  60-min = 300 credits
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Resume Builder
                </h3>
                <p className="text-sm text-gray-600">
                  Unlimited ATS analysis and downloads
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Flexibility
                </h3>
                <p className="text-sm text-gray-600">Use credits as you need</p>
                <p className="text-xs text-gray-500 mt-1">
                  Mix interviews &<br />
                  resumes freely
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">
                What are credits and how do they work?
              </h3>
              <p className="text-gray-600">
                1 credit = ₹1. Mock interviews use credits at 5 credits per
                minute. The resume builder is included with your plan and does
                not deduct credits from your balance.
              </p>
            </Card>
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">Do credits expire?</h3>
              <p className="text-gray-600">
                Credits in your wallet do not expire on a calendar schedule.
                Premium access is managed by your subscription renewal through
                Razorpay; if your plan lapses, you will not be able to start new
                paid-tier sessions until you renew.
              </p>
            </Card>
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">
                Can I purchase additional credits?
              </h3>
              <p className="text-gray-600">
                Yes! You can purchase additional credits anytime. They are added
                to your balance and used like other credits.
              </p>
            </Card>
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">
                Can I upgrade my plan?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade anytime. Unused credits from your
                current plan will be retained.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
