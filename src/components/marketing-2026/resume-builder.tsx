"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, FileText, Gauge, Linkedin, Mic, PenLine, Target, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, LoopVideo, Mono } from "./primitives";
import { CircuitTraces, GridRunners } from "./graphics";
import { CountUp, DARK, Dots, ease, Head, HL, INK, LAVENDER, LIGHT, Stepper, StickyCta, Wiring, WRAP, type Step } from "./landing-kit";
import { cn } from "@/lib/utils";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";

/**
 * AI Resume Builder landing page, on the same kit as AI Mock Interview:
 * hero → 01 four steps → 02 the rewrite → 03 17 templates → 04 Ava → 05 ATS score → 06 what the resume feeds.
 */

/* ═══════════════ HERO ═══════════════ */

const REWRITES = [
  { before: "Worked on payment APIs.", after: "Built 6 payment APIs on Node + Postgres for 40k requests a day; cut p95 latency 38%.", tags: ["No number", "Weak verb"], from: 72, to: 81 },
  { before: "Responsible for the company website.", after: "Rebuilt the marketing site in Next.js; Lighthouse 54 → 96 and sign-ups up 22%.", tags: ["No outcome", "Passive"], from: 74, to: 83 },
  { before: "Helped the team with testing.", after: "Wrote 140 Playwright tests that cut release regressions from 9 to 1 a quarter.", tags: ["Vague", "No number"], from: 70, to: 79 },
];
const NUM = /(\d[\d,.]*\s?(?:%|k|ms|×)?|p95)/;

/** Rewritten bullet, typed out, with every number picked out in the brand gradient. */
function Strong({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (!run || n >= text.length) return;
    const t = setTimeout(() => setN((x) => x + 1), 22);
    return () => clearTimeout(t);
  }, [n, run, text]);
  const shown = run ? text.slice(0, n) : text;
  return (
    <>
      {shown.split(NUM).map((p, i) => (NUM.test(p) ? <span key={i} className="rounded bg-emerald-500/12 px-0.5 font-semibold text-emerald-700">{p}</span> : <span key={i}>{p}</span>))}
      {run && n < text.length && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-current" />}
    </>
  );
}

function RewriteCard({ r, run }: { r: (typeof REWRITES)[number]; run: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <Mono className="text-[10.5px] text-primary">AI REWRITE · EXPERIENCE</Mono>
        <Mono className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">ATS <span className="text-amber-600">{r.from}</span> → <span className="text-emerald-600">{run ? <CountUp to={r.to} run /> : r.to}</span></Mono>
      </div>
      <p className="mt-3 text-[14px] text-[#4B5275] line-through decoration-amber-500/70 decoration-2">{r.before}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{r.tags.map((t) => <span key={t} className="rounded-md bg-amber-400/15 px-1.5 py-0.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-amber-700">⚠ {t}</span>)}</div>
      <p className="mt-3 rounded-xl bg-primary-muted px-3 py-2.5 text-[14.5px] leading-relaxed text-[#2E3656]"><Strong text={r.after} run={run} /></p>
    </>
  );
}

