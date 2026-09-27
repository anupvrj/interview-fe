"use client";

import { BarChart3, CheckCircle2, FileText, Target } from "lucide-react";

type Props = Readonly<{
  candidateName: string;
  email?: string | null;
  avgScore?: number | null;
  totalInterviews?: number;
  completedInterviews?: number;
  resumeCount?: number;
  loading?: boolean;
}>;

export function InstituteCandidateReportsHero({
  candidateName,
  email,
  avgScore,
  totalInterviews = 0,
  completedInterviews = 0,
  resumeCount = 0,
  loading,
}: Props) {
  const name = candidateName.trim() || "Candidate";
  const subtitle = [email?.trim() || null, "Resumes and AI Interview Practice"]
    .filter(Boolean)
    .join(" · ");

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
            Candidate
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Reports
            <span className="font-bold text-white/90"> — {name}</span>
          </h1>
          <p className="text-sm leading-relaxed text-white/80 sm:text-[0.9375rem]">
            {subtitle}
          </p>
        </div>

        {!loading ? (
          <div className="flex flex-wrap gap-2 lg:max-w-lg lg:justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Target className="h-4 w-4 text-white/90" aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-white">
                {avgScore != null ? avgScore : "—"}{" "}
                <span className="font-medium text-white/85">avg score</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <BarChart3 className="h-4 w-4 text-white/90" aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-white">
                {totalInterviews}{" "}
                <span className="font-medium text-white/85">
                  interview{totalInterviews === 1 ? "" : "s"}
                </span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4 text-white/90" aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-white">
                {completedInterviews}{" "}
                <span className="font-medium text-white/85">completed</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <FileText className="h-4 w-4 text-white/90" aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-white">
                {resumeCount}{" "}
                <span className="font-medium text-white/85">
                  resume{resumeCount === 1 ? "" : "s"}
                </span>
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
