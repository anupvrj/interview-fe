"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  LayoutGrid,
  MessageCircle,
  Mic,
  MonitorPlay,
  Network,
  PlayCircle,
  Scale,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { SystemDesignHeroPreview } from "@/components/system-design/SystemDesignHeroPreview";
import { Button } from "@/components/ui/button";
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

const productStats = [
  {
    value: "10",
    label: "Curated system design prompts",
    icon: LayoutGrid,
  },
  {
    value: "4",
    label: "Weighted rubric dimensions",
    icon: BarChart3,
  },
  {
    value: "3",
    label: "Live feedback channels",
    detail: "Voice, diagram submit, text chat",
    icon: MessageCircle,
  },
];

type WhyCard = {
  title: string;
  tagline: string;
  body: string;
  icon: LucideIcon;
  gradient: string;
  href?: string;
  footer?: string;
};

const whyCards: WhyCard[] = [
  {
    title: "Excalidraw whiteboard",
    tagline: "Draw like the real round.",
    body: "Industry-standard Excalidraw canvas with shapes, arrows, and labels. Your board autosaves throughout the session and appears on your final report.",
    icon: LayoutGrid,
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    title: "AI Live interviewer",
    tagline: "Talk through trade-offs out loud.",
    body: "Start a live voice session with camera and screen capture. The AI probes requirements, scaling, failure modes, and consistency—the way senior panels do.",
    icon: Mic,
    gradient: "from-cyan-500 to-sky-600",
  },
  {
    title: "Think while you draw",
    tagline: "Build the dual skill senior rounds test.",
    body: "Practice explaining your architecture as you sketch—clarifying requirements, naming components, and justifying data flows in real time, not after the fact.",
    icon: Network,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Sharpen your scope instinct",
    tagline: "Stop jumping straight to boxes.",
    body: "Live follow-ups train you to clarify capacity, latency, and failure handling before you over-engineer—the habit that separates strong candidates from diagram memorizers.",
    icon: Target,
    gradient: "from-violet-500 to-violet-700",
  },
  {
    title: "Know where you're weak",
    tagline: "Improve session by session.",
    body: "Get honest feedback on how you scope problems, design components, handle scaling, and defend trade-offs—so every practice round targets a skill you can actually work on.",
    icon: Scale,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    title: "Show up interview-ready",
    tagline: "Replay, reflect, repeat.",
    body: "Review what you said, how your design evolved, and what to improve next—then run another session until you're confident walking into a senior system design round.",
    icon: MonitorPlay,
    gradient: "from-slate-700 to-slate-900",
  },
];

const howSteps = [
  {
    title: "Choose a prompt",
    body: 'Pick from 10 curated scenarios—URL shortener, chat, payment flow, search engine, and more—or hit "Surprise me" for a random prompt.',
    icon: PlayCircle,
  },
  {
    title: "Whiteboard your architecture",
    body: "Draw components, APIs, queues, caches, and data flows on an Excalidraw canvas. Edits autosave so you can resume an active session anytime.",
    icon: LayoutGrid,
  },
  {
    title: "Run the live voice interview",
    body: "Start the AI Live session, explain your design out loud, submit diagram snapshots for spoken feedback, and use text chat when you need a nudge.",
    icon: Mic,
  },
  {
    title: "End session & review scores",
    body: "Finalize to get rubric scores on scope, architecture, scaling, and communication—then open the detailed report with recommendations and PDF export.",
    icon: BarChart3,
  },
];

const rubricDimensions = [
  {
    name: "Scope & requirements",
    weight: "15%",
    body: "Did you clarify functional and non-functional requirements before jumping into boxes and arrows?",
  },
  {
    name: "Component architecture",
    weight: "25%",
    body: "Are the core services, data stores, and boundaries on your diagram appropriate for the problem?",
  },
  {
    name: "Scaling & deep dive",
    weight: "40%",
    body: "How well did you handle throughput, sharding, caching, queues, and failure modes under follow-up pressure?",
  },
  {
    name: "Trade-offs & communication",
    weight: "20%",
    body: "Did you explain why you chose each approach—not just name technologies—and stay structured while defending your design?",
  },
];