export function RbHero() {
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(() => setK((x) => (x + 1) % REWRITES.length), 6500);
    return () => clearTimeout(id);
  }, [k, reduce]);

  return (
    <section className="relative overflow-clip pb-24 pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><FileText className="size-5" /></span>
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>AI Resume Builder</span>
              <Mono className="text-[11px] text-muted-foreground">17 TEMPLATES · ATS-SCORED · FREE PDF</Mono>
            </span>
          </motion.div>

          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.055em] md:text-[60px] xl:text-[66px]", INK)}>
            AI resume builder that <span className={HL}>rewrites</span> while you{" "}
            <span className="relative inline-block whitespace-nowrap">watch.
              <svg aria-hidden viewBox="0 0 520 24" preserveAspectRatio="none" className="absolute -bottom-1 left-[2%] h-[0.18em] w-[92%] overflow-visible">
                <defs><linearGradient id="rb-ul" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" stopOpacity=".8" /><stop offset="1" stopColor="#1F8FFF" stopOpacity=".8" /></linearGradient></defs>
                <motion.path d="M4 16 C 120 4, 260 22, 516 8" fill="none" stroke="url(#rb-ul)" strokeWidth="7" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.9, ease }} />
              </svg>
            </span>
          </motion.h1>
          <p className="mt-7 max-w-[48ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            <span className="max-md:hidden">Click a weak line. Get a specific one back, in place. The PDF re-flows, the ATS score moves, and 17 templates are one click apart.</span>
            <span className="md:hidden">Click a weak line. Get a specific one back, in place.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
              <StartLink href={MK26_ROUTES.startResume}>Build my resume, free <ArrowRight /></StartLink>
            </Button>
            <a href={MK26_ROUTES.ats} className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#2E3656] hover:text-primary">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-white"><Gauge className="size-4" /></span>Check my ATS score
            </a>
          </div>
          <Mono className="mt-4 block text-[12px] text-muted-foreground">Free PDF download · No card · Also works in ChatGPT</Mono>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-muted-foreground max-md:hidden">Start from</span>
            {[{ i: Linkedin, t: "LinkedIn" }, { i: Upload, t: "Old PDF" }, { i: Mic, t: "Talk to Ava" }, { i: PenLine, t: "Blank page" }].map(({ i: I, t }) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-[#2E3656]"><I className="size-3.5 text-primary" />{t}</span>
            ))}
          </div>
        </div>

        <div className="relative">
          <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }}>
            <BrowserFrame url="app.interviewtrix.com/dashboard/resumes/aarav-rao/edit" className="shadow-[0_60px_120px_-40px_rgba(40,30,140,.6)]"><LoopVideo name="rb-editor" priority /></BrowserFrame>
          </motion.div>
          {/* the rewrite, floating over the real editor; height is reserved for the longest example so nothing jumps */}
          <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, type: "spring", stiffness: 150, damping: 20 }}
            className="relative -mt-16 ml-auto w-[94%] rounded-2xl border border-white/70 bg-white/90 p-4 text-left shadow-[0_30px_60px_-24px_rgba(30,20,80,.5),inset_0_1px_0_#fff] backdrop-blur-xl sm:w-[82%] lg:-ml-10 lg:mr-auto">
            <div className="grid">
              {REWRITES.map((r) => <div key={r.before} aria-hidden className="invisible [grid-area:1/1]"><RewriteCard r={r} run={false} /></div>)}
              <AnimatePresence mode="wait">
                <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="[grid-area:1/1]">
                  <RewriteCard r={REWRITES[k]} run={!reduce} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ TICKER ═══════════════ */

