"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileSearch,
  Shield,
  Target,
  Layers,
  AlertTriangle,
  Users,
  Scale,
  TrendingUp,
  Upload,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appMarketingSection, appMarketingSectionLight } from "@/lib/app-theme";
import { SeoVideoSection } from "@/components/seo/SeoVideoSection";
import { atsCheckerDemoVideo } from "@/lib/seo/marketing-video-content";

const CHECK_CATEGORIES = [
  {
    icon: FileSearch,
    title: "Content",
    tagline: "Words that get parsed and remembered",
    checks: [
      "ATS Parse Rate",
      "Quantifying Impact",
      "Repetition",
      "Spelling & Grammar",
      "Bullets Consistency",
    ],
    iconClass: "bg-primary",
    cardTint: "from-[#7367F0]/[0.06] to-card",
  },
  {
    icon: Layers,
    title: "Sections",
    tagline: "Structure recruiters expect",
    checks: ["Essential Sections", "Contact Information", "Section Order"],
    iconClass: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    cardTint: "from-indigo-500/[0.06] to-card",
  },
  {
    icon: Shield,
    title: "ATS Essentials",
    tagline: "Format that survives the scan",
    checks: [
      "File Format & Size",
      "Design",
      "Email Address",
      "Header Links",
      "File Name",
      "Dates & Links",
    ],
    iconClass: "bg-gradient-to-br from-sky-500 to-sky-600",
    cardTint: "from-sky-500/[0.06] to-card",
  },
  {
    icon: AlertTriangle,
    title: "HR Red Flags",
    tagline: "Issues that trigger instant rejections",
    checks: [
      "Credibility",
      "Interview Risks",
      "Peer Benchmarking",
    ],
    iconClass: "bg-gradient-to-br from-amber-500 to-amber-600",
    cardTint: "from-amber-500/[0.06] to-card",
  },
  {
    icon: Scale,
    title: "Discrimination",
    tagline: "Bias signals to remove early",
    checks: ["Ageism & Date Bias", "Employment Gaps"],
    iconClass: "bg-gradient-to-br from-rose-500 to-rose-600",
    cardTint: "from-rose-500/[0.06] to-card",
  },
  {
    icon: TrendingUp,
    title: "Seniority",
    tagline: "Level fit beyond years of experience",
    checks: ["Career Progression", "Skill Evidence", "Leadership Signals"],
    iconClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    cardTint: "from-emerald-500/[0.06] to-card",
  },
  {
    icon: Target,
    title: "Tailoring",
    tagline: "Keyword match for the role you want",
    checks: ["Hard Skills", "Soft Skills", "Action Verbs", "Title Match"],
    iconClass: "bg-gradient-to-br from-violet-500 to-violet-600",
    cardTint: "from-violet-500/[0.06] to-card",
  },
];

const CHECK_FLOAT_ICONS = [
  FileSearch,
  Shield,
  Target,
  Layers,
  AlertTriangle,
  TrendingUp,
  Scale,
];

function ChecksFloatingBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(10)].map((_, i) => {
        const Icon = CHECK_FLOAT_ICONS[i % CHECK_FLOAT_ICONS.length];
        return (
          <div
            key={`checks-float-a-${i}`}
            className="absolute"
            style={{
              left: `${(i * 11) % 92}%`,
              top: `${(i * 17) % 88}%`,
              opacity: 0.1,
              animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.45}s`,
            }}
          >
            <Icon className="h-10 w-10 text-[#7367F0] sm:h-12 sm:w-12" />
          </div>
        );
      })}
      {[...Array(6)].map((_, i) => {
        const Icon = CHECK_FLOAT_ICONS[(i + 2) % CHECK_FLOAT_ICONS.length];
        return (
          <div
            key={`checks-float-b-${i}`}
            className="absolute"
            style={{
              left: `${(i * 18 + 3) % 88}%`,
              top: `${(i * 23 + 5) % 90}%`,
              opacity: 0.07,
              animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.75}s`,
            }}
          >
            <Icon className="h-7 w-7 text-[#7367F0] sm:h-9 sm:w-9" />
          </div>
        );
      })}
    </div>
  );
}

const CARD_PLACEMENT = [
  { offsetY: "-mt-3", offsetX: "" },
  { offsetY: "mt-5", offsetX: "ml-1" },
  { offsetY: "mt-1", offsetX: "-ml-2" },
  { offsetY: "mt-6", offsetX: "ml-2" },
  { offsetY: "-mt-2", offsetX: "ml-4" },
  { offsetY: "mt-4", offsetX: "-ml-3" },
  { offsetY: "mt-2", offsetX: "ml-1" },
] as const;

