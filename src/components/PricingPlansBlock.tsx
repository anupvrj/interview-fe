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
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { planApi, userApi } from "@/lib/api";
import type { PlanRecord } from "@/lib/planRecord";
import { getPlanMarketingHighlights } from "@/lib/planHighlightsFromFeatures";
import {
  getMarketingPlanGradient,
  getMarketingPlanIcon,
} from "@/lib/planMarketingDisplay";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";

function buildDisplayRows(plans: PlanRecord[]) {
  return plans.map((p) => {
    const isEnterprise = p.planId === "enterprise";
    const isFree = p.planId === "free";
    const priceLabel = isEnterprise
      ? "Custom"
      : isFree
        ? "0"
        : String(p.pricing.monthly);
    const creditsLabel = isEnterprise
      ? "Volume & custom terms"
      : `${p.creditsIncluded.monthly.toLocaleString("en-IN")} credits`;
    const periodLabel = isEnterprise ? "" : "month";
    const highlights = getPlanMarketingHighlights(p);
    return {
      id: p.planId,
      plan: p,
      popular: p.isPopular,
      priceLabel,
      creditsLabel,
      periodLabel,
      highlights,
    };
  });
}

export type PricingPlansBlockProps = {
  /** Show “Choose Your Plan” heading + subtitle (homepage section). Hide on /pricing when the hero already has the title. */
  showHeading?: boolean;
  /** Homepage-only link to full pricing page */
  showViewAllPlansLink?: boolean;
};

export function PricingPlansBlock({
  showHeading = true,
  showViewAllPlansLink = false,
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

  const rows = buildDisplayRows(plans);

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
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Choose Your Plan
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Don&apos;t just apply—win. Plans for resumes, interviews, peers, and job search—your end-to-end career partner.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading plans…</p>
        </div>
      ) : loadError ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {rows.map((row) => {
            const Icon = getMarketingPlanIcon(row.id, row.plan.icon);
            const gradientClass = getMarketingPlanGradient(
              row.id,
              row.plan.color,
            );
            const isEnterprise = row.id === "enterprise";
            const isThisLoading = loadingPlanId === row.id;
            return (
              <Card
                key={row.id}
                className={`relative border-2 hover:shadow-xl transition-all bg-white ${
                  row.popular
                    ? "border-blue-600 shadow-lg scale-105 sm:scale-110 glow-border"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {row.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${gradientClass} shadow-md`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl mb-2">
                    {row.plan.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600 mb-3">
                    {row.plan.description}
                  </CardDescription>
                  <div className="mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {isEnterprise ? "" : "₹"}
                      {row.priceLabel}
                    </span>
                    {row.periodLabel ? (
                      <span className="text-gray-600 ml-2 text-sm sm:text-base">
                        /{row.periodLabel}
                      </span>
                    ) : null}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    {row.creditsLabel}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {row.highlights.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-3">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-gray-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleChoosePlan(row.id)}
                    disabled={loadingPlanId !== null || !isLoaded}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isThisLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Loading...
                      </>
                    ) : isEnterprise ? (
                      <>
                        Contact sales
                        <ArrowRight className="w-4 h-4 ml-2 inline" />
                      </>
                    ) : row.id === "free" ? (
                      <>
                        Get started
                        <ArrowRight className="w-4 h-4 ml-2 inline" />
                      </>
                    ) : (
                      <>
                        Choose plan
                        <ArrowRight className="w-4 h-4 ml-2 inline" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showViewAllPlansLink ? (
        <div className="text-center mt-8 sm:mt-12">
          <Link href="/pricing">
            <Button
              variant="outline"
              className="border-2 text-sm sm:text-base"
            >
              View All Plans & Details
              <ArrowRight className="w-4 h-4 ml-2" />
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