export function SystemDesignLandingSections() {
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = [{ ref: howItWorksRef, setter: setHowItWorksVisible }];

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
        id="ai-system-design-stats"
        className={cn(
          appMarketingSectionAlt,
          "px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:py-20",
        )}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center sm:mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>What you get in every session</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Built for{" "}
              <span className="text-primary">senior system design rounds</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              A live whiteboard, voice interviewer, and rubric scoring pipeline
              modeled on how architecture interviews actually run—not a passive
              diagram quiz.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
            {productStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-7"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary sm:h-14 sm:w-14">
                    <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                      {stat.value}
                    </div>
                    <div className="text-sm text-primary sm:text-base">
                      {stat.label}
                    </div>
                    {stat.detail ? (
                      <div className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                        {stat.detail}
                      </div>
                    ) : null}
                  </div>
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
                <LayoutGrid className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
              ) : i % 3 === 1 ? (
                <Network className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
              ) : (
                <BarChart3 className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
              )}
            </div>
          ))}
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="mb-12 text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <span>Platform capabilities</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Everything in one{" "}
              <span className="text-primary">architecture practice room</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              Whiteboard, voice, diagram review, chat, scoring, recording, and
              export—wired together the way a real system design loop should
              feel.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyCards.map((card) => {
              const Icon = card.icon;
              const cardContent = (
                <>
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
                    {card.footer ? (
                      <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
                        {card.footer}
                        <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    ) : null}
                  </div>
                </>
              );

              const cardClassName =
                "group relative flex h-full min-h-[220px] flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl";

              if (card.href) {
                return (
                  <Link key={card.title} href={card.href} className={cardClassName}>
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div key={card.title} className={cardClassName}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className={cn(
          appMarketingSectionLight,
          "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
        )}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <span>Scoring rubric</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Scored the way{" "}
              <span className="text-primary">senior panels evaluate</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              When you end a session, your voice transcript, chat history, and
              final whiteboard are evaluated against four weighted
              dimensions—with the heaviest weight on scaling depth.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rubricDimensions.map((dimension) => (
              <div
                key={dimension.name}
                className="rounded-xl border border-border/80 bg-card p-5 shadow-card"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {dimension.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {dimension.weight}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">
                  {dimension.body}
                </p>
              </div>
            ))}
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
              Four steps from prompt to{" "}
              <span className="text-primary">scored report</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              Start on the dashboard, run the live session, then review rubric
              scores and a detailed report you can replay, share, or export as
              PDF.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
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
                <LayoutGrid className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
              ) : i % 3 === 1 ? (
                <Network className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
              ) : (
                <BarChart3 className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
              )}
            </div>
          ))}
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
              <span>Inside the workspace</span>
            </div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Whiteboard, voice, and problem context{" "}
              <span className="text-primary">in one view</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              The session workspace combines an Excalidraw canvas, a collapsible
              problem statement with scale requirements, an AI Live voice
              panel, optional text chat, and diagram submit controls—the same
              surfaces you use during a real architecture interview.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-white shadow-2xl sm:rounded-xl sm:border-2 md:border-4">
            <div className="flex justify-center p-6 sm:p-8 md:p-10">
              <SystemDesignHeroPreview />
            </div>
            <div className="absolute right-3 top-3 z-10 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:text-sm">
              Architecture canvas
            </div>
          </div>
        </div>
      </section>

      <section
        className={cn(
          appMarketingSectionLight,
          "relative px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
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
                <LayoutGrid className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
              ) : i % 4 === 1 ? (
                <Network className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
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
            Walk in having already run{" "}
            <span className="text-primary">the full loop</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 sm:mb-10 sm:text-xl">
            Choose a curated prompt, whiteboard your architecture, defend it in
            a live AI voice session, and review a rubric report with clear next
            steps—before your next senior system design interview.
          </p>
          <Button
            asChild
            size="lg"
            className="h-auto bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-slate-900 hover:shadow-xl sm:py-5 sm:text-lg"
          >
            <Link href="/dashboard/system-design">
              Start System Design Session
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-4 text-sm font-medium text-gray-500">
            Excalidraw whiteboard · AI Live interviewer · Rubric report & PDF
          </p>
        </div>
      </section>
    </>
  );
}
