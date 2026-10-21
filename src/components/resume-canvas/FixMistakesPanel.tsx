"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Loader2, RefreshCw, Sparkles, Target } from "lucide-react";
import { resumeApi } from "@/lib/api";
import type { ATSCheckId, ATSCheckResult, ATSIssue, ATSReportV3 } from "@/types/atsReport";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScoreRing, scoreBand } from "./CanvasChrome";
import type { CanvasMark } from "./CanvasInteractionLayer";

/** Our own check: "{XX%}"-style blanks left by suggestions, which would print as-is. */
const PLACEHOLDER_CHECK = "placeholderValues" as ATSCheckId;
const PLACEHOLDER_RE = /\{[^{}\n]{1,15}\}/g;
/** Title the backend uses when a check got no answer from the model (scored 0 until re-run). */
export const INCOMPLETE_TITLE = "Analysis incomplete";

/**
 * Blanks still on the resume. The excerpt is the few words before the blank plus the
 * blank, so two identical "{XX%}" in different bullets highlight separately.
 */
export function placeholderIssues(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];
  for (const line of text.split(/\n/)) {
    for (const match of line.matchAll(PLACEHOLDER_RE)) {
      const context = line.trim().replace(/\s+/g, " ");
      const before = line.slice(0, match.index ?? 0).trim().split(/\s+/).slice(-4).join(" ");
      issues.push({
        title: "Fill in the real number",
        description: `“${context.length > 140 ? `${context.slice(0, 137)}…` : context}” — replace ${match[0]} with your actual result before you send this.`,
        excerpt: `${before} ${match[0]}`.trim(),
        severity: "fail",
      } as ATSIssue);
    }
  }
  return issues;
}

const squash = (text: string) => text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

/** Fix-list groups, in the order a user should work through them. Every scored check is covered. */
const GROUPS: Array<{ title: string; checks: ATSCheckId[]; tone: CanvasMark["tone"] }> = [
  { title: "Fill in", checks: [PLACEHOLDER_CHECK], tone: "error" },
  { title: "Typos", checks: ["spellingGrammar"], tone: "error" },
  { title: "Red flags recruiters notice", checks: ["credibility", "interviewRisks"], tone: "weak" },
  { title: "Sections & contact", checks: ["essentialSections", "contactInformation", "sectionOrder", "headerLinks", "emailAddress", "datesLinksConsistency", "design", "atsParseRate"], tone: "weak" },
  { title: "Clarity", checks: ["repetition", "bulletsConsistency", "actionVerbs"], tone: "weak" },
  { title: "Fit for the job", checks: ["mustHaveSkillsMatch", "hardSkillsMatch", "softSkillsMatch", "titleMatch", "experienceMatch", "preferredSkillsMatch", "educationMatch", "certificationMatch", "responsibilitiesMatch"], tone: "weak" },
  { title: "Seniority & skills", checks: ["careerProgression", "leadershipSignals", "skillEvidence", "peerBenchmarking"], tone: "weak" },
  { title: "Bias risks", checks: ["ageismDateBias", "employmentGaps"], tone: "weak" },
  { title: "Impact (optional)", checks: ["quantifyingImpact"], tone: "weak" },
];

/** Where a finding lives on the page, for findings that quote no text (e.g. "Missing LinkedIn"). */
const CHECK_SECTION: Partial<Record<ATSCheckId, string>> = {
  contactInformation: "personalInfo",
  headerLinks: "personalInfo",
  emailAddress: "personalInfo",
  titleMatch: "personalInfo",
  mustHaveSkillsMatch: "skills",
  hardSkillsMatch: "skills",
  softSkillsMatch: "skills",
  preferredSkillsMatch: "skills",
  skillEvidence: "skills",
  peerBenchmarking: "skills",
  educationMatch: "education",
  ageismDateBias: "education",
  certificationMatch: "certificates",
  employmentGaps: "experience",
  careerProgression: "experience",
  leadershipSignals: "experience",
  experienceMatch: "experience",
  responsibilitiesMatch: "experience",
  actionVerbs: "experience",
  quantifyingImpact: "experience",
  bulletsConsistency: "experience",
};

/** Findings that praise the resume — shown in the full report, not as things to fix. */
const POSITIVE_KINDS = new Set(["positive", "credibility_positive", "skill_present"]);

