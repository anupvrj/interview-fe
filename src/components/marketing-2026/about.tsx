"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Emblem, type EmblemKind, Mono } from "./primitives";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { CircuitTraces, GridRunners } from "./graphics";
import { DARK, Dots, ease, Head, HL, INK, LAVENDER, LIGHT, StickyCta, WRAP } from "./landing-kit";
import { cn } from "@/lib/utils";

/**
 * About InterviewTrix. One story, the product's own loop told out loud:
 * hero (the context loop) → 01 one place → 02 agents working together → 03 proof (IX Profile + peers) → 04 why it works (the manifesto).
 */

/* ═══════════════ HERO: the context engine ═══════════════ */

const STAGES = ["Practice", "Context", "Understanding", "Readiness"];
const LAP_MS = 6400;
const SLOTS = 32;

/**
 * The loop, drawn as an engine: a light runs the outer ring past the four stages, every lap adds a session to the
 * ring of dots, and the gauge in the middle shows how much context the AI now has about you.
 */
function ContextLoop() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.4 });
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduce || !on) return;
    const t = setInterval(() => setStep((s) => s + 1), LAP_MS / STAGES.length);
    return () => clearInterval(t);
  }, [on, reduce]);

  const lap = Math.floor(step / STAGES.length), at = step % STAGES.length;
  const sessions = Math.min(SLOTS, 12 + lap);
  const context = Math.min(96, 41 + lap * 6 + at * 2);
  const C = 200, RO = 172, RM = 132, RI = 86;
  const pt = (r: number, deg: number) => { const a = (deg - 90) * (Math.PI / 180); return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }; };
  const gauge = 2 * Math.PI * RI;

  return (
    <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[440px]">
      {/* soft light behind the engine */}
      <div aria-hidden className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(115,103,240,.32),transparent_68%)] blur-2xl" />
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="ce-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8E83F5" /><stop offset="1" stopColor="#3FB6FF" /></linearGradient>
          <linearGradient id="ce-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7367F0" stopOpacity="0" /><stop offset="1" stopColor="#5CC2FF" /></linearGradient>
          <radialGradient id="ce-core" cx="50%" cy="38%" r="70%"><stop offset="0" stopColor="#1B2C55" /><stop offset="1" stopColor="#0A1428" /></radialGradient>
        </defs>

        {/* outer track + the light that runs it */}
        <circle cx={C} cy={C} r={RO} fill="none" stroke="#DCD8F6" strokeWidth="1.5" strokeDasharray="2 7" />
        <motion.g style={{ originX: "200px", originY: "200px" }} animate={reduce || !on ? { rotate: 0 } : { rotate: 360 }} transition={{ duration: LAP_MS / 1000, ease: "linear", repeat: Infinity }}>
          <path d={`M ${pt(RO, -70).x} ${pt(RO, -70).y} A ${RO} ${RO} 0 0 1 ${pt(RO, 0).x} ${pt(RO, 0).y}`} fill="none" stroke="url(#ce-tail)" strokeWidth="4" strokeLinecap="round" />
          <circle cx={pt(RO, 0).x} cy={pt(RO, 0).y} r="6" fill="#5CC2FF" />
          <circle cx={pt(RO, 0).x} cy={pt(RO, 0).y} r="13" fill="#5CC2FF" opacity=".25" />
        </motion.g>

        {/* every session it has learned from */}
        {Array.from({ length: SLOTS }).map((_, i) => {
          const p = pt(RM, (360 / SLOTS) * i), filled = i < sessions, newest = i === sessions - 1;
          return (
            <motion.circle key={i} cx={p.x} cy={p.y} initial={false} animate={{ r: newest ? 6 : filled ? 4.2 : 3, opacity: filled ? 1 : 0.9 }} transition={{ duration: 0.5 }}
              fill={filled ? "url(#ce-g)" : "#FFFFFF"} stroke={filled ? "none" : "#BDB6F2"} strokeWidth="1.2" />
          );
        })}

        {sessions > 0 && !reduce && (() => { const p = pt(RM, (360 / SLOTS) * (sessions - 1)); return <motion.circle key={sessions} cx={p.x} cy={p.y} fill="none" stroke="#5CC2FF" strokeWidth="1.5" initial={{ r: 6, opacity: 0.9 }} animate={{ r: 16, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity }} />; })()}
        {/* the core: how much context it has */}
        <circle cx={C} cy={C} r={RI + 18} fill="url(#ce-core)" />
        <circle cx={C} cy={C} r={RI} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="7" />
        <motion.circle cx={C} cy={C} r={RI} fill="none" stroke="url(#ce-g)" strokeWidth="7" strokeLinecap="round" transform={`rotate(-90 ${C} ${C})`}
          strokeDasharray={gauge} animate={{ strokeDashoffset: gauge * (1 - context / 100) }} transition={{ duration: 0.9, ease }} />
      </svg>

      {/* readout */}
      <div className="absolute inset-0 grid place-items-center text-center text-white">
        <div>
          <Mono className="text-[9.5px] tracking-[.18em] text-sky-300 sm:text-[10.5px]">IX SKILL GRAPH</Mono>
          <p className="mt-0.5 text-[38px] font-extrabold leading-none tracking-[-0.04em] tabular-nums sm:text-[52px]">{context}<span className="text-[0.5em] text-white/60">%</span></p>
          <p className="mt-1 text-[11px] text-white/60 sm:text-[12.5px]">knows you · session {sessions}</p>
        </div>
      </div>

      {/* the four stages, on the outer ring */}
      {STAGES.map((k, i) => {
        const p = pt(RO, i * 90), active = i === at;
        return (
          <span key={k} className={cn("absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-300 sm:px-3 sm:text-[12.5px]",
            active ? "border-primary bg-primary text-white shadow-[0_8px_24px_-8px_rgba(115,103,240,.9)]" : "border-white bg-white/90 text-[#2E3656] shadow-[0_8px_20px_-14px_rgba(30,20,90,.5)] backdrop-blur")}
            style={{ left: `${(p.x / 400) * 100}%`, top: `${(p.y / 400) * 100}%` }}>{k}</span>
        );
      })}
    </div>
  );
}

