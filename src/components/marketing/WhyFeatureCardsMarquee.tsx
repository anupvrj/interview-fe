"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  "group relative isolate flex h-full min-h-[260px] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-6 text-left shadow-card transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-xl sm:hover:-translate-y-0.5";

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

function WhyFeatureCardContent({ card }: { card: FeatureCard }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-muted/40 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex h-full min-w-0 flex-col">
        <div className="mb-4 flex min-w-0 flex-col items-center text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
          <FeatureCardIcon icon={card.icon} gradient={card.gradient} />
          <div className="min-w-0 flex-1">
            <h3 className="mt-4 text-base font-bold text-slate-900 sm:mt-0 sm:text-xl">
              {card.title}
            </h3>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {card.tagline}
            </p>
          </div>
        </div>
        <p className="flex-1 text-center text-sm leading-relaxed text-gray-600 sm:text-left">
          {card.body}
        </p>
        {card.cta ? (
          <p className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-primary sm:justify-start">
            {card.cta}
            <ArrowRight className="h-4 w-4 shrink-0" />
          </p>
        ) : null}
      </div>
    </>
  );
}

function WhyFeatureCard({
  card,
  embedded = false,
}: {
  card: FeatureCard;
  embedded?: boolean;
}) {
  const shellClass = embedded
    ? "group relative isolate flex h-full min-h-[260px] w-full min-w-0 max-w-full flex-col p-4 text-left sm:p-6"
    : cardShellClass;

  if (card.href) {
    return (
      <Link href={card.href} className={shellClass}>
        <WhyFeatureCardContent card={card} />
      </Link>
    );
  }

  return (
    <div className={shellClass}>
      <WhyFeatureCardContent card={card} />
    </div>
  );
}

const AUTO_ADVANCE_MS = 4500;
const USER_PAUSE_MS = 8000;

function WhyFeatureCardsMobileCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const isUserInteractingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scrollCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - slideCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
    activeIndexRef.current = closestIndex;
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      const slide = slideRefs.current[index];
      if (!scroller || !slide) return;

      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const targetScrollLeft = slideCenter - scroller.clientWidth / 2;

      scroller.scrollTo({
        left: targetScrollLeft,
        behavior,
      });
    },
    [],
  );

  const pauseAutoScroll = useCallback(() => {
    isUserInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, USER_PAUSE_MS);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateActiveIndex();
    scroller.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    const handleTouchStart = () => pauseAutoScroll();
    scroller.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
      scroller.removeEventListener("touchstart", handleTouchStart);
    };
  }, [pauseAutoScroll, updateActiveIndex]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const interval = setInterval(() => {
      if (isUserInteractingRef.current) return;

      const next = (activeIndexRef.current + 1) % featureCards.length;
      scrollToIndex(next);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(interval);
  }, [scrollToIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleDotClick = (index: number) => {
    pauseAutoScroll();
    scrollToIndex(index);
  };

  return (
    <div className="w-full min-w-0 overflow-hidden sm:hidden">
      <div
        ref={scrollerRef}
        className="flex w-full min-w-0 snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth scroll-px-6 px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Interview Trix features"
      >
        {featureCards.map((card, index) => (
          <div
            key={card.title}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            className="box-border w-[calc(100%-3rem)] max-w-full shrink-0 snap-center snap-always overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card"
          >
            <WhyFeatureCard card={card} embedded />
          </div>
        ))}
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Feature carousel"
      >
        {featureCards.map((card, index) => (
          <button
            key={card.title}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={card.title}
            onClick={() => handleDotClick(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === activeIndex ? "w-6 bg-primary" : "w-2 bg-slate-300",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function WhyFeatureCardsMarquee() {
  return (
    <>
      <WhyFeatureCardsMobileCarousel />

      <div className="hidden min-w-0 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((card) => (
          <WhyFeatureCard key={card.title} card={card} />
        ))}
      </div>
    </>
  );
}
