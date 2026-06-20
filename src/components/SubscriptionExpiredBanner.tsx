"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi, type Subscription } from "@/lib/api";

export function SubscriptionExpiredBanner() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    localStorage.setItem("clerk-user-id", user.id);
    paymentApi
      .getSubscription()
      .then(setSubscription)
      .catch(() => setSubscription(null));
  }, [isLoaded, user]);

  const isExpired =
    subscription?.isExpired === true ||
    subscription?.needsRenewal === true ||
    subscription?.status === "expired" ||
    !!subscription?.expiredPlanId;

  // Plan page has its own full-screen renewal gate
  if (pathname === "/dashboard/plan") {
    return null;
  }

  if (!isExpired) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              Your subscription has expired
            </p>
            <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
              Premium access is paused. Renew a monthly plan to restore credits
              and features — active subscriptions auto-renew via Razorpay.
            </p>
          </div>
        </div>
        <Link href="/dashboard/plan?renew=1" className="shrink-0">
          <Button size="sm" className="w-full sm:w-auto">
            Renew subscription
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