/** Short card labels in our own words (not the backend's check names). */
const CARD_LABEL: Partial<Record<ATSCheckId, string>> = {
  [PLACEHOLDER_CHECK]: "Blank to fill",
  spellingGrammar: "Typo",
  quantifyingImpact: "Add a result",
  repetition: "Repeated word",
  bulletsConsistency: "Bullet length",
  actionVerbs: "Action verbs",
  datesLinksConsistency: "Dates & links",
  headerLinks: "Links",
  emailAddress: "Email",
  essentialSections: "Sections",
  contactInformation: "Contact",
  sectionOrder: "Section order",
  design: "Layout",
  atsParseRate: "Readability",
  credibility: "Credibility",
  interviewRisks: "Interview risk",
  peerBenchmarking: "Common skill",
  careerProgression: "Career story",
  leadershipSignals: "Leadership",
  skillEvidence: "Skill proof",
  ageismDateBias: "Age bias",
  employmentGaps: "Gaps",
  mustHaveSkillsMatch: "Required skills",
  hardSkillsMatch: "Hard skills",
  softSkillsMatch: "Soft skills",
  titleMatch: "Job title",
  experienceMatch: "Experience",
  preferredSkillsMatch: "Nice-to-have skills",
  educationMatch: "Education",
  certificationMatch: "Certifications",
  responsibilitiesMatch: "Responsibilities",
};

export interface FixItem {
  id: string;
  check: ATSCheckResult;
  issue: ATSIssue;
  tone: CanvasMark["tone"];
  /** The model didn't answer for this check — re-run, don't fix or dismiss. */
  incomplete: boolean;
  /** A single word with real replacement words (typo / repeated word chips). */
  wordFix: boolean;
}

function checksById(report: ATSReportV3): Map<ATSCheckId, ATSCheckResult> {
  const map = new Map<ATSCheckId, ATSCheckResult>();
  for (const category of Object.values(report.categories ?? {})) {
    for (const check of category?.checks ?? []) map.set(check.id, check);
  }
  return map;
}

/** Chips must be replacement words, not advice like "vary your vocabulary". */
export function isWordFix(issue: ATSIssue): boolean {
  const excerpt = issue.excerpt?.trim() ?? "";
  if (!excerpt || /\s/.test(excerpt)) return false;
  const alts = (issue.alternatives ?? []).filter(Boolean);
  return alts.length > 0 && alts.every((a) => a.trim().split(/\s+/).length <= 2 && !/\b(your|use|try|vary|avoid)\b/i.test(a));
}

/**
 * Findings grouped for the panel. With `liveText` (the resume's text now), findings
 * about text that is no longer there are dropped and blanks like "{XX%}" are listed
 * even before the next check.
 */
export function buildFixItems(
  report: ATSReportV3 | null,
  liveText?: string,
): Array<{ title: string; items: FixItem[] }> {
  if (!report && !liveText) return [];
  const checks = report ? checksById(report) : new Map<ATSCheckId, ATSCheckResult>();
  if (liveText) {
    const issues = placeholderIssues(liveText);
    checks.set(PLACEHOLDER_CHECK, {
      id: PLACEHOLDER_CHECK,
      label: "Blanks to fill",
      description: "",
      status: issues.length ? "fail" : "pass",
      score: issues.length ? 0 : 100,
      issueCount: issues.length,
      issues,
    } as unknown as ATSCheckResult);
  }
  const live = liveText ? squash(liveText) : null;
  return GROUPS.map((group) => ({
    title: group.title,
    items: group.checks.flatMap((id) => {
      const check = checks.get(id);
      if (!check || check.status === "skipped") return [];
      // Content-based ids (ignoring an issue re-sends the report, so indexes would shift);
      // repeats of the same text get #2, #3…
      const seen = new Map<string, number>();
      const current = check.issues.filter(
        (issue) =>
          !POSITIVE_KINDS.has(issue.kind ?? "") &&
          // Quoted text the user has since changed: the card no longer applies.
          (!live || isWordFix(issue) || !issue.excerpt || live.includes(squash(issue.excerpt))),
      );
      return current.map((issue, i) => {
        const key = (issue.excerpt || issue.title || String(i)).slice(0, 80);
        const n = (seen.get(key) ?? 0) + 1;
        seen.set(key, n);
        return {
          id: `${id}:${key}#${n}`,
          check,
          issue,
          tone: group.tone,
          incomplete: issue.title === INCOMPLETE_TITLE,
          wordFix: isWordFix(issue),
        };
      });
    }),
  }));
}

