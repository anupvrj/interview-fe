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
import { Progress } from "@/components/ui/progress";
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

  const handlePurchaseCredits = async () => {
    const amount = Number.parseInt(customCreditAmount);
    if (!amount || amount < 1) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid credit amount (minimum 1 credit)",
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

    const planOrder = ["free", "starter", "premium", "elite"];
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
  if (subscription?.plan === "starter") {
    planName = "Starter Plan";
  } else if (subscription?.plan === "premium") {
    planName = "Premium Plan";
  } else if (subscription?.plan === "elite") {
    planName = "Elite Plan";
  }

  const nextPlan = subscription?.plan ? getNextPlan(subscription.plan) : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8 py-6 lg:py-8">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-8 lg:p-10 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Subscription & Credits
            </h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Manage your subscription, purchase credits, and unlock premium
            features
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Current Plan */}
        <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">{planName}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Your active subscription
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Credit Usage for Interviews */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200/50">
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
              <div className="space-y-2 pt-3 border-t border-blue-200">
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
              <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200/50">
                <div className="w-12 h-12 bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Calendar className="w-6 h-6 text-white" />
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
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-5"></div>
                  {!showCancelConfirm ? (
                    <div className="p-5 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border-2 border-red-200/50">
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
                    <div className="p-5 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border-2 border-red-200/50">
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
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-5"></div>
                  <div className="p-5 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border-2 border-green-200/50">
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

        {/* Right Column - Credit Balance & Purchase */}
        <Card className="border-2 border-emerald-200/50 shadow-xl bg-white/95 backdrop-blur-sm h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Credits</CardTitle>
                <CardDescription className="text-sm mt-1">
                  1 credit = ₹1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Current Balance */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border-2 border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Available Balance
                  </p>
                  <p className="text-4xl lg:text-5xl font-bold text-emerald-600">
                    {creditBalance?.available || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Total: {creditBalance?.total || 0} • Used:{" "}
                    {creditBalance?.used || 0}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Coins className="w-9 h-9 text-white" />
                </div>
              </div>
            </div>

            {/* Purchase Credits */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border-2 border-emerald-200/50">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Purchase Credits
              </h4>
              <div className="space-y-3">
                <div>
                  <Input
                    type="number"
                    placeholder="Enter amount (min 1)"
                    value={customCreditAmount}
                    onChange={(e) => setCustomCreditAmount(e.target.value)}
                    min="1"
                    className="w-full h-12 text-base"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {customCreditAmount
                      ? `Total: ₹${Number.parseInt(customCreditAmount) || 0}`
                      : "Enter the number of credits you want to purchase"}
                  </p>
                </div>
                <Button
                  onClick={handlePurchaseCredits}
                  disabled={purchasingCredits || !customCreditAmount}
                  size="lg"
                  className="w-full !bg-emerald-600 hover:!bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all h-12"
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

      {/* Upgrade Section */}
      {nextPlan && (
        <Card className="border-2 border-purple-200/50 shadow-xl bg-gradient-to-br from-purple-50/50 to-white backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Upgrade to {nextPlan.name}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Unlock more features and interviews
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nextPlan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/50"
                >
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing & CTA */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border-2 border-purple-200/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Starting at</p>
                  <p className="text-4xl font-bold text-gray-900">
                    ₹{nextPlan.price}
                    <span className="text-lg font-normal text-gray-600">
                      /month
                    </span>
                  </p>
                </div>
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 !bg-purple-600 hover:!bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Highest Plan Message */}
      {!nextPlan && subscription?.plan !== "free" && (
        <Card className="border-2 border-amber-200/50 shadow-xl bg-gradient-to-br from-amber-50/50 to-white backdrop-blur-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-5 p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border-2 border-amber-200/50">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-slate-900 mb-2">
                  🎉 You're on our highest plan!
                </h3>
                <p className="text-base text-gray-700">
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
