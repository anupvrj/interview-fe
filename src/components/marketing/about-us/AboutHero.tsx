"use client";

import { AnimateIn } from "@/components/marketing/about-us/AnimateIn";
import { appMarketingSectionLight } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

export function AboutHero() {
  return (
    <section
      id="about-hero"
      className={cn(
        appMarketingSectionLight,
        "relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20",
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto max-w-4xl text-center">
        <AnimateIn>
          <span className="mb-6 inline-flex rounded-full border border-primary/20 bg-background/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
            About Interview Trix
          </span>
        </AnimateIn>

        <AnimateIn delay={60}>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.08]">
            Redefining interview prep for the{" "}
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              AI hiring era
            </span>
          </h1>
        </AnimateIn>

        <AnimateIn delay={120}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Hiring runs on ATS filters, AI screeners, and company-specific rounds
            long before you meet a recruiter. Interview Trix helps you win at
            every stage—not just the final interview.
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}
