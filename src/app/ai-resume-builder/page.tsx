"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Sparkles,
  ArrowRight,
  Target,
  Brain,
  BarChart3,
  Star,
  Check,
  Palette,
  FileCheck,
  Download,
  Eye,
  TrendingUp,
  ScanSearch,
  Settings,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { AddToChromeButton } from "@/components/chrome-extension/AddToChromeButton";
import { MarketingFooter } from "@/components/MarketingFooter";
import { ResumeBuilderHeroPreview } from "@/components/marketing/ResumeBuilderHeroPreview";
import { SeoVideoSection } from "@/components/seo/SeoVideoSection";
import { resumeBuilderDemoVideo } from "@/lib/seo/marketing-video-content";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import {
  appMarketingSection,
  appMarketingSectionAlt,
  appMarketingSectionLight,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const trustedCompanies = [
  { name: "Razorpay", file: "razorpay.png" },
  { name: "Amazon", file: "amazon.png" },
  { name: "TCS", file: "tcs.png" },
  { name: "Accenture", file: "accenture.png" },
  { name: "Deloitte", file: "deloitte.png" },
  { name: "Bosch Group", file: "bosch-group.png" },
  { name: "Mercedes-Benz", file: "mercedes-benz.png" },
  { name: "Fortinet", file: "fortinet.png" },
  { name: "News Corp", file: "news-corp.png" },
  { name: "Walmart", file: "walmart.png" },
  { name: "PayPal", file: "paypal.png" },
  { name: "BCE Global Tech", file: "bce-global-tech.png" },
];

type Feature = {
  title: string;
  tagline: string;
  body: string;
  icon: LucideIcon;
  gradient: string;
};

const features: Feature[] = [
  {
    title: "ATS-Optimized Templates",
    tagline: "Pass the bots. Reach the desk.",
    body: "Layouts built for Applicant Tracking Systems—clean structure, parseable sections, and recruiter-friendly formatting.",
    icon: FileCheck,
    gradient: "from-slate-700 to-slate-900",
  },
  {
    title: "AI-Powered Writing",
    tagline: "Quantify your impact.",
    body: "Chat with AI to turn vague bullets into measurable achievements recruiters actually remember.",
    icon: Sparkles,
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    title: "50+ Professional Templates",
    tagline: "Look sharp in any industry.",
    body: "Pick from modern, executive, and creative designs—all tuned for ATS parsing and human readability.",
    icon: Palette,
    gradient: "from-cyan-500 to-sky-600",
  },
  {
    title: "Smart ATS Score",
    tagline: "Know your score before you apply.",
    body: "See how robot readers likely score your resume—and exactly what to fix before a human clicks.",
    icon: TrendingUp,
    gradient: "from-violet-500 to-violet-700",
  },
  {
    title: "Live Preview",
    tagline: "Edit and see instantly.",
    body: "Watch your resume update in real time as you refine content, layout, and section order.",
    icon: Eye,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "One-Click Export",
    tagline: "Ready when you are.",
    body: "Download polished PDF or Word files the moment your resume clears screening.",
    icon: Download,
    gradient: "from-amber-500 to-orange-600",
  },
];

const howItWorksSteps: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Choose a Template",
    body: "Pick from ATS-optimized designs built for your role and industry.",
    icon: FileText,
  },
  {
    title: "Fill Your Details",
    body: "Add experience, skills, and achievements—or import an existing resume.",
    icon: Settings,
  },
  {
    title: "Polish with AI",
    body: "Get instant wording improvements tuned for clarity and ATS parsing.",
    icon: Zap,
  },
  {
    title: "Score & Export",
    body: "Review your Smart ATS Score, then download PDF or Word when you're ready.",
    icon: Download,
  },
];

