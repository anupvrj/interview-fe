"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { PricingPlansBlock } from "@/components/PricingPlansBlock";
import { PricingComparisonTable } from "@/components/PricingComparisonTable";
import { Card } from "@/components/ui/card";
import {
  appMarketingSection,
  appMarketingSectionAlt,
  appCard,
} from "@/lib/app-theme";
import { PRICING_FAQ } from "@/lib/pricingPageContent";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-background selection:bg-info-muted">
      <SiteHeader />

      <section className="bg-background px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-16">
            <h1 className="mb-4 text-3xl font-bold text-slate-900 sm:mb-6 sm:text-4xl lg:text-5xl">
              Choose Your <span className="text-primary">Plan</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg lg:text-xl">
              From ATS-ready resumes to AI interview practice and job search—pick
              the plan that fits your journey.
            </p>
          </div>
        </div>
      </section>

      <section
        id="plans"
        className={cn(
          appMarketingSection,
          "container mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 pt-0",
        )}
      >
        <PricingPlansBlock showHeading={false} paidOnly />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Are you looking for Enterprise solutions?{" "}
          <Link
            href="/contact"
            className="font-medium text-primary hover:underline"
          >
            Contact sales
          </Link>
        </p>
      </section>

      <section
        id="compare"
        className={cn(
          appMarketingSection,
          "container mx-auto max-w-6xl scroll-mt-24 px-4 pb-16",
        )}
      >
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Master feature comparison
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Side-by-side view of every plan capability.
          </p>
        </div>
        <PricingComparisonTable />
      </section>

      <section
        id="faq"
        className={cn(
          appMarketingSectionAlt,
          "px-4 pb-20 sm:px-6 lg:px-8",
        )}
      >
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Subscription & billing FAQ
          </h2>
          <div className="space-y-4">
            {PRICING_FAQ.map((item) => (
              <Card key={item.question} className={cn(appCard, "p-6")}>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {item.question}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.answer}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
