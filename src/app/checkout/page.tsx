"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  Check,
  X,
  ArrowLeft,
  Sparkles,
  ArrowUp,
  Mic,
  Brain,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { paymentApi, planApi, Subscription } from "@/lib/api";
import type { PlanRecord } from "@/lib/planRecord";
import { getPlanMarketingHighlights } from "@/lib/planHighlightsFromFeatures";
import Script from "next/script";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const planId = searchParams.get("plan") as "premium" | null;
  const billingCycle = (searchParams.get("cycle") || "monthly") as
    | "monthly"
    | "quarterly"
    | "yearly";

  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [samePlanError, setSamePlanError] = useState<string | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<PlanRecord | null>(null);
  const [planCatalog, setPlanCatalog] = useState<PlanRecord[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Plan hierarchy for upgrade checks
  const getPlanLevel = (plan: string): number => {
    const levels: Record<string, number> = {
      free: 0,
      premium: 1,
      enterprise: 2,
    };
    return levels[plan] ?? 0;
  };

  const getNextPlan = (currentPlan: string): string | null => {
    if (currentPlan === "free") return "premium";
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

  // Load plan catalog from API (database) and check subscription
  useEffect(() => {
    const run = async () => {
      if (!isLoaded || !user) {
        setCheckingSubscription(false);
        return;
      }

      if (!planId || planId !== "premium") {
        router.push("/pricing");
        return;
      }

      try {
        setCatalogError(null);
        const catalog = await planApi.getAllPlans();
        setPlanCatalog(catalog);
        const premium = catalog.find((p) => p.planId === "premium");
        if (!premium) {
          setCatalogError(
            "Premium plan is not available. Please try again later.",
          );
          setPremiumPlan(null);
          return;
        }
        setPremiumPlan(premium);

        const planLabel = (id: string) =>
          catalog.find((p) => p.planId === id)?.displayName ??
          catalog.find((p) => p.planId === id)?.name ??
          id;

        const subscription = await paymentApi.getSubscription();
        setCurrentSubscription(subscription);

        if (
          subscription &&
          subscription.plan === planId &&
          subscription.status === "active"
        ) {
          const nextPlan = getNextPlan(planId);
          if (nextPlan) {
            setSamePlanError(
              `You are already subscribed to the ${planLabel(planId)} plan. Please upgrade to ${planLabel(nextPlan)} plan instead.`,
            );
          } else {
            setSamePlanError(
              `You are already subscribed to the ${planLabel(planId)} plan. For Enterprise (teams & custom terms), contact us from the pricing page.`,
            );
          }
        } else if (
          subscription &&
          subscription.plan !== "free" &&
          getPlanLevel(subscription.plan) > getPlanLevel(planId)
        ) {
          setSamePlanError(
            `You are currently on the ${planLabel(subscription.plan)} plan. Please contact support if you want to change your plan.`,
          );
        } else {
          setSamePlanError(null);
        }
      } catch (error) {
        console.error("Error loading checkout context:", error);
        setCatalogError(
          error instanceof Error ? error.message : "Failed to load plan",
        );
        setSamePlanError(null);
      } finally {
        setCheckingSubscription(false);
      }
    };

    run();
  }, [isLoaded, user, planId, router]);

  const handlePayment = async () => {
    if (!planId || !user || samePlanError || !premiumPlan) return;

    setLoading(true);
    setError(null);

    try {
      // Create order/subscription
      const order = await paymentApi.createOrder(planId, billingCycle);
      console.log("🔍 Order received from backend:", order);
      console.log("💰 Amount in paise:", order.amount);
      console.log("💰 Amount in rupees:", order.amount / 100);
      setOrderData(order);

      // Initialize Razorpay
      if (!window.Razorpay || !razorpayLoaded) {
        throw new Error(
          "Razorpay SDK not loaded. Please wait a moment and try again.",
        );
      }

      // Check if this is a subscription (has subscriptionId)
      if (order.subscriptionId) {
        console.log(
          "🔑 Opening Razorpay with subscription_id:",
          order.subscriptionId,
        );
        console.log("📋 Full order data:", JSON.stringify(order, null, 2));
        // Handle Razorpay Subscription
        // For subscriptions, we use the subscription ID to authenticate
        // The subscription will be activated via webhook after first payment
        const options = {
          key: order.keyId,
          subscription_id: order.subscriptionId,
          name: "Interview Trix",
          description: `${premiumPlan.name} Plan - ${premiumPlan.creditsIncluded[billingCycle]} credits (${billingCycle} billing)`,
          prefill: {
            name: user.fullName || user.firstName || "",
            email: user.primaryEmailAddress?.emailAddress || "",
          },
          theme: {
            color: "rgb(37,99,235)",
          },
          handler: async function (response: any) {
            try {
              console.log("✅ Subscription payment authorized:", response);
              // Subscription activation will be handled via webhook
              // For now, verify the payment
              if (response.razorpay_payment_id) {
                const result = await paymentApi.verifyPayment(
                  order.orderId, // Use subscription ID as order ID
                  response.razorpay_payment_id,
                  response.razorpay_signature || "",
                );
                console.log("✅ Subscription payment verified:", result);
              }
              // Redirect - webhook will activate subscription
              router.push("/dashboard?payment=success&type=subscription");
            } catch (err: any) {
              console.error("❌ Subscription authorization failed:", err);
              setError(
                err.message ||
                  "Subscription authorization failed. Please contact support if payment was deducted.",
              );
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // Handle regular Razorpay Order (one-time payment)
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Interview Trix",
          description: `${premiumPlan.name} Plan - ${premiumPlan.creditsIncluded[billingCycle]} credits`,
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
                response.razorpay_signature,
              );

              console.log(
                "✅ Payment verified, subscription activated:",
                result,
              );

              // Redirect to dashboard after successful payment
              router.push("/dashboard?payment=success");
            } catch (err: any) {
              console.error("❌ Payment verification failed:", err);
              setError(
                err.message ||
                  "Payment verification failed. Please contact support if payment was deducted.",
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
      }
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
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "rgb(37,99,235)" }}
        />
      </div>
    );
  }

  if (catalogError || !premiumPlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4">
        <p className="text-gray-700 mb-4 text-center max-w-md">
          {catalogError ?? "Unable to load plan."}
        </p>
        <Link href="/pricing">
          <Button variant="outline">Back to pricing</Button>
        </Link>
      </div>
    );
  }

  const plan = premiumPlan;
  const planPrice = plan.pricing[billingCycle];
  const planCredits = plan.creditsIncluded[billingCycle];
  const highlightLines = getPlanMarketingHighlights(plan);

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
        <SiteHeader />

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
                  <span className="text-gray-700">Credits</span>
                  <span className="font-semibold text-gray-900">
                    {planCredits.toLocaleString()} credits
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Billing Period</span>
                  <span className="font-semibold text-gray-900">
                    {billingCycle === "monthly"
                      ? "Monthly"
                      : billingCycle === "quarterly"
                        ? "Quarterly"
                        : "Yearly"}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "rgb(37,99,235)" }}
                    >
                      ₹{planPrice.toLocaleString()}
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
                  getNextPlan(currentSubscription.plan) && (
                    <Link
                      href={`/checkout?plan=${getNextPlan(currentSubscription.plan)}`}
                    >
                      <Button
                        className="w-full mt-3 text-white"
                        style={{ backgroundColor: "rgb(37,99,235)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgb(17,24,39)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgb(37,99,235)")
                        }
                      >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Upgrade to{" "}
                        {planCatalog.find(
                          (p) =>
                            p.planId ===
                            getNextPlan(currentSubscription.plan),
                        )?.name ?? "Next Plan"}
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
              style={{ backgroundColor: "rgb(37,99,235)" }}
              onMouseEnter={(e) =>
                !e.currentTarget.disabled &&
                (e.currentTarget.style.backgroundColor = "rgb(17,24,39)")
              }
              onMouseLeave={(e) =>
                !e.currentTarget.disabled &&
                (e.currentTarget.style.backgroundColor = "rgb(37,99,235)")
              }
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
                <>Pay ₹{planPrice.toLocaleString()} Now</>
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
              {highlightLines.slice(0, 4).map((highlight, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Check
                    className="h-5 w-5"
                    style={{ color: "rgb(37,99,235)" }}
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <MarketingFooter as="footer" className="relative z-10" />
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-blue-50">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "rgb(37,99,235)" }}
          />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
