"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  CheckCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Calendar,
  Zap,
} from "lucide-react";
import { paymentApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function PlanPage() {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadSubscription();
    }
  }, [isLoaded, user]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getSubscription();
      setSubscription(data);
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNextPlan = (currentPlan: string) => {
    if (currentPlan === "free")
      return {
        id: "starter",
        name: "Starter",
        price: 299,
        interviews: 3,
        features: [
          "3 voice interviews per month",
          "Basic feedback (score + transcript)",
          "Teacher Assistant unlimited",
          "Progress tracking",
        ],
      };
    if (currentPlan === "starter")
      return {
        id: "pro",
        name: "Pro",
        price: 699,
        interviews: 10,
        features: [
          "10 voice interviews per month",
          "Detailed behavioral analysis + action items",
          "Teacher Assistant + custom questions",
          "Progress tracking + weak area radar",
          "Priority support",
        ],
      };
    if (currentPlan === "pro")
      return {
        id: "exam_pack",
        name: "Exam Pack",
        price: 1499,
        interviews: 20,
        features: [
          "20 voice interviews (3 months)",
          "BPSC/SSC/IBPS specialized questions",
          "Curated question bank",
          "Certification/score report",
          "Priority support",
        ],
      };
    return null;
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(37,99,235)] mx-auto mb-4" />
          <p className="text-gray-600">Loading your plan details...</p>
        </div>
      </div>
    );
  }

  let planName = "Free Plan";
  if (subscription?.plan === "starter") {
    planName = "Starter Plan";
  } else if (subscription?.plan === "pro") {
    planName = "Pro Plan";
  } else if (subscription?.plan === "exam_pack") {
    planName = "Exam Pack";
  }

  const nextPlan = subscription?.plan ? getNextPlan(subscription.plan) : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 lg:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Plan</h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Manage your subscription, view plan details, and upgrade to unlock
            more features
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Current Plan */}
      <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl lg:text-2xl">
              Current Plan: {planName}
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            Your active subscription details and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6">
          <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                Interviews Used
              </span>
              <span className="text-sm font-bold text-[rgb(37,99,235)]">
                {subscription?.interviewsUsed || 0} /{" "}
                {subscription?.interviewsLimit || 2}
              </span>
            </div>
            <Progress
              value={
                subscription?.interviewsUsed && subscription?.interviewsLimit
                  ? (subscription.interviewsUsed /
                      subscription.interviewsLimit) *
                    100
                  : 0
              }
              className="h-3"
            />
            <p className="text-xs text-gray-600 mt-2">
              {subscription?.interviewsLimit &&
              subscription?.interviewsUsed >= subscription?.interviewsLimit
                ? "You've reached your limit. Upgrade to continue."
                : `${
                    (subscription?.interviewsLimit || 2) -
                    (subscription?.interviewsUsed || 0)
                  } interviews remaining this period`}
            </p>
          </div>

          {subscription?.currentPeriodEnd && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200/50">
              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Current Period
                </p>
                <p className="text-sm text-gray-600">
                  Period ends:{" "}
                  <span className="font-medium">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {nextPlan && (
        <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl lg:text-2xl">
                Upgrade to {nextPlan.name}
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              Get more interviews and unlock advanced features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-6">
            <div className="p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200/50">
              <h4 className="font-bold text-base lg:text-lg text-gray-900 mb-3 lg:mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-[rgb(37,99,235)]" />
                What you'll get:
              </h4>
              <ul className="space-y-2 lg:space-y-3">
                {nextPlan.features.map((feature) => (
                  <li
                    key={feature}
                    className="text-sm text-gray-700 flex items-start gap-3"
                  >
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-[rgb(37,99,235)] mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    ₹{nextPlan.price}
                    <span className="text-base lg:text-lg font-normal text-gray-600">
                      /{nextPlan.id === "exam_pack" ? "3 months" : "month"}
                    </span>
                  </p>
                </div>
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Highest Plan Message */}
      {!nextPlan && (
        <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 mb-2">
                  You're on our highest plan!
                </h3>
                <p className="text-sm text-gray-700">
                  Enjoy all premium features and unlimited benefits. Thank you
                  for being a valued member!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
