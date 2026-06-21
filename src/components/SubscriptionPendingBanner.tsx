"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingSubscriptionPolling } from "@/hooks/usePendingSubscriptionPolling";

export function SubscriptionPendingBanner() {
  const pathname = usePathname();
  const { subscription, activationState, isPolling, pollTimedOut } =
    usePendingSubscriptionPolling({ silent: pathname === "/dashboard/plan" });

  if (pathname === "/dashboard/plan") {
    return null;
  }

  if (activationState !== "pending" || !subscription?.pendingPayment) {
    return null;
  }

  const planLabel =
    subscription.pendingPayment.planDisplayName ||
    subscription.pendingPayment.plan ||
    "your plan";

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {isPolling ? (
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
          ) : (
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              Activating {planLabel} — payment processing
            </p>
            <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
              UPI AutoPay is set up for ₹
              {subscription.pendingPayment.amount.toLocaleString()}. Your plan
              unlocks when Razorpay captures the payment (usually minutes; UPI
              may take until tomorrow). Keep the mandate active in GPay.
              {pollTimedOut
                ? " Still waiting? Open Plan & billing or contact support."
                : null}
            </p>
          </div>
        </div>
        <Link href="/dashboard/plan?payment=processing" className="shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="w-full border-amber-300 bg-background/80 sm:w-auto"
          >
            View status
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
