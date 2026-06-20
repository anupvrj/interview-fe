"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ArrowRight, Loader2, Coins } from "lucide-react";
import { planApi, userApi } from "@/lib/api";
import type { PlanRecord } from "@/lib/planRecord";
import { getPlanMarketingHighlights } from "@/lib/planHighlightsFromFeatures";
import {
  getMarketingPlanGradient,
  getMarketingPlanIcon,
} from "@/lib/planMarketingDisplay";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import {
  COMING_SOON_PLAN_FEATURES,
  isPaidPlanId,
} from "@/lib/pricingPageContent";
import { cn } from "@/lib/utils";

const COMING_SOON_SUFFIX = /\s*\(Coming soon\)\s*$/i;

function isComingSoonHighlight(
  line: string,
  comingSoonHighlights?: string[],
): boolean {
  const stripped = line.replace(COMING_SOON_SUFFIX, "").trim();
  if (COMING_SOON_SUFFIX.test(line)) return true;
  const markers = comingSoonHighlights?.length
    ? comingSoonHighlights
    : [...COMING_SOON_PLAN_FEATURES];
  return markers.some(
    (h) => h === line || h === stripped || stripped.startsWith(h),
  );
}

function parseHighlightLine(
  line: string,
  comingSoonHighlights?: string[],
): { text: string; comingSoon: boolean } {
  const text = line.replace(COMING_SOON_SUFFIX, "").trim();
  return {
    text,
    comingSoon: isComingSoonHighlight(line, comingSoonHighlights),
  };
}

function ComingSoonTag({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "coming-soon-tag inline-flex shrink-0 items-center rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 font-bold uppercase tracking-widest text-amber-800",
        compact
          ? "px-2 py-px text-[9px] tracking-wide"
          : "px-2.5 py-0.5 text-[10px]",
      )}
    >
      Coming soon
    </span>
  );
}

function UpcomingSectionLabel() {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200/90 bg-slate-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
      Upcoming
    </span>
  );
}

function buildDisplayRows(plans: PlanRecord[], paidOnly: boolean) {
  const filtered = plans
    .filter((p) => p.planId !== "free")
    .filter((p) => (paidOnly ? isPaidPlanId(p.planId) : p.planId !== "enterprise"));

  return filtered.map((p) => {
    const isEnterprise = p.planId === "enterprise";
    const isFree = p.planId === "free";
    const priceLabel = isEnterprise
      ? "Custom"
      : isFree
        ? "0"
        : String(p.pricing.monthly);
    const creditsMonthly = p.creditsIncluded.monthly;
    const periodLabel = isEnterprise || isFree ? "" : "month";
    const rawHighlights = p.highlights?.length
      ? p.highlights
      : getPlanMarketingHighlights(p);
    const highlights = rawHighlights.filter(
      (line) => !/^\d[\d,]*\s*credits?\b/i.test(line.trim()),
    );
    const comingSoonHighlights =
      p.metadata?.comingSoonHighlights?.length
        ? p.metadata.comingSoonHighlights
        : [...COMING_SOON_PLAN_FEATURES];
    return {
      id: p.planId,
      plan: p,
      popular: p.isPopular,
      priceLabel,
      creditsMonthly,
      isEnterprise,
      isFree,
      periodLabel,
      highlights,
      comingSoonHighlights,
    };
  });
}

