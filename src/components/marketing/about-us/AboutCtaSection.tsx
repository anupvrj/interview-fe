"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimateIn } from "@/components/marketing/about-us/AnimateIn";
import { AboutSectionHeader } from "@/components/marketing/about-us/AboutSectionHeader";
import { PricingFAQAccordion } from "@/components/pricing/PricingFAQAccordion";
import { Button } from "@/components/ui/button";
import { ABOUT_US_FAQ } from "@/lib/aboutUsContent";
import { cn } from "@/lib/utils";

export function AboutFaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-muted/40 px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
    >
      <div className="container mx-auto max-w-3xl">
        <AboutSectionHeader
          badge="FAQ"
          title="Frequently asked questions"
          description="Everything you need to know about Interview Trix and how we help candidates prepare."
        />
        <AnimateIn delay={80}>
          <PricingFAQAccordion items={ABOUT_US_FAQ} />
        </AnimateIn>
      </div>
    </section>
  );
}

export function AboutCtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="container mx-auto max-w-4xl">
        <AnimateIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5b54dc] via-[#6d5ef0] to-[#7a72f2] px-6 py-12 text-center shadow-xl sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                Ready to prepare the modern way?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
                Join thousands of candidates using Interview Trix to build stronger
                resumes, practice smarter, and land interviews with confidence.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className={cn(
                      "h-12 bg-white px-8 text-primary hover:bg-white/90",
                    )}
                  >
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 border-white/30 bg-white/10 px-8 text-white hover:bg-white/20 hover:text-white"
                  >
                    View plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
