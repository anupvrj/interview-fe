"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Crown,
  Loader2,
  ArrowRight,
  Coins,
  XCircle,
  AlertTriangle,
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
import { Mono } from "@/components/marketing-2026/primitives";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { ListHeader } from "@/components/dashboard-2026/PracticeHero";

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

  const statusTone = isFailedActivation
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : isPendingActivation || subscription?.status === "cancelled"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : isPaidPlan || isTrialPlan
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "border-border bg-muted text-muted-foreground";

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <Eyebrow>PLAN &amp; BILLING</Eyebrow>
            <h1 className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
              Your plan, your credits,{" "}
              <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">and what&apos;s left.</span>
            </h1>
            <p className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
              Manage your subscription, see your credit balance, and top up when you need more time for AI interviews, coding rounds and reports.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["5 credits / minute", "Monthly plan credits", "One-click top-up"].map((t) => (
                <Mono key={t} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">{t.toUpperCase()}</Mono>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <Mono className="text-[11px] text-muted-foreground">CURRENT PLAN</Mono>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold", statusTone)}>
                {isPendingActivation && isPolling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {statusLabel}
              </span>
            </div>
            <p className="mt-2 text-[24px] font-extrabold tracking-[-0.035em] text-foreground">{planName}</p>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <Mono className="text-[11px] text-muted-foreground">CREDITS AVAILABLE</Mono>
                {monthlyCredits > 0 && <Mono className="text-[11px] text-muted-foreground">OF {monthlyCredits.toLocaleString()} / MO</Mono>}
              </div>
              <Mono className="mt-1 block text-[36px] leading-none tracking-tight text-foreground">{displayCredits.toLocaleString()}</Mono>
              {creditProgress != null && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]" style={{ width: `${creditProgress}%` }} />
                </div>
              )}
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                {isPaidPlan ? (subscription?.autoRenew ? "Auto-renew is on." : "Auto-renew is off.") : "Upgrade anytime for monthly plan credits."}
              </p>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
          {([
            ["Minutes left", Math.floor(displayCredits / 5).toLocaleString(), "at 5 credits a minute"],
            [
              isPaidPlan && subscription?.currentPeriodEnd ? "Next renewal" : "Subscription",
              isPaidPlan && subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : isPaidPlan || isTrialPlan || isPendingActivation ? statusLabel : "None",
              subscription?.status === "cancelled" ? "access until period ends" : isPaidPlan ? "billing period" : "no active subscription",
            ],
            ["Lifetime used", creditBalance ? creditBalance.used.toLocaleString() : "—", "credits spent"],
            ["Wallet total", creditBalance ? creditBalance.total.toLocaleString() : "—", "credits ever added"],
          ] as const).map(([k, v, d]) => (
            <div key={k} className="min-w-0 border-border px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className="mt-1 block truncate text-[20px] tracking-tight text-foreground">{v}</Mono>
              <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {isPendingActivation && subscription?.pendingPayment ? (
        <div className="flex items-start gap-3 rounded-[18px] border border-amber-500/30 bg-amber-500/[0.06] px-5 py-4 text-sm">
          {isPolling ? (
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div>
            <p className="font-semibold text-foreground">Payment processing</p>
            <p className="mt-1 text-muted-foreground">
              UPI AutoPay is set up for ₹{subscription.pendingPayment.amount.toLocaleString()}. Paid plan
              features unlock when Razorpay captures the charge — keep
              sufficient balance and do not cancel the mandate in GPay.
              {pollTimedOut
                ? " If this takes longer than expected, contact support."
                : " Checking automatically every few seconds…"}
            </p>
          </div>
        </div>
      ) : null}

      {isFailedActivation ? (
        <div className="flex flex-col gap-3 rounded-[18px] border border-destructive/30 bg-destructive/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-destructive">Subscription payment could not be completed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              AutoPay was cancelled or the bank did not confirm the payment. You are on the free tier until checkout succeeds.
            </p>
          </div>
          <Link
            href={`/checkout?plan=${subscription?.failedPayment?.plan || subscription?.pendingPayment?.plan || "tech_basic"}`}
            className={cn(buttonVariants(), "h-10 shrink-0 rounded-xl")}
          >
            Complete payment <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-6">
        <section className="overflow-hidden rounded-[22px] border border-border bg-card lg:col-span-3">
          <ListHeader
            eyebrow="YOUR SUBSCRIPTION"
            title={isPaidPlan ? "What a session costs you." : "You're on the free tier."}
            description={isPaidPlan ? "Paid plan: interview sessions and monthly credits." : "Buy a plan or credits to unlock more practice."}
          />
          <div className="grid grid-cols-3 gap-px border-b border-border bg-border">
            {[
              ["30-min session", "150"],
              ["60-min session", "300"],
              ["Min. to start", "150"],
            ].map(([label, value]) => (
              <div key={label} className="bg-card px-4 py-4 md:px-6">
                <p className="text-[12px] text-muted-foreground">{label}</p>
                <Mono className="mt-1 block text-[22px] tracking-tight text-foreground">{value}</Mono>
                <Mono className="text-[10.5px] text-muted-foreground">CREDITS</Mono>
              </div>
            ))}
          </div>

          <div className="space-y-4 p-5 md:p-6">
            {isPaidPlan && subscription?.status === "active" && subscription?.autoRenew && (
              <div className="rounded-2xl border border-border p-4">
                {!showCancelConfirm ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Cancel subscription</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">Stop auto-renewal. You keep access and credits until the current period ends.</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      variant="outline"
                      className="h-10 shrink-0 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Cancel subscription
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground">Cancel auto-renewal?</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">You keep access and credits until the current period ends.</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button type="button" onClick={handleCancelSubscription} disabled={cancellingSubscription} variant="destructive" className="h-10 rounded-xl">
                        {cancellingSubscription ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling…</>) : "Yes, cancel"}
                      </Button>
                      <Button type="button" onClick={() => setShowCancelConfirm(false)} variant="outline" className="h-10 rounded-xl">
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
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Reactivate subscription</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      Access until <span className="font-medium text-foreground">{formatDate(subscription.currentPeriodEnd)}</span>. Turn auto-renewal back on to continue uninterrupted.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleReactivateSubscription}
                    disabled={reactivatingSubscription}
                    className="h-10 shrink-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {reactivatingSubscription ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reactivating…</>) : (<><Crown className="mr-1.5 h-4 w-4" />Reactivate now</>)}
                  </Button>
                </div>
              )}

            {nextPlan && !isHighestSelfServePlan(normalizedPlan) ? (
              <div className="relative overflow-hidden rounded-2xl bg-[#0B1530] p-5 text-white">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,rgba(115,103,240,.45),transparent_70%)]" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Mono className="text-[11px] text-white/60">NEXT PLAN UP</Mono>
                    <p className="mt-1 text-[20px] font-extrabold tracking-[-0.03em]">{nextPlan.name}</p>
                    <p className="mt-0.5 text-[13px] text-white/70">From ₹{nextPlan.price}/mo: more sessions, coding rounds and system design.</p>
                  </div>
                  <Link href="/pricing" className={cn(buttonVariants(), "h-10 shrink-0 rounded-xl")}>
                    View all plans <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : null}

            {isHighestSelfServePlan(normalizedPlan) && (
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">You&apos;re on our highest plan</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Tech Pro includes the fullest session allotments and priority support. Thank you for being a valued member.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-border bg-card lg:col-span-2">
          <ListHeader eyebrow="TOP UP" title="Add credits." description="1 credit = ₹1 · minimum 300 credits." />
          <div className="space-y-4 p-5 md:p-6">
            <div className="grid grid-cols-3 gap-2">
              {[300, 600, 1000].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCreditAmountChange(String(n))}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    customCreditAmount === String(n) ? "border-primary bg-primary/[0.07]" : "border-border hover:border-primary/40",
                  )}
                >
                  <Mono className="block text-[16px] text-foreground">{n}</Mono>
                  <span className="text-[11.5px] text-muted-foreground">{Math.floor(n / 5)} min</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="credit-amount" className="text-[13px]">Or enter an amount</Label>
              <Input
                id="credit-amount"
                type="number"
                placeholder="e.g. 500 (min 300)"
                value={customCreditAmount}
                onChange={(e) => handleCreditAmountChange(e.target.value)}
                min="300"
                step="50"
                className={cn("h-11 w-full rounded-xl text-base", creditAmountError && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
            {creditAmountError ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {creditAmountError}
              </p>
            ) : null}

            <div className="flex items-baseline justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-[13px] text-muted-foreground">You pay</span>
              <Mono className="text-[20px] text-foreground">₹{customCreditAmount && !creditAmountError ? Number.parseInt(customCreditAmount) || 0 : 0}</Mono>
            </div>

            <Button
              type="button"
              onClick={handlePurchaseCredits}
              disabled={purchasingCredits || !customCreditAmount || !!creditAmountError}
              className="h-11 w-full rounded-xl text-[14.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)]"
            >
              {purchasingCredits ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>) : (<><Coins className="mr-2 h-4 w-4" />Buy credits</>)}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
