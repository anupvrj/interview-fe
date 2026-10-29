"use client";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowRight, Chrome, Code2, MessageSquare, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, LivePill, Mono, SoundToggle } from "./primitives";
import { LiveRound } from "./mock-interview";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { GridRunners, SilkRibbons } from "./graphics";
import { usePublicPlatformStats } from "@/hooks/usePublicPlatformStats";

const surfaces = [
  { icon: MessageSquare, label: "ChatGPT" },
  { icon: Chrome, label: "Chrome" },
  { icon: Sparkle, label: "Claude" },
  { icon: Code2, label: "Any MCP client" },
];

// navy headline; the two words that carry the promise wear the light logo gradient
const HL = "bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF] bg-clip-text pr-[0.06em] text-transparent";
const EASE = [0.16, 1, 0.3, 1] as const;

const words = [
  { t: "Hyper", c: "text-[#2E3656]" },
  { t: "Personalised", c: HL },
  { t: "AI Interviewer", c: `whitespace-nowrap ${HL}` },
  { t: "that", c: "text-[#2E3656]" },
];

// live platform totals (GET /marketing/stats, the same numbers the production home page counts up)
const heroStats = [
  ["interviews", "interview sessions"],
  ["resumes", "resumes built"],
  ["users", "users"],
] as const;

