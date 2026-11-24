"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleDashed, Loader2, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mono } from "@/components/marketing-2026/primitives";
import { jobKeywordGroups, type KeywordGroup } from "@/components/resume-canvas/jobKeywords";
import { track } from "@/lib/analytics/productEvents";
import { cn } from "@/lib/utils";
import type { ATSReportV3 } from "@/types/atsReport";

/** The backend's minimum for job matching (JOB_MATCH_MIN_JD_CHARS). */
export const MIN_JD_CHARS = 50;

function Chips({ items, tone, icon }: { items: string[]; tone: "missing" | "partial" | "found"; icon: React.ReactNode }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <li
          key={k}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[12.5px] leading-none",
            tone === "missing" && "border-rose-500/30 bg-rose-500/[0.07] text-foreground",
            tone === "partial" && "border-amber-500/30 bg-amber-500/[0.08] text-foreground",
            tone === "found" && "border-emerald-500/25 bg-emerald-500/[0.06] text-muted-foreground",
          )}
        >
          {icon}
          {k}
        </li>
      ))}
    </ul>
  );
}

function Group({ title, hint, group }: { title: string; hint: string; group: KeywordGroup }) {
  const [showFound, setShowFound] = useState(false);
  const toAdd = group.missing.length + group.partial.length;
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] font-semibold text-foreground">{title}</p>
        <Mono className="text-[11px] text-muted-foreground">
          {group.found.length} OF {group.found.length + toAdd} ON YOUR RESUME
        </Mono>
      </div>
      {toAdd === 0 ? (
        <p className="text-[13px] text-emerald-700 dark:text-emerald-400">All on your resume.</p>
      ) : (
        <>
          <p className="text-[12.5px] text-muted-foreground">{hint}</p>
          {group.missing.length > 0 && <Chips items={group.missing} tone="missing" icon={<Plus className="h-3 w-3 text-rose-600 dark:text-rose-400" />} />}
          {group.partial.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[12px] text-muted-foreground">Mentioned, but not clearly shown:</p>
              <Chips items={group.partial} tone="partial" icon={<CircleDashed className="h-3 w-3 text-amber-600 dark:text-amber-400" />} />
            </div>
          )}
        </>
      )}
      {group.found.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowFound((s) => !s)} className="text-[12px] font-medium text-primary hover:underline" aria-expanded={showFound}>
            {showFound ? "Hide" : "Show"} {group.found.length} found
          </button>
          {showFound && <div className="mt-1.5"><Chips items={group.found} tone="found" icon={<Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />} /></div>}
        </div>
      )}
    </div>
  );
}

/**
 * "Job keywords": the skills a pasted job asks for that the resume doesn't show yet, with a
 * link to add them in the editor. Without a job, it offers to paste one.
 */
export function ATSKeywordsCard({
  report,
  editorHref,
  initialJobDescription = "",
  running = false,
  onRunJobMatch,
}: {
  report: ATSReportV3;
  /** The editor's job-match panel, where keywords are added. */
  editorHref?: string;
  initialJobDescription?: string;
  running?: boolean;
  onRunJobMatch?: (jd: string) => void | Promise<void>;
}) {
  const groups = jobKeywordGroups(report);
  const [jd, setJd] = useState(initialJobDescription);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const text = jd.trim();
    if (text.length < MIN_JD_CHARS) {
      setError(`Paste at least ${MIN_JD_CHARS} characters of the job description.`);
      return;
    }
    setError(null);
    track("ats_job_match_requested", { surface: "report", has_previous: Boolean(groups) });
    try {
      await onRunJobMatch?.(text);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check against this job. Please try again.");
    }
  };

  const form = (
    <div className="space-y-2">
      <label htmlFor="ats-jd" className="text-[12.5px] font-medium text-foreground">Job description</label>
      <textarea
        id="ats-jd"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={5}
        placeholder="Paste the full job post here"
        className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error && <p className="text-[12.5px] text-destructive">{error}</p>}
      <Button type="button" onClick={() => void run()} disabled={running || !onRunJobMatch} className="h-10 rounded-xl px-4">
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
        {running ? "Checking…" : "Check against this job"}
      </Button>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-[22px] border border-border bg-card" aria-labelledby="ats-keywords-title">
      <div className="border-b border-border px-5 py-4">
        <Mono className="text-[11px] text-primary">— JOB KEYWORDS —</Mono>
        <p id="ats-keywords-title" className="mt-1 text-[15px] font-semibold text-foreground">
          {groups
            ? groups.total - groups.foundCount === 0
              ? "Your resume covers this job's skills."
              : `${groups.total - groups.foundCount} of ${groups.total} skills from the job aren't clear on your resume.`
            : "See which skills a job asks for that your resume is missing."}
        </p>
      </div>
      <div className="space-y-5 p-5">
        {groups ? (
          <>
            {groups.required && <Group title="Required" hint="The job lists these as must-haves. Add the ones you really have." group={groups.required} />}
            {groups.preferred && <Group title="Nice to have" hint="Optional, but each one you have helps." group={groups.preferred} />}
            <p className="text-[12px] text-muted-foreground">Only add skills you actually have. Recruiters ask about them in interviews.</p>
            {open ? form : (
              <button type="button" onClick={() => setOpen(true)} className="text-[12.5px] font-medium text-primary hover:underline">
                Check against a different job
              </button>
            )}
          </>
        ) : (
          form
        )}
      </div>
      {groups && editorHref && groups.total > groups.foundCount && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3.5">
          <p className="text-[12.5px] text-muted-foreground">Keywords turn green as you add them.</p>
          <Link
            href={editorHref}
            onClick={() => track("ats_keywords_editor_opened", { missing: groups.total - groups.foundCount })}
            className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
          >
            Add in editor <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
