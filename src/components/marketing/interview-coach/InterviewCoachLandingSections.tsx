"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  FileText,
  Globe,
  Mic,
  PlayCircle,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeoVideoSection } from "@/components/seo/SeoVideoSection";
import { aiInterviewCoachDemoVideo } from "@/lib/seo/marketing-video-content";
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

function useCountUp(
  end: number,
  duration = 2000,
  suffix = "",
  prefix = "",
  delay = 0,
  sectionId = "ai-interview-coach-stats",
) {
  const [count, setCount] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || hasStartedRef.current) return;
        hasStartedRef.current = true;

        const run = () => {
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(end * easeOutQuart));
            if (progress < 1) requestAnimationFrame(animate);
            else setCount(end);
          };
          requestAnimationFrame(animate);
        };

        if (delay > 0) window.setTimeout(run, delay);
        else run();
      },
      { threshold: 0.25 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [end, duration, delay, sectionId]);

  return prefix + count.toLocaleString("en-IN") + suffix;
}

type WhyCard = {
  title: string;
  tagline: string;
  body: string;
  icon: LucideIcon;
  gradient: string;
};

const whyCards: WhyCard[] = [
  {
    title: "Conversational Voice AI",
    tagline: "Talk, don't type.",
    body: "Answer out loud in a real-time voice conversation that feels like sitting across from a live recruiter.",
    icon: Mic,
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    title: "Company-Specific Questions",
    tagline: "Target your exact employer.",
    body: "Name your target company and role, and the AI shapes questions around how that team actually interviews.",
    icon: Building2,
    gradient: "from-cyan-500 to-sky-600",
  },
  {
    title: "Detailed Reports & Scores",
    tagline: "Know exactly what to fix.",
    body: "Get a full transcript plus Technical, Behavioral, Communication, and Confidence scores with clear next steps.",
    icon: BarChart3,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    title: "Resume-Aware Follow-ups",
    tagline: "Built around your story.",
    body: "Use your saved resume or upload a PDF—the AI digs into your real projects and pushes for specifics.",
    icon: FileText,
    gradient: "from-slate-700 to-slate-900",
  },
];

const howSteps = [
  {
    title: "Set up your session",
    body: "Pick your role, target company, language, and duration in seconds.",
    icon: PlayCircle,
  },
  {
    title: "Talk to the AI interviewer",
    body: "Answer behavioral and technical questions out loud in a live voice session.",
    icon: Mic,
  },
  {
    title: "Review your report",
    body: "Read your transcript, category scores, and exactly what to improve next.",
    icon: BarChart3,
  },
];

const prepGameCards = [
  {
    title: "Voice-first realism",
    body: "Practice like the real thing—speak your answers aloud and build muscle memory for interview day.",
    icon: Mic,
  },
  {
    title: "Company-specific prep",
    body: "Simulate the exact employer, role, and seniority level you'll face—not generic flashcards.",
    icon: Target,
  },
  {
    title: "Score-driven improvement",
    body: "Category scores on technical, behavioral, and communication skills show exactly where to focus next.",
    icon: TrendingUp,
  },
  {
    title: "Interview-ready iX Scores",
    body: "Earn verified iX Scores that recruiters search for—proof of performance, not just resume claims.",
    icon: Rocket,
  },
];