export function AbHero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-clip pb-20 pt-28 md:pb-28 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <Emblem kind="graph" tone="light" className="size-11 rounded-xl" />
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>About InterviewTrix</span>
              <Mono className="text-[11px] text-muted-foreground">AGENTIC AI · CAREER PLATFORM</Mono>
            </span>
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[38px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[46px] md:text-[60px] xl:text-[66px]", INK)}>
            An AI that <span className={cn(HL, "whitespace-nowrap")}>learns you</span>, and coaches you until you&apos;re hired.
          </motion.h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }}
            className="mt-6 max-w-[44ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            An agentic AI platform that takes you from resume to offer, and gets sharper about you with every session.
          </motion.p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90"><StartLink href={MK26_ROUTES.startInterview}>Start my free mock interview <ArrowRight /></StartLink></Button>
            <a href="#ab-why" className="text-[15px] font-semibold text-[#2E3656] hover:text-primary">Why it works →</a>
          </div>
        </div>
        <ContextLoop />
      </div>
    </section>
  );
}

/* ═══════════════ 01 · ONE PLACE ═══════════════ */

const PIECES: { kind: EmblemKind; k: string; d: string; href: string; tag: string; span: string }[] = [
  { kind: "resume", k: "ATS-optimized resume", d: "Build it against the job, and see your ATS score before a recruiter does.", href: MK26_ROUTES.resume, tag: "RESUME", span: "lg:col-span-2" },
  { kind: "voice", k: "Live AI mock interviews", d: "Any role, any industry. A voice interviewer that follows up when you get vague.", href: MK26_ROUTES.interview, tag: "VOICE", span: "lg:col-span-2" },
  { kind: "code", k: "Coding rounds", d: "A real editor and real test cases, with an interviewer who asks about your complexity.", href: MK26_ROUTES.coding, tag: "CODE", span: "lg:col-span-2" },
  { kind: "whiteboard", k: "Live system design", d: "A whiteboard that reads your diagram and pushes on scale.", href: MK26_ROUTES.systemDesign, tag: "WHITEBOARD", span: "lg:col-span-3" },
  { kind: "peers", k: "1:1 Peer Interviews", d: "When you're ready, a verified professional from a top company runs the round.", href: MK26_ROUTES.peerInterviews, tag: "PEERS", span: "lg:col-span-3" },
];