/**
 * Highlights for the page: the exact text each open finding is about (red boxes by
 * default). Findings without a quote carry their section, outlined when picked.
 */
export function fixMarks(groups: Array<{ items: FixItem[] }>, resolved: Set<string>): CanvasMark[] {
  return groups.flatMap((g) =>
    g.items
      .filter((item) => !resolved.has(item.id) && !item.incomplete)
      .filter((item) => (item.issue.excerpt?.trim().length ?? 0) > 1 || !!CHECK_SECTION[item.check.id])
      .map((item) => ({
        id: item.id,
        text: item.issue.excerpt?.trim() ?? "",
        tone: item.tone,
        wholeWord: item.wordFix,
        section: CHECK_SECTION[item.check.id],
      })),
  );
}

function IssueCard({
  item,
  active,
  onLocate,
  onApply,
  onIgnore,
  targetRole,
}: {
  item: FixItem;
  active: boolean;
  onLocate: () => void;
  onApply: (improved: string) => boolean;
  onIgnore: () => void;
  targetRole?: string;
}) {
  const { issue, check } = item;
  const [ai, setAi] = useState<{ loading: boolean; options: string[]; error?: string }>({ loading: false, options: [] });
  const excerpt = issue.excerpt?.trim() ?? "";
  const isWord = item.wordFix;
  const isBlank = check.id === PLACEHOLDER_CHECK;
  const chips = isWord ? (issue.alternatives ?? []).filter(Boolean).slice(0, 5) : [];
  const label = CARD_LABEL[check.id] ?? "Suggestion";
  const heading =
    isWord && check.id === "spellingGrammar"
      ? "Possible typo"
      : isWord && check.id === "repetition"
        ? "Used a lot — try a different word"
        : issue.title;
  const locatable = !!excerpt || !!CHECK_SECTION[check.id];
  // Whole-bullet suggestions only: a fragment would replace the entire line.
  const canTapRewrite =
    !!excerpt && !isWord && !isBlank && !!issue.rewriteSuggestion && issue.rewriteSuggestion.trim() !== excerpt;
  const canAskAi = !!excerpt && !isWord && !isBlank && excerpt.split(/\s+/).length >= 4 && !/^(sample|your)\b/i.test(excerpt);
  const howToFix = issue.fixBody || issue.suggestion;

  const rewrite = async () => {
    setAi({ loading: true, options: [] });
    try {
      const options = await resumeApi.aiRewrite({ text: excerpt, kind: "bullet", targetRole });
      setAi({ loading: false, options, error: options.length ? undefined : "No better wording found." });
    } catch {
      setAi({ loading: false, options: [], error: "Couldn't reach AI. Try again." });
    }
  };

  return (
    <div
      role={locatable ? "button" : undefined}
      tabIndex={locatable ? 0 : undefined}
      onClick={locatable ? onLocate : undefined}
      onKeyDown={(e) => {
        if (locatable && e.key === "Enter") onLocate();
      }}
      className={cn(
        "rounded-xl border bg-card p-3 text-left transition-shadow",
        locatable && "cursor-pointer",
        active ? "border-primary shadow-md" : "border-border hover:shadow-sm",
      )}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", item.tone === "error" ? "bg-red-500" : "bg-sky-500")} />
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-foreground">{heading}</p>
      {excerpt && !isBlank ? (
        <p className={cn("mt-1 text-xs", isWord ? "font-mono text-rose-700 dark:text-rose-300" : "line-clamp-3 text-muted-foreground")}>
          {isWord ? excerpt : `“${excerpt}”`}
        </p>
      ) : null}
      {!isWord && issue.description ? <p className="mt-1 text-xs text-muted-foreground">{issue.description}</p> : null}
      {issue.interviewQuestion ? (
        <p className="mt-1.5 text-xs italic text-muted-foreground">A recruiter may ask: “{issue.interviewQuestion}”</p>
      ) : null}
      {!isWord && !isBlank && howToFix && howToFix !== issue.description ? (
        <p className="mt-1.5 text-xs text-foreground/80">
          <span className="font-semibold">How to fix: </span>
          {howToFix}
        </p>
      ) : null}
      {chips.length ? <p className="mt-2 text-[11px] font-semibold text-muted-foreground">Replace with:</p> : null}
      <div className="mt-2.5 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onApply(chip)}
            className="rounded-full border border-primary/40 bg-background px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {chip}
          </button>
        ))}
        {canTapRewrite ? (
          <button
            type="button"
            onClick={() => onApply(issue.rewriteSuggestion!)}
            className="w-full rounded-md border border-emerald-500/50 bg-emerald-50 px-2.5 py-1.5 text-left text-xs text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
          >
            <span className="block font-semibold">Suggested wording · tap to use</span>
            {issue.rewriteSuggestion}
          </button>
        ) : null}
        {canAskAi ? (
          <button
            type="button"
            onClick={() => void rewrite()}
            disabled={ai.loading}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {ai.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Ask AI Coach
          </button>
        ) : null}
      </div>
      {ai.options.length ? (
        <ul className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          {ai.options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => onApply(option)}
                className="w-full rounded-md border border-border px-2.5 py-1.5 text-left text-xs hover:border-primary hover:bg-muted/40"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {ai.error ? <p className="mt-1.5 text-xs text-muted-foreground">{ai.error}</p> : null}
      <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onIgnore} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function FixMistakesPanel({
  report,
  score,
  checking,
  edited,
  resolved,
  activeId,
  onLocate,
  onApply,
  onIgnore,
  onRecheck,
  onTailor,
  targetRole,
  liveText,
  children,
}: {
  /** The resume's text now (keeps the list in step with edits). */
  liveText?: string;
  report: ATSReportV3 | null;
  score: number | null;
  checking: boolean;
  /** The resume changed since the last check (grade may be out of date). */
  edited: boolean;
  resolved: Set<string>;
  activeId: string | null;
  onLocate: (id: string) => void;
  onApply: (item: FixItem, improved: string) => boolean;
  onIgnore: (item: FixItem) => void;
  onRecheck: () => void;
  onTailor: () => void;
  targetRole?: string;
  /** The full ATS report, shown under the fix list. */
  children?: React.ReactNode;
}) {
  const groups = useMemo(() => buildFixItems(report, liveText), [report, liveText]);
  const open = groups.reduce((n, g) => n + g.items.filter((i) => !i.incomplete && !resolved.has(i.id)).length, 0);
  const unfinished = useMemo(
    () => [...new Set(groups.flatMap((g) => g.items.filter((i) => i.incomplete).map((i) => i.check.label)))],
    [groups],
  );
  const band = scoreBand(score);
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background p-4 ring-1 ring-border">
        <ScoreRing score={score} size={64} busy={checking} />
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-bold uppercase tracking-wide", band.text)}>{band.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {open > 0 ? `${open} thing${open === 1 ? "" : "s"} to improve` : "Nothing urgent to improve"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {edited ? "You've edited since the last check — re-run to update." : "Score out of 100 from our ATS check."}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onRecheck} disabled={checking}>
          {checking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          Run check again
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onTailor}>
          <Target className="mr-1.5 h-3.5 w-3.5" />
          Match a job
        </Button>
      </div>

      {unfinished.length ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">
            {unfinished.length} check{unfinished.length === 1 ? "" : "s"} didn&apos;t finish
          </p>
          <p className="mt-1">
            {unfinished.join(", ")} — these count as 0 in your score until they run. Running the check again usually fixes it.
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onRecheck} disabled={checking}>
            {checking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Check again
          </Button>
        </div>
      ) : null}

      {groups.map((group) => {
        const items = group.items.filter((i) => !i.incomplete && !resolved.has(i.id));
        // Groups with nothing to fix stay out of the way (the score ring already says "all good").
        if (!items.length) return null;
        return (
          <section key={group.title}>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
              {items.length ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{items.length} to fix</span>
              ) : null}
            </div>
            {items.length ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <IssueCard
                    key={item.id}
                    item={item}
                    active={activeId === item.id}
                    onLocate={() => onLocate(item.id)}
                    onApply={(improved) => onApply(item, improved)}
                    onIgnore={() => onIgnore(item)}
                    targetRole={targetRole}
                  />
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No issues detected.
              </p>
            )}
          </section>
        );
      })}

      {children ? (
        <section className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowReport((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
          >
            Detailed report
            <span className="text-xs font-medium text-primary">{showReport ? "Hide" : "Show"}</span>
          </button>
          {showReport ? <div className="mt-3">{children}</div> : null}
        </section>
      ) : null}
      {resolved.size ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" />
          {resolved.size} fixed this session
        </p>
      ) : null}
    </div>
  );
}
