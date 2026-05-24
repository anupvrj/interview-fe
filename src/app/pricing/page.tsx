"use client";

import { Sparkles, Mic, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { PricingPlansBlock } from "@/components/PricingPlansBlock";
import { PageHeader } from "@/components/app/PageHeader";
import {
  appMarketingSection,
  appMarketingSectionAlt,
  appCard,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      <section
        className={cn(
          appMarketingSection,
          "relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pt-32",
        )}
      >
        <div className="container mx-auto max-w-7xl">
          <PageHeader
            title="Choose your plan"
            description="From ATS-ready resumes to AI Interview Practice and peer interviews to smart job search—pick credits that fit your journey. Interview Trix is your end-to-end career partner."
            className="mx-auto max-w-3xl [&_.min-w-0]:flex [&_.min-w-0]:flex-col [&_.min-w-0]:items-center gap-6 text-center sm:flex-col sm:items-center sm:justify-center sm:text-center"
          />
        </div>
      </section>

      {/* Main Content — plans from GET /plans (database) */}
      <div
        className={cn(
          appMarketingSectionAlt,
          "container mx-auto max-w-6xl px-4 pb-16 pt-8",
        )}
      >
        <PricingPlansBlock showHeading={false} />
      </div>

      <div
        className={cn(appMarketingSection, "container mx-auto px-4 pb-16")}
      >
        <div className="mx-auto max-w-4xl">
          <Card className={cn(appCard, "p-8")}>
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              How Credits Work
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Interviews</h3>
                <p className="text-sm text-gray-600">5 credits per minute</p>
                <p className="text-xs text-gray-500 mt-1">
                  30-min = 150 credits
                  <br />
                  60-min = 300 credits
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Resume Builder
                </h3>
                <p className="text-sm text-gray-600">
                  Unlimited ATS analysis and downloads
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Flexibility
                </h3>
                <p className="text-sm text-gray-600">Use credits as you need</p>
                <p className="text-xs text-gray-500 mt-1">
                  Mix interviews &<br />
                  resumes freely
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div
        className={cn(
          appMarketingSectionAlt,
          "px-4 pb-16 sm:px-6 lg:px-8",
        )}
      >
        <div className="mx-auto mt-4 max-w-3xl sm:mt-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className={cn(appCard, "p-6")}>
              <h3 className="font-semibold text-lg mb-2">
                What are credits and how do they work?
              </h3>
              <p className="text-gray-600">
                1 credit = ₹1. AI Interview Practice uses credits at 5 credits per
                minute. The resume builder is included with your plan and does
                not deduct credits from your balance.
              </p>
            </Card>
            <Card className={cn(appCard, "p-6")}>
              <h3 className="font-semibold text-lg mb-2">Do credits expire?</h3>
              <p className="text-gray-600">
                Credits in your wallet do not expire on a calendar schedule.
                Premium access is managed by your subscription renewal through
                Razorpay; if your plan lapses, you will not be able to start new
                paid-tier sessions until you renew.
              </p>
            </Card>
            <Card className={cn(appCard, "p-6")}>
              <h3 className="font-semibold text-lg mb-2">
                Can I purchase additional credits?
              </h3>
              <p className="text-gray-600">
                Yes! You can purchase additional credits anytime. They are added
                to your balance and used like other credits.
              </p>
            </Card>
            <Card className={cn(appCard, "p-6")}>
              <h3 className="font-semibold text-lg mb-2">
                Can I upgrade my plan?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade anytime. Unused credits from your
                current plan will be retained.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
