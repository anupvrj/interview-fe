"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowLeft, ArrowRight, Download, FileSearch, Gauge, Layers, Scale, Shield, Target, TrendingUp, Upload, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrowserFrame, Index, LoopVideo, Mono } from "./primitives";
import { mk26Asset } from "./assets";
import { GridRunners } from "./graphics";
import { CountUp, DARK, ease, Head, HL, INK, Stepper, Wiring, WRAP, type Step } from "./landing-kit";

/**
 * ATS Resume Checker landing page, on the same kit as the AI Resume Builder:
 * hero (with the upload) → ticker → 01 what we check → 02 how it works → 03 see it run → 04 then fix it.
 */

/** The checks the report runs, grouped the way the report groups them. */
const CATEGORIES = [
  { icon: FileSearch, t: "Content", d: "Words that get parsed and remembered", checks: ["ATS Parse Rate", "Quantifying Impact", "Repetition", "Spelling & Grammar", "Bullets Consistency"] },
  { icon: Layers, t: "Sections", d: "Structure recruiters expect", checks: ["Essential Sections", "Contact Information", "Section Order"] },
  { icon: Shield, t: "ATS Essentials", d: "Format that survives the scan", checks: ["File Format & Size", "Design", "Email Address", "Header Links", "File Name", "Dates & Links"] },
  { icon: AlertTriangle, t: "HR Red Flags", d: "Issues that trigger instant rejections", checks: ["Credibility", "Interview Risks", "Peer Benchmarking"] },
  { icon: Scale, t: "Discrimination", d: "Bias signals to remove early", checks: ["Ageism & Date Bias", "Employment Gaps"] },
  { icon: TrendingUp, t: "Seniority", d: "Level fit beyond years of experience", checks: ["Career Progression", "Skill Evidence", "Leadership Signals"] },
  { icon: Target, t: "Tailoring", d: "Keyword match for the role you want", checks: ["Hard Skills", "Soft Skills", "Action Verbs", "Title Match"], jd: true },
];

/* ═══════════════ HERO ═══════════════ */

