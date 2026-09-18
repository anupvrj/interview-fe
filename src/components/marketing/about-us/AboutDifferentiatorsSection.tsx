"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Code2,
  FileText,
  Globe2,
  Layers3,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { AnimateIn } from "@/components/marketing/about-us/AnimateIn";
import { AboutSectionHeader } from "@/components/marketing/about-us/AboutSectionHeader";
import { DIFFERENTIATORS } from "@/lib/aboutUsContent";
import { appCard, appMarketingSectionLight } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const cardIcons = [ShieldCheck, Layers3, Globe2, BarChart3];

type FloatingGraphic = {
  Icon: LucideIcon;
  left: string;
  top: string;
  size: string;
  opacity: number;
  floatIndex: number;
  duration: number;
  delay: number;
};

const floatingGraphics: FloatingGraphic[] = [
  { Icon: ShieldCheck, left: "6%", top: "14%", size: "h-12 w-12 sm:h-14 sm:w-14", opacity: 0.12, floatIndex: 0, duration: 9, delay: 0 },
  { Icon: FileText, left: "88%", top: "10%", size: "h-11 w-11 sm:h-12 sm:w-12", opacity: 0.1, floatIndex: 1, duration: 11, delay: 0.6 },
  { Icon: Mic, left: "92%", top: "58%", size: "h-10 w-10 sm:h-11 sm:w-11", opacity: 0.09, floatIndex: 2, duration: 10, delay: 1.1 },
  { Icon: Code2, left: "4%", top: "72%", size: "h-10 w-10 sm:h-11 sm:w-11", opacity: 0.1, floatIndex: 1, duration: 12, delay: 0.4 },
  { Icon: Layers3, left: "18%", top: "38%", size: "h-9 w-9 sm:h-10 sm:w-10", opacity: 0.08, floatIndex: 2, duration: 8, delay: 1.4 },
  { Icon: Globe2, left: "76%", top: "78%", size: "h-11 w-11 sm:h-12 sm:w-12", opacity: 0.09, floatIndex: 0, duration: 13, delay: 0.9 },
  { Icon: BarChart3, left: "52%", top: "6%", size: "h-8 w-8 sm:h-9 sm:w-9", opacity: 0.07, floatIndex: 1, duration: 10, delay: 1.8 },
  { Icon: Bot, left: "34%", top: "82%", size: "h-9 w-9 sm:h-10 sm:w-10", opacity: 0.08, floatIndex: 2, duration: 11, delay: 0.2 },
  { Icon: Target, left: "62%", top: "88%", size: "h-8 w-8", opacity: 0.07, floatIndex: 0, duration: 9, delay: 1.6 },
  { Icon: Sparkles, left: "44%", top: "22%", size: "h-7 w-7 sm:h-8 sm:w-8", opacity: 0.06, floatIndex: 1, duration: 7, delay: 2.1 },
];

const driftingGraphics = [
  { Icon: FileText, top: "22%", animation: "profile-hero-drift 26s ease-in-out infinite", delay: "0s" },
  { Icon: Mic, top: "48%", animation: "profile-hero-drift-alt 30s ease-in-out infinite", delay: "-8s" },
  { Icon: ShieldCheck, top: "66%", animation: "profile-hero-drift 28s ease-in-out infinite", delay: "-16s" },
] as const;

function DifferentiatorsBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(115,103,240,0.14),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(99,102,241,0.1),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(115,103,240,0.08),transparent_45%)]" />

      {floatingGraphics.map(
        ({ Icon, left, top, size, opacity, floatIndex, duration, delay }, index) => (
          <div
            key={`float-${left}-${top}-${index}`}
            className="absolute"
            style={{
              left,
              top,
              opacity,
              animation: `float-${floatIndex} ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <Icon className={cn(size, "text-[#7367F0]/50")} />
          </div>
        ),
      )}

      {driftingGraphics.map(({ Icon, top, animation, delay }) => (
        <div
          key={`drift-${Icon.displayName ?? Icon.name}-${top}`}
          className="absolute left-0 w-10 sm:w-12"
          style={{ top, animation, animationDelay: delay }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7367F0]/10 bg-background/40 backdrop-blur-sm sm:h-11 sm:w-11">
            <Icon className="h-5 w-5 text-[#7367F0]/35" />
          </div>
        </div>
      ))}

      <div
        className="absolute -left-16 top-1/4 h-52 w-52 rounded-full bg-[#7367F0]/10 blur-3xl"
        style={{ animation: "float-1 14s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-12 bottom-1/4 h-44 w-44 rounded-full bg-indigo-400/10 blur-3xl"
        style={{ animation: "float-2 16s ease-in-out infinite 1s" }}
      />
    </div>
  );
}

export function AboutDifferentiatorsSection() {
  return (
    <section
      id="what-makes-us-different"
      className={cn(
        appMarketingSectionLight,
        "scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
      )}
    >
      <DifferentiatorsBackground />

      <div className="container relative z-10 mx-auto max-w-6xl">
        <AboutSectionHeader
          badge="Why us"
          title="What makes Interview Trix different"
          description="We're not another question bank. We're a career partner built for the full hiring funnel."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {DIFFERENTIATORS.map((item, index) => {
            const Icon = cardIcons[index] ?? ShieldCheck;
            return (
              <AnimateIn key={item.title} delay={index * 70}>
                <article
                  className={cn(
                    appCard,
                    "flex gap-4 border-border/60 bg-background/85 p-5 backdrop-blur-sm transition-shadow hover:shadow-header sm:p-6",
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </article>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
