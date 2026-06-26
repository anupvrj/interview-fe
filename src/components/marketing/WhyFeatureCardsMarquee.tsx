"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FilePenLine,
  MicVocal,
  Network,
  ScanSearch,
  SquareCode,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureCard = {
  title: string;
  tagline: string;
  body: string;
  icon: LucideIcon;
  gradient: string;
  href?: string;
  cta?: string;
};

const featureCards: FeatureCard[] = [
  {
    title: "AI Resume Builder",
    tagline: "Pass the bots. Reach the desk.",
    body: "Chat with AI to generate quantified achievements and format an ATS-proof profile using 50+ templates.",
    icon: FilePenLine,
    gradient: "from-slate-700 to-slate-900",
    href: "/ai-resume-builder",
    cta: "Build your resume",
  },
  {
    title: "Resume ATS Checker",
    tagline: "Know your score before you apply.",
    body: "Run a semantic analysis to instantly fix missing keywords and formatting errors to beat software filters.",
    icon: ScanSearch,
    gradient: "from-violet-500 to-violet-700",
    href: "/ats-checker",
    cta: "Check your score",
  },
  {
    title: "Live AI Mock Interviews",
    tagline: "Face the pressure. Master the pitch.",
    body: "Practice in a voice-first studio where our AI remembers your past answers and dynamically scales difficulty.",
    icon: MicVocal,
    gradient: "from-indigo-500 to-purple-600",
    href: "/ai-interview-coach",
    cta: "Start mock interview",
  },
  {
    title: "Practice Coding Round",
    tagline: "Code live. Defend your logic.",
    body: "Write code in a real-time IDE while an AI cross-examines your algorithms and time/space complexity.",
    icon: SquareCode,
    gradient: "from-emerald-500 to-teal-600",
    href: "/ai-coding-practice",
    cta: "Start coding",
  },
  {
    title: "Practice Live System Design",
    tagline: "Architect like a Principal Engineer.",
    body: "Draw architectures on a live canvas and debate your scalability trade-offs through realistic, voice-driven conversations.",
    icon: Network,
    gradient: "from-amber-500 to-orange-600",
    href: "/ai-system-design",
    cta: "Start whiteboarding",
  },
  {
    title: "Company-Specific Prep",
    tagline: "Target your exact employer.",
    body: "Input your target role. Our AI automatically calibrates questions to match the exact hiring standards of top-tier firms.",
    icon: Target,
    gradient: "from-cyan-500 to-sky-600",
  },
];

const cardShellClass =
  "group relative flex h-full min-h-[280px] w-[min(88vw,360px)] shrink-0 flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl";

function FeatureCardIcon({
  icon: Icon,
  gradient,
}: {
  icon: LucideIcon;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105",
        gradient,
      )}
    >
      <Icon className="h-7 w-7 text-white" strokeWidth={2} />
    </div>
  );
}

function WhyFeatureCard({
  card,
  duplicate,
}: {
  card: FeatureCard;
  duplicate?: boolean;
}) {
  const content = (
    <>
      <div className="absolute inset-0 rounded-2xl bg-card/30 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex h-full flex-col">
        <FeatureCardIcon icon={card.icon} gradient={card.gradient} />
        <h3 className="mb-2 text-xl font-bold text-slate-900">{card.title}</h3>
        <p className="mb-2 text-sm font-semibold text-gray-800">{card.tagline}</p>
        <p className="flex-1 text-sm leading-relaxed text-gray-600">{card.body}</p>
        {card.cta ? (
          <p className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
            {card.cta}
            <ArrowRight className="h-4 w-4" />
          </p>
        ) : null}
      </div>
    </>
  );

  if (card.href) {
    return (
      <Link
        href={card.href}
        className={cardShellClass}
        aria-hidden={duplicate}
        tabIndex={duplicate ? -1 : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cardShellClass} aria-hidden={duplicate}>
      {content}
    </div>
  );
}

export function WhyFeatureCardsMarquee() {
  const [paused, setPaused] = useState(false);
  const loopCards = [...featureCards, ...featureCards];

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#796ef2] to-transparent sm:w-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#796ef2] to-transparent sm:w-20"
        aria-hidden
      />

      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onTouchCancel={() => setPaused(false)}
      >
        <div
          className="flex w-max gap-6 py-1 will-change-transform animate-why-feature-marquee-ltr motion-reduce:animate-none"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {loopCards.map((card, index) => (
            <WhyFeatureCard
              key={`${card.title}-${index}`}
              card={card}
              duplicate={index >= featureCards.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
