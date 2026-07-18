"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  Check,
  X,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Coins,
  Calendar,
  Shield,
  Sparkles,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi, planApi, Subscription } from "@/lib/api";
import type { PlanRecord } from "@/lib/planRecord";
import { getPlanMarketingHighlights } from "@/lib/planHighlightsFromFeatures";
import Script from "next/script";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import {
  appCardElevated,
  appPrimaryButton,
  appSurfaceMuted,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  isCheckoutPlanId,
  PLAN_COLUMN_LABELS,
  type CheckoutPlanId,
  type PaidPlanId,
} from "@/lib/pricingPageContent";
import {
  getMarketingPlanGradient,
  getMarketingPlanIcon,
} from "@/lib/planMarketingDisplay";
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
  const planId = searchParams.get("plan") as CheckoutPlanId | null;
  const isTrialCheckout = planId === "trial";
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
    if (planId === "trial") {
      router.replace("/dashboard?trial_offer=1");
      return;
    }
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

      if (!planId || !isCheckoutPlanId(planId)) {
        router.push("/pricing");
        return;
      }

      try {
        setCatalogError(null);
        let planRecord: PlanRecord | null = null;
        if (isTrialCheckout) {
          planRecord = await planApi.getPlanById("trial");
        } else {
          const catalog = await planApi.getAllPlans();
          setPlanCatalog(catalog);
          planRecord = catalog.find((p) => p.planId === planId) ?? null;
        }
        if (!planRecord) {
          setCatalogError(
            "This plan is not available. Please choose another from pricing.",
          );
          setSelectedPlan(null);
          return;
        }
        setSelectedPlan(planRecord);

        if (isTrialCheckout) {
          setSamePlanError(null);
          return;
        }

        const catalog = planCatalog.length
          ? planCatalog
          : await planApi.getAllPlans();
        if (!planCatalog.length) setPlanCatalog(catalog);

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
      const order = isTrialCheckout
        ? await paymentApi.createTrialOrder()
        : await paymentApi.createOrder(
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
      if (order.subscriptionId && !isTrialCheckout) {
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
            color: "#7367F0",
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
          description: isTrialCheckout
            ? "Trial Pass — 200 credits for 14 days"
            : `${selectedPlan.name} Plan - ${selectedPlan.creditsIncluded[billingCycle]} credits`,
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

              router.push(
                isTrialCheckout
                  ? "/dashboard/plan?payment=success&type=trial"
                  : "/dashboard?payment=success",
              );
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
            color: "#7367F0",
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
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (catalogError || !selectedPlan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className={cn(appCardElevated, "max-w-md p-8 text-center")}>
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-[#7367F0]" />
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            {catalogError ?? "Unable to load plan."}
          </p>
          <Button variant="outline" asChild>
            <Link href="/pricing">Back to pricing</Link>
          </Button>
        </div>
      </div>
    );
  }

  const plan = selectedPlan;
  const planPrice = plan.pricing[billingCycle];
  const planCredits = plan.creditsIncluded[billingCycle];
  const highlightLines = getPlanMarketingHighlights(plan);
  const PlanIcon = getMarketingPlanIcon(plan.planId, plan.icon);
  const planGradient = getMarketingPlanGradient(plan.planId);
  const planLabel =
    PLAN_COLUMN_LABELS[plan.planId as PaidPlanId] ??
    plan.displayName ??
    plan.name;
  const billingLabel =
    billingCycle === "monthly"
      ? "Monthly"
      : billingCycle === "quarterly"
        ? "Quarterly"
        : "Yearly";

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Razorpay SDK loaded");
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

      <div className="relative min-h-screen scroll-smooth bg-background selection:bg-[#7367F0]/20">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(115,103,240,0.08),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.06),transparent_38%)]"
        />
        <SiteHeader />

        <div className="container relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-24 sm:pt-28 lg:pt-32">
          <Button
            variant="ghost"
            asChild
            className="-ml-2 mb-6 text-muted-foreground hover:text-foreground"
          >
            <Link href="/pricing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to pricing
            </Link>
          </Button>

          <div className="space-y-4">
            <div className={cn(appCardElevated, "overflow-hidden")}>
              <div className="relative overflow-hidden border-b border-border/60 px-5 py-6 sm:px-6">
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#7367F0]/15 via-transparent to-transparent"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#7367F0]/15 blur-3xl"
                  aria-hidden
                />

                <div className="relative space-y-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7367F0]/25 bg-[#7367F0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7367F0]">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Secure checkout
                  </span>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                          planGradient,
                        )}
                      >
                        <PlanIcon className="h-7 w-7" aria-hidden />
                      </span>
                      <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                          Complete your purchase
                        </h1>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Review your plan and pay securely with Razorpay.
                          Credits apply after successful payment.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <CheckoutStatPill icon={PlanIcon} label={planLabel} />
                    <CheckoutStatPill
                      icon={Coins}
                      label={`${planCredits.toLocaleString()} credits`}
                    />
                    <CheckoutStatPill icon={Calendar} label={billingLabel} />
                    <CheckoutStatPill icon={Shield} label="Razorpay secure" />
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-5 py-6 sm:px-6">
                <div className="rounded-2xl border border-[#7367F0]/15 bg-[#7367F0]/[0.04] p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Order summary
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-semibold text-foreground">
                        {plan.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Credits</span>
                      <span className="font-semibold text-foreground">
                        {planCredits.toLocaleString()} credits
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Billing</span>
                      <span className="font-semibold text-foreground">
                        {billingLabel}
                      </span>
                    </div>
                    <div className="border-t border-border/60 pt-3">
                      <div className="flex items-end justify-between gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Total due today
                        </span>
                        <span className="text-3xl font-bold tracking-tight text-[#7367F0]">
                          ₹{planPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {samePlanError ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          Already subscribed
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {samePlanError}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      {currentSubscription &&
                      getNextPlan(currentSubscription.plan) ? (
                        <Button className={cn("flex-1", appPrimaryButton)} asChild>
                          <Link
                            href={`/checkout?plan=${getNextPlan(currentSubscription.plan)}`}
                          >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            Upgrade to{" "}
                            {planCatalog.find(
                              (p) =>
                                p.planId ===
                                getNextPlan(currentSubscription.plan),
                            )?.name ?? "Next Plan"}
                          </Link>
                        </Button>
                      ) : null}
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href="/dashboard">Go to dashboard</Link>
                      </Button>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                {!razorpayLoaded ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-[#7367F0]" />
                    Loading payment gateway…
                  </div>
                ) : null}

                <Button
                  onClick={handlePayment}
                  disabled={loading || !razorpayLoaded || !!samePlanError}
                  size="lg"
                  className={cn(
                    "h-12 w-full text-base font-semibold shadow-lg shadow-[#7367F0]/20 disabled:cursor-not-allowed disabled:opacity-50",
                    appPrimaryButton,
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing…
                    </>
                  ) : !razorpayLoaded ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      Pay ₹{planPrice.toLocaleString()} now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" aria-hidden />
                  <span>Secure payment powered by Razorpay</span>
                </div>
              </div>
            </div>

            <div className={cn(appCardElevated, "overflow-hidden")}>
              <div className="border-b border-border/60 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-foreground">
                  What&apos;s included
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Everything you unlock with {planLabel}
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 p-5 sm:grid-cols-2 sm:p-6">
                {highlightLines.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check
                        className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </span>
                    <span className="font-medium text-foreground/90">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(appSurfaceMuted, "px-4 py-3.5 text-center sm:px-5")}>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Card payments usually activate your plan instantly. UPI AutoPay
                may take until the bank confirms the first debit — often same
                day, sometimes the next day.
              </p>
            </div>
          </div>
        </div>

        <MarketingFooter as="footer" className="relative z-10" />
      </div>
    </>
  );
}

function CheckoutStatPill({
  icon: Icon,
  label,
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}>) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7367F0]/15 bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
      <Icon className="h-3.5 w-3.5 text-[#7367F0]" aria-hidden />
      {label}
    </span>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