export function InterviewCoachLandingSections() {
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [gameVisible, setGameVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  const sessionCount = useCountUp(2000, 2200, "+", "", 0);
  const industryCount = useCountUp(8, 1800, "+", "", 150);

  useEffect(() => {
    const nodes = [
      { ref: howItWorksRef, setter: setHowItWorksVisible },
      { ref: gameRef, setter: setGameVisible },
    ];

    const observers = nodes.map(({ ref, setter }) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setter(true);
          });
        },
        { threshold: 0.2 },
      );
      if (ref.current) observer.observe(ref.current);
      return { observer, ref };
    });

    return () => {
      observers.forEach(({ observer, ref }) => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  return (
    <>
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
            {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
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
            ))}
          </div>
        </div>
      </section>

      <section
        id="ai-interview-coach-stats"
        className={cn(
          appMarketingSectionAlt,
          "px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:py-20",
        )}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center sm:mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI interview practice at a glance</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Trusted practice{" "}
              <span className="text-primary">across industries</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary sm:h-14 sm:w-14">
                <Mic className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                  {sessionCount}
                </div>
                <div className="text-sm text-primary sm:text-base">
                  AI mock interview sessions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary sm:h-14 sm:w-14">
                <Globe className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                  {industryCount}
                </div>
                <div className="text-sm text-primary sm:text-base">
                  Industries covered
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary sm:h-14 sm:w-14">
                <BarChart3 className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                  4.9
                </div>
                <div className="text-sm text-primary sm:text-base">
                  Average candidate rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={gameRef}
        className={cn(
          appMarketingSectionLight,
          "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
        )}
      >
        <div className="container mx-auto max-w-7xl">
          <div
            className={cn(
              "mb-12 text-center transition-all duration-700 sm:mb-16",
              gameVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              <span>Changing the interview prep game</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              How InterviewTrix is{" "}
              <span className="text-primary">transforming prep</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              Candidates rehearse with realistic voice AI, earn verified iX
              Scores, and show up interview-ready—before recruiters ever open
              their resume.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
            {prepGameCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={cn(
                    "group relative flex flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl",
                    gameVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0",
                  )}
                  style={{
                    transitionDelay: gameVisible
                      ? `${0.1 + index * 0.1}s`
                      : "0s",
                  }}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md transition-transform group-hover:scale-105">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
                <Mic className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
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
              <span>Why AI Interview Coach</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Don&apos;t just practice.{" "}
              <span className="text-primary">Perform.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              Skip generic Q&amp;A and simulate the exact interview you&apos;ll
              face—right down to the company, role, and language.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group relative flex h-full min-h-[220px] flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
                >
                  <div className="absolute inset-0 rounded-xl bg-muted/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex h-full flex-col">
                    <div className="mb-4 flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105",
                          card.gradient,
                        )}
                      >
                        <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900">
                          {card.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {card.tagline}
                        </p>
                      </div>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-gray-600">
                      {card.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        ref={howItWorksRef}
        className={cn(
          appMarketingSection,
          "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
        )}
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <span>How it works</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Three steps to{" "}
              <span className="text-primary">interview-ready</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              Configure your AI mock interview, practice answers out loud, and
              review category scores—repeat until every response is
              shortlist-worthy.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
            {howSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={cn(
                    "group relative flex flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl",
                    howItWorksVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0",
                  )}
                  style={{
                    transitionDelay: howItWorksVisible
                      ? `${0.1 + index * 0.12}s`
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

      <section
        className={cn(
          appMarketingSection,
          "relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={`spotlight-float-${i}`}
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
                <Mic className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
              ) : (
                <BarChart3 className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
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
              Watch voice mock interviews{" "}
              <span className="text-primary">in action</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              See realistic AI interview practice live—adaptive questions,
              instant feedback, and detailed reports that help you earn verified
              iX Scores recruiters search for.
            </p>
          </div>

          <SeoVideoSection
            content={aiInterviewCoachDemoVideo}
            variant="feature"
            className="relative mx-auto w-full max-w-4xl"
            playerClassName="overflow-hidden rounded-lg border border-border bg-white shadow-2xl sm:rounded-xl sm:border-2 md:border-4"
            autoPlay
            loop
            muted
          >
            <div className="absolute right-3 top-3 z-10 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:text-sm">
              AI mock interview
            </div>
          </SeoVideoSection>
        </div>
      </section>

      <section
        className={cn(
          appMarketingSectionLight,
          "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={`cta-float-${i}`}
              className="absolute"
              style={{
                left: `${(i * 13 + 4) % 92}%`,
                top: `${(i * 19 + 6) % 88}%`,
                opacity: 0.1,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {i % 4 === 0 ? (
                <Mic className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
              ) : i % 4 === 1 ? (
                <Brain className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
              ) : i % 4 === 2 ? (
                <BarChart3 className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
              ) : (
                <Target className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
              )}
            </div>
          ))}
        </div>

        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:mb-6 sm:text-4xl lg:text-5xl">
            Don&apos;t just apply.{" "}
            <span className="text-primary">Rehearse to win.</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 sm:mb-10 sm:text-xl">
            Transform how you sound and show up—with a voice-based AI mock
            interview and a report that tells you exactly what to improve before
            offer week.
          </p>
          <Button
            asChild
            size="lg"
            className="h-auto bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-slate-900 hover:shadow-xl sm:py-5 sm:text-lg"
          >
            <Link href="/dashboard/interviews/new">
              Start Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-4 text-sm font-medium text-gray-500">
            No credit card required · Instant feedback
          </p>
        </div>
      </section>
    </>
  );
}
