"use client";

import { CalendarClock, Layers, Users } from "lucide-react";

type Props = Readonly<{
  batchName: string;
  memberCount: number;
  scheduledRounds?: number;
  reportsCompleted?: number | null;
  subtitle?: string | null;
  eyebrow?: string;
  /** When set, shown as the main heading; batch name appears on the line below. */
  title?: string;
  loading?: boolean;
}>;

export function InstituteBatchDetailHero({
  batchName,
  memberCount,
  scheduledRounds,
  reportsCompleted,
  subtitle,
  eyebrow = "Batch cohort",
  title,
  loading,
}: Props) {
  const displayBatchName = batchName.trim() || "Untitled batch";
  const showEyebrow = eyebrow.trim().length > 0 && !title;
  const description =
    subtitle?.trim() ||
    (title ? null : "Add members, schedule interview rounds for the whole cohort, and track performance.");
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(115,103,240,0.22)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#7367F0] via-[#6e62e5] to-indigo-900"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          {title ? (
            <div className="space-y-3">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {title}
                <span className="font-bold text-white/90"> - {displayBatchName}</span>
              </h1>
              {description ? (
                <p className="text-sm leading-relaxed text-white/80 sm:text-[0.9375rem]">
                  {description}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1">
              {showEyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:max-w-2xl">
                {displayBatchName}
              </h1>
              {description ? (
                <p className="text-sm text-white/80">{description}</p>
              ) : null}
            </div>
          )}
        </div>

        {!loading ? (
          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Users className="h-4 w-4 text-white/90" aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-white">
                {memberCount}{" "}
                <span className="font-medium text-white/85">
                  member{memberCount === 1 ? "" : "s"}
                </span>
              </span>
            </div>
            {typeof scheduledRounds === "number" ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
                <CalendarClock className="h-4 w-4 text-white/90" aria-hidden />
                <span className="text-sm font-semibold tabular-nums text-white">
                  {scheduledRounds}{" "}
                  <span className="font-medium text-white/85">rounds</span>
                </span>
              </div>
            ) : null}
            {typeof reportsCompleted === "number" ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
                <Layers className="h-4 w-4 text-white/90" aria-hidden />
                <span className="text-sm font-semibold tabular-nums text-white">
                  {reportsCompleted}{" "}
                  <span className="font-medium text-white/85">reports</span>
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
