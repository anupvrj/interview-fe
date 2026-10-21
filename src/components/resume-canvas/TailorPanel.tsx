"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Loader2, MinusCircle, PlusCircle, Sparkles, X, XCircle } from "lucide-react";
import { resumeApi, type Resume } from "@/lib/api";
import type { ATSCheckId, ATSCheckResult, ATSReportV3 } from "@/types/atsReport";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { keywordCount, keywordOnResume, partialJobKeywords } from "./jobKeywords";

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

/** What the job checklist reads from the last ATS report, in the order a recruiter would. */
const CHECKLIST: Array<{ id: ATSCheckId; label: string }> = [
  { id: "titleMatch", label: "Job title" },
  { id: "mustHaveSkillsMatch", label: "Must-have skills" },
  { id: "experienceMatch", label: "Years of experience" },
  { id: "educationMatch", label: "Education" },
  { id: "responsibilitiesMatch", label: "Responsibilities" },
  { id: "quantifyingImpact", label: "Results with numbers" },
  { id: "spellingGrammar", label: "Spelling" },
  { id: "repetition", label: "Repeated words" },
  { id: "contactInformation", label: "Contact details" },
];

const PRAISE = new Set(["positive", "credibility_positive", "skill_present"]);

function findCheck(report: ATSReportV3 | null | undefined, id: ATSCheckId): ATSCheckResult | undefined {
  if (!report) return undefined;
  for (const category of Object.values(report.categories ?? {})) {
    const hit = category?.checks?.find((c) => c.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Job match beside the page: paste a job → match score, a keyword table with counts
 * (found keywords are highlighted on the page), a job checklist that links into the ATS
 * fixes, and AI help to point the summary at this job.
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
  resumeText,
  report,
  onShowCheck,
  summaryText,
  onApplySummary,
  targetRole,
}: {
  /** Current resume text (lower-cased): keywords move to "found" as you add them. */
  resumeText: string;
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
  /** Last ATS report, for the job checklist. */
  report?: ATSReportV3 | null;
  /** Open the ATS panel on this check's first finding. */
  onShowCheck?: (checkId: ATSCheckId) => void;
  /** The summary as plain text, and how to replace it. */
  summaryText?: string;
  onApplySummary?: (text: string) => void;
  targetRole?: string;
}) {
  const [draft, setDraft] = useState(jobDescription);
  const [editing, setEditing] = useState(!match);
  const [summaryAi, setSummaryAi] = useState<{ loading: boolean; options: string[]; error?: string; applied?: number }>({
    loading: false,
    options: [],
  });
  useEffect(() => {
    setDraft(jobDescription);
  }, [jobDescription]);
  useEffect(() => {
    if (match) setEditing(false);
  }, [match]);

  const jobText = jobDescription.toLowerCase();
  const rows = useMemo(() => {
    if (!match) return [];
    // Requirements the ATS check found only partly (e.g. "Kafka") belong in the table too.
    const partial = partialJobKeywords(report);
    const seen = new Set<string>();
    const all = [...match.missingSkills, ...partial, ...match.matchedSkills].filter((k) => {
      const key = k.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return all.map((keyword) => {
      const inResume = keywordCount(keyword, resumeText);
      return {
        keyword,
        inResume,
        inJob: Math.max(1, keywordCount(keyword, jobText)),
        found: inResume > 0 || keywordOnResume(keyword, resumeText),
      };
    });
  }, [match, report, resumeText, jobText]);
  const counted = rows.filter((r) => !excluded.has(r.keyword));
  const found = counted.filter((r) => r.found).length;

  const tailorSummary = async () => {
    if (!summaryText?.trim()) return;
    setSummaryAi({ loading: true, options: [] });
    try {
      // Job keywords not on the resume: the summary must not claim them.
      const avoidTerms = rows.filter((r) => !r.found).flatMap((r) => r.keyword.split(/\s+or\s+|\s*\/\s*/i));
      const options = await resumeApi.aiRewrite({ text: summaryText, kind: "summary", targetRole, jobDescription, avoidTerms });
      setSummaryAi({ loading: false, options, error: options.length ? undefined : "No better wording found." });
    } catch {
      setSummaryAi({ loading: false, options: [], error: "Couldn't reach AI. Try again." });
    }
  };

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
            {running ? "Comparing…" : "Compare with my resume"}
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
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">How well you match</p>
        <div className="mt-2">
          <ScoreBar score={score ?? match.matchScore} />
        </div>
        {match.headline ? <p className="mt-2 text-sm font-medium text-foreground">{match.headline}</p> : null}
        {match.summary ? <p className="mt-1 text-xs text-muted-foreground">{match.summary}</p> : null}
        <div className="mt-3 flex gap-2">
          <Button type="button" size="sm" className="flex-1" onClick={() => onTailor(jobDescription)} disabled={tailoring}>
            {tailoring ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            Rewrite for this job
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            Try another job
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Keywords from the job</h4>
          <span className="text-xs text-muted-foreground">
            {found} of {counted.length} covered
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2.5 py-1.5 text-left font-semibold">Keyword</th>
                <th className="px-1 py-1.5 text-center font-semibold" title="Times it appears on your resume">
                  Yours
                </th>
                <th className="px-1 py-1.5 text-center font-semibold" title="Times it appears in the job ad">
                  Job
                </th>
                <th className="w-14 px-1 py-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const off = excluded.has(row.keyword);
                return (
                  <tr key={row.keyword} className={cn(off && "text-muted-foreground")}>
                    <td className={cn("px-2.5 py-1.5", off && "line-through")}>{row.keyword}</td>
                    <td className="px-1 py-1.5 text-center">
                      {row.found ? (
                        <span className="font-semibold text-emerald-600">{Math.max(1, row.inResume)}</span>
                      ) : (
                        <X className="mx-auto h-3.5 w-3.5 text-rose-500" aria-label="Not on your resume" />
                      )}
                    </td>
                    <td className="px-1 py-1.5 text-center font-semibold">{row.inJob}</td>
                    <td className="px-1 py-1.5">
                      <span className="flex justify-end gap-0.5">
                        {!row.found && !off ? (
                          <button
                            type="button"
                            title="I have this — add it to Skills"
                            aria-label={`Add ${row.keyword} to skills`}
                            onClick={() => onAddSkill(row.keyword)}
                            className="rounded-full p-0.5 text-emerald-700 hover:bg-emerald-100"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          title={off ? "Count it again" : "Not relevant for me — don't count it"}
                          aria-label={off ? `Include ${row.keyword}` : `Exclude ${row.keyword}`}
                          onClick={() => onToggleExclude(row.keyword)}
                          className="rounded-full p-0.5 hover:bg-muted"
                        >
                          <MinusCircle className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">Keywords already on your resume are underlined on the page.</p>
      </section>

      {report ? (
        <section className="space-y-1.5">
          <h4 className="text-sm font-semibold text-foreground">Job checklist</h4>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border text-xs">
            {CHECKLIST.map(({ id, label }) => {
              const check = findCheck(report, id);
              if (!check || check.status === "skipped") return null;
              const findings = check.issues.filter((i) => !PRAISE.has(i.kind ?? ""));
              const ok = check.status === "pass" || findings.length === 0;
              const note = ok
                ? (check.summary as { headline?: string } | undefined)?.headline || "Looks good."
                : findings[0]?.title || findings[0]?.description;
              return (
                <li key={id} className="flex items-start gap-2 px-2.5 py-2">
                  {ok ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  ) : check.status === "fail" ? (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="block text-muted-foreground">{note}</span>
                  </span>
                  {!ok && onShowCheck ? (
                    <button type="button" onClick={() => onShowCheck(id)} className="shrink-0 font-semibold text-primary hover:underline">
                      Show
                    </button>
                  ) : null}
                </li>
              );
            })}
            {summaryText && onApplySummary ? (
              <li className="px-2.5 py-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">Summary</span>
                    <span className="block text-muted-foreground">Point your summary at this job, using only what you already wrote.</span>
                  </span>
                  <button
                    type="button"
                    disabled={summaryAi.loading}
                    onClick={() => void tailorSummary()}
                    className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-60"
                  >
                    {summaryAi.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {summaryAi.options.length ? "More options" : "Tailor"}
                  </button>
                </div>
                {summaryAi.options.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {summaryAi.options.map((option, i) => (
                      <li key={option}>
                        <button
                          type="button"
                          onClick={() => {
                            onApplySummary(option);
                            setSummaryAi((prev) => ({ ...prev, applied: i }));
                          }}
                          className={cn(
                            "w-full rounded-md border px-2.5 py-1.5 text-left leading-relaxed",
                            summaryAi.applied === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
                          )}
                        >
                          {option}
                          <span className="mt-1 block text-[11px] font-semibold text-primary">
                            {summaryAi.applied === i ? "In your resume ✓" : "Put this in"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {summaryAi.error ? <p className="mt-1.5 text-muted-foreground">{summaryAi.error}</p> : null}
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

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
