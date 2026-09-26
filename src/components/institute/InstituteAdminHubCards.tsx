"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Layers, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CardTheme = {
  shell: string;
  border: string;
  hoverBorder: string;
  iconBg: string;
  restText: string;
  cta: string;
  glow: string;
  orb: string;
};

type InstituteHubCard = {
  href: string;
  icon: LucideIcon;
  lead: string;
  rest: string;
  description: string;
  theme: CardTheme;
};

function buildCards(institutionId: string): InstituteHubCard[] {
  const base = `/dashboard/institute/${institutionId}`;
  return [
    {
      href: `${base}/candidates`,
      icon: Users,
      lead: "Manage",
      rest: "Candidates",
      description: "Invite members, view reports, schedule 1:1 interviews",
      theme: {
        shell:
          "from-emerald-500/[0.12] via-card to-emerald-400/[0.04] dark:from-emerald-500/20 dark:via-card dark:to-emerald-950/30",
        border: "border-emerald-500/25",
        hoverBorder: "hover:border-emerald-400/55",
        iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30",
        restText: "text-emerald-700 dark:text-emerald-300",
        cta: "text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-400 dark:group-hover:text-emerald-300",
        glow: "hover:shadow-emerald-500/20",
        orb: "bg-emerald-400/25",
      },
    },
    {
      href: `${base}/batches`,
      icon: Layers,
      lead: "Organize",
      rest: "Batches",
      description: "Cohorts, rosters, bulk schedule, and run reports",
      theme: {
        shell:
          "from-violet-500/[0.12] via-card to-fuchsia-400/[0.04] dark:from-violet-500/20 dark:via-card dark:to-violet-950/30",
        border: "border-violet-500/25",
        hoverBorder: "hover:border-violet-400/55",
        iconBg: "bg-gradient-to-br from-violet-400 to-fuchsia-600 shadow-violet-500/30",
        restText: "text-violet-700 dark:text-violet-300",
        cta: "text-violet-600 group-hover:text-violet-700 dark:text-violet-400 dark:group-hover:text-violet-300",
        glow: "hover:shadow-violet-500/20",
        orb: "bg-violet-400/25",
      },
    },
    {
      href: `${base}/schedules`,
      icon: CalendarClock,
      lead: "Scheduled",
      rest: "Interviews",
      description: "AI mock, coding, and system design — batch or individual schedules",
      theme: {
        shell:
          "from-sky-500/[0.12] via-card to-sky-400/[0.04] dark:from-sky-500/20 dark:via-card dark:to-sky-950/30",
        border: "border-sky-500/25",
        hoverBorder: "hover:border-sky-400/55",
        iconBg: "bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-500/30",
        restText: "text-sky-700 dark:text-sky-300",
        cta: "text-sky-600 group-hover:text-sky-700 dark:text-sky-400 dark:group-hover:text-sky-300",
        glow: "hover:shadow-sky-500/20",
        orb: "bg-sky-400/25",
      },
    },
  ];
}

type Props = Readonly<{
  institutionId: string;
}>;

export function InstituteAdminHubCards({ institutionId }: Props) {
  const cards = buildCards(institutionId);

  return (
    <section aria-label="Institution admin actions" className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const { theme } = card;

          return (
            <Link
              key={`${card.href}-${card.rest}`}
              href={card.href}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-sm",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1 hover:shadow-lg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7367F0]/40",
                theme.shell,
                theme.border,
                theme.hoverBorder,
                theme.glow,
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300",
                  "opacity-60 group-hover:opacity-100",
                  theme.orb,
                )}
              />

              <div className="relative">
                <div
                  className={cn(
                    "mb-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105",
                    theme.iconBg,
                  )}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
                </div>

                <h3 className="text-[0.9375rem] leading-snug text-foreground sm:text-base">
                  <span className="font-bold">{card.lead}</span>{" "}
                  <span className={cn("font-semibold", theme.restText)}>
                    {card.rest}
                  </span>
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">
                  {card.description}
                </p>

                <span
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors",
                    theme.cta,
                  )}
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