export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [sound, setSound] = useState(false);
  const { stats } = usePublicPlatformStats();
  const { scrollYProgress } = useScroll({ target: stage, offset: ["start end", "start 15%"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [28, 18]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: EASE },
  });

  return (
    <section className="relative overflow-clip pb-24 pt-32 md:pt-40">
      {/* BG: the blueprint box grid, with a very light running animation along its lines */}
      {/* very soft brand wash under the grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(42%_34%_at_50%_30%,rgba(115,103,240,.16),transparent_72%),radial-gradient(38%_30%_at_22%_14%,rgba(31,143,255,.10),transparent_70%),radial-gradient(36%_28%_at_80%_16%,rgba(155,140,255,.14),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_60%)]" />
      <GridRunners />
      <SilkRibbons className="absolute inset-x-0 top-[44%] h-[760px] w-full opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto max-w-[1120px] px-5 text-center">
        <motion.div {...rise(0)}><LivePill><span className="hidden sm:inline">New · InterviewTrix is </span><span className="sm:hidden">Now </span>live inside ChatGPT</LivePill></motion.div>
        <h1 className="text-balance mx-auto mt-7 max-w-[15ch] text-[46px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[62px] md:text-[78px] xl:text-[88px]">
          {words.map((w, i) => (
            <motion.span key={w.t} className={`inline-block ${w.c}`} {...rise(0.12 + i * 0.07)}>
              {w.t}&nbsp;
            </motion.span>
          ))}
          <motion.span className="relative inline-block whitespace-nowrap" {...rise(0.12 + words.length * 0.07)}>
            <span className="pb-2 pr-[0.12em] text-[#2E3656] [-webkit-box-decoration-break:clone]">remembers you!</span>
            <svg aria-hidden viewBox="0 0 520 24" preserveAspectRatio="none" className="absolute -bottom-1 left-[2%] h-[0.18em] w-[92%] overflow-visible">
              <defs><linearGradient id="uline" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" stopOpacity=".8" /><stop offset="1" stopColor="#1F8FFF" stopOpacity=".8" /></linearGradient></defs>
              <motion.path d="M4 16 C 120 4, 260 22, 516 8" fill="none" stroke="url(#uline)" strokeWidth="7" strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.05, duration: 0.9, ease: EASE }} />
            </svg>
          </motion.span>
        </h1>
        <motion.p {...rise(0.8)} className="text-balance mx-auto mt-7 max-w-[56ch] text-[17px] leading-relaxed text-[#4B5275] md:text-[18.5px]">
          Your real interview shouldn&apos;t be your first rehearsal. Practise voice, coding and system design rounds — each one picks up where the last left off.
        </motion.p>
        <motion.div {...rise(0.92)} className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
            <StartLink href={MK26_ROUTES.startInterview}>Start my free mock interview <ArrowRight /></StartLink>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-xl px-6 text-[15.5px]">
            <StartLink href={MK26_ROUTES.ats}>Check my resume score</StartLink>
          </Button>
        </motion.div>
        <motion.div {...rise(1.02)} className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <span>Use it in</span>
          {surfaces.map(({ icon: I, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-foreground">
              <I className="size-3.5 text-primary" /> {label}
            </span>
          ))}
        </motion.div>
        <motion.div {...rise(1.12)} className="mx-auto mt-10 grid max-w-[640px] grid-cols-3 divide-x divide-border border-y border-border text-left">
          {heroStats.map(([k, l]) => (
            <div key={l} className="px-3 py-3 md:px-4">
              {stats
                ? <Mono className="block whitespace-nowrap text-[18px] tracking-tight md:text-[22px]">{stats[k].toLocaleString("en-IN")}+</Mono>
                : <span className="my-[5px] block h-[18px] w-16 animate-pulse rounded bg-muted md:h-[22px]" aria-hidden />}
              <span className="text-[12.5px] text-muted-foreground">{l}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Product stage — grows to full width as it scrolls in (Verve pattern), real capture inside */}
      <motion.div ref={stage} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25, duration: 0.8, ease: EASE }} className="relative mx-auto mt-16 max-w-[1180px] px-4">
        <motion.div style={reduce ? undefined : { scale, y, borderRadius: radius }} className="relative origin-top">
          <BrowserFrame url="app.interviewtrix.com/interview/live">
            <LiveRound sound={sound} />
          </BrowserFrame>
          <SoundToggle sound={sound} onToggle={() => setSound((x) => !x)} className="absolute -top-5 right-6" />
        </motion.div>
        {/* depth: glass cards overlapping the frame edges, each telling a different part of the story */}
        <motion.div initial={reduce ? false : { opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 20 }}
          className="pointer-events-none absolute -left-2 bottom-[14%] hidden w-[230px] rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-[0_30px_60px_-24px_rgba(30,20,80,.45),inset_0_1px_0_#fff] backdrop-blur-xl lg:block">
          <Mono className="text-[10.5px] text-muted-foreground">LIVE · WHILE YOU SPEAK</Mono>
          {[["Pace", "138 wpm", 62], ["Clarity", "76/100", 76], ["Confidence", "82%", 82]].map(([k, v, w]) => (
            <div key={k as string} className="mt-3">
              <div className="flex justify-between text-[12.5px]"><span className="text-muted-foreground">{k}</span><Mono>{v}</Mono></div>
              <div className="mt-1 h-1 rounded-full bg-muted"><motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400" initial={{ width: 0 }} whileInView={{ width: `${w}%` }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 1 }} /></div>
            </div>
          ))}
        </motion.div>
        <motion.div initial={reduce ? false : { opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: 0.5, type: "spring", stiffness: 160, damping: 20 }}
          className="pointer-events-none absolute -right-2 top-[18%] hidden w-[250px] rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-[0_30px_60px_-24px_rgba(30,20,80,.45),inset_0_1px_0_#fff] backdrop-blur-xl lg:block">
          <Mono className="text-[10.5px] text-primary">BEFORE YOUR NEXT ROUND</Mono>
          <p className="mt-1 text-[15px] font-bold tracking-tight">Master next</p>
          {["Caching trade-offs", "Pace under pressure", "Defend O(n log n)"].map((t, k) => (
            <p key={t} className="mt-2 flex items-center gap-2 text-[13px]"><span className="grid size-5 place-items-center rounded-md bg-primary-muted font-[family-name:var(--font-geist-mono)] text-[10.5px] text-primary">{k + 1}</span>{t}</p>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
