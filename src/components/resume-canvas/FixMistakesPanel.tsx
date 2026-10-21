"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Loader2, RefreshCw, Sparkles, Target } from "lucide-react";
import { resumeApi } from "@/lib/api";
import type { ATSCheckId, ATSCheckResult, ATSIssue, ATSReportV3 } from "@/types/atsReport";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScoreRing, scoreBand } from "./CanvasChrome";
import type { CanvasMark } from "./CanvasInteractionLayer";

/** Fix-list groups, in the order a user should work through them. */
const GROUPS: Array<{ title: string; checks: ATSCheckId[]; tone: CanvasMark["tone"] }> = [
  { title: "Typos", checks: ["spellingGrammar"], tone: "error" },
  { title: "Impact", checks: ["quantifyingImpact"], tone: "weak" },
  { title: "Clarity", checks: ["repetition", "bulletsConsistency"], tone: "weak" },
  { title: "Polish", checks: ["datesLinksConsistency", "headerLinks", "emailAddress", "skillEvidence"], tone: "weak" },
];

/** Short card labels in our own words (not the backend's check names). */
const CARD_LABEL: Partial<Record<ATSCheckId, string>> = {
  spellingGrammar: "Typo",
  quantifyingImpact: "Add a result",
  repetition: "Repeated word",
  bulletsConsistency: "Bullet length",
  datesLinksConsistency: "Dates & links",
  headerLinks: "Links",
  emailAddress: "Email",
  skillEvidence: "Skill proof",
};

export interface FixItem {
  id: string;
  check: ATSCheckResult;
  issue: ATSIssue;
  tone: CanvasMark["tone"];
}

function checksById(report: ATSReportV3): Map<ATSCheckId, ATSCheckResult> {
  const map = new Map<ATSCheckId, ATSCheckResult>();
  for (const category of Object.values(report.categories ?? {})) {
    for (const check of category?.checks ?? []) map.set(check.id, check);
  }
  return map;
}

/** Issues that point at text on the page, grouped for the panel. */
export function buildFixItems(report: ATSReportV3 | null): Array<{ title: string; items: FixItem[] }> {
  if (!report) return [];
  const checks = checksById(report);
  return GROUPS.map((group) => ({
    title: group.title,
    items: group.checks.flatMap((id) => {
      const check = checks.get(id);
      // Content-based ids (ignoring an issue re-sends the report, so indexes would shift);
      // repeats of the same text get #2, #3…
      const seen = new Map<string, number>();
      return (check?.issues ?? []).map((issue, i) => {
        const key = (issue.excerpt || issue.title || String(i)).slice(0, 80);
        const n = (seen.get(key) ?? 0) + 1;
        seen.set(key, n);
        return {
        id: `${id}:${key}#${n}`,
        check: check!,
        issue,
        tone: group.tone,
        };
      });
    }),
  }));
}

/** Highlights for the page: the exact text each open issue is about. */
export function fixMarks(groups: Array<{ items: FixItem[] }>, resolved: Set<string>): CanvasMark[] {
  return groups.flatMap((g) =>
    g.items
      .filter((item) => !resolved.has(item.id) && item.issue.excerpt && item.issue.excerpt.trim().length > 1)
      .map((item) => ({
        id: item.id,
        text: item.issue.excerpt!.trim(),
        tone: item.tone,
        wholeWord: item.check.id === "spellingGrammar" || item.check.id === "repetition",
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
  const isWord = check.id === "spellingGrammar" || check.id === "repetition";
  const chips = (issue.alternatives ?? []).filter(Boolean).slice(0, 5);
  const label = CARD_LABEL[check.id] ?? "Suggestion";
  const heading = check.id === "spellingGrammar" ? "Possible typo" : check.id === "repetition" ? "Used a lot — try a different word" : issue.title;

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
      role="button"
      tabIndex={0}
      onClick={onLocate}
      onKeyDown={(e) => {
        if (e.key === "Enter") onLocate();
      }}
      className={cn(
        "cursor-pointer rounded-xl border bg-card p-3 text-left transition-shadow",
        active ? "border-primary shadow-md" : "border-border hover:shadow-sm",
      )}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", item.tone === "error" ? "bg-red-500" : "bg-sky-500")} />
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-foreground">{heading}</p>
      {excerpt ? (
        <p className={cn("mt-1 text-xs", isWord ? "font-mono text-rose-700 dark:text-rose-300" : "line-clamp-3 text-muted-foreground")}>
          {isWord ? excerpt : `“${excerpt}”`}
        </p>
      ) : null}
      {isWord && chips.length && excerpt ? <p className="mt-2 text-[11px] font-semibold text-muted-foreground">Replace with:</p> : null}
      {!isWord && issue.description ? <p className="mt-1 text-xs text-muted-foreground">{issue.description}</p> : null}
      <div className="mt-2.5 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
        {excerpt
          ? chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onApply(chip)}
                className="rounded-full border border-primary/40 bg-background px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {chip}
              </button>
            ))
          : null}
        {excerpt && issue.rewriteSuggestion && !isWord ? (
          <button
            type="button"
            onClick={() => onApply(issue.rewriteSuggestion!)}
            className="w-full rounded-md border border-emerald-500/50 bg-emerald-50 px-2.5 py-1.5 text-left text-xs text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
          >
            <span className="block font-semibold">Suggested wording · tap to use</span>
            {issue.rewriteSuggestion}
          </button>
        ) : null}
        {excerpt && !isWord && !/^(sample|your)\b/i.test(excerpt) ? (
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
  children,
}: {
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
  const groups = useMemo(() => buildFixItems(report), [report]);
  const open = groups.reduce((n, g) => n + g.items.filter((i) => !resolved.has(i.id)).length, 0);
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

      {groups.map((group) => {
        const items = group.items.filter((i) => !resolved.has(i.id));
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
