"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Mono } from "@/components/marketing-2026/primitives";
import { cn } from "@/lib/utils";
import type { ATSCategoryId, ATSReportV3 } from "@/types/atsReport";
import { CATEGORY_ORDER } from "@/types/atsReport";

/** What each category looks at, in one line. */
const CATEGORY_WHAT: Partial<Record<ATSCategoryId, string>> = {
  content: "Can software read it, numbers in your bullets, spelling, repetition, sample text left in",
  sections: "The standard sections, contact details and their order",
  atsEssentials: "File type and size, layout, email, links and dates",
  hrRedFlags: "What a recruiter would question: vague claims, risks, how you compare with peers",
  discrimination: "Details that can invite bias, like age signals or unexplained gaps",
  seniority: "Career progression, evidence for your skills, leadership",
  tailoring: "Skills, title and wording against the job you pasted",
};

/**
 * "How this score works": the categories and how much each counts, why it's capped, and a
 * plain statement that it's our estimate, not the score an employer's system gives.
 */
export function ATSScoreExplainer({ report }: { report: ATSReportV3 }) {
  const [open, setOpen] = useState(false);
  const weights = report.scoreWeights ?? {};
  const rows = CATEGORY_ORDER.filter((id) => (weights[id] ?? 0) > 0 && report.categories[id]).map((id) => ({
    id,
    label: report.categories[id].label,
    score: report.categories[id].score,
    weight: weights[id]!,
  }));

  return (
    <section className="overflow-hidden rounded-[18px] border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="ats-score-explainer"
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-muted/40"
      >
        <span className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
          <Info className="h-4 w-4 text-primary" />
          How this score works
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id="ats-score-explainer" className="space-y-4 border-t border-border px-5 py-4 text-[13px] text-muted-foreground">
          <p>
            This is <span className="font-medium text-foreground">InterviewTrix&apos;s estimate</span> of how well hiring software can read your resume and how it
            reads to a recruiter. It isn&apos;t the score any employer&apos;s system gives: each company sets theirs up differently.
          </p>
          {rows.length > 0 && (
            <div>
              <Mono className="text-[11px] text-muted-foreground">WHAT COUNTS{report.mode === "tailored" ? " (WITH YOUR JOB)" : ""}</Mono>
              <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                {rows.map((r) => (
                  <li key={r.id} className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-0.5 px-3.5 py-2.5">
                    <span className="font-medium text-foreground">{r.label}</span>
                    <Mono className="text-[12px] text-foreground tabular-nums">{r.weight}%</Mono>
                    {CATEGORY_WHAT[r.id] && <span className="col-span-2 text-[12px]">{CATEGORY_WHAT[r.id]}</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px]">
                Each category&apos;s score is the average of its checks, with failed checks counting a little more. Your overall score is the weighted
                average above. Categories not in this list are tips and don&apos;t change the score.
              </p>
            </div>
          )}
          {report.scoreCap != null && (
            <p>
              <span className="font-medium text-foreground">Why it&apos;s held at {report.scoreCap}:</span> a resume that isn&apos;t finished can&apos;t look ready, however
              clean the rest is.{report.scoreCapReasons?.length ? ` Fix: ${report.scoreCapReasons.join("; ")}.` : ""}
            </p>
          )}
          <p>
            {report.mode === "tailored"
              ? "Job match is a separate score: it compares your resume with the job you pasted and doesn't change this one."
              : "Paste a job description to also get a separate job match score and the keywords you're missing."}{" "}
            The same resume always gets the same score; it moves only when your resume changes.
          </p>
        </div>
      )}
    </section>
  );
}
