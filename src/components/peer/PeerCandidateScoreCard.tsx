"use client";

import { BarChart3 } from "lucide-react";
import { PeerBookingCardShell } from "@/components/peer/PeerBookingCardShell";
import { cn } from "@/lib/utils";
import type { PeerInterviewerCandidateScore } from "@/lib/api";

const DIMENSIONS: Array<{
  key: keyof Pick<PeerInterviewerCandidateScore, "technical" | "behaviour" | "communication">;
  label: string;
}> = [
  { key: "technical", label: "Technical skills" },
  { key: "behaviour", label: "Behavioural" },
  { key: "communication", label: "Communication skills" },
];

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{score}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500",
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export function PeerCandidateScoreCard({
  title = "Interview Score",
  description = "Your peer interviewer has given this score based on your interview performance.",
  score,
  emptyMessage = "Scores will appear here after your interviewer completes the session.",
}: {
  title?: string;
  description?: string;
  score?: PeerInterviewerCandidateScore;
  emptyMessage?: string;
}) {
  return (
    <PeerBookingCardShell title={title} description={description} icon={BarChart3}>
      {score ? (
        <div className="space-y-4">
          <div className="flex items-end gap-3 border-b border-border/40 pb-4">
            <span className="text-4xl font-bold tabular-nums leading-none text-[#7367F0]">
              {score.overall}
            </span>
            <div className="pb-0.5">
              <p className="text-sm font-medium text-foreground">Overall average</p>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </div>
          </div>

          <div className="space-y-3">
            {DIMENSIONS.map(({ key, label }) => (
              <ScoreBar key={key} label={label} score={score[key]} />
            ))}
          </div>

          {score.comments ? (
            <blockquote className="rounded-xl border border-border/40 bg-muted/15 px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{score.comments}&rdquo;
            </blockquote>
          ) : null}

          {score.submittedAt ? (
            <p className="text-[10px] text-muted-foreground">
              Scored on{" "}
              {new Date(score.submittedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </PeerBookingCardShell>
  );
}
