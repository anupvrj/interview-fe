"use client";

import { Loader2, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { StarRatingDisplay } from "@/components/system-design-admin/StarRatingInput";
import type {
  SystemDesignDifficulty,
  SystemDesignProblemSummary,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export type SystemDesignDifficultyFilter = "all" | SystemDesignDifficulty;

export const SD_DIFFICULTY_FILTERS: {
  value: SystemDesignDifficultyFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const DIFFICULTY_STYLES: Record<SystemDesignDifficulty, string> = {
  easy: "bg-emerald-500/12 text-emerald-700 border-emerald-500/20",
  medium: "bg-amber-500/12 text-amber-800 border-amber-500/20",
  hard: "bg-rose-500/12 text-rose-700 border-rose-500/20",
};

function CompanyTags({ companies }: { readonly companies: string[] }) {
  if (companies.length === 0) return null;

  const visible = companies.slice(0, 4);
  const extra = companies.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((company) => (
        <Badge
          key={company}
          variant="outline"
          className="rounded-md border-border/70 bg-muted/30 px-1.5 py-0 text-[10px] font-medium normal-case text-muted-foreground"
        >
          {company}
        </Badge>
      ))}
      {extra > 0 ? (
        <Badge
          variant="secondary"
          className="rounded-md px-1.5 py-0 text-[10px] font-medium"
        >
          +{extra}
        </Badge>
      ) : null}
    </div>
  );
}

type SystemDesignProblemPickCardProps = {
  readonly problem: SystemDesignProblemSummary;
  readonly attemptBusy?: boolean;
  readonly disabled?: boolean;
  readonly onView: (problemId: string) => void;
  readonly onAttempt: (problemId: string) => void;
};

export function SystemDesignProblemPickCard({
  problem,
  attemptBusy,
  disabled,
  onView,
  onAttempt,
}: SystemDesignProblemPickCardProps) {
  return (
    <div
      className={cn(
        "group flex min-h-[10rem] w-full flex-col rounded-xl border border-border/60 p-4 text-left shadow-sm transition-all",
        "bg-gradient-to-br from-white via-violet-50/50 to-[#7367F0]/[0.07]",
        "dark:from-card dark:via-[#7367F0]/[0.04] dark:to-violet-950/25",
        "hover:border-[#7367F0]/30 hover:from-violet-50/70 hover:to-[#7367F0]/[0.1] hover:shadow-md",
        "dark:hover:from-card dark:hover:via-[#7367F0]/[0.07] dark:hover:to-violet-950/35",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {problem.title}
          </h3>
          {problem.shortTitle ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {problem.shortTitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            DIFFICULTY_STYLES[problem.difficulty],
          )}
        >
          {problem.difficulty}
        </span>
        <Badge
          variant="secondary"
          className="rounded-md px-1.5 py-0 text-[10px] font-medium capitalize"
        >
          {problem.category.replaceAll("_", " ")}
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          <StarRatingDisplay value={problem.adminRating} size="sm" />
        </div>
      </div>

      <div className="mt-3 min-h-[2.25rem]">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Asked at
        </p>
        <CompanyTags companies={problem.askedAt ?? []} />
      </div>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 sm:flex-none"
          disabled={disabled}
          onClick={() => onView(problem.id)}
        >
          View problem
        </Button>
        <Button
          type="button"
          size="sm"
          className={cn("h-9 flex-1 sm:flex-none", institutePrimaryClass)}
          disabled={disabled || attemptBusy}
          onClick={() => onAttempt(problem.id)}
        >
          {attemptBusy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Attempt now
        </Button>
      </div>
    </div>
  );
}

export function SystemDesignDifficultyFilterBar({
  value,
  onChange,
  counts,
}: {
  readonly value: SystemDesignDifficultyFilter;
  readonly onChange: (value: SystemDesignDifficultyFilter) => void;
  readonly counts: Record<SystemDesignDifficultyFilter, number>;
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter by difficulty"
    >
      {SD_DIFFICULTY_FILTERS.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-[#7367F0]/40 bg-[#7367F0]/10 text-[#7367F0]"
                : "border-border/70 bg-card text-muted-foreground hover:border-[#7367F0]/25 hover:text-foreground",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0 text-[10px] tabular-nums",
                active ? "bg-[#7367F0]/15" : "bg-muted/60",
              )}
            >
              {counts[tab.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SystemDesignSurpriseMeButton({
  busy,
  disabled,
  onClick,
  className,
}: {
  readonly busy?: boolean;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className={cn(
        "group relative inline-flex shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all duration-200",
        "bg-gradient-to-r from-[#7367F0] via-violet-600 to-[#8b5cf6]",
        "shadow-[#7367F0]/30 hover:shadow-xl hover:shadow-[#7367F0]/40",
        "hover:-translate-y-0.5 hover:brightness-105",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7367F0]/60 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Shuffle className="h-4 w-4" aria-hidden />
        )}
      </span>
      <span className="relative flex flex-col items-start leading-tight">
        <span>Surprise me</span>
        <span className="text-[11px] font-medium text-white/85">
          Pick a random problem
        </span>
      </span>
    </button>
  );
}
