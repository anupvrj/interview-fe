"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Check, X, ArrowLeft, Sparkles, ArrowUp, Mic, Brain, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { paymentApi, Subscription } from "@/lib/api";
import { PLAN_CONFIG } from "@/lib/payment";
import Script from "next/script";
import Link from "next/link";
import { NavigationMenu } from "@/components/NavigationMenu";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const planId = searchParams.get("plan") as
    | "starter"
    | "pro"
    | "exam_pack"
    | null;

  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [samePlanError, setSamePlanError] = useState<string | null>(null);

  // Plan hierarchy for upgrade checks
  const getPlanLevel = (plan: string): number => {
    const levels: Record<string, number> = {
      free: 0,
      starter: 1,
      pro: 2,
      exam_pack: 3,
    };
    return levels[plan] ?? 0;
  };

  const getNextPlan = (currentPlan: string): string | null => {
    if (currentPlan === "free") return "starter";
    if (currentPlan === "starter") return "pro";
    if (currentPlan === "pro") return "exam_pack";
    return null;
  };

  // Clear error immediately when planId changes
  useEffect(() => {
    setSamePlanError(null);
    setCheckingSubscription(true);
    // Don't reset razorpayLoaded - if it's already loaded, keep it loaded
  }, [planId]);

  // Check if Razorpay is already loaded in window (check on mount and when plan changes)
  useEffect(() => {
    const checkRazorpay = () => {
      if (typeof window !== "undefined" && window.Razorpay) {
        setRazorpayLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkRazorpay()) return;

    // If not loaded, check periodically (fallback)
    const interval = setInterval(() => {
      if (checkRazorpay()) {
        clearInterval(interval);
      }
    }, 500);

    // Clear interval after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!checkRazorpay()) {
        console.warn("Razorpay SDK not loaded after 10 seconds");
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [planId]); // Re-check when planId changes

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      
      if (!isLoaded || !user) {
        setCheckingSubscription(false);
        return;
      }

      if (!planId || !["starter", "pro", "exam_pack"].includes(planId)) {
        router.push("/pricing");
        return;
      }

      try {
        const subscription = await paymentApi.getSubscription();
        setCurrentSubscription(subscription);

        // Check if user already has the same plan
        if (
          subscription &&
          subscription.plan === planId &&
          subscription.status === "active"
        ) {
          const nextPlan = getNextPlan(planId);
          if (nextPlan) {
            setSamePlanError(
              `You are already subscribed to the ${PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG].name} plan. Please upgrade to ${PLAN_CONFIG[nextPlan as keyof typeof PLAN_CONFIG].name} plan instead.`
            );
          } else {
            setSamePlanError(
              `You are already subscribed to the ${PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG].name} plan. This is our highest tier plan.`
            );
          }
        } else if (
          subscription &&
          subscription.plan !== "free" &&
          getPlanLevel(subscription.plan) > getPlanLevel(planId)
        ) {
          // User is trying to downgrade
          setSamePlanError(
            `You are currently on the ${PLAN_CONFIG[subscription.plan as keyof typeof PLAN_CONFIG].name} plan. Please contact support if you want to change your plan.`
          );
        } else {
          // Valid upgrade or new subscription - clear any errors
          setSamePlanError(null);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        // Continue with checkout if subscription check fails
        setSamePlanError(null);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [isLoaded, user, planId, router]);

  const handlePayment = async () => {
    if (!planId || !user || samePlanError) return;

    setLoading(true);
    setError(null);

    try {
      // Create order
      const order = await paymentApi.createOrder(planId);
      setOrderData(order);

      // Initialize Razorpay
      if (!window.Razorpay || !razorpayLoaded) {
        throw new Error(
          "Razorpay SDK not loaded. Please wait a moment and try again."
        );
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Interview Trix",
        description: `${PLAN_CONFIG[planId].name} Plan - ${PLAN_CONFIG[planId].interviewsLimit} interviews`,
        order_id: order.orderId,
        // Enable Indian payment methods
        method: {
          card: true,
          netbanking: true,
          wallet: true,
          upi: true,
        },
        handler: async function (response: any) {
          try {
            console.log("✅ Payment successful, verifying...", response);

            // Verify payment (this updates user subscription in backend)
            const result = await paymentApi.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            console.log("✅ Payment verified, subscription activated:", result);

            // Redirect to dashboard after successful payment
            router.push("/dashboard?payment=success");
          } catch (err: any) {
            console.error("❌ Payment verification failed:", err);
            setError(
              err.message ||
                "Payment verification failed. Please contact support if payment was deducted."
            );
            setLoading(false);
          }
        },
        prefill: {
          name: user.fullName || user.firstName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "rgb(37,99,235)",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !user || !planId || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'rgb(37,99,235)' }} />
      </div>
    );
  }

  const plan = PLAN_CONFIG[planId];

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Razorpay SDK loaded");
          // Double check that it's actually available
          setTimeout(() => {
            if (typeof window !== "undefined" && window.Razorpay) {
              setRazorpayLoaded(true);
            } else {
              console.warn("Razorpay object not found after script load");
            }
          }, 100);
        }}
        onError={() => {
          console.error("Failed to load Razorpay SDK");
          setError("Failed to load Razorpay SDK. Please refresh the page.");
          setRazorpayLoaded(false);
        }}
      />

      <div className="min-h-screen bg-blue-50 scroll-smooth selection:bg-blue-100 relative overflow-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50">
          {/* Top Border - Mobile Only */}
          <div className="sm:hidden h-1" style={{ backgroundColor: 'rgb(37 99 235 / var(--tw-bg-opacity, 1))' }}></div>
          
          {/* Main Header */}
          <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
                {/* Mobile Layout */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-4">
                  {/* Hamburger Menu - Mobile Only */}
                  <div className="sm:hidden">
                    <NavigationMenu />
                  </div>

                  {/* Logo - Centered on Mobile, Left on Desktop */}
                  <Link
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity mx-auto sm:mx-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xs sm:text-sm">i<span className="text-sm sm:text-base">X</span></span>
                      </div>
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                        Interview <span className="text-blue-600">Tri<span className="text-xl sm:text-2xl lg:text-3xl">X</span></span>
                      </span>
                    </div>
                  </Link>

                  {/* Right Side Icons - Mobile */}
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

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center gap-4 sm:gap-6">
                  {/* Navigation Menu */}
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

        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={`mic-${i}`}
              className="absolute opacity-10"
              style={{
                left: `${(i * 15) % 100}%`,
                top: `${(i * 20) % 100}%`,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Mic className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`brain-${i}`}
              className="absolute opacity-10"
              style={{
                left: `${(i * 18) % 100}%`,
                top: `${(i * 25) % 100}%`,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              <Brain className="w-10 h-10 sm:w-14 sm:h-14 text-blue-400" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`message-${i}`}
              className="absolute opacity-10"
              style={{
                left: `${(i * 20) % 100}%`,
                top: `${(i * 15) % 100}%`,
                animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-blue-300" />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-24 sm:pt-28 lg:pt-32 pb-16 max-w-2xl relative z-10">
          <Card className="p-8 bg-white shadow-xl border-blue-200/50">
            <h1 className="text-3xl font-bold mb-6 text-slate-900">
              Complete Your Purchase
            </h1>

            {/* Order Summary */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-200/50">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Plan</span>
                  <span className="font-semibold text-gray-900">
                    {plan.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Interviews</span>
                  <span className="font-semibold text-gray-900">
                    {plan.interviewsLimit} per {plan.period}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Billing Period</span>
                  <span className="font-semibold text-gray-900">
                    {plan.period === "month" ? "Monthly" : "3 Months"}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-2xl font-bold" style={{ color: 'rgb(37,99,235)' }}>
                      ₹{plan.price}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Same Plan Error Message */}
            {samePlanError && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <X className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-800 font-semibold mb-1">
                      Already Subscribed
                    </p>
                    <p className="text-yellow-700 text-sm">{samePlanError}</p>
                  </div>
                </div>
                {currentSubscription &&
                  currentSubscription.plan !== "exam_pack" && (
                    <Link href={`/checkout?plan=${getNextPlan(currentSubscription.plan)}`}>
                      <Button
                        className="w-full mt-3 text-white"
                        style={{ backgroundColor: 'rgb(37,99,235)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(17,24,39)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(37,99,235)'}
                      >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Upgrade to{" "}
                        {PLAN_CONFIG[
                          getNextPlan(currentSubscription.plan) as keyof typeof PLAN_CONFIG
                        ]?.name || "Next Plan"}
                      </Button>
                    </Link>
                  )}
                <Link href="/dashboard" className="block mt-3">
                  <Button variant="outline" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <X className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Payment Button */}
            {!razorpayLoaded && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Loading payment gateway...</p>
                </div>
              </div>
            )}
            <Button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded || !!samePlanError}
              className="w-full text-white py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'rgb(37,99,235)' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'rgb(17,24,39)')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'rgb(37,99,235)')}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : !razorpayLoaded ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Pay ₹{plan.price} Now</>
              )}
            </Button>

            <p className="text-sm text-gray-500 text-center mt-4">
              Secure payment powered by Razorpay
            </p>
          </Card>

          {/* Features Reminder */}
          <Card className="mt-6 p-6 bg-white">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">
              What you'll get:
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5" style={{ color: 'rgb(37,99,235)' }} />
                {plan.interviewsLimit} AI-powered mock interviews
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5" style={{ color: 'rgb(37,99,235)' }} />
                Detailed feedback and analysis
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5" style={{ color: 'rgb(37,99,235)' }} />
                Progress tracking and insights
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5" style={{ color: 'rgb(37,99,235)' }} />
                Access to all premium features
              </li>
            </ul>
          </Card>
        </div>

        {/* Footer Section */}
        <footer className="py-8 sm:py-10 px-4 sm:px-6 bg-slate-900 relative z-10">
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
                <Link href="/about-us" className="text-sm text-gray-300 hover:text-white transition-colors">
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
        </footer>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
      <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-blue-50">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'rgb(37,99,235)' }} />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