function PlanCreditsBadge({
  creditsMonthly,
  isEnterprise,
  popular,
}: {
  creditsMonthly: number;
  isEnterprise: boolean;
  isFree: boolean;
  popular: boolean;
}) {
  if (isEnterprise) {
    return (
      <div className="pricing-credits-badge mx-auto mt-3 w-full max-w-[240px] rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/80 px-4 py-2.5 text-center shadow-sm">
        <div className="relative flex items-center justify-center gap-1.5">
          <Coins className="h-4 w-4 text-slate-600" aria-hidden />
          <span className="text-sm font-semibold text-slate-700">
            Custom credits
          </span>
        </div>
      </div>
    );
  }

  const label = "credits";

  return (
    <div
      className={cn(
        "pricing-credits-badge mx-auto mt-3 w-full max-w-[240px] rounded-xl border px-4 py-2.5 text-center shadow-sm",
        popular
          ? "border-primary/35 bg-gradient-to-br from-primary/15 via-violet-50 to-primary/5"
          : "border-primary/20 bg-gradient-to-br from-primary/8 via-white to-violet-50/50",
      )}
    >
      <div className="relative flex items-center justify-center gap-1.5">
        <Coins
          className={cn(
            "h-4 w-4 shrink-0",
            popular ? "text-primary" : "text-primary/80",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
            popular ? "text-primary" : "text-primary/90",
          )}
        >
          {creditsMonthly.toLocaleString("en-IN")}
        </span>
        <span className="text-xs font-medium text-primary/75 sm:text-sm">
          {label}
        </span>
      </div>
    </div>
  );
}

export type PricingPlansBlockProps = {
  showHeading?: boolean;
  showViewAllPlansLink?: boolean;
  /** Show only General Pass, Tech Basic, Tech Pro (pricing page) */
  paidOnly?: boolean;
  /** Compact card style for homepage */
  compact?: boolean;
  /** Renewal flow — CTA copy and auto-renew footnote */
  renewalMode?: boolean;
  showAutoRenewNote?: boolean;
};

