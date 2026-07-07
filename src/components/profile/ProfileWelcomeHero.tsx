"use client";

import {
  Award,
  Briefcase,
  Building2,
  FileText,
  Mail,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const driftingIcons = [
  {
    Icon: UserIcon,
    top: "10%",
    shell: "bg-violet-400/10 border-violet-300/15",
    iconColor: "text-violet-200/50",
    animation: "profile-hero-drift 24s ease-in-out infinite",
    delay: "0s",
  },
  {
    Icon: Briefcase,
    top: "28%",
    shell: "bg-cyan-400/10 border-cyan-300/15",
    iconColor: "text-cyan-200/50",
    animation: "profile-hero-drift-alt 28s ease-in-out infinite",
    delay: "-6s",
  },
  {
    Icon: FileText,
    top: "52%",
    shell: "bg-emerald-400/10 border-emerald-300/15",
    iconColor: "text-emerald-200/50",
    animation: "profile-hero-drift 26s ease-in-out infinite",
    delay: "-12s",
  },
  {
    Icon: Building2,
    top: "18%",
    shell: "bg-sky-400/10 border-sky-300/15",
    iconColor: "text-sky-200/50",
    animation: "profile-hero-drift-alt 30s ease-in-out infinite",
    delay: "-18s",
  },
  {
    Icon: Mail,
    top: "68%",
    shell: "bg-rose-400/10 border-rose-300/15",
    iconColor: "text-rose-200/50",
    animation: "profile-hero-drift 22s ease-in-out infinite",
    delay: "-9s",
  },
  {
    Icon: Award,
    top: "42%",
    shell: "bg-amber-400/10 border-amber-300/15",
    iconColor: "text-amber-200/50",
    animation: "profile-hero-drift-alt 27s ease-in-out infinite",
    delay: "-15s",
  },
] as const;

const featurePills = [
  { label: "Account", dot: "bg-violet-400" },
  { label: "Professional", dot: "bg-cyan-400" },
  { label: "Resume", dot: "bg-emerald-400" },
  { label: "Preferences", dot: "bg-sky-400" },
] as const;

export function ProfileWelcomeHero({
  firstName,
  description = "Keep your account, professional details, and resume up to date for personalized interview experiences.",
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
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-card/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden overflow-hidden opacity-55 sm:block"
      >
        {driftingIcons.map(
          ({ Icon, top, shell, iconColor, animation, delay }, i) => (
            <div
              key={i}
              className="absolute will-change-[left,transform,opacity]"
              style={{
                top,
                animation,
                animationDelay: delay,
              }}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-sm lg:h-10 lg:w-10",
                  shell,
                  iconColor,
                )}
              >
                <Icon className="h-4 w-4 lg:h-[1.125rem] lg:w-[1.125rem]" strokeWidth={2} />
              </div>
            </div>
          ),
        )}
      </div>

      <div className="relative z-10 p-5 sm:p-6 lg:p-8">
        <div className="min-w-0 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-card/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            Your profile
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
            {firstName ? `Hi, ${firstName}` : "Your profile"}
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-[0.9375rem]">
            {description}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {featurePills.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-card/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm sm:text-xs"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", pill.dot)} />
                {pill.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
