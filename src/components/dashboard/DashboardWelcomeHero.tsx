"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Briefcase,
  Code2,
  FileEdit,
  FileText,
  Network,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CAROUSEL_INTERVAL_MS = 6000;

const floatingIcons = [
  {
    Icon: FileEdit,
    className: "left-[50%] top-[6%] text-emerald-200/50",
    shell: "bg-emerald-400/10 border-emerald-300/15",
    animation: "float-0 14s ease-in-out infinite",
  },
  {
    Icon: FileText,
    className: "left-[66%] top-[22%] text-sky-200/50",
    shell: "bg-sky-400/10 border-sky-300/15",
    animation: "float-1 16s ease-in-out infinite",
  },
  {
    Icon: Code2,
    className: "left-[54%] top-[48%] text-cyan-200/50",
    shell: "bg-cyan-400/10 border-cyan-300/15",
    animation: "float-2 18s ease-in-out infinite",
  },
  {
    Icon: Network,
    className: "left-[74%] top-[38%] text-indigo-200/50",
    shell: "bg-indigo-400/10 border-indigo-300/15",
    animation: "float-0 15s ease-in-out infinite 0.6s",
  },
  {
    Icon: UsersRound,
    className: "left-[78%] top-[10%] text-violet-200/50",
    shell: "bg-violet-400/10 border-violet-300/15",
    animation: "float-1 17s ease-in-out infinite 0.5s",
  },
  {
    Icon: Briefcase,
    className: "left-[70%] top-[64%] text-rose-200/50",
    shell: "bg-rose-400/10 border-rose-300/15",
    animation: "float-0 16s ease-in-out infinite 1s",
  },
] as const;

const featurePills = [
  { label: "Resumes", dot: "bg-emerald-400" },
  { label: "AI Practice", dot: "bg-sky-400" },
  { label: "Coding", dot: "bg-cyan-400" },
  { label: "System design", dot: "bg-indigo-400" },
  { label: "Peer sessions", dot: "bg-violet-400" },
  { label: "Job hunt", dot: "bg-rose-400" },
] as const;

type PreviewCard = {
  label: string;
  title: string;
  accent: string;
  icon: LucideIcon;
  footer: ReactNode;
};

const previewCards: PreviewCard[] = [
  {
    label: "AI Interview",
    title: "Score 82",
    accent: "text-sky-200",
    icon: FileText,
    footer: (
      <div className="mt-2 flex gap-1">
        <span className="h-1.5 flex-1 rounded-full bg-sky-400/70" />
        <span className="h-1.5 flex-1 rounded-full bg-sky-300/40" />
        <span className="h-1.5 flex-1 rounded-full bg-sky-300/40" />
      </div>
    ),
  },
  {
    label: "Coding round",
    title: "2 / 3 solved",
    accent: "text-cyan-200",
    icon: Code2,
    footer: (
      <div className="mt-2 flex gap-1">
        <span className="h-6 flex-1 rounded-md bg-cyan-400/50" />
        <span className="h-6 flex-1 rounded-md bg-cyan-400/50" />
        <span className="h-6 flex-1 rounded-md bg-white/15" />
      </div>
    ),
  },
  {
    label: "System design",
    title: "Canvas ready",
    accent: "text-indigo-200",
    icon: Network,
    footer: (
      <div className="mt-2 grid grid-cols-3 gap-1">
        <span className="h-5 rounded bg-indigo-400/45" />
        <span className="col-span-2 h-5 rounded bg-indigo-300/25" />
        <span className="col-span-2 h-5 rounded bg-indigo-300/25" />
        <span className="h-5 rounded bg-indigo-400/45" />
      </div>
    ),
  },
  {
    label: "Resume",
    title: "ATS 87",
    accent: "text-emerald-200",
    icon: FileEdit,
    footer: (
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div className="h-full w-[87%] rounded-full bg-emerald-400" />
      </div>
    ),
  },
];

function HeroPreviewCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % previewCards.length);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(goNext, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goNext]);

  return (
    <div
      className="hidden shrink-0 flex-col items-center lg:flex lg:w-[260px] xl:w-[280px]"
      aria-live="polite"
      aria-roledescription="carousel"
      aria-label="Practice preview"
    >
      <div className="relative h-[8.75rem] w-full max-w-[13rem]">
        {previewCards.map((card, index) => {
          const Icon = card.icon;
          const isActive = index === activeIndex;

          return (
            <div
              key={card.label}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${previewCards.length}`}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0 rounded-xl border border-white/20 bg-white/10 p-3.5 shadow-lg backdrop-blur-md transition-all duration-700 ease-out",
                isActive
                  ? "z-10 translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none z-0 translate-y-2 scale-[0.97] opacity-0",
              )}
              style={
                isActive
                  ? { animation: "float-1 8s ease-in-out infinite" }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide",
                      card.accent,
                    )}
                  >
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-white">
                    {card.title}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-white/90" strokeWidth={2} />
                </div>
              </div>
              {card.footer}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardWelcomeHero({
  firstName,
  description = "Your hub for resumes, AI Interview Practice and coding practice, peer sessions, and job hunt—InterviewTrix as your end-to-end career partner.",
}: {
  firstName: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(115,103,240,0.28)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#7367F0] via-[#6e62e5] to-indigo-800"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(52,211,153,0.35),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.3),transparent_38%),radial-gradient(circle_at_70%_85%,rgba(244,114,182,0.28),transparent_40%),radial-gradient(circle_at_30%_90%,rgba(251,191,36,0.22),transparent_35%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "dashboard-hero-shimmer 8s ease-in-out infinite",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl"
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 hidden opacity-60 md:block">
        {floatingIcons.map(({ Icon, className, shell, animation }, i) => (
          <div
            key={i}
            className={cn("absolute", className)}
            style={{ animation }}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-sm lg:h-11 lg:w-11",
                shell,
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
        <div className="min-w-0 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            Career hub
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
            Welcome back, {firstName}!
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-[0.9375rem]">
            {description}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {featurePills.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm sm:text-xs"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", pill.dot)} />
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        <HeroPreviewCarousel />
      </div>
    </section>
  );
}