function CategoryCard({
  cat,
  index,
  visible,
  placement,
}: {
  cat: (typeof CHECK_CATEGORIES)[number];
  index: number;
  visible: boolean;
  placement: (typeof CARD_PLACEMENT)[number];
}) {
  const Icon = cat.icon;

  return (
    <div
      className={cn(
        "transition-all duration-700",
        placement.offsetY,
        placement.offsetX,
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-y-8",
      )}
      style={{ transitionDelay: visible ? `${index * 70}ms` : "0ms" }}
    >
      <article
        className={cn(
          "group relative shrink-0 snap-start overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-header sm:p-5",
          "w-[min(85vw,300px)] sm:w-[280px] lg:w-[260px] xl:w-[280px]",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
            cat.cardTint,
          )}
        />
        <div className="relative">
          <div className="mb-3 flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-110",
                cat.iconClass,
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight text-foreground">{cat.title}</h3>
              <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-gray-700">{cat.tagline}</p>
            </div>
          </div>

          <ul className="flex flex-wrap gap-1.5">
            {cat.checks.map((check) => (
              <li
                key={check}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-card/75 px-2 py-1 text-[11px] text-gray-600 backdrop-blur-sm sm:text-xs"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                {check}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  );
}

export function ATSChecksGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.08 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={cn(
        appMarketingSectionLight,
        "relative scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16 lg:py-20",
      )}
    >
      <ChecksFloatingBackdrop />

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div
          className={cn(
            "mb-8 text-center transition-all duration-500 sm:mb-10",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7367F0]/20 bg-[#7367F0]/10 px-3 py-1 text-sm font-medium text-[#7367F0]">
            <FileSearch className="h-3 w-3" />
            <span>27 Crucial Checks</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            AI-powered analysis across 7 categories
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            We go beyond typos — checking parse rate, recruiter red flags, seniority fit, and job tailoring.
          </p>
        </div>

        {/* Mobile / tablet: horizontal scroll, spaced with up/down offsets */}
        <div
          className={cn(
            "-mx-4 flex items-center gap-6 overflow-x-auto px-6 py-4 snap-x snap-mandatory scrollbar-thin lg:hidden",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {CHECK_CATEGORIES.map((cat, index) => (
            <CategoryCard
              key={cat.title}
              cat={cat}
              index={index}
              visible={visible}
              placement={CARD_PLACEMENT[index]}
            />
          ))}
        </div>

        {/* Desktop: cards scattered across the section in two loose rows */}
        <div className={cn("hidden lg:block", visible ? "opacity-100" : "opacity-0")}>
          <div className="flex items-start justify-between gap-8 px-2 xl:gap-10 xl:px-6">
            {CHECK_CATEGORIES.slice(0, 4).map((cat, index) => (
              <CategoryCard
                key={cat.title}
                cat={cat}
                index={index}
                visible={visible}
                placement={CARD_PLACEMENT[index]}
              />
            ))}
          </div>
          <div className="mt-10 flex items-end justify-around gap-8 px-6 xl:mt-12 xl:gap-12 xl:px-20">
            {CHECK_CATEGORIES.slice(4).map((cat, index) => (
              <CategoryCard
                key={cat.title}
                cat={cat}
                index={index + 4}
                visible={visible}
                placement={CARD_PLACEMENT[index + 4]}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const HOW_STEPS: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Upload Resume",
    body: "Drop your PDF — optionally paste a job description for tailoring checks.",
    icon: Upload,
  },
  {
    title: "Parse & Score",
    body: "We extract structured data and measure ATS parse rate instantly.",
    icon: FileSearch,
  },
  {
    title: "Run 27 Checks",
    body: "Content, sections, red flags, seniority, and keyword fit — all in one report.",
    icon: Users,
  },
  {
    title: "Fix & Apply",
    body: "Get issue-level fixes and jump into our AI resume builder to improve fast.",
    icon: Target,
  },
];

export function ATSHowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold: 0.2 },
    );

    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={cn(
        appMarketingSectionLight,
        "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
      )}
    >
      <div className="container mx-auto max-w-7xl">
        <div
          className={cn(
            "mb-12 text-center transition-all duration-700 sm:mb-16",
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
            <span>How It Works</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Know your score before you{" "}
            <span className="text-primary">apply</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
            Upload your resume, run 27 checks, review issues, and fix with
            AI—four simple steps to beat the bots and reach recruiters.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {HOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className={cn(
                  "group relative flex flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl",
                  visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                )}
                style={{
                  transitionDelay: visible ? `${0.1 + index * 0.1}s` : "0s",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md transition-transform group-hover:scale-105">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-4xl font-bold text-primary/15">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ATSSeeItInAction() {
  return (
    <section
      className={cn(
        appMarketingSection,
        "relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={`ats-action-float-${i}`}
            className="absolute"
            style={{
              left: `${(i * 16 + 4) % 92}%`,
              top: `${(i * 21 + 6) % 88}%`,
              opacity: 0.07,
              animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {i % 3 === 0 ? (
              <FileSearch className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
            ) : i % 3 === 1 ? (
              <Shield className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
            ) : (
              <Target className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
            )}
          </div>
        ))}
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
            <span>See It In Action</span>
          </div>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            From upload to{" "}
            <span className="text-primary">optimized ATS score</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
            Watch your resume get scanned, scored, and improved—the way ATS
            filters and recruiters really decide who moves forward.
          </p>
        </div>

        <SeoVideoSection
          content={atsCheckerDemoVideo}
          className="relative mx-auto w-full max-w-4xl"
          playerClassName="overflow-hidden rounded-lg border border-border bg-white shadow-2xl sm:rounded-xl sm:border-2 md:border-4"
          autoPlay
          loop
          muted
        >
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Live ATS Scan
          </div>
        </SeoVideoSection>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "What is a good ATS score?",
    a: "Scores above 80 generally indicate a well-optimized resume. Focus on fixing high-impact issues in Content and ATS Essentials first.",
  },
  {
    q: "Can ATS read PDFs?",
    a: "Yes. We test parse compatibility with PDF uploads. Use clean formatting and standard section headings for best results.",
  },
  {
    q: "Do I need a job description?",
    a: "No — you'll get a full standalone report. Adding a JD unlocks the Tailoring category with keyword and title matching.",
  },
  {
    q: "How is this different from other checkers?",
    a: "We combine deterministic rules (reproducible scores) with AI analysis for credibility, seniority, and rewrite suggestions — all free for signed-in users.",
  },
  {
    q: "Is my resume data private?",
    a: "Yes. Your resume is processed securely and used only to generate your ATS report.",
  },
  {
    q: "What file size is allowed?",
    a: "PDF files up to 2MB — matching industry ATS upload limits.",
  },
];

export function ATSFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-foreground mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === idx ? null : idx)}
                className="w-full px-5 py-4 text-left font-medium text-foreground flex justify-between items-center"
              >
                {item.q}
                <span className="text-primary text-xl">{open === idx ? "−" : "+"}</span>
              </button>
              {open === idx && (
                <p className="px-5 pb-4 text-sm text-muted-foreground">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ATSDashboardPreview() {
  return (
    <div className="hidden lg:block relative">
      <div className="rounded-2xl border border-border bg-card shadow-2xl p-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="rounded-xl bg-muted/50 p-3 mb-3 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground ml-2">InterviewTrix ATS Report</span>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <div className="rounded-lg bg-card border border-border p-3 text-center">
            <div className="text-2xl font-bold text-green-600">92</div>
            <div className="text-xs text-muted-foreground">/100</div>
            <div className="mt-2 space-y-1">
              {["Content", "Sections", "Skills"].map((l) => (
                <div key={l} className="text-[10px] text-muted-foreground">{l}</div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-card border border-border p-3 space-y-2">
            <div className="text-xs font-bold text-primary">CONTENT</div>
            <div className="h-2 rounded-full bg-green-200 w-full" />
            <div className="h-1.5 rounded bg-muted w-full" />
            <div className="h-1.5 rounded bg-muted w-4/5" />
            <div className="h-1.5 rounded bg-muted w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ATSLandingCTA() {
  return (
    <section className="py-16 bg-primary/5 border-y border-primary/10">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Turn feedback into a stronger resume
        </h2>
        <p className="text-muted-foreground mb-6">
          Fix flagged issues with our AI resume builder — templates, rewrites, and live ATS scoring included.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/ai-resume-builder"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            AI Resume Builder
          </a>
          <a
            href="/ai-interview-coach"
            className="inline-flex items-center px-6 py-3 rounded-lg border border-border bg-card font-medium hover:border-primary transition-colors"
          >
            Practice Interview
          </a>
        </div>
      </div>
    </section>
  );
}
