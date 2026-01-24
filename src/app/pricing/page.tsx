"use client";

import {} from "react";
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
    price: 299,
    period: "month",
    interviewsLimit: 3,
    features: [
      "3 voice interviews per month",
      "Basic feedback (score + transcript)",
      "Teacher Assistant unlimited",
      "Progress tracking",
    ],
    color: "from-landing-blue-500 to-landing-blue-600",
    icon: Sparkles,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 699,
    period: "month",
    interviewsLimit: 10,
    features: [
      "10 voice interviews per month",
      "Detailed behavioral analysis + action items",
      "Teacher Assistant + custom questions",
      "Progress tracking + weak area radar",
      "Priority support",
    ],
    color: "from-landing-blue-600 to-landing-blue-700",
    icon: Zap,
    popular: true,
  },
  {
    id: "exam_pack",
    name: "Exam Pack",
    price: 1499,
    period: "3 months",
    interviewsLimit: 20,
    features: [
      "20 voice interviews (3 months)",
      "BPSC/SSC/IBPS specialized questions",
      "Curated question bank",
      "Certification/score report",
      "Priority support",
    ],
    color: "from-landing-blue-700 to-landing-blue-800",
    icon: Trophy,
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const handleSelectPlan = (planId: string) => {
    if (!isLoaded || !user) {
      router.push("/sign-in");
      return;
    }
    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-blue-50 via-landing-blue-100 to-landing-blue-200">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-landing-blue-700" />
            <span className="text-2xl font-bold bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 bg-clip-text text-transparent">
              Easy Interview
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            )}
            {!user && (
              <Link href="/sign-in">
                <Button variant="gradient">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock your interview potential with our AI-powered mock interview
            platform
          </p>
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
                    ? "border-2 border-landing-blue-600 shadow-xl scale-105"
                    : "border shadow-lg"
                } bg-white hover:shadow-2xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
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
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    {plan.interviewsLimit} interviews per{" "}
                    {plan.period === "month" ? "month" : "3 months"}
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
                      ? "bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900"
                      : "bg-gray-900 hover:bg-gray-800"
                  } text-white`}
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
    </div>
  );
}
