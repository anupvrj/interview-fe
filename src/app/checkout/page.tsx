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
  Shield,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  couponApi,
  paymentApi,
  planApi,
  affiliateApi,
  Subscription,
  type AppliedCoupon,
} from "@/lib/api";
import { CheckoutCouponField } from "@/components/checkout/CheckoutCouponField";
import { getStoredReferralCode, rememberReferralCode } from "@/lib/affiliate-cookies";
import { apiErrorMessage } from "@/lib/api-errors";
import type { PlanRecord } from "@/lib/planRecord";
import { getPlanMarketingHighlights } from "@/lib/planHighlightsFromFeatures";
import Script from "next/script";
import Link from "next/link";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { Footer } from "@/components/marketing-2026/closing";
import { Emblem, type EmblemKind, Index, Mono } from "@/components/marketing-2026/primitives";
import { Blueprint, HL, INK, WRAP } from "@/components/marketing-2026/landing-kit";
import { cn } from "@/lib/utils";
import {
  isCheckoutPlanId,
  PLAN_COLUMN_LABELS,
  type CheckoutPlanId,
  type PaidPlanId,
} from "@/lib/pricingPageContent";
import type { SelfServePlanSlug } from "@/lib/api";

/** Same emblem each plan wears on the pricing page. */
const PLAN_EMBLEM: Record<string, EmblemKind> = { general_pass: "voice", tech_basic: "code", tech_pro: "layers", enterprise: "seats", free: "spark" };

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
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState(0);

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
    setAppliedCoupon(null);
    setCouponInput("");
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

  useEffect(() => {
    if (
      !isLoaded ||
      !user ||
      !planId ||
      isTrialCheckout ||
      !isCheckoutPlanId(planId) ||
      !!samePlanError
    ) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const result = await couponApi.apply({
          plan: planId,
          billingCycle,
        });
        if (cancelled || !result.applied) return;
        setAppliedCoupon(result);
        setCouponInput(result.code);
      } catch {
        // No welcome coupon, or user is ineligible — stay silent.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, planId, billingCycle, isTrialCheckout, samePlanError]);

  useEffect(() => {
    const fromQuery = searchParams.get("ref");
    if (fromQuery) rememberReferralCode(fromQuery);
    const stored = getStoredReferralCode();
    setReferralCode(stored);
    if (!stored || isTrialCheckout) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await affiliateApi.stats();
        if (!cancelled) {
          setReferralDiscountPercent(data.referralDiscountPercent || 0);
        }
      } catch {
        setReferralDiscountPercent(10);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, isTrialCheckout]);

  const handleApplyCoupon = async () => {
    if (!planId || isTrialCheckout) return;
    const code = couponInput.trim();
    if (!code) return;
    setApplyingCoupon(true);
    try {
      const result = await couponApi.apply({
        code,
        plan: planId,
        billingCycle,
      });
      if (!result.applied) {
        toast.error("This coupon could not be applied");
        return;
      }
      setAppliedCoupon(result);
      toast.success(result.message);
    } catch (err) {
      toast.error(apiErrorMessage(err, "This coupon could not be applied"));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

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
            appliedCoupon?.code,
            referralCode || undefined,
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
      <Marketing2026Shell>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Marketing2026Shell>
    );
  }

  if (catalogError || !selectedPlan) {
    return (
      <Marketing2026Shell>
        <Nav />
        <main className="relative flex min-h-screen items-center justify-center overflow-clip px-5 pt-20">
          <Blueprint />
          <div className="relative max-w-md rounded-[22px] border border-[#E7E6F2] bg-white p-8 text-center shadow-[0_30px_70px_-40px_rgba(47,43,61,.45)] dark:border-border dark:bg-card">
            <Mono className="text-[11px] text-primary">— CHECKOUT —</Mono>
            <p className={cn("mt-3 text-[22px] font-extrabold tracking-[-0.03em] dark:text-foreground", INK)}>That plan didn&apos;t load.</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{catalogError ?? "Unable to load plan."}</p>
            <Button asChild className="mt-6 h-11 rounded-xl px-5">
              <Link href="/pricing">Back to pricing</Link>
            </Button>
          </div>
        </main>
      </Marketing2026Shell>
    );
  }

  const plan = selectedPlan;
  const planPrice = plan.pricing[billingCycle];
  const couponPercent = appliedCoupon?.discountPercent ?? 0;
  const referralApplies =
    !isTrialCheckout &&
    Boolean(referralCode) &&
    referralDiscountPercent > couponPercent;
  const dueToday = appliedCoupon
    ? appliedCoupon.finalAmount
    : referralApplies
      ? Math.round((planPrice * (100 - referralDiscountPercent)) / 100)
      : planPrice;
  const hasIntroDiscount = dueToday < planPrice;
  const planCredits = plan.creditsIncluded[billingCycle];
  // the credits line already sits in the pill above the list
  const includedLines = getPlanMarketingHighlights(plan).filter((h) => !/^\d[\d,]*\s*(monthly\s+)?credits?\b/i.test(h));
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
    <Marketing2026Shell>
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

      <Nav />
      <main>
        <section className="relative overflow-clip pb-20 pt-28 md:pb-28 md:pt-40">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_50%_20%,rgba(115,103,240,.16),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_80%)]" />
          <Blueprint />
          <div className={WRAP}>
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back to pricing
            </Link>

            <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
              <div>
                <Index n="01" label="Checkout" />
                <h1 className={cn("text-[38px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[48px] md:text-[60px]", INK)}>
                  You&apos;re one step from <span className={HL}>{planLabel}</span>.
                </h1>
                <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[#4B5275] md:text-[18px]">
                  Review your plan and pay securely with Razorpay. Credits are added to your account after the payment succeeds.
                </p>

                <div className="relative mt-9 overflow-hidden rounded-2xl border border-primary bg-[#0D1F36] shadow-[0_0_0_1px_hsl(var(--primary)),0_30px_60px_-30px_rgba(115,103,240,.75)]">
                  <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_45%_at_40%_0%,rgba(115,103,240,.28),transparent_70%)]" />
                  <div className="relative p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-3">
                      <Emblem kind={PLAN_EMBLEM[plan.planId] ?? "spark"} glow />
                      <Mono className="rounded-md bg-primary px-2 py-0.5 text-[10.5px] text-white">{billingLabel.toUpperCase()}</Mono>
                    </div>
                    <Mono className="mt-5 block text-[11px] text-[#6E86A8]">PASS · {isTrialCheckout ? "14 DAYS" : billingLabel.toUpperCase()}</Mono>
                    <h2 className="mt-1 text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-white">{plan.displayName || plan.name}</h2>
                    {plan.description ? <p className="mt-2 max-w-[52ch] text-[14.5px] leading-snug text-[#9FB3CF]">{plan.description}</p> : null}
                    <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/25 px-3 py-1.5 text-[13px] font-semibold text-white">
                      <Coins className="size-3.5" />
                      {planCredits.toLocaleString("en-IN")} credits
                    </span>
                    {includedLines.length > 0 && (
                      <ul className="mt-6 grid gap-x-6 gap-y-2.5 border-t border-dashed border-[#1B3C62] pt-5 sm:grid-cols-2">
                        {includedLines.map((line) => (
                          <li key={line} className="flex items-start gap-2.5 text-[14px] leading-snug text-[#CFE0F7]">
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-sky-400/15 text-sky-300"><Check className="size-3" /></span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <p className="mt-5 max-w-[60ch] text-[13.5px] leading-relaxed text-muted-foreground">
                  Card payments usually activate your plan instantly. UPI AutoPay may take until the bank confirms the first debit — often same day, sometimes the next day.
                </p>
              </div>

              <div className="lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-[22px] border border-[#E7E6F2] bg-white shadow-[0_30px_70px_-40px_rgba(47,43,61,.45)] dark:border-border dark:bg-card">
                  <div className="border-b border-[#E7E6F2] px-6 py-5 dark:border-border">
                    <Mono className="text-[11px] text-primary">— ORDER SUMMARY —</Mono>
                    <p className={cn("mt-2 text-[20px] font-extrabold tracking-[-0.03em] dark:text-foreground", INK)}>{plan.name}</p>
                  </div>

                  <div className="space-y-5 px-6 py-5">
                    <dl className="space-y-2.5 text-[14px]">
                      {([
                        ["Plan", planLabel],
                        ["Credits", `${planCredits.toLocaleString("en-IN")}`],
                        ["Billing", billingLabel],
                      ] as const).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="font-semibold text-foreground">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    {!isTrialCheckout ? (
                      <CheckoutCouponField
                        inputValue={couponInput}
                        onInputChange={setCouponInput}
                        onApply={() => void handleApplyCoupon()}
                        onClear={handleClearCoupon}
                        applying={applyingCoupon}
                        applied={appliedCoupon}
                      />
                    ) : null}
                    {!isTrialCheckout && referralApplies ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2.5 text-[13.5px] text-emerald-700 dark:text-emerald-300">
                        {referralDiscountPercent}% referral discount applied — first month only
                      </div>
                    ) : null}

                    <div className="border-t border-dashed border-[#E7E6F2] pt-5 dark:border-border">
                      <div className="flex items-end justify-between gap-3">
                        <Mono className="pb-1.5 text-[11px] text-muted-foreground">TOTAL DUE TODAY</Mono>
                        <span className="text-right">
                          {hasIntroDiscount ? (
                            <span className="mr-2 text-[16px] font-medium text-muted-foreground line-through">₹{planPrice.toLocaleString("en-IN")}</span>
                          ) : null}
                          <span className={cn("text-[40px] font-black leading-none tracking-[-0.04em] tabular-nums dark:text-foreground", INK)}>
                            ₹{dueToday.toLocaleString("en-IN")}
                          </span>
                        </span>
                      </div>
                      {hasIntroDiscount ? (
                        <p className="mt-2 text-[12.5px] text-muted-foreground">
                          Recurring months bill at the full list price of ₹{planPrice.toLocaleString("en-IN")}.
                        </p>
                      ) : null}
                    </div>

                    {samePlanError ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">Already subscribed</p>
                            <p className="mt-1 text-[13.5px] text-muted-foreground">{samePlanError}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                          {currentSubscription && getNextPlan(currentSubscription.plan) ? (
                            <Button className="h-11 rounded-xl" asChild>
                              <Link href={`/checkout?plan=${getNextPlan(currentSubscription.plan)}`}>
                                <ArrowUp className="mr-1.5 h-4 w-4" />
                                Upgrade to{" "}
                                {planCatalog.find((p) => p.planId === getNextPlan(currentSubscription.plan))?.name ?? "Next Plan"}
                              </Link>
                            </Button>
                          ) : null}
                          <Button variant="outline" className="h-11 rounded-xl" asChild>
                            <Link href="/dashboard">Go to dashboard</Link>
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] text-destructive">
                        <X className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    ) : null}

                    <Button
                      onClick={handlePayment}
                      disabled={loading || !razorpayLoaded || !!samePlanError}
                      className="h-[52px] w-full rounded-xl text-[15.5px] font-semibold shadow-[0_14px_34px_-12px_rgba(115,103,240,.8)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing…</>
                      ) : !razorpayLoaded ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading payment gateway…</>
                      ) : (
                        <>Pay ₹{dueToday.toLocaleString("en-IN")} now<ArrowRight className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-[#E7E6F2] border-t border-[#E7E6F2] bg-[#F8F8FB] text-center dark:divide-border dark:border-border dark:bg-muted/30">
                    {([
                      [Shield, "RAZORPAY SECURE"],
                      [CreditCard, "UPI · CARDS"],
                      [Coins, "NETBANKING · WALLETS"],
                    ] as const).map(([Icon, label]) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 px-2 py-3.5">
                        <Icon className="size-4 text-primary" />
                        <Mono className="text-[9.5px] leading-tight text-muted-foreground">{label}</Mono>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Marketing2026Shell>
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
