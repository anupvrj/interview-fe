"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { Button } from "@/components/ui/button";
import { appMarketingSection, appMarketingSectionAlt } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

export type PracticeLandingStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type PracticeLandingFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  footer?: string;
};

export type PracticeProductLandingProps = {
  badge: string;
  headingFull: string;
  /** Substring in headingFull rendered in primary colour */
  headingAccent: string;
  topSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  heroCtaSignedInHref: string;
  heroCtaSignedOutHref: string;
  floatIcons: LucideIcon[];
  preview: ReactNode;
  howItWorksTitle?: string;
  howItWorksSubtitle?: string;
  steps: PracticeLandingStep[];
  actionTitle: string;
  actionDescription: string;
  actionPreview: ReactNode;
  featuresTitle: string;
  featuresSubtitle: string;
  features: PracticeLandingFeature[];
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
  ctaSignedInHref: string;
  ctaSignedOutHref: string;
};

function AuthCtaLink({
  signedInHref,
  signedOutHref,
  children,
  className,
}: {
  signedInHref: string;
  signedOutHref: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <SignedIn>
        <Link href={signedInHref} className={className}>
          {children}
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href={signedOutHref} className={className}>
          {children}
        </Link>
      </SignedOut>
    </>
  );
}

export function PracticeProductLanding({
  badge,
  headingFull,
  headingAccent,
  topSubtitle,
  heroTitle,
  heroDescription,
  heroCtaLabel,
  heroCtaSignedInHref,
  heroCtaSignedOutHref,
  floatIcons,
  preview,
  howItWorksTitle = "How It Works",
  howItWorksSubtitle = "Configure → practice → get scored → iterate with clear next steps",
  steps,
  actionTitle,
  actionDescription,
  actionPreview,
  featuresTitle,
  featuresSubtitle,
  features,
  ctaTitle,
  ctaDescription,
  ctaLabel,
  ctaSignedInHref,
  ctaSignedOutHref,
}: PracticeProductLandingProps) {
  const [headingText, setHeadingText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [headingComplete, setHeadingComplete] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const accentStart = headingFull.indexOf(headingAccent);

  useEffect(() => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < headingFull.length) {
        setHeadingText(headingFull.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setHeadingComplete(true);
      }
    }, 100);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(typeInterval);
  }, [headingFull]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHowItWorksVisible(true);
        });
      },
      { threshold: 0.2 },
    );
    const node = howItWorksRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

  const renderHeading = () => {
    if (accentStart < 0) {
      return (
        <span className="text-foreground">
          {headingText}
          {headingText.length >= headingFull.length ? (
            <span
              className={cn(
                "ml-1 inline-block h-[1em] w-0.5 bg-primary align-middle",
                showCursor ? "opacity-100" : "opacity-0",
              )}
            />
          ) : null}
        </span>
      );
    }

    const beforeAccent = headingText.substring(
      0,
      Math.min(accentStart, headingText.length),
    );
    const accentPart =
      headingText.length > accentStart
        ? headingText.substring(
            accentStart,
            Math.min(accentStart + headingAccent.length, headingText.length),
          )
        : "";
    const afterAccent =
      headingText.length > accentStart + headingAccent.length
        ? headingText.substring(accentStart + headingAccent.length)
        : "";

    return (
      <>
        <span className="block sm:inline text-foreground">{beforeAccent}</span>
        <span className="block sm:inline">
          <span className="text-primary">{accentPart}</span>
          <span className="text-foreground">{afterAccent}</span>
          {headingText.length >= headingFull.length ? (
            <span
              className={cn(
                "ml-1 inline-block h-[1em] w-0.5 bg-primary align-middle",
                showCursor ? "opacity-100" : "opacity-0",
              )}
              style={{
                animation: headingComplete ? "blink-caret 1s infinite" : "none",
              }}
            />
          ) : null}
        </span>
      </>
    );
  };

  return (
    <div className="min-h-screen scroll-smooth bg-background selection:bg-info-muted">
      <SiteHeader />

      <section
        className={cn(
          appMarketingSection,
          "relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pt-32",
        )}
      >
        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-muted px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              <span>{badge}</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl">
              {renderHeading()}
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl md:text-2xl">
              {topSubtitle}
            </p>
          </div>
        </div>
      </section>

      <section
        className={cn(
          appMarketingSectionAlt,
          "relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 md:pb-24 lg:pb-28 lg:pt-24",
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatIcons.flatMap((Icon, i) =>
            [...Array(4)].map((_, j) => {
              const key = `${Icon.displayName ?? "icon"}-${i}-${j}`;
              const idx = i * 4 + j;
              return (
                <div
                  key={key}
                  className="absolute"
                  style={{
                    left: `${(idx * 14) % 100}%`,
                    top: `${(idx * 18 + 5) % 100}%`,
                    opacity: 0.08,
                    animation: `float-${idx % 3} ${6 + (idx % 3) * 2}s ease-in-out infinite`,
                    animationDelay: `${idx * 0.4}s`,
                  }}
                >
                  <Icon className="h-10 w-10 text-primary/70 sm:h-14 sm:w-14" />
                </div>
              );
            }),
          )}
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative z-10 space-y-6 text-center lg:text-left">
              <h2 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-3xl md:text-4xl lg:text-5xl">
                {heroTitle}
              </h2>
              <p className="mx-auto max-w-xl px-2 text-base leading-relaxed text-gray-600 sm:px-0 sm:text-lg md:text-xl lg:mx-0">
                {heroDescription}
              </p>
              <div className="px-2 sm:px-0">
                <p className="mb-3 text-center text-xs text-gray-500 sm:mb-4 sm:text-sm lg:text-left">
                  Trusted by candidates at top companies
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 opacity-60 sm:gap-6 lg:justify-start">
                  {["Amazon", "Flipkart", "Razorpay", "TCS", "Infosys"].map(
                    (name) => (
                      <div
                        key={name}
                        className="text-lg font-bold text-gray-700 sm:text-xl"
                      >
                        {name}
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 sm:px-0 lg:justify-start">
                <AuthCtaLink
                  signedInHref={heroCtaSignedInHref}
                  signedOutHref={heroCtaSignedOutHref}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="h-auto w-full bg-primary px-5 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-900 hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base"
                  >
                    {heroCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </AuthCtaLink>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-600 sm:text-sm">
                    4.9/5
                  </span>
                </div>
              </div>
            </div>
            <div className="relative order-1 flex justify-center lg:order-2 lg:justify-start">
              {preview}
            </div>
          </div>
        </div>
      </section>

      <section
        ref={howItWorksRef}
        className="bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28"
      >
        <div className="container mx-auto max-w-7xl">
          <div
            className={cn(
              "mb-12 text-center transition-all duration-700 sm:mb-16",
              howItWorksVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
              {howItWorksTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
              {howItWorksSubtitle}
            </p>
          </div>
          <div className="relative">
            <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className={cn(
                      "rounded-2xl border-2 border-border bg-white p-4 shadow-lg transition-all hover:border-border hover:shadow-xl sm:p-5",
                      howItWorksVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0",
                    )}
                    style={{
                      transitionDelay: howItWorksVisible
                        ? `${0.1 + index * 0.1}s`
                        : "0s",
                      transitionDuration: "0.6s",
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-md sm:h-20 sm:w-20">
                        <Icon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                      </div>
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground sm:text-base">
                        {index + 1}
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-slate-900 sm:text-xl">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 sm:text-base">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-muted/30 px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:py-20">
        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="mb-2 text-3xl font-bold text-slate-900 sm:mb-3 sm:text-4xl md:text-5xl">
              {actionTitle}
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
              {actionDescription}
            </p>
          </div>
          <div className="flex justify-center">{actionPreview}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-muted px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28">
        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
              {featuresTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
              {featuresSubtitle}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              const body = (
                <>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-md">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                  {feature.footer ? (
                    <p className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                      {feature.footer} <ArrowRight className="h-4 w-4" />
                    </p>
                  ) : null}
                </>
              );
              const cardClass =
                "rounded-2xl border-2 border-border bg-white p-6 shadow-lg transition-all hover:border-border hover:shadow-xl sm:p-8";

              if (feature.href) {
                return (
                  <Link
                    key={feature.title}
                    href={feature.href}
                    className={cn(cardClass, "block text-left")}
                  >
                    {body}
                  </Link>
                );
              }
              return (
                <div key={feature.title} className={cardClass}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gray-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28">
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:mb-6 sm:text-4xl md:text-5xl">
            {ctaTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 sm:mb-10 sm:text-xl">
            {ctaDescription}
          </p>
          <AuthCtaLink
            signedInHref={ctaSignedInHref}
            signedOutHref={ctaSignedOutHref}
          >
            <Button
              size="lg"
              className="h-12 !bg-primary px-8 text-base font-medium text-white shadow-sm transition-all hover:opacity-90 sm:text-lg"
            >
              {ctaLabel}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </AuthCtaLink>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
