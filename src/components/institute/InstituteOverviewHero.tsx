"use client";

import { Building2, CheckCircle2, Layers, PlayCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  institutionName: string;
  domain?: string | null;
  contactEmail?: string | null;
  memberCount: number;
  batchCount: number;
  scheduledCount: number;
  startedCount: number;
  completedCount: number;
}>;

export function InstituteOverviewHero({
  institutionName,
  domain,
  contactEmail,
  memberCount,
  batchCount,
  scheduledCount,
  startedCount,
  completedCount,
}: Props) {
  const subtitle = [domain, contactEmail].filter(Boolean).join(" · ");

  const statItems = [
    { label: "Members", value: memberCount, icon: Users },
    { label: "Batches", value: batchCount, icon: Layers },
    { label: "Scheduled", value: scheduledCount, icon: PlayCircle },
    { label: "Completed", value: completedCount, icon: CheckCircle2 },
  ] as const;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(115,103,240,0.28)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#7367F0] via-[#6e62e5] to-indigo-900"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_12%_25%,rgba(52,211,153,0.32),transparent_45%),radial-gradient(circle_at_88%_18%,rgba(56,189,248,0.28),transparent_40%),radial-gradient(circle_at_72%_88%,rgba(167,139,250,0.25),transparent_42%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="min-w-0 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90 backdrop-blur-sm">
            <Building2 className="h-3.5 w-3.5 text-amber-200" />
            Institution admin
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
            {institutionName}
          </h1>

          {subtitle ? (
            <p className="text-sm text-white/75">{subtitle}</p>
          ) : null}

          <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-[0.9375rem]">
            Run your cohort from one place — enroll candidates, manage batches, and
            track scheduled and completed interview activity.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:flex-wrap sm:gap-2">
            {statItems.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-white/80" strokeWidth={2} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
                    {label}
                  </p>
                  <p className="text-lg font-bold tabular-nums leading-none text-white">
                    {value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {startedCount > 0 ? (
            <p className="text-xs text-white/70">
              {startedCount} interview{startedCount === 1 ? "" : "s"} in progress right now.
            </p>
          ) : null}
        </div>

        <div
          aria-hidden
          className="hidden shrink-0 lg:flex lg:h-40 lg:w-40 lg:items-center lg:justify-center"
        >
          <div
            className={cn(
              "relative flex h-36 w-36 items-center justify-center rounded-3xl",
              "border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md",
            )}
          >
            <Building2 className="h-16 w-16 text-white/90" strokeWidth={1.5} />
            <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-emerald-400/30">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-sky-400/30">
              <Layers className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
