"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowRight, FileSearch, Layers, Scale, Shield, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mono } from "@/components/marketing-2026/primitives";
import { EASE, Eyebrow, ScoreRing, dash2026Scope } from "@/components/dashboard-2026/ui";
import { ListHeader } from "@/components/dashboard-2026/PracticeHero";
import { useResumesQuery } from "@/hooks/queries/useResumesQuery";
import type { Resume } from "@/lib/api";
import { ATSUploadHero } from "./ATSUploadHero";

/** The report's seven categories and the checks inside each, same as the public ATS checker page. */
const CATEGORIES = [
  { icon: FileSearch, t: "Content", checks: ["ATS Parse Rate", "Quantifying Impact", "Repetition", "Spelling & Grammar", "Bullets Consistency"] },
  { icon: Layers, t: "Sections", checks: ["Essential Sections", "Contact Information", "Section Order"] },
  { icon: Shield, t: "ATS Essentials", checks: ["File Format & Size", "Design", "Email Address", "Header Links", "File Name", "Dates & Links"] },
  { icon: AlertTriangle, t: "HR Red Flags", checks: ["Credibility", "Interview Risks", "Peer Benchmarking"] },
  { icon: Scale, t: "Discrimination", checks: ["Ageism & Date Bias", "Employment Gaps"] },
  { icon: TrendingUp, t: "Seniority", checks: ["Career Progression", "Skill Evidence", "Leadership Signals"] },
  { icon: Target, t: "Tailoring", checks: ["Hard Skills", "Soft Skills", "Action Verbs", "Title Match"], jd: true },
];

const hasAts = (r: Resume) => typeof r.atsScore === "number" && Number.isFinite(r.atsScore);
const dayMonth = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");
const reportHref = (r: Resume) => `/dashboard/ats-checker?resumeId=${encodeURIComponent(r.resumeId)}`;

function scoreTone(n: number) {
  if (n >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 60) return "text-primary";
  return "text-amber-600 dark:text-amber-400";
}

interface ATSDashboardUploadViewProps {
  onStart: (file: File, jobDescription: string) => void;
  uploading?: boolean;
  error?: string | null;
}

export function ATSDashboardUploadView({ onStart, uploading, error }: ATSDashboardUploadViewProps) {
  const reduce = useReducedMotion();
  const { data: resumes = [] } = useResumesQuery();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });

  const scored = resumes
    .filter(hasAts)
    .sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0));
  const last = scored[0];
  const best = scored.length ? Math.max(...scored.map((r) => Math.round(r.atsScore!))) : null;
  const avg = scored.length ? Math.round(scored.reduce((n, r) => n + (r.atsScore ?? 0), 0) / scored.length) : null;
  const ready = scored.filter((r) => (r.atsScore ?? 0) >= 80).length;

  return (
    <div className={cn(dash2026Scope, "space-y-5 lg:space-y-6")}>
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <motion.div {...rise(0)}><Eyebrow>ATS CHECKER</Eyebrow></motion.div>
            <motion.h1 {...rise(0.08)} className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
              Is your resume{" "}
              <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">good enough</span>{" "}
              for their software?
            </motion.h1>
            <motion.p {...rise(0.16)} className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
              Upload a PDF for a Smart ATS Score: parse rate, content quality, recruiter red flags and, if you paste a job, how well you match it. Every issue comes with a fix.
            </motion.p>
            <motion.div {...rise(0.24)} className="mt-6 [&_button]:rounded-xl">
              <ATSUploadHero onStart={onStart} uploading={uploading} error={error} compact />
            </motion.div>
          </div>

          <motion.div {...rise(0.3)} className="rounded-2xl border border-border bg-background/70 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur">
            <Mono className="text-[11px] text-muted-foreground">LAST CHECKED</Mono>
            {last ? (
              <div className="mt-3 flex items-center gap-4">
                <ScoreRing score={Math.round(last.atsScore!)} />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{last.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">{dayMonth(last.updatedAt)}</p>
                  <Link href={reportHref(last)} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                    Open the report <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                No resume checked yet. Upload one and its score shows up here, with every issue to fix.
              </p>
            )}
          </motion.div>
        </div>

        <motion.div {...rise(0.36)} className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
          {([
            ["Resumes checked", String(scored.length), `${resumes.length} in your account`],
            ["Best score", best != null ? String(best) : "—", "out of 100"],
            ["Average", avg != null ? String(avg) : "—", avg != null ? "across checked resumes" : "after your first check"],
            ["Ready to send", String(ready), "scoring 80 or more"],
          ] as const).map(([k, v, d]) => (
            <div key={k} className="border-border px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className="mt-1 block text-[24px] tracking-tight text-foreground">{v}</Mono>
              <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {scored.length > 0 && (
        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader eyebrow="YOUR REPORTS" title={`${scored.length} checked resume${scored.length === 1 ? "" : "s"}.`} description="Open a report to fix its issues, or run the check again after you edit." />
          <ul className="divide-y divide-border">
            {scored.slice(0, 6).map((r) => {
              const s = Math.round(r.atsScore!);
              return (
                <li key={r.resumeId}>
                  <Link href={reportHref(r)} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 md:px-6">
                    <Mono className={cn("w-10 shrink-0 text-[22px] font-semibold tabular-nums", scoreTone(s))}>{s}</Mono>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-foreground">{r.title}</p>
                      <div className="mt-1.5 h-1 max-w-[220px] overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-primary" : "bg-amber-500")} style={{ width: `${s}%` }} />
                      </div>
                    </div>
                    <Mono className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">{dayMonth(r.updatedAt).toUpperCase()}</Mono>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-[22px] border border-border bg-card">
        <ListHeader eyebrow="WHAT WE CHECK" title="Seven ways their software reads you." description="Every report groups its checks the same way, so you fix the categories that cost you most first.">
          <Mono className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">JOB MATCH WITH A JD</Mono>
        </ListHeader>
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <div key={c.t} className={cn("bg-card p-5 md:p-6", i === 0 && "xl:col-span-2")}>
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white"><c.icon className="h-4 w-4" /></span>
                <Mono className="text-[10.5px] text-muted-foreground">0{i + 1}{c.jd ? " · WITH A JOB" : ""}</Mono>
              </div>
              <p className="mt-3 text-[15px] font-semibold text-foreground">{c.t}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.checks.map((k) => (
                  <Mono key={k} className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{k}</Mono>
                ))}
              </div>
            </div>
          ))}
          <div className="bg-card p-5 md:p-6">
            <Mono className="text-[10.5px] text-primary">THEN</Mono>
            <p className="mt-3 text-[15px] font-semibold text-foreground">Fix it in the editor.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">One click opens the report beside your resume, and the score moves as you edit.</p>
            <Link href="/dashboard/resumes" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
              Your resumes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
