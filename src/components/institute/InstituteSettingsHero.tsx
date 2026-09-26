"use client";

import { Settings2, Users } from "lucide-react";

type Props = Readonly<{
  institutionName?: string;
  staffCount?: number;
  isAdmin?: boolean;
  loading?: boolean;
}>;

export function InstituteSettingsHero({
  institutionName,
  staffCount,
  isAdmin,
  loading,
}: Props) {
  const displayName = institutionName?.trim() || "Your institution";

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
        <div className="min-w-0 max-w-2xl space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
            Institution
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Settings</h1>
          <p className="text-sm leading-relaxed text-white/80">
            View <span className="font-medium text-white/95">{displayName}</span> profile details
            {isAdmin ? " and manage your team from here." : "."}
          </p>
        </div>

        {!loading && isAdmin && typeof staffCount === "number" ? (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
            <Users className="h-4 w-4 text-white/90" aria-hidden />
            <span className="text-sm font-medium text-white/90">
              <span className="text-lg font-bold tabular-nums text-white">{staffCount}</span> team
              member{staffCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : !loading ? (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
            <Settings2 className="h-4 w-4 text-white/90" aria-hidden />
            <span className="text-sm font-medium text-white/90">Profile & preferences</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
