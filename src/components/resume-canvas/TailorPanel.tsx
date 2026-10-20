"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MinusCircle, PlusCircle, Sparkles, X } from "lucide-react";
import type { Resume } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JobMatch = NonNullable<Resume["jobMatchFeedback"]>;

const MIN_JD_CHARS = 80;

function ScoreBar({ score }: { score: number }) {
  const tone = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-black text-foreground">{score}%</span>
      <div className="h-2 flex-1 rounded-full bg-muted">
        <div className={cn("h-2 rounded-full transition-all", tone)} style={{ width: `${Math.max(3, Math.min(100, score))}%` }} />
      </div>
    </div>
  );
}

/**
 * Check & Tailor beside the page: paste a job → match score, keyword table
 * (found keywords are highlighted green on the page), strengths/gaps, then
 * one click to tailor with AI.
 */
export function TailorPanel({
  jobDescription,
  match,
  score,
  running,
  tailoring,
  excluded,
  onToggleExclude,
  onCheck,
  onTailor,
  onAddSkill,
}: {
  jobDescription: string;
  match: JobMatch | null;
  score: number | null;
  running: boolean;
  tailoring: boolean;
  excluded: Set<string>;
  onToggleExclude: (keyword: string) => void;
  onCheck: (jobDescription: string) => void;
  onTailor: (jobDescription: string) => void;
  /** User confirms they have a missing skill → add it to Skills. */
  onAddSkill: (skill: string) => void;
}) {
  const [draft, setDraft] = useState(jobDescription);
  const [editing, setEditing] = useState(!match);
  useEffect(() => {
    setDraft(jobDescription);
  }, [jobDescription]);
  useEffect(() => {
    if (match) setEditing(false);
  }, [match]);

  const keywords = match
    ? [
        ...match.missingSkills.map((k) => ({ keyword: k, found: false })),
        ...match.matchedSkills.map((k) => ({ keyword: k, found: true })),
      ]
    : [];
  const counted = keywords.filter((k) => !excluded.has(k.keyword));
  const found = counted.filter((k) => k.found).length;

  if (editing || !match) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Paste the job description. You&apos;ll get a match score, the keywords you&apos;re missing, and what to change.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          placeholder="Paste the full job description here…"
          className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1"
            disabled={running || draft.trim().length < MIN_JD_CHARS}
            onClick={() => onCheck(draft.trim())}
          >
            {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {running ? "Checking…" : "Check match"}
          </Button>
          {match ? (
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          ) : null}
        </div>
        {draft.trim().length > 0 && draft.trim().length < MIN_JD_CHARS ? (
          <p className="text-xs text-muted-foreground">Paste the whole description — a few lines isn&apos;t enough to compare.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <section className="rounded-xl border border-border bg-card p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Job match</p>
        <div className="mt-2">
          <ScoreBar score={score ?? match.matchScore} />
        </div>
        {match.headline ? <p className="mt-2 text-sm font-medium text-foreground">{match.headline}</p> : null}
        {match.summary ? <p className="mt-1 text-xs text-muted-foreground">{match.summary}</p> : null}
        <div className="mt-3 flex gap-2">
          <Button type="button" size="sm" className="flex-1" onClick={() => onTailor(jobDescription)} disabled={tailoring}>
            {tailoring ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            Tailor with AI
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            Change job
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Keywords</h4>
          <span className="text-xs text-muted-foreground">
            {found}/{counted.length} on your resume
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Keyword</th>
                <th className="px-2 py-2 text-center font-semibold">On resume</th>
                <th className="w-16 px-2 py-2" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {keywords.map(({ keyword, found: isFound }) => {
                const off = excluded.has(keyword);
                return (
                  <tr key={keyword} className="border-t border-border">
                    <td className={cn("px-3 py-1.5 font-medium text-foreground", off && "text-muted-foreground line-through")}>{keyword}</td>
                    <td className="px-2 py-1.5 text-center">
                      {isFound ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Found" />
                      ) : (
                        <X className={cn("mx-auto h-4 w-4", off ? "text-muted-foreground" : "text-red-500")} aria-label="Missing" />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex justify-end gap-1">
                        {!isFound && !off ? (
                          <button
                            type="button"
                            title="I have this skill — add it to Skills"
                            aria-label={`Add ${keyword} to skills`}
                            onClick={() => onAddSkill(keyword)}
                            className="text-muted-foreground hover:text-emerald-600"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          title={off ? "Count this keyword again" : "Not relevant — don't count it"}
                          aria-label={off ? `Include ${keyword}` : `Exclude ${keyword}`}
                          onClick={() => onToggleExclude(keyword)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Keywords already on your resume are highlighted green on the page.</p>
      </section>

      {match.strengths.length ? (
        <section>
          <h4 className="mb-1.5 text-sm font-semibold text-foreground">What already fits</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {match.strengths.map((s) => (
              <li key={s} className="flex gap-1.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {match.gaps.length ? (
        <section>
          <h4 className="mb-1.5 text-sm font-semibold text-foreground">Gaps to address</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {match.gaps.map((g) => (
              <li key={g} className="flex gap-1.5">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                {g}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
