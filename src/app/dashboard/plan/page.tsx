"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Crown,
  CheckCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Calendar,
  Zap,
  Coins,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { paymentApi, Subscription, CreditBalance } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  normalizeSubscriptionPlan,
  subscriptionPlanDisplayName,
  isPaidSubscriptionPlan,
  getUpgradeOffer,
} from "@/lib/subscriptionPlans";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";

export default function PlanPage() {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
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
  const [planLoadError, setPlanLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      void loadPageData();
    }
  }, [isLoaded, user]);

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

  const loadPageData = async () => {
    try {
      setLoading(true);
      setPlanLoadError(null);
      const [sub, balance] = await Promise.all([
        paymentApi.getSubscription(),
        paymentApi.getCreditBalance(),
      ]);
      setSubscription(sub);
      setCreditBalance(balance);
      if (!sub) {
        setPlanLoadError(
          "Could not load your subscription. Refresh the page or try again shortly.",
        );
      }
    } catch (error) {
      console.error("Error loading plan page data:", error);
      setPlanLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load subscription details.",
      );
    } finally {
      setLoading(false);
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
      void loadPageData();
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast.error("Cancellation Failed", {
        description:
          error.message || "Failed to cancel subscription. Please try again.",
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
      void loadPageData();
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

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#7367F0] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your plan details...</p>
        </div>
      </div>
    );
  }

  const normalizedPlan = normalizeSubscriptionPlan(subscription?.plan);
  const planName = subscription
    ? subscriptionPlanDisplayName(normalizedPlan)
    : "Subscription unavailable";
  const upgradeOffer = getUpgradeOffer(normalizedPlan);
  const isPaidPlan = isPaidSubscriptionPlan(subscription?.plan);
  const interviewCredits =
    creditBalance?.available ??
    subscription?.creditsAvailable ??
    0;
  const nextRenewalIso =
    subscription?.nextRenewalDate ?? subscription?.currentPeriodEnd;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-[#7367F0]/[0.04] px-4 py-4 sm:px-5 sm:py-5">
        <div className="relative z-10 flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0] sm:h-11 sm:w-11">
            <Crown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground sm:text-xl lg:text-2xl">
              Subscription & Credits
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Credits fuel the full partner loop—Smart ATS resume passes, AI Interview Practice and
              coding mocks, peer sessions, and the stretch to offers—top up when
              you need more runway.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Column - Current Plan + Upgrade card */}
        <div className="space-y-4">
          <Card className="h-fit overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#7367F0] shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {planName}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Your active subscription
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {planLoadError && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {planLoadError}
                </div>
              )}
              {/* Credit Usage for Interviews */}
              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-700 block mb-1">
                      Credits for Interviews
                    </span>
                    <span className="text-xs text-gray-500">
                      5 credits per minute
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#7367F0] block">
                      {interviewCredits}
                    </span>
                    <span className="text-xs text-gray-500">available</span>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>30-min interview</span>
                    <span className="font-semibold">150 credits</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>60-min interview</span>
                    <span className="font-semibold">300 credits</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Minimum to start</span>
                    <span className="font-semibold text-orange-600">
                      25 credits
                    </span>
                  </div>
                </div>
              </div>

              {/* Next renewal — paid plans */}
              {isPaidPlan && nextRenewalIso && (
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#7367F0] shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Billing
                    </p>
                    <p className="text-sm text-gray-600">
                      Next renewal date:{" "}
                      <span className="font-medium">
                        {formatDate(nextRenewalIso)}
                      </span>
                      {subscription?.billingCycle && (
                        <span className="text-gray-500">
                          {" "}
                          ({subscription.billingCycle})
                        </span>
                      )}
                    </p>
                    {subscription?.autoRenew === false && (
                      <p className="text-xs text-amber-700 mt-1">
                        Auto-renew is off — access continues until this date.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cancel Subscription Section - Only for active paid subscriptions */}
              {isPaidPlan &&
                subscription?.status === "active" &&
                subscription?.autoRenew && (
                  <div className="pt-2">
                    <div className="mb-4 h-px bg-slate-200"></div>
                    {!showCancelConfirm ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start gap-4 mb-4">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 mb-2">
                              Cancel Subscription
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                              <li>Stop automatic renewals</li>
                              <li>Keep access until period ends</li>
                              <li>Credits remain available</li>
                            </ul>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowCancelConfirm(true)}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-md border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-gray-900 mb-4">
                          Are you sure you want to cancel?
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleCancelSubscription}
                            disabled={cancellingSubscription}
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                          >
                            {cancellingSubscription ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Yes, Cancel
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowCancelConfirm(false)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Keep It
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Reactivate Subscription Section - Only for cancelled subscriptions within period */}
              {isPaidPlan &&
                subscription?.status === "cancelled" &&
                subscription?.currentPeriodEnd &&
                new Date(subscription.currentPeriodEnd) > new Date() && (
                  <div className="pt-2">
                    <div className="mb-4 h-px bg-slate-200"></div>
                    <div className="rounded-md border border-green-200 bg-green-50 p-4">
                      <div className="flex items-start gap-4 mb-4">
                        <Sparkles className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-2">
                            Reactivate Subscription
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Access until{" "}
                            <span className="font-semibold">
                              {formatDate(subscription.currentPeriodEnd)}
                            </span>
                          </p>
                          <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                            <li>Enable auto-renewals</li>
                            <li>Continue without interruption</li>
                            <li>Keep all credits & benefits</li>
                          </ul>
                        </div>
                      </div>
                      <Button
                        onClick={handleReactivateSubscription}
                        disabled={reactivatingSubscription}
                        size="sm"
                        className="w-full !bg-green-600 hover:!bg-green-700 text-white"
                      >
                        {reactivatingSubscription ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Reactivating...
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            Reactivate Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Upgrade card - free → Premium; premium → Enterprise */}
          {upgradeOffer && (
            <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
              <CardContent className="py-5">
                <div className="flex flex-col items-start justify-between gap-4 rounded-md border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-bold text-slate-900">
                        {upgradeOffer.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {upgradeOffer.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={upgradeOffer.href}
                    className="w-full sm:w-auto shrink-0"
                  >
                    <Button
                      size="lg"
                      className="w-full sm:w-auto !bg-purple-600 text-white shadow-lg transition-all hover:!bg-purple-700 hover:shadow-xl"
                    >
                      {upgradeOffer.ctaLabel}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Credit Balance & Purchase */}
        <Card className="h-fit overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Credits</CardTitle>
                <CardDescription className="text-sm mt-1">
                  1 credit = ₹1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Balance */}
            <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Available Balance
                  </p>
                  <p className="text-3xl font-bold text-emerald-600 lg:text-4xl">
                    {creditBalance?.available || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Total: {creditBalance?.total || 0} • Used:{" "}
                    {creditBalance?.used || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                  <Coins className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            {/* Purchase Credits */}
            <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Purchase Credits
              </h4>
              <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <Coins className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">Credit Purchase Info:</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>1 credit = ₹1</li>
                      <li>Minimum purchase: 300 credits (₹300)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Input
                    type="number"
                    placeholder="Enter amount (min 300)"
                    value={customCreditAmount}
                    onChange={(e) => handleCreditAmountChange(e.target.value)}
                    min="300"
                    step="50"
                    className={`w-full h-12 text-base ${creditAmountError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {creditAmountError ? (
                    <div className="flex items-center gap-1 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <p className="text-xs text-red-600 font-medium">
                        {creditAmountError}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      {customCreditAmount
                        ? `Total: ₹${Number.parseInt(customCreditAmount) || 0}`
                        : ""}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handlePurchaseCredits}
                  disabled={
                    purchasingCredits ||
                    !customCreditAmount ||
                    !!creditAmountError
                  }
                  size="lg"
                  className="h-11 w-full !bg-emerald-600 text-white shadow-lg transition-all hover:!bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {purchasingCredits ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5 mr-2" />
                      Buy Credits Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highest tier — Enterprise only */}
      {normalizedPlan === "enterprise" && (
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
          <CardContent className="py-5">
            <div className="flex items-start gap-4 rounded-md border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-bold text-slate-900">
                  🎉 You're on our highest plan!
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
