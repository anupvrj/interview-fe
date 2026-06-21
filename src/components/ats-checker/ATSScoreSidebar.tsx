"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ATSCategoryResult, ATSCheckResult } from "@/types/atsReport";
import {
  CATEGORY_ORDER,
  getScoreColor,
  getScoreRingColor,
} from "@/types/atsReport";
import { ATSCheckListItem } from "./ATSCheckListItem";

interface ATSScoreSidebarProps {
  score: number;
  issueCount: number;
  categories: Record<string, ATSCategoryResult>;
  selectedCheckId: string | null;
  onSelectCheck: (check: ATSCheckResult, categoryLabel: string) => void;
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={getScoreRingColor(score)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", getScoreColor(score))}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export function ATSScoreSidebar({
  score,
  issueCount,
  categories,
  selectedCheckId,
  onSelectCheck,
}: ATSScoreSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    jobMatch: true,
    content: true,
  });

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground mb-3">Your Score</h2>
        <ScoreGauge score={score} />
        <p className="text-sm text-muted-foreground mt-2">
          {issueCount} Issue{issueCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-2">
        {CATEGORY_ORDER.map((catId) => {
          const cat = categories[catId];
          if (!cat) return null;
          const isOpen = expanded[catId];
          const activeChecks = cat.checks.filter((c) => c.status !== "skipped");
          const displayScore =
            catId === "tailoring" && activeChecks.length === 0
              ? "??"
              : `${cat.score}%`;

          return (
            <div key={catId} className="border-b border-border/60 last:border-0 pb-2">
              <button
                type="button"
                onClick={() => toggle(catId)}
                className="w-full flex items-center gap-2 py-2 text-left"
              >
                <span className="flex-1 text-xs font-bold uppercase tracking-wide text-foreground">
                  {cat.label}
                  {cat.issueCount > 0 && (
                    <span className="ml-1 font-normal normal-case text-muted-foreground">
                      · {cat.issueCount} issue{cat.issueCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    typeof displayScore === "string" && displayScore === "??"
                      ? "bg-muted text-muted-foreground"
                      : cat.score >= 80
                        ? "bg-green-100 text-green-700"
                        : cat.score >= 60
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700",
                  )}
                >
                  {displayScore}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <div className="space-y-0.5 pb-2">
                  {cat.checks.map((check) => (
                    <ATSCheckListItem
                      key={check.id}
                      check={check}
                      selected={selectedCheckId === check.id}
                      onSelect={() => onSelectCheck(check, cat.label)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