export function PricingPlansBlock({
  showHeading = true,
  showViewAllPlansLink = false,
  paidOnly = false,
  compact = false,
  renewalMode = false,
  showAutoRenewNote = false,
}: PricingPlansBlockProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [contactSalesOpen, setContactSalesOpen] = useState(false);
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError(null);
        setLoading(true);
        const list = await planApi.getAllPlans();
        if (cancelled) return;
        const sorted = [...list].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        setPlans(sorted);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Could not load plans. Try again.",
          );
          setPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = buildDisplayRows(plans, paidOnly);

  const handleChoosePlan = async (planId: string) => {
    if (!isLoaded) return;

    if (planId === "enterprise") {
      setContactSalesOpen(true);
      return;
    }

    setLoadingPlanId(planId);

    try {
      if (planId === "free") {
        if (!user) {
          localStorage.setItem("pendingPlan", "free");
          router.push(`/sign-in?redirect=/onboarding`);
          return;
        }
        try {
          const profile = await userApi.getMyProfile();
          if (!profile.onboardingCompleted) {
            localStorage.setItem("pendingPlan", "free");
            router.push("/onboarding");
            return;
          }
          router.push("/dashboard");
        } catch {
          localStorage.setItem("pendingPlan", "free");
          router.push("/onboarding");
        }
        return;
      }

      if (!user) {
        localStorage.setItem("pendingPlan", planId);
        router.push(`/sign-in?redirect=/onboarding`);
        return;
      }

      try {
        const profile = await userApi.getMyProfile();

        if (!profile.onboardingCompleted) {
          localStorage.setItem("pendingPlan", planId);
          router.push("/onboarding");
          return;
        }

        router.push(`/checkout?plan=${planId}&cycle=monthly`);
      } catch {
        localStorage.setItem("pendingPlan", planId);
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error in handleChoosePlan:", error);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <>
      {showHeading ? (
        <div className="mb-10 text-center sm:mb-12 lg:mb-16">
          <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl lg:text-4xl">
            {renewalMode ? "Renew your subscription" : "Choose Your Plan"}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base lg:text-lg">
            {renewalMode
              ? "Select a monthly plan. After payment, Razorpay will auto-renew each billing cycle until you cancel."
              : "Career-targeted tracks for non-tech professionals, junior developers, and senior engineers."}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Loading plans…</p>
        </div>
      ) : loadError ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-gray-600">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-6 sm:gap-8",
            paidOnly || rows.length === 3
              ? "md:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {rows.map((row) => {
            const Icon = getMarketingPlanIcon(row.id, row.plan.icon);
            const gradientClass = getMarketingPlanGradient(
              row.id,
              row.plan.color,
            );
            const isEnterprise = row.isEnterprise;
            const isThisLoading = loadingPlanId === row.id;

            return (
              <Card
                key={row.id}
                className={cn(
                  "relative flex flex-col border-2 bg-white transition-all hover:shadow-xl",
                  row.popular
                    ? "border-primary shadow-lg lg:scale-[1.02] glow-border"
                    : "border-gray-200 hover:border-border",
                  compact && "h-full",
                )}
              >
                {row.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                    <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-md sm:text-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4 text-center">
                  <div className="mb-4 flex justify-center">
                    <div
                      className={cn(
                        "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md",
                        gradientClass,
                      )}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="mb-2 text-xl sm:text-2xl">
                    {row.plan.displayName || row.plan.name}
                  </CardTitle>
                  <CardDescription className="mb-3 min-h-[2.5rem] text-xs text-gray-600 sm:text-sm">
                    {row.plan.description}
                  </CardDescription>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900 sm:text-4xl">
                      {isEnterprise ? "" : "₹"}
                      {row.priceLabel}
                    </span>
                    {row.periodLabel ? (
                      <span className="ml-2 text-sm text-gray-600 sm:text-base">
                        /{row.periodLabel}
                      </span>
                    ) : null}
                  </div>
                  <PlanCreditsBadge
                    creditsMonthly={row.creditsMonthly}
                    isEnterprise={row.isEnterprise}
                    isFree={row.isFree}
                    popular={row.popular}
                  />
                </CardHeader>

                <CardContent className="flex flex-1 flex-col pt-0">
                  {(() => {
                    const parsed = row.highlights.map((feature) =>
                      parseHighlightLine(feature, row.comingSoonHighlights),
                    );
                    const regular = parsed.filter((p) => !p.comingSoon);
                    const upcoming = parsed.filter((p) => p.comingSoon);

                    return (
                      <ul className="mb-6 flex-1 space-y-2.5 sm:mb-8 sm:space-y-3">
                        {regular.map(({ text }) => (
                          <li key={text} className="flex items-start gap-2 sm:gap-3">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 sm:h-5 sm:w-5" />
                            <span className="text-xs text-gray-700 sm:text-sm">
                              {text}
                            </span>
                          </li>
                        ))}

                        {upcoming.length > 0 ? (
                          <>
                            <li
                              className="border-t border-border/60 pt-4 pb-0.5"
                              aria-hidden
                            >
                              <UpcomingSectionLabel />
                            </li>
                            {upcoming.map(({ text }) => (
                              <li key={text}>
                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                  <div className="flex min-w-0 items-start gap-2 sm:gap-2.5">
                                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500/70 sm:h-4 sm:w-4" />
                                    <span className="text-[11px] leading-snug text-gray-500 sm:text-xs">
                                      {text}
                                    </span>
                                  </div>
                                  <ComingSoonTag compact />
                                </div>
                              </li>
                            ))}
                          </>
                        ) : null}
                      </ul>
                    );
                  })()}

                  <Button
                    onClick={() => handleChoosePlan(row.id)}
                    disabled={loadingPlanId !== null || !isLoaded}
                    className={cn(
                      "w-full shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
                      row.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-primary hover:bg-slate-900",
                    )}
                  >
                    {isThisLoading ? (
                      <>
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : isEnterprise ? (
                      <>
                        Contact sales
                        <ArrowRight className="ml-2 inline h-4 w-4" />
                      </>
                    ) : row.id === "free" ? (
                      <>
                        Get started free
                        <ArrowRight className="ml-2 inline h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {renewalMode ? "Renew monthly" : "Subscribe monthly"}
                        <ArrowRight className="ml-2 inline h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAutoRenewNote ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Plans bill monthly. Razorpay auto-renews on your billing date when a
          valid card or UPI mandate is on file.
        </p>
      ) : null}

      {showViewAllPlansLink ? (
        <div className="mt-8 text-center sm:mt-12">
          <Link href="/pricing">
            <Button variant="outline" className="border-2 text-sm sm:text-base">
              View all plans & comparison
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : null}

      <ContactSalesDialog
        open={contactSalesOpen}
        onOpenChange={setContactSalesOpen}
      />
    </>
  );
}
