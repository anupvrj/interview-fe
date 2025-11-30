"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Check, X, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { paymentApi } from "@/lib/api";
import { PLAN_CONFIG } from "@/lib/payment";
import Script from "next/script";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const planId = searchParams.get("plan") as
    | "starter"
    | "pro"
    | "exam_pack"
    | null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!planId || !["starter", "pro", "exam_pack"].includes(planId)) {
      router.push("/pricing");
      return;
    }
  }, [isLoaded, user, planId, router]);

  const handlePayment = async () => {
    if (!planId || !user) return;

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
        name: "Hello Interview",
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

            // Redirect to new interview page
            router.push("/dashboard/interviews/new?payment=success");
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
          color: "#7c3aed",
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

  if (!isLoaded || !user || !planId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const plan = PLAN_CONFIG[planId];

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          console.log("Razorpay SDK loaded");
          setRazorpayLoaded(true);
        }}
        onError={() => {
          setError("Failed to load Razorpay SDK");
          setRazorpayLoaded(false);
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        {/* Header */}
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Hello Interview
              </span>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="p-8 bg-white shadow-xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">
              Complete Your Purchase
            </h1>

            {/* Order Summary */}
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
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
                    <span className="text-2xl font-bold text-purple-600">
                      ₹{plan.price}
                    </span>
                  </div>
                </div>
              </div>
            </div>

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
              disabled={loading || !razorpayLoaded}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                <Check className="h-5 w-5 text-green-500" />
                {plan.interviewsLimit} AI-powered mock interviews
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-500" />
                Detailed feedback and analysis
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-500" />
                Progress tracking and insights
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-500" />
                Access to all premium features
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