const FACTS = ["17 templates", "34 ATS checks · 8 categories", "Import LinkedIn or PDF", "Talk it out with Ava", "Tailored to the JD, nothing invented", "Free PDF download", "Works in ChatGPT"];
export function RbTicker() {
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

/* ═══════════════ 01 · FOUR STEPS ═══════════════ */

const STEPS: Step[] = [
  { k: "BRING WHAT YOU HAVE", icon: Upload, t: "Import LinkedIn or an old PDF.", d: "Or just talk it through with Ava. Nothing to retype.", v: "rb-import", url: "app.interviewtrix.com/dashboard/resumes/new" },
  { k: "AI DRAFTS IT", icon: PenLine, t: "A full first draft, section by section.", d: "Parser, writer and ATS agents fill every section from what you brought.", v: "rb-agents", url: "app.interviewtrix.com/dashboard/resumes/new/build" },
  { k: "POINT IT AT A JOB", icon: Target, t: "Paste the job. It lines you up.", d: "Must-have skills pulled out and matched to what you've actually done. Nothing invented.", v: "rb-tailor", url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/tailor" },
  { k: "SCORE AND DOWNLOAD", icon: Gauge, t: "Download when it's green.", d: "34 ATS checks across 8 categories, live while you edit. The PDF is free.", v: "rb-ats", url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/ats" },
];
export const RbSteps = () => <Stepper steps={STEPS} n="01" label="How it works" title={<>Blank page to <span className={HL}>job-ready</span> in four steps.</>} />;

/* ═══════════════ 02 · THE REWRITE (dark) ═══════════════ */

const CHECKS = ["Weak verb", "No number", "No outcome", "Too long", "Repeated phrase", "Buzzword"];
export function RbRewrite() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.4 });
  const [k, setK] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!on || held || reduce) return;
    const id = setTimeout(() => setK((x) => (x + 1) % REWRITES.length), 6500);
    return () => clearTimeout(id);
  }, [k, on, held, reduce]);
  const r = REWRITES[k];

  return (
    <section className={DARK}>
      <CircuitTraces className="opacity-70" />
      <div ref={ref} className={WRAP}>
        <Head dark n="02" label="The rewrite" title={<>“Worked on APIs” isn&apos;t a <span className={HL}>bullet.</span></>}
          sub="Click a weak line. Get a specific one back, in place, built only from what you actually did." />
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
          {/* weak lines */}
          <ul className="grid grid-cols-1 gap-3">
            {REWRITES.map((x, i) => (
              <li key={x.before}>
                <button onClick={() => setK(i)} className={cn("w-full rounded-2xl border p-5 text-left transition-all duration-300",
                  i === k ? "border-white/25 bg-white/[.09] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" : "border-white/10 bg-white/[.03] hover:bg-white/[.06]")}>
                  <Mono className="text-[10.5px] text-white/45">YOUR LINE · 0{i + 1}</Mono>
                  <p className={cn("mt-1 text-[16px]", i === k ? "text-white" : "text-[#9FB3CF]")}>{x.before}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{x.tags.map((t) => <span key={t} className="rounded-md bg-amber-400/15 px-1.5 py-0.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-amber-300">⚠ {t}</span>)}</div>
                </button>
              </li>
            ))}
          </ul>
          {/* the rewrite */}
          <div className="relative rounded-[28px] border border-white/10 bg-white/[.04] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur md:p-9">
            <div className="flex items-center justify-between">
              <Mono className="text-[11px] text-sky-300">REWRITTEN IN PLACE · 0.8s</Mono>
              <Mono className="text-[11px] text-white/60">ATS <span className="text-amber-300">{r.from}</span> → <span className="text-emerald-300">{r.to}</span></Mono>
            </div>
            <div className="grid">
              {REWRITES.map((x) => <p key={x.after} aria-hidden className="invisible mt-6 text-[22px] leading-[1.55] [grid-area:1/1] md:text-[26px]">{x.after}</p>)}
              <AnimatePresence mode="wait">
                <motion.p key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                  className="mt-6 text-[22px] leading-[1.55] text-white [grid-area:1/1] md:text-[26px] [&_span.font-semibold]:bg-emerald-400/15 [&_span.font-semibold]:text-emerald-300">
                  <Strong text={r.after} run={on && !reduce} />
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
              <Mono className="mr-1 text-[10.5px] text-white/45">EVERY LINE IS CHECKED FOR</Mono>
              {CHECKS.map((c) => <span key={c} className="rounded-full border border-white/10 px-2.5 py-1 text-[12px] text-[#CFE0F7]">{c}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 03 · 17 TEMPLATES ═══════════════ */

const TEMPLATES = ["meridian", "harvard", "clean-slate", "saffron-line", "atlantic-blue", "executive", "classic", "corporate", "amber-edge", "cobalt-stream", "condensed-rule", "confident-grid", "ember-timeline", "mercury", "navy-frame", "royal-indigo", "true-blue"];
const label = (id: string) => id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export function RbTemplates() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35 });
  const [k, setK] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!on || held || reduce) return;
    const id = setTimeout(() => setK((x) => (x + 1) % TEMPLATES.length), 2600);
    return () => clearTimeout(id);
  }, [k, on, held, reduce]);
  const t = TEMPLATES[k];

  return (
    <section className={LAVENDER}>
      <div ref={ref} className={WRAP}>
        <Head n="03" label="17 templates" title={<>Same resume. <span className={HL}>17 layouts.</span> One click.</>}
          sub="Every template is tested for clean parsing. Switch at 2 a.m., switch again at 9. Your content never moves." />
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
            {TEMPLATES.map((id, i) => (
              <button key={id} onClick={() => setK(i)} className={cn("group relative overflow-hidden rounded-xl border bg-white p-1.5 text-left transition-all duration-300", i >= 5 && "max-md:hidden",
                i === k ? "border-primary shadow-[0_14px_30px_-16px_rgba(115,103,240,.8)] ring-2 ring-primary/25" : "border-border hover:border-primary/40")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/marketing-2026/templates/${id}-preview.webp`} alt="" loading="lazy" className="aspect-[1/1.32] w-full rounded-md object-cover object-top" />
                <span className={cn("mt-1 block truncate px-0.5 text-[11px] font-medium", i === k ? "text-primary" : "text-[#4B5275]")}>{label(id)}</span>
              </button>
            ))}
            <span className="grid place-items-center rounded-xl border border-dashed border-primary/30 bg-white/60 text-center text-[12px] font-semibold text-primary md:hidden">+{TEMPLATES.length - 5}<br />more</span>
          </div>
          <div className="relative mx-auto w-full max-w-[440px]">
            <div aria-hidden className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(closest-side,rgba(115,103,240,.22),transparent)] blur-xl" />
            <div className="relative overflow-hidden rounded-[18px] border border-white bg-white p-2 shadow-[0_50px_100px_-40px_rgba(40,30,140,.55)]">
              <AnimatePresence mode="popLayout" initial={false}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img key={t} src={`/marketing-2026/templates/${t}-preview.webp`} alt={`${label(t)} resume template`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  className="aspect-[1/1.32] w-full rounded-xl object-cover object-top" />
              </AnimatePresence>
            </div>
            <div className="relative mt-4 flex items-center justify-between">
              <p className={cn("text-[17px] font-bold", INK)}>{label(t)}</p>
              <Mono className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-700">✓ ATS-SAFE</Mono>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · AVA (full-bleed dark) ═══════════════ */

/* One short film in one frame: a voice call with Ava, then the real product writing, scoring and handing over the PDF. */
// opens with the same three lines the real Ava screen shows, then the call carries on
const VOICE = [
  { who: "AVA", t: "Hi Aarav! Tell me about your most recent role.", ms: 2300 },
  { who: "YOU", t: "I lead frontend at a payments startup. I cut checkout load time by almost 40%.", ms: 3200 },
  { who: "AVA", t: "Great impact. I'll add that with the metric. Which tools did you use?", ms: 2700 },
  { who: "YOU", t: "Next.js, a CDN in front of the images, and lazy loading below the fold.", ms: 3000 },
  { who: "AVA", t: "Perfect. That's a strong first bullet. Building your resume now.", ms: 2600 },
] as const;
const GAP = 380; // the beat of silence between speakers
const CHAPTERS = [
  { k: "Talk", v: "rb-ava", ms: VOICE.reduce((n, l) => n + l.ms, 0), url: "app.interviewtrix.com/dashboard/resumes/new/ava" },
  { k: "Ava writes it", v: "rb-agents", ms: 3400, url: "app.interviewtrix.com/dashboard/resumes/new/build" },
  { k: "Your resume", v: "rb-editor", ms: 4000, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/edit" },
  { k: "Scored", v: "rb-ats", ms: 4600, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao/ats" },
  { k: "Downloaded", v: "rb-ats", ms: 3400, url: "app.interviewtrix.com/dashboard/resumes/aarav-rao" },
];

/** Live voice bar: who's talking, a waveform that moves only while someone speaks, and the caption. */
function VoiceBar({ line, run }: { line: (typeof VOICE)[number]; run: boolean }) {
  const ava = line.who === "AVA";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#050E1C]/80 p-3 pr-4 backdrop-blur-xl">
      <span className={cn("relative grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white", ava ? "bg-gradient-to-br from-[#7367F0] to-[#1FB6FF]" : "bg-[#2E3656]")}>
        {ava ? "Ava" : "You"}
        {run && <span className={cn("absolute inset-0 animate-ping rounded-full", ava ? "bg-[#7367F0]/40" : "bg-white/20")} />}
      </span>
      <span className="flex h-7 shrink-0 items-center gap-[3px]">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span key={i} className={cn("w-[3px] rounded-full", ava ? "bg-gradient-to-t from-[#7367F0] to-[#5CC2FF]" : "bg-white/70")}
            animate={run ? { height: [4, 6 + ((i * 41) % 18), 4] } : { height: 4 }} transition={{ duration: 0.7 + (i % 4) * 0.12, repeat: Infinity, ease: "easeInOut", delay: (i % 6) * 0.05 }} />
        ))}
      </span>
      <AnimatePresence mode="wait">
        <motion.p key={line.t} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="min-w-0 text-[14px] leading-snug text-white">
          <Mono className={cn("mr-2 text-[10px]", ava ? "text-sky-300" : "text-white/60")}>{ava ? "AVA" : "YOU"}</Mono>{line.t}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function RbAva() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.4 });
  const [c, setC] = useState(0);
  const [v, setV] = useState(0); // voice line inside chapter 1
  const [talking, setTalking] = useState(true); // false during the short pause before the next speaker
  const [restart, setRestart] = useState(0); // a chapter click always restarts that chapter's clock
  const ch = CHAPTERS[c];

  // chapter clock
  useEffect(() => {
    if (!on || reduce) return;
    const t = setTimeout(() => { setC((x) => (x + 1) % CHAPTERS.length); setV(0); }, ch.ms);
    return () => clearTimeout(t);
  }, [c, on, reduce, ch.ms, restart]);
  // voice lines inside "Talk"
  useEffect(() => {
    if (c !== 0 || !on || reduce) return;
    setTalking(true);
    const quiet = setTimeout(() => setTalking(false), VOICE[v].ms - GAP);
    const next = v < VOICE.length - 1 ? setTimeout(() => setV((x) => x + 1), VOICE[v].ms) : undefined;
    return () => { clearTimeout(quiet); if (next) clearTimeout(next); };
  }, [c, v, on, reduce, restart]);

  return (
    <section className="grain relative overflow-clip bg-[hsl(var(--ix-navy))] py-24 text-[#EAF2FF] md:py-32">
      <CircuitTraces className="opacity-50" />
      <div className="pointer-events-none absolute -inset-x-1/2 bottom-0 h-[42%] origin-bottom [transform:perspective(520px)_rotateX(58deg)] bg-[linear-gradient(rgba(31,143,255,.28)_2px,transparent_2px),linear-gradient(90deg,rgba(31,143,255,.28)_2px,transparent_2px)] bg-[length:90px_90px] opacity-50 [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)]" />
      <div ref={ref} className={WRAP}>
        <Head dark n="04" label="Meet Ava" title={<>You did more than you wrote. Ava asks until it <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">shows.</span></>}
          aside={<Mono className="mb-3 inline-block rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11.5px] text-sky-300">● VOICE RESUME COACH</Mono>}
          sub="Talk about your work out loud. Ava asks for the number, writes the bullet, and hands you a scored PDF." />

        <div className="mx-auto max-w-[1040px]">
          <BrowserFrame url={ch.url}>
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={`${c}-${restart}`} initial={{ opacity: 0, scale: 1.01 }} animate={{ opacity: 1, scale: reduce ? 1 : 1.04 }} exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.3 }, scale: { duration: ch.ms / 1000, ease: "linear" } }} className="origin-center">
                  {/* the real Ava moment is short: play it once, then hold on the live conversation while the call continues */}
                  <LoopVideo name={ch.v} priority={on} loop={c !== 0} />
                </motion.div>
              </AnimatePresence>
              {/* warm the next chapters so a switch never flashes black */}
              {on && <div aria-hidden className="hidden">{[...new Set(CHAPTERS.map((x) => x.v))].map((v) => <link key={v} rel="preload" as="video" href={`/marketing-2026/video/${v}.mp4?v=9`} />)}</div>}

              {/* chapter 1: the voice call over the real Ava screen */}
              <AnimatePresence>
                {c === 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="absolute inset-x-3 bottom-3 sm:inset-x-6 sm:bottom-6">
                    <VoiceBar line={VOICE[v]} run={on && !reduce && talking} />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {c === 0 && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-3 top-3 rounded-full bg-[#050E1C]/80 px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-emerald-300 backdrop-blur">● LIVE · VOICE</motion.span>}
              </AnimatePresence>

              {/* last chapter: the hand-over */}
              <AnimatePresence>
                {c === CHAPTERS.length - 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-[#050E1C]/55 backdrop-blur-[2px]">
                    <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}
                      className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white p-4 pr-6 text-[#2E3656] shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]">
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 14 }}
                        className="grid size-11 place-items-center rounded-full bg-emerald-500 text-[20px] font-bold text-white">✓</motion.span>
                      <div>
                        <p className="text-[15.5px] font-bold">Aarav_Rao_Resume.pdf</p>
                        <Mono className="text-[11px] text-[#6B7194]">DOWNLOADED · ATS 92 · 1 PAGE</Mono>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BrowserFrame>

          {/* chapter rail: one segment per chapter, the current one filling */}
          <div className="mt-5 grid grid-cols-5 gap-2">
            {CHAPTERS.map((x, i) => (
              <button key={x.k} onClick={() => { setC(i); setV(0); setRestart((r) => r + 1); }} className="group text-left">
                <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                  {i < c && <span className="block h-full w-full rounded-full bg-white/50" />}
                  {i === c && <motion.span key={`${c}-${on}-${restart}`} className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#5CC2FF]"
                    initial={{ width: "0%" }} animate={{ width: on && !reduce ? "100%" : "4%" }} transition={{ duration: on && !reduce ? x.ms / 1000 : 0.2, ease: "linear" }} />}
                </span>
                <Mono className={cn("mt-2 block truncate text-[10.5px] uppercase transition-colors max-sm:hidden", i === c ? "text-white" : "text-white/45 group-hover:text-white/75")}>0{i + 1} · {x.k}</Mono>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 05 · ATS SCORE ═══════════════ */

const ATS_NOTES = [
  { k: "34 CHECKS", t: "Parsed the way their software reads it.", d: "Contact block, headings, dates, links, keywords and layout, across 8 categories." },
  { k: "JOB MATCH", t: "81% match, and the skills you're missing.", d: "Paste a job and see which must-haves your resume already proves." },
  { k: "RED FLAGS", t: "Caught before a recruiter sees them.", d: "Gaps, unexplained jumps and missing outcomes, each with a fix." },
];
export function RbAts() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.3, once: true });
  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP}>
        <Head n="05" label="ATS score" title={<>Know your score <span className={HL}>before</span> their software does.</>}
          sub="A live ATS check runs while you edit, so you download only when it's green." />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease }}>
          <BrowserFrame url="app.interviewtrix.com/dashboard/resumes/aarav-rao/ats">
            <div className="overflow-hidden">
              <motion.div animate={reduce ? undefined : { scale: [1, 1.06, 1.06, 1], originX: [0.5, 0.25, 0.6, 0.5], originY: [0.5, 0.4, 0.55, 0.5] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.7, 1] }}>
                <LoopVideo name="rb-ats" />
              </motion.div>
            </div>
          </BrowserFrame>
        </motion.div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {ATS_NOTES.map((x, i) => (
            <motion.div key={x.k} initial={{ opacity: 0, y: 12 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease }} className="rounded-2xl border border-border bg-white p-5">
              <Mono className="text-[11px] text-primary">0{i + 1} · {x.k}</Mono>
              <p className={cn("mt-1 text-[18px] font-bold tracking-tight", INK)}>{x.t}</p>
              <p className="mt-1 text-[14.5px] text-muted-foreground max-md:hidden">{x.d}</p>
            </motion.div>
          ))}
        </div>
        <a href={MK26_ROUTES.ats} className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary hover:underline">Check my ATS score, free <ArrowRight className="size-4" /></a>
      </div>
    </section>
  );
}

/* ═══════════════ 06 · WHAT THE RESUME FEEDS ═══════════════ */

export function RbAfter() {
  return (
    <Wiring n="06" label="One memory" title={<>Your resume <span className={HL}>isn&apos;t just a PDF.</span></>}
      sub="The same resume feeds every round you practise and every job you apply to."
      ins={["LinkedIn profile", "Your old PDF", "A talk with Ava"]}
      outs={[
        { t: "Mock interviews", d: "Questions come from the projects you actually listed." },
        { t: "Chrome extension", d: "Tailors your resume to the job post you're reading." },
        { t: "ChatGPT app", d: "Edit, tailor and score it from a chat." },
        { t: "Portfolio", d: "Your best work, public only when you turn it on." },
      ]}>
      {(on: boolean) => (
        <>
          <Mono className="text-[10.5px] text-sky-300">RESUME · MERIDIAN</Mono>
          <div className="mt-4 flex items-center gap-4">
            <span className="relative grid size-[68px] place-items-center">
              <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90"><circle cx="34" cy="34" r="29" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                <motion.circle cx="34" cy="34" r="29" fill="none" stroke="url(#kit-wire-g)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 0.92 } : {}} transition={{ delay: 0.7, duration: 1.2, ease }} /></svg>
              <span className="text-[22px] font-bold"><CountUp to={92} run={on} /></span>
            </span>
            <div><p className="font-bold">Aarav Rao</p><p className="text-[13px] text-[#9FB3CF]">Senior Frontend Engineer · ATS score</p></div>
          </div>
          <div className="mt-5 space-y-2 text-[13.5px]">
            {[["✓", "Every bullet has a number", "text-emerald-300"], ["✓", "81% match for Lumora Pay", "text-emerald-300"], ["!", "GraphQL missing from skills", "text-amber-300"]].map(([i, t, c], k) => (
              <motion.p key={t} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + k * 0.15 }} className={c}><span className="mr-1.5">{i}</span>{t}</motion.p>
            ))}
          </div>
        </>
      )}
    </Wiring>
  );
}

export const RbStickyCta = () => <StickyCta product="AI Resume Builder" cta="Build free" href={MK26_ROUTES.startResume} />;