export function AbPlace() {
  return (
    <section className={LIGHT}>
      <Dots />
      <div className={WRAP}>
        <Head n="01" label="One place" title={<>Everything a job seeker needs, <span className={HL}>in one place.</span></>}
          sub="From the resume that gets you shortlisted to the round that gets you the offer. No juggling five tools that never talk to each other." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          {PIECES.map((p, i) => (
            <motion.a key={p.k} href={p.href} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: i * 0.07, duration: 0.55, ease }}
              className={cn("group relative overflow-hidden rounded-[24px] border border-border bg-white p-5 shadow-[0_24px_50px_-36px_rgba(30,20,80,.45)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_30px_60px_-34px_rgba(75,63,208,.45)] sm:p-6", p.span)}>
              <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-[radial-gradient(circle,rgba(115,103,240,.10),transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <Emblem kind={p.kind} tone="light" />
                <Mono className="text-[10.5px] text-muted-foreground">{p.tag}</Mono>
              </div>
              <p className={cn("mt-5 text-[20px] font-bold tracking-[-0.02em]", INK)}>{p.k}</p>
              <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">{p.d}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary">See how it works <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
            </motion.a>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center text-[15px] text-muted-foreground">
          Every one of them reads and writes the same <span className="font-semibold text-[#2E3656]">IX Skill Graph</span>, so each one makes the next one smarter.
        </motion.p>
      </div>
    </section>
  );
}

/* ═══════════════ 02 · AGENTS THAT WORK TOGETHER ═══════════════ */

const AGENTS = [
  { k: "Interviewer", d: "Runs the round in a natural voice and asks the next question.", say: "“Walk me through the cache you just drew.”" },
  { k: "Follow-up", d: "Listens for vague answers and digs in, like a real panel would.", say: "“How would you know it actually helped?”" },
  { k: "Evaluator", d: "Scores every answer against the rubric for that role.", say: "Trade-offs 3/5 · Clarity 4/5" },
  { k: "Coach", d: "Turns the scores into a better version of each answer and a plan.", say: "“Lead with the trade-off before you're asked.”" },
  { k: "Memory", d: "Writes what it learned about you into your IX Skill Graph.", say: "Trade-offs → slipping · Clarity → strong" },
];
const REPORT = [
  { q: "Design a URL shortener", s: 72 },
  { q: "What breaks at 10× traffic?", s: 64 },
  { q: "Counter or hash for the code?", s: 81 },
];

export function AbAgents() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35 });
  const [a, setA] = useState(0);
  useEffect(() => {
    if (reduce || !on) return;
    const t = setInterval(() => setA((x) => (x + 1) % AGENTS.length), 2200);
    return () => clearInterval(t);
  }, [on, reduce]);
  const rows = a >= 2 ? REPORT.length : a === 1 ? 1 : 0;

  return (
    <section className={DARK}>
      <CircuitTraces className="opacity-50" />
      <div ref={ref} className={WRAP}>
        <Head dark n="02" label="Agents, together" title={<>Not one chatbot. <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">A panel of AI agents.</span></>}
          sub="Multiple agents work together to run realistic voice interviews, coding rounds and live system design sessions, then score every answer in a question-by-question report." />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* the panel, one agent at a time taking the turn */}
          <ol className="space-y-2.5">
            {AGENTS.map((g, i) => {
              const live = i === a;
              return (
                <li key={g.k}>
                  <button type="button" onClick={() => setA(i)} className={cn("flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors duration-300", live ? "border-sky-400/40 bg-white/[.07]" : "border-white/10 bg-white/[.02] hover:bg-white/[.05]")}>
                    <span className={cn("relative mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl text-[12px] font-bold transition-colors", live ? "bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white" : "bg-white/10 text-white/60")}>
                      <span className="font-[family-name:var(--font-geist-mono)]">0{i + 1}</span>
                      {live && !reduce && <span className="absolute inset-0 animate-ping rounded-xl bg-sky-400/25" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2"><span className="text-[15.5px] font-semibold text-white">{g.k} agent</span>{live && <Mono className="text-[9.5px] text-sky-300">● WORKING</Mono>}</span>
                      <span className="mt-0.5 block text-[14px] text-[#9FB3CF]">{g.d}</span>
                      <AnimatePresence>
                        {live && <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 block overflow-hidden font-[family-name:var(--font-geist-mono)] text-[12.5px] text-sky-200">{g.say}</motion.span>}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* what they produce together */}
          <div className="rounded-[24px] bg-white p-6 text-[#2E3656] shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)]">
            <div className="flex items-center justify-between"><Mono className="text-[10px] text-primary">QUESTION-BY-QUESTION REPORT</Mono><Mono className="text-[10px] text-muted-foreground">SYSTEM DESIGN · 41 MIN</Mono></div>
            <div className="mt-4 space-y-2.5">
              {REPORT.map((r, i) => (
                <motion.div key={r.q} animate={{ opacity: i < rows ? 1 : 0.25 }} transition={{ duration: 0.4 }} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3"><p className="truncate text-[14px] font-medium">Q{i + 1} · {r.q}</p><Mono className="text-[12px]">{i < rows ? r.s : "—"}</Mono></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]" animate={{ width: i < rows ? `${r.s}%` : "0%" }} transition={{ duration: 0.7, ease }} /></div>
                </motion.div>
              ))}
            </div>
            <motion.div animate={{ opacity: a >= 3 ? 1 : 0.25 }} className="mt-4 rounded-xl bg-primary-muted p-3 text-[13.5px]">
              <Mono className="mr-1.5 text-[10px] text-primary">BETTER ANSWER</Mono>Name the hot key first, then replicate it and serve it from the edge.
            </motion.div>
            <motion.div animate={{ opacity: a >= 4 ? 1 : 0.25 }} className="mt-2.5 flex flex-wrap gap-1.5">
              {[["Trade-offs", "slipping"], ["Clarity", "strong"], ["Estimation", "new"]].map(([k, s]) => (
                <span key={k} className={cn("rounded-full px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[11px]", s === "slipping" ? "bg-amber-50 text-amber-700" : s === "strong" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700")}>{k} · {s}</span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 03 · FROM PRACTICE TO PROOF ═══════════════ */

export function AbProof() {
  return (
    <section className={LAVENDER}>
      <div className={WRAP}>
        <Head n="03" label="Proof" title={<>Your practice becomes <span className={HL}>proof.</span></>}
          sub="Your progress becomes an IX Profile that shows recruiters what you can really do. And when you want a human verdict, a verified professional is one booking away." />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* IX Profile, as a recruiter sees it */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, ease }}
            className="rounded-[26px] border border-white bg-white p-6 shadow-[0_30px_60px_-34px_rgba(40,30,140,.5)]">
            <div className="flex items-center justify-between"><Mono className="text-[10.5px] text-primary">IX PROFILE · RECRUITER VIEW</Mono><Mono className="text-[10.5px] text-muted-foreground">UPDATED TODAY</Mono></div>
            <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-[16px] font-bold text-white sm:size-14 sm:text-[18px]">RS</span>
              <div className="min-w-0">
                <p className={cn("flex items-center gap-1.5 text-[17px] font-bold sm:text-[19px]", INK)}>Rohan S. <BadgeCheck className="size-4 shrink-0 text-primary" /></p>
                <p className="truncate text-[13px] text-muted-foreground sm:text-[14px]">Backend engineer · 4 yrs · Bangalore</p>
              </div>
              <div className="text-right"><p className={cn("text-[28px] font-extrabold leading-none sm:text-[32px]", INK)}>78</p><Mono className="text-[10px] text-muted-foreground">IX SCORE</Mono></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-2.5">
              {[["24", "AI rounds"], ["6", "system designs"], ["2", "peer verdicts"]].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-[#F8F8FB] p-3"><p className={cn("text-[20px] font-bold", INK)}>{n}</p><p className="text-[12.5px] text-muted-foreground">{l}</p></div>
              ))}
            </div>
            <p className="mt-5 text-[13px] font-semibold text-[#2E3656]">Strongest, with evidence</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Scaling · 74", "Impact numbers · 81", "Confidence · 82", "Testing · 76"].map((t) => <span key={t} className="rounded-full bg-emerald-50 px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[11px] text-emerald-700">{t}</span>)}
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground">Every number links to the round it came from, so a recruiter can watch the answer, not just read the score.</p>
          </motion.div>

          {/* peers */}
          <motion.a href={MK26_ROUTES.peerInterviews} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: 0.1, duration: 0.6, ease }}
            className="group flex flex-col rounded-[26px] bg-[#0B1A30] p-6 text-white shadow-[0_30px_60px_-30px_rgba(40,30,140,.7)] ring-1 ring-white/10">
            <Mono className="text-[10.5px] text-sky-300">1:1 PEER INTERVIEWS</Mono>
            <p className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.02em]">When you&apos;re ready, sit across from someone who&apos;s been on the panel.</p>
            <p className="mt-3 text-[15px] text-[#9FB3CF]">Book a live round with a verified professional from a top company. Their rating and notes land in the same memory as your AI rounds.</p>
            <div className="mt-6 flex -space-x-2">
              {["AN", "PK", "SM", "RV"].map((x, i) => <span key={x} className={cn("grid size-10 place-items-center rounded-full border-2 border-[#0B1A30] text-[12px] font-bold", ["bg-[#7367F0]", "bg-[#1F8FFF]", "bg-[#38BDF8]", "bg-[#9B8CFF]"][i])}>{x}</span>)}
              <span className="grid h-10 items-center rounded-full border-2 border-[#0B1A30] bg-white/10 px-3 text-[12px] font-semibold">Verified</span>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14.5px] font-semibold text-sky-300">Find an interviewer <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · WHY IT WORKS (the manifesto) ═══════════════ */

const MANIFESTO = ["The more you practice, the better your context gets.", "The better the context, the better the AI understands you.", "That is how practice turns into job readiness."];

/** Each line lights up as it scrolls through the middle of the screen. */
function Line({ text, i }: { text: string; i: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "start 45%"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.18, 1]);
  return (
    <motion.p ref={ref} style={{ opacity }} className={cn("text-[29px] font-extrabold leading-[1.12] tracking-[-0.045em] sm:text-[40px] md:text-[58px]", i === 2 ? "bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent" : "text-white")}>
      {text}
    </motion.p>
  );
}

export function AbWhy() {
  return (
    <section id="ab-why" className={cn(DARK, "scroll-mt-20")}>
      <CircuitTraces className="opacity-40" />
      <div className={WRAP}>
        <Head dark n="04" label="Why it works" title={<>Practice that <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">compounds.</span></>} />
        <div className="max-w-[1000px] space-y-5">
          {MANIFESTO.map((t, i) => <Line key={t} text={t} i={i} />)}
        </div>
        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[["Session 1", "It learns your role, your resume and how you answer."], ["Session 5", "It knows where you slip and starts every round there."], ["Session 20", "It coaches the gaps an interviewer would find first."]].map(([k, d]) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><Mono className="text-[11px] text-sky-300">{k.toUpperCase()}</Mono><p className="mt-2 text-[15px] text-[#C9D6EA]">{d}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const AbStickyCta = () => <StickyCta product="InterviewTrix" cta="Start free mock" href={MK26_ROUTES.startInterview} />;
