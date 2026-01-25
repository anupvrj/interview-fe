"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Check, Sparkles, Zap, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: { INR: 299, USD: 4 },
    priceYearly: { INR: 2990, USD: 40 },
    interviewsLimit: 3,
    features: [
      "3 voice interviews per month",
      "Basic feedback (score + transcript)",
      "Teacher Assistant unlimited",
      "Progress tracking",
    ],
    color: "from-blue-500 to-blue-600",
    icon: Sparkles,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: { INR: 699, USD: 9 },
    priceYearly: { INR: 6990, USD: 90 },
    interviewsLimit: 10,
    features: [
      "10 voice interviews per month",
      "Detailed behavioral analysis + action items",
      "Teacher Assistant + custom questions",
      "Progress tracking + weak area radar",
      "Priority support",
    ],
    color: "from-blue-600 to-blue-700",
    icon: Zap,
    popular: true,
  },
  {
    id: "exam_pack",
    name: "Exam Pack",
    priceMonthly: { INR: 1499, USD: 19 },
    priceYearly: { INR: 14990, USD: 190 },
    interviewsLimit: 20,
    features: [
      "20 voice interviews (3 months)",
      "BPSC/SSC/IBPS specialized questions",
      "Curated question bank",
      "Certification/score report",
      "Priority support",
    ],
    color: "from-blue-700 to-blue-800",
    icon: Trophy,
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const handleSelectPlan = (planId: string) => {
    if (!isLoaded || !user) {
      router.push("/sign-in");
      return;
    }
    router.push(`/checkout?plan=${planId}`);
  };

  const getPrice = (plan: typeof PLANS[0]) => {
    const prices = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
    return prices[currency];
  };

  const getCurrencySymbol = () => {
    return currency === "INR" ? "₹" : "$";
  };

  const getPeriod = () => {
    if (billingPeriod === "yearly") return "year";
    return "month";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">i<span className="text-sm">X</span></span>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                Interview <span className="text-blue-600">Tri<span className="text-3xl">X</span></span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            )}
            {!user && (
              <Link href="/sign-in">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-slate-900">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Unlock your interview potential with our AI-powered mock interview
            platform
          </p>

          {/* Currency and Billing Period Switchers */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            {/* Currency Switcher */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
              <button
                onClick={() => setCurrency("INR")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currency === "INR"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currency === "USD"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                USD
              </button>
            </div>

            {/* Billing Period Switcher */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${
                  plan.popular
                    ? "border-2 border-blue-600 shadow-xl scale-105"
                    : "border border-gray-200 shadow-lg"
                } bg-white hover:shadow-2xl transition-all duration-300`}
              >
                {plan.popular && (
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
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {getCurrencySymbol()}{getPrice(plan)}
                    </span>
                    <span className="text-gray-600 ml-2">/{getPeriod()}</span>
                    {billingPeriod === "yearly" && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Save {Math.round((1 - (getPrice(plan) / (plan.priceMonthly[currency] * 12))) * 100)}%
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    {plan.interviewsLimit} interviews per{" "}
                    {billingPeriod === "monthly" ? "month" : "month (billed yearly)"}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full ${
                    plan.popular
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

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                will be reflected in your next billing cycle.
              </p>
            </Card>
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">
                What happens if I exceed my interview limit?
              </h3>
              <p className="text-gray-600">
                You'll be prompted to upgrade your plan. Your unused interviews
                don't roll over to the next month.
              </p>
            </Card>
            <Card className="p-6 bg-white">
              <h3 className="font-semibold text-lg mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All new users get 3 free interviews to try out the
                platform.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          {/* Footer Content */}
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">i<span className="text-sm">X</span></span>
              </div>
              <span className="text-xl font-bold text-white">
                Interview <span className="text-blue-400">Tri<span className="text-2xl">X</span></span>
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
              <Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">
                About us
              </Link>
              <Link href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund" className="text-sm text-gray-300 hover:text-white transition-colors">
                Refund policy
              </Link>
              <Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
                Contact us
              </Link>
            </nav>
          </div>
          {/* Copyright */}
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