/** Real product capture, upload to download, cut into chapters like the Ava section on the resume builder page. */
const FLOW = [
  { k: "Upload", v: "ats-upload", ms: 2500, url: "app.interviewtrix.com/dashboard/resumes/new", cap: "Drop in the PDF you already have.", tag: "PDF · UP TO 2MB" },
  { k: "Scan", v: "ats-scan", ms: 3300, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/ats", cap: "Every check runs live. The first score is low.", tag: "LIVE ATS CHECK", score: [25, 60], at: 2200 },
  { k: "AI rewrite", v: "ats-rewrite", ms: 5800, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/edit", cap: "One click turns a vague line into one with numbers.", tag: "AI CONTENT ASSISTANT" },
  { k: "Fix", v: "ats-fix", ms: 3000, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/ats", cap: "Fix the flagged issues. Watch the score climb.", tag: "RED FLAGS CLEARED", score: [74, 92], at: 300 },
  { k: "Tailor", v: "ats-tailor", ms: 4600, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/tailor", cap: "Paste the job. The keywords you already match light up.", tag: "JOB MATCH" },
  { k: "Download", v: "", ms: 3400, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao", cap: "", tag: "" },
] as const;

function ScoreChip({ from, to, run }: { from: number; to: number; run: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#050E1C]/85 px-2 py-1 backdrop-blur sm:right-4 sm:top-4 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-1.5">
      <Mono className="text-[10px] text-white/60">ATS</Mono>
      <span className={cn("text-[14px] font-black tabular-nums leading-none sm:text-[18px]", to >= 80 ? "text-emerald-300" : "text-amber-300")}>{run ? <CountUp to={to} run /> : to}</span>
      <Mono className="text-[10px] text-white/40 max-sm:hidden">from {from}</Mono>
    </motion.div>
  );
}

function AtsFlowPlayer() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.4 });
  const [c, setC] = useState(0);
  const [restart, setRestart] = useState(0);
  const ch = FLOW[c];
  const last = c === FLOW.length - 1;
  const [scoreShown, setScoreShown] = useState(false);
  useEffect(() => {
    setScoreShown(false);
    if (!("at" in ch)) return;
    const t = setTimeout(() => setScoreShown(true), reduce ? 0 : ch.at);
    return () => clearTimeout(t);
  }, [c, restart, ch, reduce]);

  useEffect(() => {
    if (!on || reduce) return;
    const t = setTimeout(() => setC((x) => (x + 1) % FLOW.length), ch.ms);
    return () => clearTimeout(t);
  }, [c, on, reduce, ch.ms, restart]);

  return (
    <div ref={ref}>
      <BrowserFrame url={ch.url} className="shadow-[0_60px_120px_-40px_rgba(40,30,140,.6)]">
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${c}-${restart}`} initial={{ opacity: 0, scale: 1.01 }} animate={{ opacity: 1, scale: reduce ? 1 : 1.04 }} exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.3 }, scale: { duration: ch.ms / 1000, ease: "linear" } }} className="origin-center">
              {last ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mk26Asset("/video/ats-done.jpg")} alt="" className="block aspect-video w-full object-cover" />
              ) : (
                <LoopVideo name={ch.v} priority={on} loop={false} />
              )}
            </motion.div>
          </AnimatePresence>
          {/* warm the next chapters so a switch never flashes black */}
          {on && <div aria-hidden className="hidden">{FLOW.filter((x) => x.v).map((x) => <link key={x.v} rel="preload" as="video" href={mk26Asset(`/video/${x.v}.mp4`)} />)}</div>}

          <AnimatePresence>
            {"score" in ch && scoreShown && <ScoreChip key={`s-${c}-${restart}`} from={ch.score[0]} to={ch.score[1]} run={on && !reduce} />}
          </AnimatePresence>

          {/* the caption for each step, in the same glass bar as Ava's voice line */}
          <AnimatePresence mode="wait">
            {!last && (
              <motion.div key={`cap-${c}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.25 }}
                className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl border border-white/15 bg-[#050E1C]/80 p-1.5 pr-3 backdrop-blur-xl sm:inset-x-4 sm:bottom-4 sm:gap-3 sm:rounded-2xl sm:p-2.5 sm:pr-4">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] font-[family-name:var(--font-geist-mono)] text-[9.5px] font-bold text-white sm:size-8 sm:text-[11px]">0{c + 1}</span>
                <p className="min-w-0 truncate text-[11.5px] leading-snug text-white sm:whitespace-normal sm:text-[14px]">
                  <Mono className="mr-2 text-[10px] text-sky-300 max-sm:hidden">{ch.tag}</Mono>{ch.cap}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* last chapter: the hand-over */}
          <AnimatePresence>
            {last && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-[#050E1C]/55 backdrop-blur-[2px]">
                <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="mx-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-white p-3 pr-4 text-[#2E3656] shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] sm:gap-4 sm:p-4 sm:pr-6">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 14 }}
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white sm:size-11"><Download className="size-4 sm:size-5" /></motion.span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold sm:text-[15.5px]">Aarav_Rao_Resume.pdf</p>
                    <Mono className="text-[11px] text-[#6B7194]">DOWNLOADED · ATS 94 · TAILORED</Mono>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BrowserFrame>

      {/* chapter rail: one segment per step, the current one filling */}
      {/* each segment's button is padded to a 32px-tall tap area; the bar itself stays thin */}
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {FLOW.map((x, i) => (
          <button key={x.k} type="button" onClick={() => { setC(i); setRestart((r) => r + 1); }} className="group min-h-8 py-2 text-left" aria-label={`Show step ${i + 1}: ${x.k}`}>
            <span className="block h-1 overflow-hidden rounded-full bg-[#2E3656]/12">
              {i < c && <span className="block h-full w-full rounded-full bg-primary/45" />}
              {i === c && <motion.span key={`${c}-${on}-${restart}`} className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]"
                initial={{ width: "0%" }} animate={{ width: on && !reduce ? "100%" : "4%" }} transition={{ duration: on && !reduce ? x.ms / 1000 : 0.2, ease: "linear" }} />}
            </span>
            <Mono className={cn("mt-1.5 block truncate text-[10px] uppercase transition-colors max-sm:hidden", i === c ? "text-[#2E3656]" : "text-muted-foreground/70 group-hover:text-[#2E3656]")}>{x.k}</Mono>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AtsHero({ upload }: { upload: React.ReactNode }) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({ initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.65, ease } });
  return (
    <section id="ats-upload" className="relative scroll-mt-24 overflow-clip pb-24 pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div>
          <motion.div {...rise(0)} className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><Gauge className="size-5" /></span>
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>ATS Resume Checker</span>
              <Mono className="text-[11px] text-muted-foreground">7 CATEGORIES · PDF · JOB MATCH OPTIONAL</Mono>
            </span>
          </motion.div>

          <motion.h1 {...rise(0.08)} className={cn("mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.055em] md:text-[60px] xl:text-[66px]", INK)}>
            Is your resume <span className={HL}>good enough</span> for their software?
          </motion.h1>
          <motion.p {...rise(0.16)} className="mt-7 max-w-[50ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            Upload your PDF for a Smart ATS Score: parse rate, content quality, recruiter red flags and, if you paste a job, how well you match it. One report, every issue with a fix.
          </motion.p>
          <motion.div {...rise(0.24)} className="mt-8">{upload}</motion.div>
          <motion.div {...rise(0.32)} className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-muted-foreground max-md:hidden">Checks</span>
            {["Parse rate", "Red flags", "Seniority fit", "Job match"].map((t) => (
              <span key={t} className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-[#2E3656]">{t}</span>
            ))}
          </motion.div>
        </div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }} className="lg:pl-6">
          <AtsFlowPlayer />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════ TICKER ═══════════════ */

const FACTS = ["7 categories", "ATS parse rate", "HR red flags", "Seniority fit", "Bias signals", "Job description match", "Copy-ready rewrites", "PDF up to 2MB"];
export function AtsTicker() {
  return (
    <div className="relative overflow-hidden border-y border-[#E7E6F2] bg-white/60 py-4">
      <div className="mask-x flex w-max gap-10 [animation:marquee_36s_linear_infinite]">
        {[...FACTS, ...FACTS].map((f, i) => (
          <Mono key={i} aria-hidden={i >= FACTS.length} className="flex items-center gap-10 whitespace-nowrap text-[13px] uppercase tracking-wider text-[#4B5275]">
            {f}<span className="size-2 rotate-45 rounded-[2px] bg-primary/60" />
          </Mono>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ 01 · WHAT WE CHECK ═══════════════ */

/* each category gets a small looping motion graphic of what it actually checks */

const LOOP = { repeat: Infinity, repeatDelay: 1.2 } as const;
const glass = "rounded-lg border border-white/10 bg-white/[.06]";

/** Content: a weak bullet gets its vague words flagged, then comes back with a number. */
function ArtContent({ on }: { on: boolean }) {
  return (
    <div className="space-y-2.5">
      <div className={cn(glass, "p-3 text-[12.5px] leading-snug text-white/80")}>
        <motion.span animate={on ? { opacity: [1, 1, 0.35, 0.35, 1] } : {}} transition={{ duration: 5, times: [0, 0.2, 0.3, 0.9, 1], ...LOOP }}>
          <span className="rounded bg-amber-400/20 px-0.5 text-amber-200">Worked on</span> payment APIs <span className="rounded bg-amber-400/20 px-0.5 text-amber-200">for the team</span>.
        </motion.span>
      </div>
      <motion.div animate={on ? { opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, 8] } : { opacity: 1 }} transition={{ duration: 5, times: [0, 0.3, 0.42, 0.9, 1], ...LOOP }}
        className={cn(glass, "border-emerald-400/30 bg-emerald-400/[.08] p-3 text-[12.5px] leading-snug text-white")}>
        Built 6 payment APIs serving <span className="rounded bg-emerald-400/25 px-0.5 font-semibold text-emerald-200">40k requests a day</span>, cutting p95 by <span className="rounded bg-emerald-400/25 px-0.5 font-semibold text-emerald-200">38%</span>.
      </motion.div>
      <div className="flex gap-1.5">
        {["Weak verb", "No number"].map((t, i) => (
          <motion.span key={t} animate={on ? { opacity: [0, 1, 1, 0] } : {}} transition={{ duration: 5, times: [0.05 + i * 0.05, 0.15 + i * 0.05, 0.3, 0.38], ...LOOP }}
            className="rounded-md bg-amber-400/15 px-1.5 py-0.5 font-[family-name:var(--font-geist-mono)] text-[10px] text-amber-200">⚠ {t}</motion.span>
        ))}
      </div>
    </div>
  );
}

/** Sections: blocks arrive out of order and settle into the order recruiters expect. */
function ArtSections({ on }: { on: boolean }) {
  const rows = ["Contact", "Summary", "Experience", "Skills", "Education"];
  const shuffled = [2, 0, 4, 1, 3]; // start position of each row
  return (
    <div className="relative h-[170px]">
      {rows.map((r, i) => (
        <motion.div key={r} className={cn(glass, "absolute inset-x-0 flex h-[28px] items-center justify-between px-3 text-[12px] text-white/85")}
          animate={on ? { top: [shuffled[i] * 34, shuffled[i] * 34, i * 34, i * 34, shuffled[i] * 34] } : { top: i * 34 }}
          transition={{ duration: 5, times: [0, 0.25, 0.45, 0.9, 1], ease: "easeInOut", ...LOOP }}>
          <span>{r}</span>
          <motion.span className="text-emerald-300" animate={on ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }} transition={{ duration: 5, times: [0, 0.45, 0.52, 0.9, 1], ...LOOP }}>✓</motion.span>
        </motion.div>
      ))}
    </div>
  );
}

/** ATS Essentials: the file and header checks tick off one by one. */
function ArtEssentials({ on }: { on: boolean }) {
  const rows = [["File", "resume.pdf · 184 KB"], ["Email", "aarav.rao@gmail.com"], ["Links", "linkedin.com/in/aarav"], ["Dates", "Jan 2023 – Present"]];
  return (
    <div className="space-y-2">
      {rows.map(([k, v], i) => (
        <div key={k} className={cn(glass, "flex items-center gap-2.5 px-3 py-2 text-[12px]")}>
          <motion.span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-400 text-[9px] font-bold text-[#06202a]"
            animate={on ? { scale: [0, 0, 1, 1, 0] } : { scale: 1 }} transition={{ duration: 4.5, times: [0, 0.1 + i * 0.12, 0.18 + i * 0.12, 0.9, 1], type: "tween", ...LOOP }}>✓</motion.span>
          <span className="w-10 shrink-0 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase text-white/45">{k}</span>
          <span className="truncate text-white/85">{v}</span>
        </div>
      ))}
    </div>
  );
}

/** HR Red Flags: a scan line passes the timeline and stops on the claim a recruiter would question. */
function ArtRedFlags({ on }: { on: boolean }) {
  return (
    <div className="relative space-y-2">
      {["Senior Engineer · 2023 – now", "Engineer · 2021 – 2023", "Led a team of 40 · 2020"].map((t, i) => (
        <div key={t} className={cn(glass, "relative px-3 py-2 text-[12px] text-white/85", i === 2 && "overflow-hidden")}>
          {t}
          {i === 2 && (
            <motion.span className="absolute inset-0 rounded-lg border border-rose-400/70 bg-rose-500/15" animate={on ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }} transition={{ duration: 5, times: [0, 0.4, 0.48, 0.9, 1], ...LOOP }} />
          )}
        </div>
      ))}
      <motion.div className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-300 to-transparent"
        animate={on ? { top: ["0%", "100%", "100%"], opacity: [1, 1, 0] } : { opacity: 0 }} transition={{ duration: 5, times: [0, 0.42, 0.5], ...LOOP }} />
      <motion.div animate={on ? { opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, 6] } : { opacity: 1 }} transition={{ duration: 5, times: [0, 0.5, 0.58, 0.9, 1], ...LOOP }}
        className="rounded-lg bg-rose-500/15 px-3 py-2 text-[11.5px] leading-snug text-rose-100">
        <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-rose-300">CREDIBILITY · </span>A team of 40, two years in? Back it up or reword it.
      </motion.div>
    </div>
  );
}

/** Discrimination: the dates that invite age bias fade out of the resume. */
function ArtBias({ on }: { on: boolean }) {
  const fade = (d: number) => ({ animate: on ? { opacity: [1, 1, 0.15, 0.15, 1] } : {}, transition: { duration: 5, times: [0, 0.3 + d, 0.4 + d, 0.9, 1], ...LOOP } });
  return (
    <div className={cn(glass, "space-y-2.5 p-3 text-[12px] text-white/85")}>
      <p className="font-semibold text-white">B.Tech, Computer Science</p>
      <p className="flex items-center gap-1.5">Deccan Institute <motion.span {...fade(0)} className="rounded bg-rose-400/20 px-1 text-rose-200 line-through decoration-rose-300/70">· 1998</motion.span></p>
      <p className="flex items-center gap-1.5">Date of birth <motion.span {...fade(0.08)} className="rounded bg-rose-400/20 px-1 text-rose-200 line-through decoration-rose-300/70">12 Mar 1976</motion.span></p>
      <div className="border-t border-dashed border-white/10 pt-2.5">
        <p className="flex items-center justify-between">2019 – 2021 <motion.span animate={on ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }} transition={{ duration: 5, times: [0, 0.5, 0.58, 0.9, 1], ...LOOP }}
          className="font-[family-name:var(--font-geist-mono)] text-[10px] text-amber-200">GAP · ADD ONE LINE</motion.span></p>
      </div>
    </div>
  );
}

/** Seniority: each role steps up, and the leadership signal lights the top rung. */
function ArtSeniority({ on }: { on: boolean }) {
  const rungs = [["Engineer", 38], ["Senior", 62], ["Lead", 88]] as const;
  return (
    <div className="flex h-[170px] items-end gap-3">
      {rungs.map(([t, h], i) => (
        <div key={t} className="flex flex-1 flex-col items-center gap-2">
          <motion.div className={cn("w-full rounded-t-lg", i === 2 ? "bg-gradient-to-t from-[#7367F0] to-[#5CC2FF]" : "bg-white/15")}
            animate={on ? { height: [0, h * 1.4, h * 1.4, 0] } : { height: h * 1.4 }} transition={{ duration: 5, times: [0.05 + i * 0.12, 0.2 + i * 0.12, 0.9, 1], ease: "easeOut", ...LOOP }} />
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase text-white/60">{t}</span>
        </div>
      ))}
    </div>
  );
}

/** Tailoring: keywords from the job slide across and match the ones the resume already has. */
function ArtTailoring({ on }: { on: boolean }) {
  const kws = [["React", true], ["Next.js", true], ["GraphQL", false], ["Core Web Vitals", true]] as const;
  return (
    <div className="space-y-2">
      <Mono className="text-[10px] text-white/45">FROM THE JOB</Mono>
      <div className="flex flex-wrap gap-1.5">
        {kws.map(([k, hit], i) => (
          <motion.span key={k} animate={on ? { opacity: [0, 1, 1, 0], x: [-10, 0, 0, 0] } : { opacity: 1 }} transition={{ duration: 5, times: [0.05 + i * 0.08, 0.15 + i * 0.08, 0.9, 1], ...LOOP }}
            className={cn("rounded-md px-2 py-1 text-[11.5px]", hit ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200")}>
            {hit ? "✓" : "+"} {k}
          </motion.span>
        ))}
      </div>
      <motion.div animate={on ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }} transition={{ duration: 5, times: [0, 0.5, 0.58, 0.9, 1], ...LOOP }} className={cn(glass, "mt-3 flex items-center justify-between px-3 py-2.5")}>
        <span className="text-[12px] text-white/80">Job match</span>
        <span className="text-[20px] font-black tabular-nums text-emerald-300">81%</span>
      </motion.div>
    </div>
  );
}

const ART = [ArtContent, ArtSections, ArtEssentials, ArtRedFlags, ArtBias, ArtSeniority, ArtTailoring];
const TINTS = ["from-[#3a2a8a] to-[#120f33]", "from-[#1d2a6b] to-[#0b1530]", "from-[#0e4b5a] to-[#06202a]", "from-[#5a1e2e] to-[#1f0a10]", "from-[#2b1b4d] to-[#100a1e]", "from-[#123a2a] to-[#07160f]", "from-[#1b2f5c] to-[#0a1224]"];

function CheckCard({ i, on, className, style }: { i: number; on: boolean; className?: string; style?: React.CSSProperties }) {
  const c = CATEGORIES[i];
  const Art = ART[i];
  return (
    <div style={style} className={cn("group relative flex h-[440px] w-[300px] shrink-0 flex-col overflow-hidden rounded-[22px] bg-gradient-to-b p-5 text-white shadow-[0_30px_60px_-30px_rgba(30,20,90,.55)]", TINTS[i], className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[15px] font-semibold"><c.icon className="size-4 text-sky-300" />{c.t}</span>
        <Mono className="text-[10px] text-white/45">0{i + 1}{c.jd ? " · WITH A JOB" : ""}</Mono>
      </div>
      <p className="mt-1 text-[13.5px] text-white/65">{c.d}</p>
      <div className="mt-5 flex-1"><Art on={on} /></div>
      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/10 pt-4">
        {c.checks.map((k) => (
          <Mono key={k} className="rounded-md bg-white/[.07] px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide text-white/70">{k}</Mono>
        ))}
      </div>
    </div>
  );
}

/** Desktop: the cards scattered across the board, each at its own height and tilt; hovering one straightens it and lifts it forward. */
const SCATTER = [
  { x: 0, y: 30, r: -3 },
  { x: 320, y: 0, r: 2 },
  { x: 640, y: 50, r: -1.5 },
  { x: 960, y: 10, r: 2.5 },
  { x: 160, y: 540, r: 2 },
  { x: 480, y: 580, r: -2 },
  { x: 800, y: 550, r: 1.5 },
] as const;

export function AtsChecks() {
  const rail = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const railOn = useInView(rail, { amount: 0.2 });
  const boardOn = useInView(board, { amount: 0.15 });
  const reduce = useReducedMotion();
  const go = (d: number) => rail.current?.scrollBy({ left: d * 340, behavior: "smooth" });
  return (
    <section className="relative overflow-clip border-y border-primary/10 bg-[linear-gradient(180deg,#F3F1FF_0%,#ECEBFF_100%)] py-24 md:py-28">
      <div className="bg-dots mask-fade pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex max-w-[1180px] items-end justify-between gap-6 px-5">
        <div>
          <Index n="03" label="What we check" />
          <h2 className={cn("max-w-[16ch] text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] md:text-[56px]", INK)}>Seven ways their software <span className={HL}>reads you.</span></h2>
        </div>
        <div className="hidden gap-2 md:flex xl:hidden">
          <button type="button" onClick={() => go(-1)} aria-label="Previous" className="grid size-10 place-items-center rounded-full border border-border bg-card hover:border-primary"><ArrowLeft className="size-4" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next" className="grid size-10 place-items-center rounded-full border border-border bg-card hover:border-primary"><ArrowRight className="size-4" /></button>
        </div>
        <p className="hidden max-w-[34ch] pb-2 text-[16px] leading-relaxed text-muted-foreground xl:block">Every check is grouped the way the report shows it. Hover a card to see what it catches.</p>
      </div>

      {/* phones, tablets and small laptops: a swipeable rail */}
      <div ref={rail} className="relative mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] md:scroll-px-[max(20px,calc((100vw-1180px)/2))] md:px-[max(20px,calc((100vw-1180px)/2))] xl:hidden">
        {CATEGORIES.map((c, i) => <CheckCard key={c.t} i={i} on={railOn && !reduce} className="snap-start" />)}
      </div>

      {/* wide screens: scattered board (it needs the full 1240px) */}
      <div ref={board} className="relative mx-auto mt-14 hidden h-[1040px] w-[1240px] xl:block">
        {SCATTER.map((p, i) => (
          <motion.div key={CATEGORIES[i].t} className="absolute hover:z-20" style={{ left: p.x, top: p.y, zIndex: i % 2 ? 2 : 1 }}
            initial={reduce ? false : { opacity: 0, y: 60, rotate: 0 }} animate={boardOn || reduce ? { opacity: 1, y: 0, rotate: p.r } : {}}
            whileHover={reduce ? undefined : { rotate: 0, y: -14, scale: 1.04, transition: { type: "spring", stiffness: 260, damping: 20 } }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 120, damping: 16 }}>
            <motion.div animate={reduce || !boardOn ? undefined : { y: [0, -6, 0] }} transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}>
              <CheckCard i={i} on={boardOn && !reduce} className="w-[280px]" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════ 01 · HOW IT WORKS ═══════════════ */

const STEPS: Step[] = [
  { k: "UPLOAD", icon: Upload, t: "Drop in the PDF you have.", d: "Optionally paste a job description to unlock the tailoring checks.", v: "ats-upload", url: "app.interviewtrix.com/dashboard/resumes/new" },
  { k: "SCAN", icon: Gauge, t: "Every check runs live.", d: "Parsed the way their software reads it, scored across seven categories.", v: "ats-scan", url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/ats" },
  { k: "FIX WITH AI", icon: Wrench, t: "One click per issue.", d: "Vague lines come back specific, with your numbers kept. Nothing invented.", v: "ats-rewrite", url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/edit" },
  { k: "MATCH THE JOB", icon: Target, t: "Paste the job. It lines you up.", d: "The keywords you already match light up, and the ones you're missing get flagged.", v: "ats-tailor", url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/tailor" },
];
export const AtsStepsSection = () => <Stepper steps={STEPS} n="01" label="How it works" title={<>PDF in, <span className={HL}>fix list</span> out.</>} />;

/* ═══════════════ 03 · SEE IT RUN ═══════════════ */

/** Where each step starts in ats-film.mp4 (seconds), and what to say over it. */
const FILM = [
  { at: 0, k: "Upload", cap: "Your PDF goes in." },
  { at: 2.1, k: "Scan", cap: "Every check runs live." },
  { at: 5.0, k: "AI rewrite", cap: "A vague summary becomes a specific one." },
  { at: 10.4, k: "Fix", cap: "Flagged issues fixed, score climbs to 92." },
  { at: 13.0, k: "Tailor", cap: "Matched to the job description." },
];
const FILM_LEN = 22.8;

export function AtsDemo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const step = FILM.reduce((n, s, i) => (t >= s.at ? i : n), 0);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.3 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const seek = (at: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = at + 0.05;
    void v.play().catch(() => {});
  };

  return (
    <section className={DARK}>
      <div className={WRAP}>
        <Head dark n="02" label="See it run" title={<>Scanned, scored and <span className={HL}>fixed</span>, live.</>}
          sub="One resume, start to finish: uploaded, scanned, rewritten with AI, fixed and matched to a job." />
        <div className="mx-auto max-w-[1040px]">
          <BrowserFrame url="app.interviewtrix.com/dashboard/resumes/aarav-rao/ats" className="shadow-[0_60px_120px_-40px_rgba(0,0,0,.7)]">
            <div className="relative overflow-hidden">
              <video
                ref={ref}
                className="block aspect-video w-full object-cover"
                src={mk26Asset("/video/ats-film.mp4")}
                poster={mk26Asset("/video/ats-film.jpg")}
                muted
                loop
                playsInline
                preload="metadata"
                onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
                aria-label="InterviewTrix product capture: a resume uploaded, scanned, rewritten with AI, fixed and tailored to a job"
              />
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.25 }}
                  className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl border border-white/15 bg-[#050E1C]/80 p-1.5 pr-3 backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:gap-3 sm:rounded-2xl sm:p-3 sm:pr-4">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] font-[family-name:var(--font-geist-mono)] text-[9.5px] font-bold text-white sm:size-9 sm:text-[11px]">0{step + 1}</span>
                  <p className="min-w-0 truncate text-[11.5px] leading-snug text-white sm:whitespace-normal sm:text-[14px]">
                    <Mono className="mr-2 text-[10px] uppercase text-sky-300 max-sm:hidden">{FILM[step].k}</Mono>{FILM[step].cap}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </BrowserFrame>

          {/* chapter rail, driven by the video's own clock */}
          <div className="mt-5 grid grid-cols-5 gap-2">
            {FILM.map((x, i) => {
              const end = FILM[i + 1]?.at ?? FILM_LEN;
              const fill = t >= end ? 100 : t <= x.at ? 0 : ((t - x.at) / (end - x.at)) * 100;
              return (
                <button key={x.k} type="button" onClick={() => seek(x.at)} className="group text-left" aria-label={`Jump to ${x.k}`}>
                  <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                    <span className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#5CC2FF] transition-[width] duration-200 ease-linear" style={{ width: `${fill}%` }} />
                  </span>
                  <Mono className={cn("mt-2 block truncate text-[10.5px] uppercase transition-colors max-sm:hidden", i === step ? "text-white" : "text-white/45 group-hover:text-white/75")}>0{i + 1} · {x.k}</Mono>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · WHAT THE SCORE FEEDS ═══════════════ */

export function AtsAfter() {
  return (
    <Wiring n="04" label="Then fix it" title={<>A score is a start. <span className={HL}>A better resume</span> is the point.</>}
      sub="The report opens straight into the AI resume builder, and the fixed resume goes everywhere you practise and apply."
      ins={["Your resume PDF", "A job description", "Seven categories of checks"]}
      outs={[
        { t: "AI resume builder", d: "Fix each issue in place while the score moves." },
        { t: "Mock interviews", d: "Questions come from the projects you actually listed." },
        { t: "Chrome extension", d: "Re-check against the job post you're reading." },
        { t: "ChatGPT app", d: "Score and tailor it from a chat." },
      ]}>
      {(on: boolean) => (
        <>
          <Mono className="text-[10.5px] text-sky-300">ATS REPORT · AARAV-RAO.PDF</Mono>
          <div className="mt-4 flex items-center gap-4">
            <span className="relative grid size-[68px] place-items-center">
              <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90"><circle cx="34" cy="34" r="29" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                <motion.circle cx="34" cy="34" r="29" fill="none" stroke="url(#kit-wire-g)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 0.92 } : {}} transition={{ delay: 0.7, duration: 1.2, ease }} /></svg>
              <span className="text-[22px] font-bold"><CountUp to={92} run={on} /></span>
            </span>
            <div><p className="font-bold">From 25 to 92</p><p className="text-[13px] text-[#9FB3CF]">Smart ATS score · after fixes</p></div>
          </div>
          <div className="mt-5 space-y-2 text-[13.5px]">
            {[["✓", "Every bullet has a number", "text-emerald-300"], ["✓", "No dates that invite bias", "text-emerald-300"], ["!", "GraphQL missing from skills", "text-amber-300"]].map(([i, t, c], k) => (
              <motion.p key={t} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + k * 0.15 }} className={c}><span className="mr-1.5">{i}</span>{t}</motion.p>
            ))}
          </div>
        </>
      )}
    </Wiring>
  );
}

/** Phones only: once the hero upload scrolls away, keep one way back to it. Hides again near the closing section. */
export function AtsStickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const end = document.documentElement.scrollHeight - window.innerHeight - 900;
      setShow(window.scrollY > 640 && window.scrollY < end);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-2 pl-4 shadow-[0_20px_50px_-20px_rgba(30,20,90,.6)] backdrop-blur-xl md:hidden">
          <div className="min-w-0 flex-1"><p className={cn("truncate text-[14px] font-bold", INK)}>ATS Resume Checker</p><Mono className="text-[10.5px] text-muted-foreground">PDF · UP TO 2MB</Mono></div>
          <a href="#ats-upload" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-[14.5px] font-medium text-primary-foreground">Check free <ArrowRight className="size-4" /></a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
