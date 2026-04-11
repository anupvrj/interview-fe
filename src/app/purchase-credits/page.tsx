"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Check, Coins, Zap } from "lucide-react";
import { paymentApi } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CREDIT_PACKAGES = [
  {
    amount: 500,
    price: 500,
    popular: false,
    description: "Perfect for a few extra interviews",
    features: ["500 credits", "Valid for 60 days", "~1.5 hours of interviews"],
  },
  {
    amount: 1000,
    price: 1000,
    popular: true,
    description: "Most popular choice",
    features: ["1000 credits", "Valid for 90 days", "~3 hours of interviews"],
  },
  {
    amount: 2000,
    price: 2000,
    popular: false,
    description: "Maximum value",
    features: ["2000 credits", "Valid for 120 days", "~6 hours of interviews"],
  },
  {
    amount: 5000,
    price: 5000,
    popular: false,
    description: "For power users",
    features: ["5000 credits", "Valid for 180 days", "~15 hours of interviews"],
  },
];

export default function PurchaseCreditsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent("/purchase-credits")}`,
      );
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePurchase = async (creditAmount: number) => {
    if (!user || !razorpayLoaded) return;

    setLoading(true);
    setSelectedAmount(creditAmount);

    try {
      const order = await paymentApi.purchaseCredits(creditAmount);

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Interview Trix",
        description: `Purchase ${creditAmount} credits`,
        order_id: order.orderId,
        prefill: {
          name: user.fullName || user.firstName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "rgb(37,99,235)",
        },
        handler: async function (response: any) {
          try {
            console.log("✅ Payment successful:", response);
            await paymentApi.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            );
            router.push("/dashboard?payment=success&type=credit_purchase");
          } catch (err: any) {
            console.error("❌ Payment verification failed:", err);
            alert("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setSelectedAmount(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Error creating order:", error);
      alert(error.message || "Failed to create order");
      setLoading(false);
      setSelectedAmount(null);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Purchase Credits
            </h1>
            <p className="text-gray-600 mt-1">
              Top up your account with credits for more interviews
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  How Credits Work
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 1 credit = ₹1</li>
                  <li>• Interview cost: 5 credits per minute</li>
                  <li>• Purchased credits are added to your balance until used</li>
                  <li>• Use credits for mock interviews anytime</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Packages */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.amount}
              className={`relative border-2 transition-all hover:shadow-xl ${
                pkg.popular
                  ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {pkg.amount} Credits
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {pkg.description}
                  </p>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₹{pkg.price.toLocaleString()}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg.amount)}
                  disabled={loading}
                  className={`w-full ${
                    pkg.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      : ""
                  }`}
                >
                  {loading && selectedAmount === pkg.amount ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Purchase ₹${pkg.price}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  What happens to my existing subscription?
                </h3>
                <p className="text-gray-600 text-sm">
                  Purchased credits are added to your account and can be used
                  alongside your subscription credits. They're separate from
                  your plan.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Do credits expire?
                </h3>
                <p className="text-gray-600 text-sm">
                  No — purchased credits are not removed after a fixed number of
                  days. Product access for premium features is tied to an active
                  subscription (renewed via Razorpay).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I get a refund?
                </h3>
                <p className="text-gray-600 text-sm">
                  Unused credits can be refunded within 7 days of purchase.
                  Contact support for refund requests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
