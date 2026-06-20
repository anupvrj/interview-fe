"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Crown,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PricingPlansBlock } from "@/components/PricingPlansBlock";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { cn, formatDate } from "@/lib/utils";

function PlanPageBackdrop() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6" aria-hidden>
      <div className="h-32 rounded-xl border border-[#7367F0]/10 bg-gradient-to-br from-[#7367F0]/[0.06] to-transparent" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-xl border border-border/60 bg-card shadow-card" />
        <div className="h-24 rounded-xl border border-border/60 bg-card shadow-card" />
        <div className="h-24 rounded-xl border border-border/60 bg-card shadow-card" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="h-64 rounded-xl border border-border/60 bg-card shadow-card lg:col-span-3" />
        <div className="h-64 rounded-xl border border-border/60 bg-card shadow-card lg:col-span-2" />
      </div>
    </div>
  );
}

type SubscriptionRenewalGateProps = Readonly<{
  expiredOn?: string;
}>;

function SubscriptionRenewalGateContent({
  expiredOn,
}: SubscriptionRenewalGateProps) {
  const searchParams = useSearchParams();
  const renewFromUrl = searchParams.get("renew") === "1";
  const [showPlans, setShowPlans] = useState(renewFromUrl);

  if (showPlans) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-xl border border-[#7367F0]/10 bg-gradient-to-br from-[#7367F0]/[0.06] via-card to-[#7367F0]/[0.04] px-4 py-6 sm:px-6">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#7367F0]/20 bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0]">
                <Sparkles className="h-3.5 w-3.5" />
                Renew subscription
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Choose a plan to renew
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Monthly billing via Razorpay. After checkout, your plan
                auto-renews each cycle until you cancel.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPlans(false)}
              className="shrink-0"
            >
              Back
            </Button>
          </div>
        </section>

        <PricingPlansBlock
          showHeading={false}
          paidOnly
          renewalMode
          showAutoRenewNote
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-[min(72vh,720px)] w-full max-w-7xl">
      <div className="pointer-events-none select-none blur-[6px] opacity-[0.4] saturate-50">
        <PlanPageBackdrop />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

        <Card className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-amber-500/25 bg-card/95 shadow-2xl backdrop-blur-sm">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
          <CardHeader className="pb-3 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Subscription expired
            </CardTitle>
            <CardDescription className="text-base">
              Premium access is paused until you renew your plan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {expiredOn ? (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <Calendar className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    Billing period ended
                  </p>
                  <p className="text-muted-foreground">
                    Expired on {formatDate(expiredOn)}
                  </p>
                </div>
              </div>
            ) : null}

            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                {
                  icon: RefreshCw,
                  text: "Active plans renew monthly via Razorpay (card or UPI AutoPay).",
                },
                {
                  icon: Sparkles,
                  text: "Credits refresh on each successful renewal.",
                },
                {
                  icon: Crown,
                  text: "Pick any plan below to restore interviews and resume tools.",
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#7367F0]" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              size="lg"
              className={cn(
                "h-12 w-full text-base shadow-lg hover:shadow-xl",
                institutePrimaryClass,
              )}
              onClick={() => setShowPlans(true)}
            >
              View plans &amp; renew
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              General Pass · Tech Basic · Tech Pro
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SubscriptionRenewalGate(props: SubscriptionRenewalGateProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#7367F0]" />
        </div>
      }
    >
      <SubscriptionRenewalGateContent {...props} />
    </Suspense>
  );
}
