"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import {
  Check,
  Sparkles,
  Zap,
  Trophy,
  Crown,
  ArrowRight,
  User,
  Mic,
  Brain,
  MessageSquare,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { NavigationMenu } from "@/components/NavigationMenu";
import { formatCurrency, formatCredits } from "@/lib/payment";
import { planApi } from "@/lib/api";

const ICON_MAP = {
  Sparkles,
  Zap,
  Trophy,
  Crown,
};

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const isRenderablePaidPlan = (plan: any) =>
    plan?.planId &&
    plan.planId !== "free" &&
    plan.pricing &&
    typeof plan.pricing === "object" &&
    plan.creditsIncluded &&
    typeof plan.creditsIncluded === "object" &&
    plan.features &&
    typeof plan.features === "object";

  const loadPlans = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const allPlans = await planApi.getAllPlans();

      // Filter out free plan and ensure plans have required fields
      const paidPlans = (Array.isArray(allPlans) ? allPlans : []).filter(
        isRenderablePaidPlan,
      );

      setPlans(paidPlans);
      if (paidPlans.length === 0 && Array.isArray(allPlans) && allPlans.length > 0) {
        setLoadError(
          "Plans loaded but none matched the paid-plan format. Check API data.",
        );
      }
    } catch (error) {
      console.error("Error loading plans:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load plans";
      setLoadError(message);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (!isLoaded || !user) {
      router.push("/sign-in");
      return;
    }
    router.push(`/checkout?plan=${planId}&cycle=${billingCycle}`);
  };

  const getPrice = (plan: any) => {
    return plan.pricing?.[billingCycle] || 0;
  };

  const getCredits = (plan: any) => {
    return plan.creditsIncluded?.[billingCycle] || 0;
  };

  const getPeriodLabel = () => {
    if (billingCycle === "yearly") return "year";
    if (billingCycle === "quarterly") return "quarter";
    return "month";
  };

  const getSavingsBadge = (plan: any) => {
    if (billingCycle === "monthly" || !plan.metadata?.savingsPercentage)
      return null;

    const savingsPercent =
      billingCycle === "yearly"
        ? plan.metadata.savingsPercentage.yearly
        : plan.metadata.savingsPercentage.quarterly;

    if (!savingsPercent) return null;

    return (
      <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
        Save {savingsPercent}%
      </div>
    );
  };

  const getPlanHighlights = (plan: any): string[] => {
    const highlights: string[] = [];
    const features = plan.features;

    // Free interviews
    if (features.freeInterviews) {
      highlights.push(
        `${features.freeInterviews.count} free ${features.freeInterviews.duration}-min interviews`,
      );
    }

    // Additional interviews
    if (features.additionalInterviews) {
      highlights.push(
        `${features.additionalInterviews.count} additional ${features.additionalInterviews.duration}-min interviews`,
      );
    }

    // Resume builder
    if (features.resumeBuilder?.enabled) {
      if (features.resumeBuilder.resumesIncluded === -1) {
        highlights.push(
          `Unlimited resumes (${features.resumeBuilder.costPerResume} credits/resume)`,
        );
      } else {
        highlights.push(
          `${features.resumeBuilder.resumesIncluded} resume${features.resumeBuilder.resumesIncluded > 1 ? "s" : ""} included`,
        );
      }
    }

    // ATS Scoring
    if (features.atsScoring?.detailed) {
      highlights.push("Detailed ATS score");
    } else if (features.atsScoring?.basic) {
      highlights.push("Basic ATS score");
    }

    // Credit expiry
    if (plan.creditExpiry) {
      highlights.push(`Credits expire in ${plan.creditExpiry} days`);
    } else if (plan.planId !== "free") {
      highlights.push("Credits NEVER expire");
    }

    // Job recommendations
    if (features.jobRecommendations) {
      if (features.jobRecommendations.daily === -1) {
        highlights.push("Unlimited job recommendations");
      } else {
        highlights.push(
          `${features.jobRecommendations.daily} daily job recommendations`,
        );
      }
    }

    // Real interviews (Elite only)
    if (features.realInterviews) {
      highlights.push(
        `${features.realInterviews.count} real interviews with top engineers`,
      );
    }

    // Priority support
    if (features.prioritySupport) {
      highlights.push("Priority support");
    }

    // Custom questions
    if (features.customQuestions) {
      highlights.push("Custom interview questions");
    }

    // Behavioral analysis
    if (features.behavioralAnalysis) {
      highlights.push("Behavioral analysis");
    }

    return highlights;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (!loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-2">
            No plans available at the moment.
          </p>
          {loadError && (
            <p className="text-sm text-gray-500 mb-4 break-words">{loadError}</p>
          )}
          <Button onClick={loadPlans}>Retry</Button>
        </div>
      </div>
    );
  }

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
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity mx-auto sm:mx-0"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        i<span className="text-sm sm:text-base">X</span>
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                      Interview{" "}
                      <span className="text-blue-600">
                        Tri
                        <span className="text-xl sm:text-2xl lg:text-3xl">
                          X
                        </span>
                      </span>
                    </span>
                  </div>
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
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-4">
              Credit-based pricing for maximum flexibility
            </p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <Info className="w-4 h-4" />
              <span>
                1 Credit = ₹1 | Interview: 5 credits/min | Resume: 30 credits
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-8 pb-16">
        {/* Billing Period Switcher */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("quarterly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "quarterly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "yearly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon =
              ICON_MAP[plan.icon as keyof typeof ICON_MAP] || Sparkles;
            const price = getPrice(plan);
            const credits = getCredits(plan);

            return (
              <Card
                key={plan.planId}
                className={`relative p-8 ${
                  plan.isPopular
                    ? "border-2 border-blue-600 shadow-xl scale-105"
                    : "border border-gray-200 shadow-lg"
                } bg-white hover:shadow-2xl transition-all duration-300`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} shadow-md`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.displayName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {plan.description}
                  </p>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      /{getPeriodLabel()}
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    {formatCredits(credits)}
                  </div>
                  {getSavingsBadge(plan)}
                  {plan.creditExpiry && (
                    <p className="text-xs text-gray-500 mt-2">
                      Credits expire in {plan.creditExpiry} days
                    </p>
                  )}
                  {!plan.creditExpiry && plan.planId !== "free" && (
                    <p className="text-xs text-green-600 font-semibold mt-2">
                      Credits NEVER expire! ✨
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {getPlanHighlights(plan).map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{highlight}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.planId)}
                  className={`w-full ${
                    plan.isPopular
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  } text-white font-medium shadow-sm transition-all`}
                >
                  Choose Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Credit Information */}
        <div className="mt-16 max-w-4xl mx-auto">
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
                <p className="text-sm text-gray-600">30 credits per resume</p>
                <p className="text-xs text-gray-500 mt-1">
                  Includes unlimited
                  <br />
                  ATS analysis & downloads
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
                1 credit = ₹1. Credits are used for interviews (5 credits/min)
                and resume creation (30 credits/resume). You can use your
                credits flexibly across all features.
              </p>
            </Card>
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">Do credits expire?</h3>
              <p className="text-gray-600">
                Starter plan: 60 days | Premium plan: 120 days | Elite plan:
                Never expires! Choose the plan that fits your timeline.
              </p>
            </Card>
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">
                Can I purchase additional credits?
              </h3>
              <p className="text-gray-600">
                Yes! You can purchase additional credits anytime. They follow
                the expiry rules of your current plan.
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

      {/* Footer Section */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">
                  i<span className="text-sm">X</span>
                </span>
              </div>
              <span className="text-xl font-bold text-white">
                Interview{" "}
                <span className="text-blue-400">
                  Tri<span className="text-2xl">X</span>
                </span>
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
              <Link
                href="/about-us"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                About us
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/refund"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Refund policy
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Contact us
              </Link>
            </nav>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              © 2026 Interview Trix. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
