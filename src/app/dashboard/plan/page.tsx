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
import { paymentApi, planApi, Subscription, CreditBalance } from "@/lib/api";
import { formatDate } from "@/lib/utils";

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
  const [allPlans, setAllPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadSubscription();
      loadCreditBalance();
      loadPlans();
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

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getSubscription();
      console.log("📊 Subscription data loaded:", data);
      console.log("🔍 Cancel button conditions:");
      console.log("  - plan !== 'free':", data?.plan !== "free");
      console.log("  - status === 'active':", data?.status === "active");
      console.log("  - autoRenew:", data?.autoRenew);
      setSubscription(data);
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
          color: "#2563eb",
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

  const getNextPlan = (currentPlan: string): NextPlanDisplay | null => {
    if (!allPlans || allPlans.length === 0) return null;

    const planOrder = ["free", "premium", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);

    if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
      return null;
    }

    const nextPlanId = planOrder[currentIndex + 1];
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(37,99,235)] mx-auto mb-4" />
          <p className="text-gray-600">Loading your plan details...</p>
        </div>
      </div>
    );
  }

  let planName = "Free Plan";
  if (subscription?.plan === "premium") {
    planName = "Premium Plan";
  } else if (subscription?.plan === "enterprise") {
    planName = "Enterprise Plan";
  }

  const nextPlan = subscription?.plan ? getNextPlan(subscription.plan) : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4 py-3 sm:px-5 sm:py-4 text-white shadow-lg">
        <div className="relative z-10">
          <div className="mb-1.5 flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 shadow-sm backdrop-blur-sm sm:h-9 sm:w-9">
              <Crown className="h-4 w-4" />
            </div>
            <h1 className="truncate text-lg font-bold leading-tight text-white sm:text-xl lg:text-2xl">
              Subscription & Credits
            </h1>
          </div>
          <p className="max-w-2xl text-[10px] leading-tight text-white/85 sm:text-xs md:text-sm">
            Manage your subscription, purchase credits, and unlock premium
            features
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-transparent opacity-40"></div>
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Column - Current Plan + Upgrade card */}
        <div className="space-y-4">
          <Card className="h-fit rounded-md border border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
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
                    <span className="text-2xl font-bold text-[rgb(37,99,235)] block">
                      {subscription?.creditsAvailable || 0}
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

              {/* Renewal Date */}
              {subscription?.currentPeriodEnd && (
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Current Period
                    </p>
                    <p className="text-sm text-gray-600">
                      Renews on:{" "}
                      <span className="font-medium">
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel Subscription Section - Only for active paid subscriptions */}
              {subscription?.plan !== "free" &&
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
              {subscription?.plan !== "free" &&
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

          {/* Upgrade card - right after current plan */}
          {nextPlan && (
            <Card className="rounded-md border border-border bg-card shadow-sm">
              <CardContent className="py-5">
                <div className="flex flex-col items-start justify-between gap-4 rounded-md border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-bold text-slate-900">
                        Upgrade to a higher plan and save more
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Unlock more interviews, resume builds, and premium
                        features.
                      </p>
                    </div>
                  </div>
                  <Link href="/pricing" className="w-full sm:w-auto shrink-0">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto !bg-purple-600 text-white shadow-lg transition-all hover:!bg-purple-700 hover:shadow-xl"
                    >
                      View all plans
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Credit Balance & Purchase */}
        <Card className="h-fit rounded-md border border-border bg-card shadow-sm">
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

      {/* Highest Plan Message */}
      {!nextPlan && subscription?.plan !== "free" && (
        <Card className="rounded-md border border-border bg-card shadow-sm">
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
