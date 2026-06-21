"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  Check,
  X,
  ArrowUp,
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
import { PageHeader } from "@/components/app/PageHeader";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { isPaidPlanId, type PaidPlanId } from "@/lib/pricingPageContent";
import type { SelfServePlanSlug } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const planId = searchParams.get("plan") as PaidPlanId | null;
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
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);
  const [planCatalog, setPlanCatalog] = useState<PlanRecord[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Plan hierarchy for upgrade checks
  const getPlanLevel = (plan: string): number => {
    const levels: Record<string, number> = {
      free: 0,
      general_pass: 1,
      tech_basic: 2,
      tech_pro: 3,
      premium: 3,
      enterprise: 4,
    };
    return levels[plan] ?? 0;
  };

  const getNextPlan = (currentPlan: string): string | null => {
    if (currentPlan === "free") return "general_pass";
    if (currentPlan === "general_pass") return "tech_basic";
    if (currentPlan === "tech_basic") return "tech_pro";
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

      if (!planId || !isPaidPlanId(planId)) {
        router.push("/pricing");
        return;
      }

      try {
        setCatalogError(null);
        const catalog = await planApi.getAllPlans();
        setPlanCatalog(catalog);
        const planRecord = catalog.find((p) => p.planId === planId);
        if (!planRecord) {
          setCatalogError(
            "This plan is not available. Please choose another from pricing.",
          );
          setSelectedPlan(null);
          return;
        }
        setSelectedPlan(planRecord);

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
    if (!planId || !user || samePlanError || !selectedPlan) return;

    setLoading(true);
    setError(null);

    try {
      const order = await paymentApi.createOrder(
        planId as SelfServePlanSlug,
        billingCycle,
      );
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
          description: `${selectedPlan.name} Plan - ${selectedPlan.creditsIncluded[billingCycle]} credits (${billingCycle} billing)`,
          prefill: {
            name: user.fullName || user.firstName || "",
            email: user.primaryEmailAddress?.emailAddress || "",
          },
          theme: {
            color: "#2563EB",
          },
          handler: async function (response: any) {
            try {
              console.log("✅ Subscription payment authorized:", response);
              let activationStatus: string = "pending";
              if (response.razorpay_payment_id) {
                const result = await paymentApi.verifyPayment(
                  order.orderId,
                  response.razorpay_payment_id,
                  response.razorpay_signature || "",
                );
                console.log("✅ Subscription checkout result:", result);
                activationStatus =
                  result.activationStatus ??
                  (result.subscription?.activationState === "active"
                    ? "active"
                    : "pending");
              }
              if (activationStatus === "active") {
                router.push("/dashboard?payment=success&type=subscription");
              } else {
                router.push("/dashboard/plan?payment=processing");
              }
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
          description: `${selectedPlan.name} Plan - ${selectedPlan.creditsIncluded[billingCycle]} credits`,
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
            color: "#2563EB",
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (catalogError || !selectedPlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <p className="text-gray-700 mb-4 text-center max-w-md">
          {catalogError ?? "Unable to load plan."}
        </p>
        <Link href="/pricing">
          <Button variant="outline">Back to pricing</Button>
        </Link>
      </div>
    );
  }

  const plan = selectedPlan;
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

      <div className="relative min-h-screen scroll-smooth bg-background selection:bg-info-muted">
        <SiteHeader />

        <div className="container relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-24 sm:pt-28 lg:pt-32">
          <PageHeader
            title="Complete your purchase"
            description="Review your plan and pay securely with Razorpay. Credits apply to your account after successful payment."
          />
          <Card className={cn(appCard, "mt-8 p-8 shadow-header")}>
            <div className="mb-8 p-6 bg-card rounded-lg border border-border">
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
                    <span className="text-2xl font-bold text-primary">
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
                      <Button className="w-full mt-3">
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
              <div className="mb-4 p-3 bg-muted border border-border rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Loading payment gateway...</p>
                </div>
              </div>
            )}
            <Button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded || !!samePlanError}
              size="lg"
              className="w-full py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-xs text-muted-foreground text-center mt-2 px-2">
              Card payments usually activate your plan instantly. UPI AutoPay
              may take until the bank confirms the first debit (often same day,
              sometimes the next day).
            </p>
          </Card>

          {/* Features Reminder */}
          <Card className={cn(appCard, "mt-6 p-6 shadow-header")}>
            <h3 className="font-semibold text-lg mb-4 text-gray-900">
              What you'll get:
            </h3>
            <ul className="space-y-2">
              {highlightLines.slice(0, 4).map((highlight, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Check className="h-5 w-5 shrink-0 text-primary" />
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
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
