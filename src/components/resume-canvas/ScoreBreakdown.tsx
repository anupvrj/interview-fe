"use client";

import type { ATSCheckId, ATSCheckResult, ATSReportV3 } from "@/types/atsReport";
import { cn } from "@/lib/utils";

/**
 * The score in four plain parts, so it's clear what moves it. Grouped from the report's own
 * checks (no new scoring). An estimate, not any employer's ATS score.
 */
const PARTS: { id: string; label: string; hint: string; checks: ATSCheckId[] }[] = [
  {
    id: "parse",
    label: "Readable by ATS",
    hint: "Text, contact details and sections that resume-screening software can pick up.",
    checks: ["atsParseRate", "fileFormatSize", "contactInformation", "emailAddress", "headerLinks", "essentialSections", "fileNameCheck"],
  },
  {
    id: "keywords",
    label: "Job keywords",
    hint: "How much of the job's skills, title and duties your resume shows.",
    checks: ["hardSkillsMatch", "softSkillsMatch", "mustHaveSkillsMatch", "preferredSkillsMatch", "titleMatch", "responsibilitiesMatch", "experienceMatch", "educationMatch", "certificationMatch"],
  },
  {
    id: "content",
    label: "Content quality",
    hint: "Specific achievements, clear wording, no repetition, mistakes or clichés.",
    checks: ["quantifyingImpact", "repetition", "spellingGrammar", "actionVerbs", "skillEvidence", "leadershipSignals", "credibility", "careerProgression", "placeholderValues", "datesLinksConsistency", "interviewRisks"],
  },
  {
    id: "layout",
    label: "Length & layout",
    hint: "Design, section order and consistent bullets.",
    checks: ["design", "sectionOrder", "bulletsConsistency"],
  },
];

export function scoreParts(report: ATSReportV3) {
  const all = new Map<string, ATSCheckResult>();
  for (const category of Object.values(report.categories ?? {})) for (const check of category?.checks ?? []) all.set(check.id, check);
  return PARTS.map((part) => {
    // Without a job there is nothing to match against: the keyword checks don't count.
    if (part.id === "keywords" && report.mode !== "tailored" && !report.jobMatch) return { ...part, score: null, issues: 0 };
    const checks = part.checks.map((id) => all.get(id)).filter((c): c is ATSCheckResult => !!c);
    const score = checks.length ? Math.round(checks.reduce((sum, c) => sum + c.score, 0) / checks.length) : null;
    const issues = checks.reduce((sum, c) => sum + (c.issueCount ?? 0), 0);
    return { ...part, score, issues };
  });
}

export function ScoreBreakdown({ report }: { report: ATSReportV3 }) {
  const parts = scoreParts(report);
  return (
    <section data-testid="score-breakdown" className="rounded-xl border border-border bg-card p-3.5">
      <h4 className="text-sm font-semibold text-foreground">What makes up your score</h4>
      <ul className="mt-2.5 space-y-2.5">
        {parts.map((p) => (
          <li key={p.id} title={p.hint}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{p.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {p.score === null ? (p.id === "keywords" ? "Add a job to see" : "—") : `${p.score}/100`}
                {p.issues ? ` · ${p.issues} to fix` : ""}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", p.score === null ? "" : p.score >= 80 ? "bg-emerald-500" : p.score >= 60 ? "bg-amber-500" : "bg-rose-500")}
                style={{ width: `${p.score ?? 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {typeof report.scoreCap === "number" && report.score <= report.scoreCap && report.scoreCapReasons?.length ? (
        <p data-testid="score-cap" className="mt-3 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Held at {report.scoreCap} until this is fixed: {report.scoreCapReasons.join("; ")}.
        </p>
      ) : null}
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        This is our estimate of how resume-screening software reads your resume. Every employer&apos;s system is different, and no tool can show
        their exact score.
      </p>
    </section>
  );
}
