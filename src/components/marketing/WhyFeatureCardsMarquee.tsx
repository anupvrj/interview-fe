"use client";

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
  "group relative flex h-full min-h-[260px] flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl";

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
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105",
        gradient,
      )}
    >
      <Icon className="h-7 w-7 text-white" strokeWidth={2} />
    </div>
  );
}

function WhyFeatureCard({ card }: { card: FeatureCard }) {
  const content = (
    <>
      <div className="absolute inset-0 rounded-xl bg-muted/40 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-start gap-4">
          <FeatureCardIcon icon={card.icon} gradient={card.gradient} />
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {card.tagline}
            </p>
          </div>
        </div>
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
      <Link href={card.href} className={cardShellClass}>
        {content}
      </Link>
    );
  }

  return <div className={cardShellClass}>{content}</div>;
}

export function WhyFeatureCardsMarquee() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featureCards.map((card) => (
        <WhyFeatureCard key={card.title} card={card} />
      ))}
    </div>
  );
}
