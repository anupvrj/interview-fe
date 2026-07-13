"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Crown,
  Loader2,
  Sparkles,
  ArrowRight,
  Calendar,
  Coins,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Shield,
  TrendingUp,
} from "lucide-react";
import { paymentApi, planApi, CreditBalance } from "@/lib/api";
import { usePendingSubscriptionPolling } from "@/hooks/usePendingSubscriptionPolling";
import { cn, formatDate } from "@/lib/utils";
import {
  getNextPlanId,
  isHighestSelfServePlan,
  normalizeSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/lib/subscriptionPlans";
import { SubscriptionRenewalGate } from "@/components/SubscriptionRenewalGate";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";

interface Plan {
  _id: string;
  planId: string;
  name: string;
  displayName: string;
  features: any;
  pricing: any;
  creditsIncluded: any;
}

interface NextPlanDisplay {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export default function PlanPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const {
    subscription,
    activationState,
    isPolling,
    pollTimedOut,
    refresh: refreshSubscription,
  } = usePendingSubscriptionPolling({ silent: true });
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(
    null,
  );
  const [customCreditAmount, setCustomCreditAmount] = useState<string>("");
  const [creditAmountError, setCreditAmountError] = useState<string>("");
  const [purchasingCredits, setPurchasingCredits] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reactivatingSubscription, setReactivatingSubscription] =
    useState(false);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (isLoaded && user) {
      Promise.all([refreshSubscription(), loadPlans(), loadCreditBalance()]).finally(
        () => setLoading(false),
      );
    }
  }, [isLoaded, user, refreshSubscription]);

  useEffect(() => {
    if (searchParams.get("payment") === "processing") {
      toast.info("Autopay authorized", {
        description:
          "Your plan activates automatically once Razorpay captures the subscription payment (usually within minutes; UPI may take until the next day).",
        duration: 8000,
      });
    }
  }, [searchParams]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      await refreshSubscription();
      await loadCreditBalance();
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditBalance = async () => {
    try {
      const balance = await paymentApi.getCreditBalance();
      setCreditBalance(balance);
    } catch (error) {
      console.error("Error loading credit balance:", error);
    }
  };

  const loadPlans = async () => {
    try {
      const plans = await planApi.getAllPlans();
      setAllPlans(plans);
    } catch (error) {
      console.error("Error loading plans:", error);
    }
  };

  const handleCreditAmountChange = (value: string) => {
    setCustomCreditAmount(value);

    // Validate in real-time
    if (value === "") {
      setCreditAmountError("");
      return;
    }

    const amount = Number.parseInt(value);
    if (isNaN(amount) || amount < 1) {
      setCreditAmountError("Please enter a valid number");
    } else if (amount < 300) {
      setCreditAmountError("Minimum purchase is 300 credits (₹300)");
    } else {
      setCreditAmountError("");
    }
  };

  const handlePurchaseCredits = async () => {
    const amount = Number.parseInt(customCreditAmount);
    if (!amount || amount < 300) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid credit amount (minimum 300 credits)",
      });
      return;
    }

    try {
      setPurchasingCredits(true);
      const order = await paymentApi.purchaseCredits(amount);

      // Open Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "AI Interview Platform",
        description: `Purchase ${amount} credits`,
        order_id: order.orderId,
        callback_url: undefined,
        redirect: false,
        handler: async function (response: any) {
          try {
            // For UPI and some payment methods in test mode, only payment_id is returned
            const orderId = response.razorpay_order_id || order.orderId;
            const paymentId = response.razorpay_payment_id;
            const signature = response.razorpay_signature || "";

            if (!orderId || !paymentId) {
              throw new Error("Invalid payment response from Razorpay");
            }

            await paymentApi.verifyPayment(orderId, paymentId, signature);
            toast.success("Credits Purchased!", {
              description: `Successfully added ${amount} credits to your account`,
            });
            setCustomCreditAmount("");
            loadCreditBalance();
            loadSubscription();
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment Failed", {
              description:
                "Payment verification failed. Please contact support.",
            });
          }
        },
        prefill: {
          email: user?.primaryEmailAddress?.emailAddress,
          name: user?.fullName || "",
        },
        notes: {
          credits: amount.toString(),
          type: "credit_purchase",
        },
        theme: {
          color: "#7367F0",
        },
        modal: {
          ondismiss: function () {
            setPurchasingCredits(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast.error("Purchase Failed", {
        description: "Failed to initiate credit purchase. Please try again.",
      });
    } finally {
      setPurchasingCredits(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancellingSubscription(true);
      await paymentApi.cancelSubscription();
      toast.success("Subscription Cancelled", {
        description:
          "Your subscription has been cancelled successfully. You'll keep access until the end of your current billing period.",
        duration: 5000,
      });
      setShowCancelConfirm(false);
      loadSubscription();
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      const apiMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to cancel subscription. Please try again.";
      toast.error("Cancellation Failed", {
        description: apiMessage,
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setReactivatingSubscription(true);
      await paymentApi.reactivateSubscription();
      toast.success("Subscription Reactivated!", {
        description:
          "Your subscription has been reactivated. Auto-renewal is now enabled.",
        duration: 5000,
      });
      loadSubscription();
    } catch (error: any) {
      console.error("Error reactivating subscription:", error);
      toast.error("Reactivation Failed", {
        description:
          error.message ||
          "Failed to reactivate subscription. Please try again.",
      });
    } finally {
      setReactivatingSubscription(false);
    }
  };

  const getNextPlan = (
    currentPlan: SubscriptionPlanId,
  ): NextPlanDisplay | null => {
    if (!allPlans || allPlans.length === 0) return null;

    const nextPlanId = getNextPlanId(currentPlan);
    if (!nextPlanId) return null;

    const nextPlan = allPlans.find((p) => p.planId === nextPlanId);

    if (!nextPlan) return null;

    // Generate features list from plan data
    const features: string[] = [];

    if (nextPlan.features.freeInterviews) {
      features.push(
        `${nextPlan.features.freeInterviews.count} free ${nextPlan.features.freeInterviews.duration}-min interviews`,
      );
    }

    if (nextPlan.features.additionalInterviews) {
      features.push(
        `${nextPlan.features.additionalInterviews.count} additional ${nextPlan.features.additionalInterviews.duration}-min interviews`,
      );
    }

    if (nextPlan.features.resumeBuilder?.enabled) {
      features.push("Resume Builder Pro");
    }

    if (nextPlan.features.atsScoring?.detailed) {
      features.push("Detailed ATS score");
    }

    if (nextPlan.features.behavioralAnalysis) {
      features.push("Behavioral analysis");
    }

    if (nextPlan.features.customQuestions) {
      features.push("Custom interview questions");
    }

    if (nextPlan.features.prioritySupport) {
      features.push("Priority support");
    }

    if (nextPlan.features.realInterviews) {
      features.push(
        `${nextPlan.features.realInterviews.count} real interviews with top engineers`,
      );
    }

    return {
      id: nextPlan.planId,
      name: nextPlan.displayName,
      price: nextPlan.pricing.monthly,
      features,
    };
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-sm text-muted-foreground">
            Loading your plan details…
          </p>
        </div>
      </div>
    );
  }

  const isExpired =
    subscription?.isExpired === true ||
    subscription?.needsRenewal === true ||
    subscription?.status === "expired" ||
    !!subscription?.expiredPlanId;

  if (isExpired) {
    return (
      <SubscriptionRenewalGate expiredOn={subscription?.currentPeriodEnd} />
    );
  }

  const normalizedPlan = normalizeSubscriptionPlan(subscription?.plan);
  const isTrialPlan = normalizedPlan === "trial";
  const currentPlanRecord = allPlans.find((p) => p.planId === normalizedPlan);
  const isPendingActivation = activationState === "pending";
  const isFailedActivation = activationState === "failed";
  const pendingPlanName =
    subscription?.pendingPayment?.planDisplayName ||
    subscription?.pendingPayment?.plan ||
    "Your plan";
  const planName = isPendingActivation
    ? `Activating ${pendingPlanName}`
    : isTrialPlan
      ? "Trial Pass"
      : normalizedPlan === "free"
        ? "Free tier"
        : currentPlanRecord?.displayName || currentPlanRecord?.name || "Your plan";

  const nextPlan = isTrialPlan
    ? getNextPlan("free")
    : getNextPlan(normalizedPlan);
  const isPaidPlan =
    normalizedPlan !== "free" && !isPendingActivation && !isTrialPlan;
  const displayCredits =
    creditBalance?.available ?? subscription?.creditsAvailable ?? 0;
  const monthlyCredits = isTrialPlan
    ? 200
    : (currentPlanRecord?.creditsIncluded?.monthly ?? 0);
  const creditProgress =
    monthlyCredits > 0
      ? Math.min(100, (displayCredits / monthlyCredits) * 100)
      : undefined;
  const statusLabel = isPendingActivation
    ? isPolling
      ? "Processing payment…"
      : "Awaiting payment"
    : isFailedActivation
      ? "Payment failed"
      : isTrialPlan
        ? "Trial active"
      : subscription?.status === "cancelled"
        ? "Cancelled"
        : isPaidPlan
          ? "Active"
          : "Free tier";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-[#7367F0]/10 bg-gradient-to-br from-[#7367F0]/[0.06] via-card to-[#7367F0]/[0.04] px-4 py-6 sm:px-6 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#7367F0]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl"
        />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7367F0]/20 bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0] sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Plan &amp; billing
          </div>
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Subscription &amp;{" "}
              <span className="text-[#7367F0]">credits</span>
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Manage your plan, track interview credits, and top up when you
              need more runway for AI practice, coding rounds, and reports.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 pt-1">
            {[
              "5 credits / minute",
              "Monthly plan credits",
              "One-click top-up",
            ].map((pill) => (
              <li
                key={pill}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                <CheckCircle className="h-3 w-3 text-[#7367F0]" />
                {pill}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {isPendingActivation && subscription?.pendingPayment ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 text-sm text-amber-900 dark:text-amber-100">
          <div className="flex items-start gap-3">
            {isPolling ? (
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="font-semibold">Payment processing</p>
              <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                UPI AutoPay is set up for ₹
                {subscription.pendingPayment.amount.toLocaleString()}. Paid plan
                features unlock when Razorpay captures the charge — keep
                sufficient balance and do not cancel the mandate in GPay.
                {pollTimedOut
                  ? " If this takes longer than expected, contact support."
                  : " Checking automatically every few seconds…"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isFailedActivation ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-destructive">
                Subscription payment could not be completed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                AutoPay was cancelled or the bank did not confirm the payment.
                You are on the free tier until checkout succeeds.
              </p>
            </div>
            <Link
              href={`/checkout?plan=${subscription?.failedPayment?.plan || subscription?.pendingPayment?.plan || "tech_basic"}`}
              className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
            >
              Complete payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <DashboardStatCard
          theme="violet"
          label="Current plan"
          value={planName}
          hint={
            isPaidPlan && subscription?.autoRenew
              ? "Auto-renew on"
              : isPaidPlan
                ? "Auto-renew off"
                : "Upgrade anytime"
          }
          icon={Crown}
        />
        <DashboardStatCard
          theme="emerald"
          label="Credits available"
          value={displayCredits.toLocaleString()}
          hint="5 credits per interview minute"
          icon={Coins}
          progress={creditProgress}
        />
        <DashboardStatCard
          theme="sky"
          label={
            isPaidPlan && subscription?.currentPeriodEnd
              ? "Next renewal"
              : "Status"
          }
          value={
            isPaidPlan && subscription?.currentPeriodEnd
              ? formatDate(subscription.currentPeriodEnd)
              : statusLabel
          }
          hint={
            subscription?.status === "cancelled"
              ? "Access until period ends"
              : isPaidPlan
                ? "Billing period"
                : "No active subscription"
          }
          icon={Calendar}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
        {/* Subscription */}
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card lg:col-span-3">
          <CardHeader className="border-b border-border/60 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#7367F0]/15 bg-[#7367F0]/10 text-[#7367F0]">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Your subscription
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-sm">
                    {isPaidPlan
                      ? "Paid plan — interview sessions and monthly credits"
                      : "Free tier — purchase a plan or credits to unlock more"}
                  </CardDescription>
                </div>
              </div>
              {isPaidPlan ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {statusLabel}
                </span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "30-min session", value: "150 credits" },
                { label: "60-min session", value: "300 credits" },
                { label: "Min. to start", value: "150 credits" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            {creditBalance ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <span>
                  Lifetime used:{" "}
                  <strong className="font-semibold text-foreground">
                    {creditBalance.used.toLocaleString()}
                  </strong>
                </span>
                <span className="hidden h-4 w-px bg-border sm:inline" />
                <span>
                  Wallet total:{" "}
                  <strong className="font-semibold text-foreground">
                    {creditBalance.total.toLocaleString()}
                  </strong>
                </span>
              </div>
            ) : null}

            {isPaidPlan &&
              subscription?.status === "active" &&
              subscription?.autoRenew && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  {!showCancelConfirm ? (
                    <>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            Cancel subscription
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Stop auto-renewal. You keep access and credits until
                            the current period ends.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full border-destructive/30 text-destructive hover:bg-destructive/10 sm:w-auto"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel subscription
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        Cancel auto-renewal?
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          onClick={handleCancelSubscription}
                          disabled={cancellingSubscription}
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                        >
                          {cancellingSubscription ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cancelling…
                            </>
                          ) : (
                            "Yes, cancel"
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Keep plan
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

            {isPaidPlan &&
              subscription?.status === "cancelled" &&
              subscription?.currentPeriodEnd &&
              new Date(subscription.currentPeriodEnd) > new Date() && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Reactivate subscription
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Access until{" "}
                        <span className="font-medium text-foreground">
                          {formatDate(subscription.currentPeriodEnd)}
                        </span>
                        . Turn auto-renewal back on to continue uninterrupted.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleReactivateSubscription}
                    disabled={reactivatingSubscription}
                    size="sm"
                    className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    {reactivatingSubscription ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reactivating…
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Reactivate now
                      </>
                    )}
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Credits purchase */}
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card lg:col-span-2">
          <CardHeader className="border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Top up credits
                </CardTitle>
                <CardDescription className="mt-0.5 text-sm">
                  1 credit = ₹1 · minimum 300 credits
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="rounded-xl border border-[#7367F0]/15 bg-gradient-to-br from-[#7367F0]/[0.06] to-transparent p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7367F0]">
                Available balance
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                {displayCredits.toLocaleString()}
              </p>
              {creditBalance ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {creditBalance.used.toLocaleString()} used lifetime
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="credit-amount">Credit amount</Label>
                <Input
                  id="credit-amount"
                  type="number"
                  placeholder="e.g. 500 (min 300)"
                  value={customCreditAmount}
                  onChange={(e) => handleCreditAmountChange(e.target.value)}
                  min="300"
                  step="50"
                  className={cn(
                    "h-11 w-full text-base",
                    creditAmountError &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
              </div>
              {creditAmountError ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {creditAmountError}
                </p>
              ) : customCreditAmount ? (
                <p className="text-sm text-muted-foreground">
                  You pay{" "}
                  <span className="font-semibold text-foreground">
                    ₹{Number.parseInt(customCreditAmount) || 0}
                  </span>
                </p>
              ) : null}

              <Button
                type="button"
                onClick={handlePurchaseCredits}
                disabled={
                  purchasingCredits ||
                  !customCreditAmount ||
                  !!creditAmountError
                }
                size="lg"
                className={cn(
                  "h-11 w-full shadow-lg transition-all hover:shadow-xl",
                  institutePrimaryClass,
                )}
              >
                {purchasingCredits ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-5 w-5" />
                    Buy credits
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA */}
      {nextPlan && !isHighestSelfServePlan(normalizedPlan) && (
        <Card className="overflow-hidden rounded-xl border border-[#7367F0]/20 bg-gradient-to-r from-[#7367F0]/[0.08] via-card to-violet-500/[0.06] shadow-card">
          <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7367F0] text-white shadow-lg shadow-[#7367F0]/25">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground sm:text-lg">
                  Upgrade to {nextPlan.name}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  From ₹{nextPlan.price}/mo — more sessions, coding rounds, and
                  system design allotments.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ size: "lg" }),
                institutePrimaryClass,
                "w-full shrink-0 shadow-lg sm:w-auto",
              )}
            >
              View all plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {isHighestSelfServePlan(normalizedPlan) && (
        <Card className="overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.08] to-card shadow-card">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground sm:text-lg">
                You&apos;re on our highest plan
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tech Pro includes the fullest session allotments and priority
                support. Thank you for being a valued member.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