export default function ResumeBuilderPage() {
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const [currentTemplateSlide, setCurrentTemplateSlide] = useState(0);
  const templateCarouselViewportRef = useRef<HTMLDivElement>(null);
  const [templateCarouselWidth, setTemplateCarouselWidth] = useState(0);
  const [isBelowSm, setIsBelowSm] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsBelowSm(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const el = templateCarouselViewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setTemplateCarouselWidth(el.getBoundingClientRect().width);
    });
    ro.observe(el);
    setTemplateCarouselWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const step = isBelowSm ? 3 : 5;
    setCurrentTemplateSlide((s) => {
      const n = Math.floor(s / step) * step;
      return n >= TEMPLATES_CATALOG.length ? 0 : n;
    });
  }, [isBelowSm]);

  useEffect(() => {
    const node = howItWorksRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHowItWorksVisible(true);
        });
      },
      { threshold: 0.2 },
    );

    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

  useEffect(() => {
    const totalTemplates = TEMPLATES_CATALOG.length;
    const step = isBelowSm ? 3 : 5;
    const interval = setInterval(() => {
      setCurrentTemplateSlide((prev) => {
        const nextSlide = prev + step;
        return nextSlide >= totalTemplates ? 0 : nextSlide;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isBelowSm]);

  const templateCarouselTemplatesPerPage = isBelowSm ? 3 : 5;
  const templateCarouselSlideOffsetPx =
    templateCarouselWidth > 0
      ? (currentTemplateSlide / templateCarouselTemplatesPerPage) *
        templateCarouselWidth
      : 0;

  const heroTemplate = TEMPLATES_CATALOG[0];

  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
        <SiteHeader />

        {/* Hero Section */}
        <section
          className={cn(
            appMarketingSection,
            "relative overflow-hidden px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 md:pt-28 lg:pb-20 lg:pt-32",
          )}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={`hero-float-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 13 + 4) % 92}%`,
                  top: `${(i * 19 + 6) % 88}%`,
                  opacity: 0.08,
                  animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <FileText className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
                ) : i % 3 === 1 ? (
                  <Sparkles className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
                ) : (
                  <FileCheck className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
                )}
              </div>
            ))}
          </div>

          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 space-y-4 text-center sm:space-y-5 md:space-y-6 lg:order-1 lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Resume Builder</span>
                </div>

                <h1 className="mb-4 text-[1.22rem] font-bold leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-[1.46rem] md:text-[1.625rem] lg:text-[2.15rem] xl:text-[2.28rem]">
                  <span className="block">Build an ATS-Proof Resume with</span>
                  <span className="block">
                    Your{" "}
                    <span className="text-primary">AI Resume Builder</span>
                  </span>
                </h1>

                <p className="mx-auto max-w-xl px-2 text-base leading-relaxed text-gray-600 sm:px-0 sm:text-lg lg:text-xl">
                  Real-time resume analysis, instant AI improvements, and a Smart
                  ATS Score—so you pass the bots and reach recruiters.
                </p>

                <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 sm:px-0 lg:justify-start">
                  <Link href="/dashboard/resumes/new" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="h-auto w-full bg-primary px-5 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-900 hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base"
                    >
                      Try Builder Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <AddToChromeButton variant="outline" size="lg" />
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

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm font-medium text-gray-500 lg:justify-start">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>50+ ATS templates</span>
                  </div>
                </div>
              </div>

              <div className="relative order-1 flex justify-center lg:order-2 lg:justify-end">
                <ResumeBuilderHeroPreview
                  templateThumbnail={heroTemplate.thumbnail}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trusted Companies */}
        <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-white to-slate-50/80 py-10 sm:py-14">
          <div
            className="overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          >
            <div className="flex w-max animate-trusted-logos-marquee items-center">
              {[...trustedCompanies, ...trustedCompanies].map(
                (company, index) => (
                  <div
                    key={`${company.file}-${index}`}
                    className="flex w-[42vw] shrink-0 items-center justify-center px-5 sm:w-[24vw] sm:px-6 md:w-[18vw] lg:w-[14vw]"
                  >
                    <Image
                      src={`/company-logos/${company.file}`}
                      alt={`${company.name} logo`}
                      width={180}
                      height={56}
                      className="h-8 w-auto max-w-[130px] object-contain opacity-50 grayscale transition-all duration-300 hover:scale-105 hover:opacity-100 hover:grayscale-0 sm:h-10 sm:max-w-[150px]"
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          ref={howItWorksRef}
          className={cn(
            appMarketingSectionLight,
            "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
          )}
        >
          <div className="container mx-auto max-w-7xl">
            <div
              className={`mb-12 text-center transition-all duration-700 sm:mb-16 ${
                howItWorksVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                <span>How It Works</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Build a recruiter-ready{" "}
                <span className="text-primary">ATS resume</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                Choose a template, polish with AI, check your score, and
                export—four simple steps to a stronger application.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
              {howItWorksSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className={`group relative flex flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl ${
                      howItWorksVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    }`}
                    style={{
                      transitionDelay: howItWorksVisible
                        ? `${0.1 + index * 0.1}s`
                        : "0s",
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md transition-transform group-hover:scale-105">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-4xl font-bold text-primary/15">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* See It In Action */}
        <section
          className={cn(
            appMarketingSection,
            "relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
          )}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={`action-float-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 16 + 4) % 92}%`,
                  top: `${(i * 21 + 6) % 88}%`,
                  opacity: 0.07,
                  animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <Brain className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
                ) : i % 3 === 1 ? (
                  <FileText className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
                ) : (
                  <ScanSearch className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                )}
              </div>
            ))}
          </div>

          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="mb-10 text-center sm:mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                <span>See It In Action</span>
              </div>
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                From blank page to{" "}
                <span className="text-primary">ATS-ready resume</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                Watch content get polished, scored, and export-ready—the way
                shortlists are really decided.
              </p>
            </div>

            <SeoVideoSection
              content={{
                ...resumeBuilderDemoVideo,
                thumbnailUrl: heroTemplate.thumbnail,
              }}
              variant="feature"
              className="relative mx-auto w-full max-w-4xl"
              playerClassName="overflow-hidden rounded-lg border border-border bg-white shadow-2xl sm:rounded-xl sm:border-2 md:border-4"
              autoPlay
              loop
              muted
            >
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Live Builder
              </div>
            </SeoVideoSection>

            {/* Template Carousel */}
            <div className="mt-12 sm:mt-16">
              <div className="mb-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  50+ ATS-ready templates
                </h3>
                <p className="mt-2 text-gray-600">
                  Pick a design, customize in minutes, and export when you&apos;re
                  ready.
                </p>
              </div>

              <div ref={templateCarouselViewportRef} className="overflow-hidden">
                <div
                  className="flex gap-2 transition-transform duration-700 ease-in-out sm:gap-3"
                  style={{
                    transform: `translateX(-${templateCarouselSlideOffsetPx}px)`,
                  }}
                >
                  {[...TEMPLATES_CATALOG, ...TEMPLATES_CATALOG].map(
                    (template, index) => (
                      <div
                        key={`${template.id}-${index}`}
                        className="max-sm:min-w-0 max-sm:flex-[0_0_calc((100%-1rem)/3)] shrink-0 sm:min-w-[calc(20%-0.8rem)]"
                      >
                        <div className="group relative overflow-hidden rounded-lg border border-border bg-white shadow-md transition-all hover:border-primary/40 hover:shadow-xl">
                          <div className="relative aspect-[210/297] bg-white">
                            <Image
                              src={template.thumbnail}
                              alt={template.name}
                              fill
                              className="object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <Link
                                href={`/dashboard/resumes/new?template=${template.id}&skipTemplate=true`}
                              >
                                <Button className="bg-primary text-white hover:bg-slate-900">
                                  Use Template
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                          <div className="border-t border-border/60 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="truncate text-xs font-semibold text-slate-900">
                                {template.name}
                              </h4>
                              {template.popular ? (
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                  Popular
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-2">
                {Array.from({
                  length: Math.ceil(
                    TEMPLATES_CATALOG.length / templateCarouselTemplatesPerPage,
                  ),
                }).map((_, index) => {
                  const currentPage = Math.floor(
                    (currentTemplateSlide % TEMPLATES_CATALOG.length) /
                      templateCarouselTemplatesPerPage,
                  );
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        setCurrentTemplateSlide(
                          index * templateCarouselTemplatesPerPage,
                        )
                      }
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        currentPage === index
                          ? "w-8 bg-primary"
                          : "w-2 bg-gray-300",
                      )}
                      aria-label={`Go to template page ${index + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className={cn(
            "relative overflow-hidden border-y border-[#7367F0]/20 bg-gradient-to-br from-[#7367F0]/[0.16] via-[#7367F0]/[0.06] to-[#7367F0]/[0.22]",
            "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
          )}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div
                key={`feat-float-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 11) % 92}%`,
                  top: `${(i * 17) % 88}%`,
                  opacity: 0.12,
                  animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.45}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <FileText className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
                ) : i % 3 === 1 ? (
                  <Target className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
                ) : (
                  <BarChart3 className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
                )}
              </div>
            ))}
          </div>

          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="mb-12 text-center sm:mb-16">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                <span>Why It Works</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Don&apos;t just apply.{" "}
                <span className="text-primary">Get noticed.</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                Skip generic resumes and build one tuned for how recruiters and
                ATS systems actually evaluate candidates.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative flex h-full min-h-[230px] flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
                  >
                    <div className="absolute inset-0 rounded-xl bg-muted/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="mb-4 flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105",
                            feature.gradient,
                          )}
                        >
                          <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold text-slate-900">
                            {feature.title}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-gray-800">
                            {feature.tagline}
                          </p>
                        </div>
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-gray-600">
                        {feature.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <Link href="/ats-checker">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-200 text-gray-700 hover:!bg-slate-900 hover:!text-white"
                >
                  Check your ATS score
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className={cn(
            appMarketingSectionAlt,
            "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
          )}
        >
          <div className="container relative z-10 mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:mb-6 sm:text-4xl lg:text-5xl">
              Don&apos;t just apply.{" "}
              <span className="text-primary">Build to win.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 sm:mb-10 sm:text-xl">
              Start with ATS-optimized templates, real-time AI improvements, and
              a Smart ATS Score that helps you reach the recruiter&apos;s desk.
            </p>
            <Link href="/dashboard/resumes/new">
              <Button
                size="lg"
                className="h-auto bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-slate-900 hover:shadow-xl sm:py-5 sm:text-lg"
              >
                Start Building Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm font-medium text-gray-500">
              No credit card required · Instant feedback
            </p>
          </div>
        </section>

        <MarketingFooter />
      </div>
  );
}
