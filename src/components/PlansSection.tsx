"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Zap, Trophy, Check, ArrowRight } from "lucide-react";
import { userApi } from "@/lib/api";

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
    color: "from-blue-500 to-blue-600",
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
    color: "from-blue-600 to-blue-700",
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
    color: "from-blue-700 to-blue-800",
    icon: Trophy,
    popular: false,
  },
];

export function PlansSection() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [checking, setChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, 150);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Check if section is target of navigation and trigger animation
  useEffect(() => {
    const checkAndAnimate = () => {
      if (sectionRef.current && window.location.hash === "#pricing") {
        // Reset animation
        setIsVisible(false);
        // Wait for scroll to complete, then animate
        setTimeout(() => {
          setIsVisible(true);
        }, 400);
      }
    };

    // Check on mount
    checkAndAnimate();

    // Listen for hash changes
    window.addEventListener("hashchange", checkAndAnimate);
    
    // Also check when scrolling (for programmatic navigation)
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
        if (isInView && window.location.hash === "#pricing") {
          setTimeout(() => {
            setIsVisible(true);
          }, 200);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", checkAndAnimate);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleChoosePlan = async (planId: string) => {
    if (!isLoaded) return;

    setChecking(true);

    try {
      // If user is not logged in, redirect to sign-in with plan in URL
      if (!user) {
        // Store plan in localStorage for after sign-in
        localStorage.setItem("pendingPlan", planId);
        router.push(`/sign-in?redirect=/onboarding`);
        return;
      }

      // User is logged in, check if onboarding is completed
      try {
        const profile = await userApi.getMyProfile();
        
        if (!profile.onboardingCompleted) {
          // Store plan in localStorage and redirect to onboarding
          localStorage.setItem("pendingPlan", planId);
          router.push("/onboarding");
          return;
        }

        // Onboarding completed, go directly to checkout
        router.push(`/checkout?plan=${planId}`);
      } catch (error) {
        console.error("Error checking profile:", error);
        // If error, assume onboarding not completed
        localStorage.setItem("pendingPlan", planId);
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error in handleChoosePlan:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-6 scroll-mt-20 transition-all duration-1000 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Choose Your Plan
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Flexible pricing plans designed to help you ace your interviews
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative border-2 hover:shadow-xl transition-all bg-white ${
                  plan.popular
                    ? "border-blue-600 shadow-lg scale-105 sm:scale-110 glow-border"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${plan.color} shadow-md`}
                    >
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-600 ml-2 text-sm sm:text-base">
                      /{plan.period}
                    </span>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    {plan.interviewsLimit} interviews per{" "}
                    {plan.period === "month" ? "month" : "3 months"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-3">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-gray-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleChoosePlan(plan.id)}
                    disabled={checking || !isLoaded}
                    className={`w-full ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {checking ? "Loading..." : "Choose Plan"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <Link href="/pricing">
            <Button
              variant="outline"
              className="border-2 text-sm sm:text-base"
            >
              View All Plans & Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

