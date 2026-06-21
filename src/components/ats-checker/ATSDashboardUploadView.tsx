"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  FilePenLine,
  FileSearch,
  Layers,
  Send,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ATSUploadHero } from "./ATSUploadHero";
import { ATSHeroAnimation } from "./landing/ATSHeroAnimation";

const HIGHLIGHTS = [
  "ATS parse rate & file compatibility",
  "HR red flags & seniority fit",
  "Copy-ready bullet rewrites",
];

const BENEFIT_CARDS = [
  {
    icon: Send,
    title: "Right keywords",
    description: "Match skills and qualifications ATS software scans for before a recruiter opens your file.",
    iconClass: "bg-primary text-white",
  },
  {
    icon: Users,
    title: "Data-driven fixes",
    description: "Actionable suggestions based on how real hiring systems score resumes—not guesswork.",
    iconClass: "bg-indigo-500 text-white",
  },
  {
    icon: FilePenLine,
    title: "Format that parses",
    description: "Catch layout traps, broken links, and formatting issues that block automated screening.",
    iconClass: "bg-emerald-500 text-white",
  },
] as const;

const CHECK_CATEGORIES = [
  {
    icon: FileSearch,
    title: "Content",
    checks: 5,
    iconClass: "text-primary bg-primary/10",
  },
  {
    icon: Layers,
    title: "Sections",
    checks: 3,
    iconClass: "text-indigo-600 bg-indigo-500/10",
  },
  {
    icon: Shield,
    title: "ATS Essentials",
    checks: 6,
    iconClass: "text-sky-600 bg-sky-500/10",
  },
  {
    icon: AlertTriangle,
    title: "HR Red Flags",
    checks: 4,
    iconClass: "text-amber-600 bg-amber-500/10",
  },
  {
    icon: TrendingUp,
    title: "Seniority",
    checks: 3,
    iconClass: "text-emerald-600 bg-emerald-500/10",
  },
  {
    icon: Target,
    title: "Tailoring",
    checks: 4,
    iconClass: "text-violet-600 bg-violet-500/10",
  },
] as const;

const HOW_STEPS = [
  { icon: Upload, title: "Upload", desc: "Drop your PDF — optionally add a job description." },
  { icon: FileSearch, title: "Parse", desc: "We extract structured data and measure parse rate." },
  { icon: Sparkles, title: "Analyze", desc: "27 checks across content, sections, and red flags." },
  { icon: Target, title: "Improve", desc: "Fix issues in the resume builder with one click." },
] as const;

const QUICK_TIPS = [
  {
    q: "Do I need a job description?",
    a: "No — you get a full standalone report. Adding a JD unlocks tailoring and job-match checks.",
  },
  {
    q: "What's a good ATS score?",
    a: "Scores above 80 usually mean a well-optimized resume. Start with Content and ATS Essentials fixes.",
  },
  {
    q: "What file can I upload?",
    a: "PDF only, up to 2MB — matching typical ATS upload limits.",
  },
] as const;

interface ATSDashboardUploadViewProps {
  onStart: (file: File, jobDescription: string) => void;
  uploading?: boolean;
  error?: string | null;
}

export function ATSDashboardUploadView({
  onStart,
  uploading,
  error,
}: ATSDashboardUploadViewProps) {
  return (
    <div className="space-y-10 lg:space-y-12">
      {/* Hero + upload */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(115,103,240,0.08),transparent)]" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              ATS Resume Checker
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Is your resume{" "}
                <span className="text-primary">good enough?</span>
              </h1>
            </div>

            <ul className="space-y-2">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-foreground/90"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6">
              <p className="mb-4 text-sm font-semibold text-foreground">
                Start your free check
              </p>
              <ATSUploadHero
                onStart={onStart}
                uploading={uploading}
                error={error}
                compact
              />
            </div>
          </div>

          <div className="order-last lg:order-none lg:pl-2">
            <ATSHeroAnimation />
          </div>
        </div>
      </section>

      {/* Benefit cards */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Why run an ATS check?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Most resumes are filtered by software before a human ever reads them.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {BENEFIT_CARDS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-card"
              >
                <div
                  className={cn(
                    "mb-3 flex h-11 w-11 items-center justify-center rounded-xl",
                    item.iconClass,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* What we analyze */}
      <section className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              What we analyze
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              27 automated checks across 7 categories — plus job match when you
              paste a description.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            7 categories
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHECK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    cat.iconClass,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{cat.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat.checks} checks
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-5 text-lg font-bold text-foreground sm:text-xl">
          How it works
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick tips + builder link */}
      <section className="grid gap-6 lg:grid-cols-[1fr_minmax(240px,320px)]">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">Quick tips</h2>
          <div className="mt-4 space-y-4">
            {QUICK_TIPS.map((tip) => (
              <div key={tip.q} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-foreground">{tip.q}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {tip.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h3 className="font-bold text-foreground">Already have a report?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Open the resume builder to apply fixes, improve formatting, and boost
            your score with AI rewrites.
          </p>
          <Link
            href="/dashboard/resumes"
            className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
          >
            Go to my resumes →
          </Link>
        </div>
      </section>
    </div>
  );
}
