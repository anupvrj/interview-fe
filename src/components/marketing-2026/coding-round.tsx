"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Code2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, LoopVideo, Mono } from "./primitives";
import { CircuitTraces, GridRunners } from "./graphics";
import { CountUp, useFocusCamera, DARK, Dots, ease, Head, HL, INK, LAVENDER, LIGHT, StickyCta, Wiring, WRAP } from "./landing-kit";
import { SkillsSection, type SkHub } from "./skills-section";
import { cn } from "@/lib/utils";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { CODING_DEMO_CODE as CODE, typedAt } from "./coding-typing";

/**
 * AI Coding Round landing page, same kit as the other product pages:
 * hero → 01 the round, start to finish (coded film) → 02 what it checks → 03 the problem bank → 04 skills graph (DAG) → 05 your report → 06 one memory.
 * The IDE is a coded recreation of /dashboard/coding-interviews/[id]; the candidate tile is generated footage.
 */

/* ═══════════════ the IDE, shared by the hero and the film ═══════════════ */

const KW = /\b(def|while|if|else|return|len)\b/;

/** Tiny Python highlighter: keywords, numbers, the function name. Enough to read like Monaco. */
function Code({ upto }: { upto: number }) {
  const lines = CODE.slice(0, upto).split("\n");
  return (
    <pre className="font-[family-name:var(--font-geist-mono)] text-[11.5px] leading-[1.7] md:text-[12.5px]">
      {lines.map((ln, i) => (
        <div key={i} className="flex">
          <span className="w-7 shrink-0 select-none pr-3 text-right text-white/25">{i + 1}</span>
          <span className="whitespace-pre text-[#D6E2F5]">
            {ln.split(/(\b\w+\b|\d+)/).map((t, k) =>
              KW.test(t) ? <span key={k} className="text-[#C792EA]">{t}</span>
              : /^\d+$/.test(t) ? <span key={k} className="text-[#F78C6C]">{t}</span>
              : t === "two_sum" ? <span key={k} className="text-[#82AAFF]">{t}</span>
              : <span key={k}>{t}</span>)}
            {i === lines.length - 1 && upto < CODE.length && <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-[#82AAFF]" />}
          </span>
        </div>
      ))}
    </pre>
  );
}

const PUBLIC = [{ i: "[2,7,11,15], 9", o: "[1,2]" }, { i: "[2,3,4], 6", o: "[1,3]" }, { i: "[-1,0], -1", o: "[1,2]" }];
const HIDDEN = ["empty input", "two items", "duplicates", "negatives", "target at ends", "n = 10⁵", "all equal", "no gap", "large values", "min / max", "middle pair"];

type Phase = "problem" | "code" | "run" | "submit" | "discuss" | "report";

/** The coding-round screen. Everything is driven by `phase` and a `t` (0..1 progress through that phase). */
/** `compact` drops the problem pane, for small placements like the hero. */
type Cam = "type" | "think" | "talk";
function Ide({ phase, t, caption, compact }: { phase: Phase; t: number; caption?: { who: "AI" | "YOU"; text: string; talking: boolean; hl?: number }; compact?: boolean }) {
  const order: Phase[] = ["problem", "code", "run", "submit", "discuss", "report"];
  const at = order.indexOf(phase);
  const typed = at > 1 ? CODE.length : at === 1 ? typedAt(t) : 0;
  const pub = at > 2 ? 3 : at === 2 ? Math.min(3, Math.floor(t * 3.6)) : 0;
  const hid = at > 3 ? HIDDEN.length : at === 3 ? Math.min(HIDDEN.length, Math.floor(t * (HIDDEN.length + 2))) : 0;
  const cam: Cam = phase === "code" ? "type" : caption?.who === "YOU" ? "talk" : "think";

  return (
    <div className={cn("relative grid grid-rows-[auto_minmax(0,1fr)_auto] gap-px bg-white/[.06] text-left text-white max-sm:!aspect-auto max-sm:!grid-cols-1 max-sm:!grid-rows-none", compact ? "aspect-[16/11] grid-cols-[minmax(0,1.9fr)_minmax(0,.8fr)]" : "aspect-[16/9] grid-cols-[minmax(0,.9fr)_minmax(0,1.6fr)_minmax(0,.85fr)]")}>
      {/* top bar */}
      <div className={cn("flex items-center gap-3 bg-[#0B1A30] px-3 py-2 max-sm:!col-span-1", compact ? "col-span-2" : "col-span-3")}>
        <Code2 className="size-3.5 text-[#82AAFF]" />
        <span className="truncate text-[12px] font-semibold">Two Sum II · sorted array</span>
        <Mono className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9.5px] text-amber-300">MEDIUM</Mono>
        <Mono className="rounded bg-white/10 px-1.5 py-0.5 text-[9.5px] text-white/70 max-sm:hidden">FAANG</Mono>
        <Mono className="ml-auto rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/80">Python 3</Mono>
        <Mono className="text-[10.5px] text-white/60">⏱ 18:{String(42 - Math.floor(at * 1.5)).padStart(2, "0")}</Mono>
      </div>

      {/* problem */}
      {!compact && <div className={cn("min-h-0 overflow-hidden bg-[#071224] p-3 transition-colors duration-500 max-sm:hidden", phase === "problem" && "bg-[#0E2240]")}>
        <Mono className="text-[9.5px] text-sky-300">PROBLEM</Mono>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#CFE0F7]">Given a <b className="text-white">sorted</b> array of integers, return the 1-indexed positions of two numbers that add up to <b className="text-white">target</b>. Use constant extra space.</p>
        <div className="mt-2 rounded-md bg-black/30 p-2 font-[family-name:var(--font-geist-mono)] text-[9.5px] leading-relaxed text-white/70 max-sm:hidden">
          numbers = [2,7,11,15]<br />target = 9<br />→ [1, 2]
        </div>
        <Mono className="mt-2 block text-[9px] text-white/40 max-sm:hidden">2 ≤ n ≤ 3·10⁴ · one solution</Mono>
      </div>}

      {/* editor */}
      <div className="relative min-h-0 overflow-hidden bg-[#050E1C] py-2.5 pr-2 max-sm:min-h-[400px]">
        <Mono className="mb-1.5 block pl-3 text-[9.5px] text-white/40">solution.py</Mono>
        <Code upto={typed} />
        {/* console: what the runner says, the same way the real IDE prints it */}
        {!compact && at >= 2 && at <= 3 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-3 bottom-2.5 rounded-lg border border-white/10 bg-black/40 p-2.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] leading-[1.7]">
            <p className="text-white/45">$ run · python3 solution.py</p>
            <p className={pub === 3 ? "text-emerald-300" : "text-[#CFE0F7]"}>{pub === 3 ? "✓ public 3/3 passed · 41ms" : `running public cases… ${pub}/3`}</p>
            {at >= 3 && <p className="text-white/45">$ submit · hidden cases</p>}
            {at >= 3 && <p className={hid === HIDDEN.length ? "text-emerald-300" : "text-[#CFE0F7]"}>{hid === HIDDEN.length ? "✓ accepted · hidden 11/11 · 1.4s" : `judging… ${hid}/11 · ${HIDDEN[Math.min(hid, HIDDEN.length - 1)]}`}</p>}
          </motion.div>
        )}
        {phase === "discuss" && caption?.hl && <motion.span key={caption.hl} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ top: `calc(${caption.hl - 1} * 1.7em + 31px)` }}
          className="pointer-events-none absolute inset-x-1 h-[1.7em] rounded bg-sky-400/10 text-[11.5px] ring-1 ring-sky-400/40 md:text-[12.5px]" />}
      </div>

      {/* people: candidate camera + interviewer (voice only) */}
      <div className="row-span-2 flex min-h-0 flex-col gap-px bg-white/[.06] max-sm:order-last max-sm:row-span-1 max-sm:flex-row">
        <div className="relative overflow-hidden bg-black max-sm:w-[46%]">
          <div className="relative aspect-[4/3]">
            {(["type", "think", "talk"] as Cam[]).map((k) => (
              <div key={k} className={cn("absolute inset-0 transition-opacity duration-300", cam === k ? "opacity-100" : "opacity-0")}>
                <LoopVideo name={`cr-cand-${k}`} className="!aspect-auto h-full" priority />
              </div>
            ))}
          </div>
          <Mono className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[8.5px] text-white/80">● CAMERA</Mono>
        </div>
        <div className="flex flex-1 flex-col justify-between bg-[#0B1A30] p-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-[9.5px] font-bold">DR</span>
            <div className="min-w-0 leading-tight"><p className="truncate text-[11px] font-semibold">Daniel Reed</p><Mono className="text-[8.5px] text-white/50">INTERVIEWER · VOICE</Mono></div>
          </div>
          <span className="flex h-6 items-center gap-[2px]">
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.span key={i} className="w-[2.5px] rounded-full bg-gradient-to-t from-[#7367F0] to-[#5CC2FF]"
                animate={caption?.who === "AI" && caption.talking ? { height: [3, 4 + ((i * 37) % 15), 3] } : { height: 3 }} transition={{ duration: 0.7 + (i % 4) * 0.1, repeat: Infinity, delay: (i % 5) * 0.05 }} />
            ))}
          </span>
        </div>
      </div>

      {/* tests */}
      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-[#0B1A30] px-3 py-2 max-sm:!col-span-1", compact ? "col-span-1" : "col-span-2")}>
        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold", at === 2 ? "bg-white text-[#0B1A30]" : "bg-white/10 text-white/70")}><Play className="size-3 fill-current" />Run</span>
        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold", at === 3 ? "bg-emerald-400 text-[#052E1C]" : "bg-[#7367F0] text-white")}>Submit</span>
        <Mono className="text-[10px] text-white/60">PUBLIC</Mono>
        <span className="flex gap-1">{PUBLIC.map((_, i) => <span key={i} className={cn("grid size-4 place-items-center rounded-[4px] transition-colors", i < pub ? "bg-emerald-400/25 text-emerald-300" : "bg-white/10")}>{i < pub && <Check className="size-2.5" />}</span>)}</span>
        <Mono className="text-[10px] text-white/60">HIDDEN</Mono>
        <span className="flex gap-1">{HIDDEN.map((_, i) => <span key={i} className={cn("grid size-4 place-items-center rounded-[4px] transition-colors", i < hid ? "bg-emerald-400/25 text-emerald-300" : "bg-white/10")}>{i < hid && <Check className="size-2.5" />}</span>)}</span>
        <Mono className={cn("ml-auto text-[10.5px]", hid === HIDDEN.length ? "text-emerald-300" : "text-white/50")}>{hid === HIDDEN.length ? "ACCEPTED · 11/11" : at >= 2 ? `${pub + hid} PASSED` : "NOT RUN"}</Mono>
      </div>

      {/* voice caption during the discussion */}
      <AnimatePresence>
        {caption && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute inset-x-[4%] bottom-[16%] z-10">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#050E1C]/90 p-2.5 pr-4 backdrop-blur-xl">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold", caption.who === "AI" ? "bg-gradient-to-br from-[#7367F0] to-[#1FB6FF]" : "bg-[#2E3656]")}>{caption.who === "AI" ? "DR" : "You"}</span>
              <AnimatePresence mode="wait">
                <motion.p key={caption.text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="min-w-0 text-[12.5px] leading-snug md:text-[14px]">
                  <Mono className={cn("mr-2 text-[9.5px]", caption.who === "AI" ? "text-sky-300" : "text-white/60")}>{caption.who === "AI" ? "INTERVIEWER" : "YOU"}</Mono>{caption.text}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* report */}
      <AnimatePresence>
        {phase === "report" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#050E1C]/70 p-4 backdrop-blur-[3px]">
            <motion.div initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="w-full max-w-[460px] rounded-2xl bg-white p-4 text-[#2E3656] shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] md:p-5">
              <div className="flex items-center justify-between"><Mono className="text-[10px] text-primary">CODING ROUND · REPORT</Mono><Mono className="text-[10px] text-emerald-600">✓ 11/11 HIDDEN</Mono></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[["Coding", 88], ["Discussion", 76]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-[#F4F3FB] p-3"><Mono className="text-[9.5px] text-muted-foreground">{String(k).toUpperCase()}</Mono><p className="text-[26px] font-extrabold leading-none"><CountUp to={v as number} run /></p></div>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-[12px]">
                <p className="text-emerald-700">✓ O(n) time, O(1) space, and you said why</p>
                <p className="text-amber-700">! Name the unsorted fallback before you're asked</p>
              </div>
              <Mono className="mt-3 block text-[10px] text-muted-foreground">NEXT · 3Sum · Container with most water</Mono>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════ HERO ═══════════════ */

export function CrHero() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0; const t0 = performance.now();
    const tick = (n: number) => { const k = ((n - t0) % 9000) / 6500; setT(Math.min(1, k)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  return (
    <section className="relative overflow-clip pb-24 pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><Code2 className="size-5" /></span>
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>AI Coding Round</span>
              <Mono className="text-[11px] text-muted-foreground">LIVE IDE · HIDDEN TESTS · VOICE FOLLOW-UP</Mono>
            </span>
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.055em] md:text-[60px] xl:text-[66px]", INK)}>
            Write the code. Then <span className={HL}>defend it</span>{" "}
            <span className="relative inline-block whitespace-nowrap">out loud.
              <svg aria-hidden viewBox="0 0 520 24" preserveAspectRatio="none" className="absolute -bottom-1 left-[2%] h-[0.18em] w-[92%] overflow-visible">
                <defs><linearGradient id="cr-ul" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" stopOpacity=".8" /><stop offset="1" stopColor="#1F8FFF" stopOpacity=".8" /></linearGradient></defs>
                <motion.path d="M4 16 C 120 4, 260 22, 516 8" fill="none" stroke="url(#cr-ul)" strokeWidth="7" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.9, ease }} />
              </svg>
            </span>
          </motion.h1>
          <p className="mt-7 max-w-[48ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            <span className="max-md:hidden">A live IDE with public and hidden test cases. Then an interviewer who has read your code asks why you chose that approach, and what breaks it.</span>
            <span className="md:hidden">Hidden tests, then an interviewer who asks why.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
              <StartLink href={MK26_ROUTES.startCoding}>Start my free coding round <ArrowRight /></StartLink>
            </Button>
            <a href="#mk26-cr-film" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#2E3656] hover:text-primary">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-white"><Play className="size-3.5 fill-current" /></span>Watch a round
            </a>
          </div>
          <Mono className="mt-4 block text-[12px] text-muted-foreground">14-day trial · No card · Real compile and run</Mono>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-muted-foreground max-md:hidden">Code in</span>
            {["Python", "Java", "C++", "JavaScript", "C"].map((l) => <span key={l} className="rounded-full border border-border bg-white px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[12.5px] text-[#2E3656]">{l}</span>)}
          </div>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }}>
          <BrowserFrame url="app.interviewtrix.com/coding-interviews/two-sum-sorted" className="shadow-[0_60px_120px_-40px_rgba(40,30,140,.6)]">
            <Ide compact phase={t < 1 ? "code" : "run"} t={t < 1 ? t : 0.9} />
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════ TICKER ═══════════════ */

const FACTS = ["A growing problem bank", "23 categories", "Python · Java · C++ · JavaScript · C", "Public + hidden test cases", "Real compile and run", "Voice follow-up on your code", "Two scores: code and discussion", "FAANG · product · service · startup"];
export function CrTicker() {
  return (
    <div className="relative overflow-hidden border-y border-[#E7E6F2] bg-white/60 py-4">
      <div className="mask-x flex w-max gap-10 [animation:marquee_40s_linear_infinite]">
        {[...FACTS, ...FACTS].map((f, i) => (
          <Mono key={i} aria-hidden={i >= FACTS.length} className="flex items-center gap-10 whitespace-nowrap text-[13px] uppercase tracking-wider text-[#4B5275]">
            {f}<span className="size-2 rotate-45 rounded-[2px] bg-primary/60" />
          </Mono>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ 01 · THE ROUND, START TO FINISH (film) ═══════════════ */

// hl = the editor line the interviewer is pointing at while asking
const TALK: { who: "AI" | "YOU"; text: string; ms: number; hl?: number }[] = [
  { who: "AI", text: "Accepted. Walk me through your approach.", ms: 2400, hl: 2 },
  { who: "YOU", text: "Two pointers from both ends. It's sorted, so I move whichever side gets me closer.", ms: 3600, hl: 2 },
  { who: "AI", text: "Why not a hash map? That's the usual answer.", ms: 2500, hl: 4 },
  { who: "YOU", text: "A map costs O(n) space. Walking in from both ends is O(1).", ms: 3200, hl: 4 },
  { who: "AI", text: "And if the array wasn't sorted?", ms: 2000 },
  { who: "YOU", text: "Then the hash map wins. Still one pass, but O(n) space.", ms: 3000 },
];
const INTRO = { who: "AI" as const, text: "Take a minute with it. Notice the array is sorted.", ms: 2800 };
const FILM: { k: string; p: Phase; ms: number }[] = [
  { k: "Problem", p: "problem", ms: INTRO.ms },
  { k: "Code", p: "code", ms: 8600 },
  { k: "Run", p: "run", ms: 2600 },
  { k: "Submit", p: "submit", ms: 3200 },
  { k: "Discuss", p: "discuss", ms: TALK.reduce((n, l) => n + l.ms, 0) },
  { k: "Report", p: "report", ms: 4400 },
];

export function CrFilm() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35 });
  const [c, setC] = useState(0);
  const [t, setT] = useState(0);
  const [restart, setRestart] = useState(0);
  const ch = FILM[c];

  // one clock per chapter: t runs 0 → 1, then the next chapter starts
  useEffect(() => {
    if (!on || reduce) { if (reduce) { setC(FILM.length - 1); setT(1); } return; }
    let raf = 0; const t0 = performance.now();
    const tick = (n: number) => {
      const k = Math.min(1, (n - t0) / ch.ms);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick); else { setC((x) => (x + 1) % FILM.length); setT(0); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [c, on, reduce, ch.ms, restart]);

  // which voice line, and whether someone is mid-sentence
  let caption: { who: "AI" | "YOU"; text: string; talking: boolean; hl?: number } | undefined;
  if (ch.p === "problem") caption = { who: "AI", text: INTRO.text, talking: t * INTRO.ms < INTRO.ms - 380 };
  if (ch.p === "discuss") {
    let ms = t * ch.ms;
    for (const l of TALK) { if (ms <= l.ms) { caption = { who: l.who, text: l.text, talking: ms < l.ms - 380, hl: l.hl }; break; } ms -= l.ms; }
  }

  return (
    <section id="mk26-cr-film" className="grain relative overflow-clip bg-[hsl(var(--ix-navy))] py-24 text-[#EAF2FF] md:py-32">
      <CircuitTraces className="opacity-50" />
      <div className="pointer-events-none absolute -inset-x-1/2 bottom-0 h-[42%] origin-bottom [transform:perspective(520px)_rotateX(58deg)] bg-[linear-gradient(rgba(31,143,255,.28)_2px,transparent_2px),linear-gradient(90deg,rgba(31,143,255,.28)_2px,transparent_2px)] bg-[length:90px_90px] opacity-50 [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)]" />
      <div ref={ref} className={WRAP}>
        <Head dark n="01" label="The round, start to finish" title={<>Solve it, pass it, then <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">explain it.</span></>}
          aside={<Mono className="mb-3 inline-block rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11.5px] text-sky-300">● ONE FULL ROUND · 30 SECONDS</Mono>}
          sub="Read the problem, write it, run the public cases, submit to the hidden ones, then talk it through with the interviewer. The report is waiting when you finish." />
        <div className="mx-auto max-w-[980px]">
          <BrowserFrame url="app.interviewtrix.com/coding-interviews/two-sum-sorted">
            <Ide phase={ch.p} t={t} caption={caption} />
          </BrowserFrame>
          <div className="mt-5 grid grid-cols-6 gap-2">
            {FILM.map((x, i) => (
              <button key={x.k} onClick={() => { setC(i); setT(0); setRestart((r) => r + 1); }} className="group text-left">
                <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                  <span className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#5CC2FF]" style={{ width: `${i < c ? 100 : i === c ? t * 100 : 0}%`, opacity: i < c ? 0.5 : 1 }} />
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

/* ═══════════════ 02 · WHAT IT CHECKS (vector graphics) ═══════════════ */

function Tile({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative overflow-hidden rounded-[24px] border border-border bg-white p-6 shadow-[0_24px_50px_-36px_rgba(30,20,80,.45)]", className)}>{children}</div>;
}

function HiddenGrid({ on }: { on: boolean }) {
  return (
    <div className="mt-5 grid grid-cols-4 gap-2">
      {HIDDEN.map((h, i) => {
        const fail = i === 5;
        return (
          <motion.div key={h} initial={{ rotateX: 90, opacity: 0 }} animate={on ? { rotateX: 0, opacity: 1 } : {}} transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease }}
            className={cn("rounded-lg border px-2 py-2", fail ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
            <span className={cn("grid size-5 place-items-center rounded-md", fail ? "bg-amber-400 text-white" : "bg-emerald-500 text-white")}>{fail ? <X className="size-3" /> : <Check className="size-3" />}</span>
            <Mono className={cn("mt-1.5 block truncate text-[10px]", fail ? "text-amber-800" : "text-emerald-800")}>{h}</Mono>
          </motion.div>
        );
      })}
      <div className="grid place-items-center rounded-lg border border-dashed border-border"><Mono className="text-[10px] text-muted-foreground">10/11</Mono></div>
    </div>
  );
}

function Rings({ on }: { on: boolean }) {
  const R = ({ v, label, c }: { v: number; label: string; c: string }) => (
    <div className="flex flex-col items-center">
      <span className="relative grid size-[104px] place-items-center">
        <svg viewBox="0 0 104 104" className="absolute inset-0 -rotate-90"><circle cx="52" cy="52" r="44" fill="none" stroke="#EEEDF7" strokeWidth="8" />
          <motion.circle cx="52" cy="52" r="44" fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: v / 100 } : {}} transition={{ delay: 0.3, duration: 1.2, ease }} /></svg>
        <span className={cn("text-[26px] font-extrabold", INK)}><CountUp to={v} run={on} /></span>
      </span>
      <Mono className="mt-2 text-[10.5px] text-muted-foreground">{label}</Mono>
    </div>
  );
  return <div className="mt-6 flex items-center justify-center gap-8"><R v={82} label="CODING" c="#7367F0" /><R v={64} label="DISCUSSION" c="#1F8FFF" /></div>;
}

function Compile({ on }: { on: boolean }) {
  const steps = ["$ compile solution.java", "✓ built in 0.42s", "$ run --tests public", "✓ 3/3 passed · 38ms"];
  return (
    <div className="mt-5 rounded-xl bg-[#0B1A30] p-4 font-[family-name:var(--font-geist-mono)] text-[11.5px] leading-[1.8]">
      {steps.map((l, i) => <motion.p key={l} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.35 }} className={l.startsWith("✓") ? "text-emerald-300" : "text-[#CFE0F7]"}>{l}</motion.p>)}
    </div>
  );
}

function FollowUp({ on }: { on: boolean }) {
  return (
    <div className="relative mt-5">
      <div className="rounded-xl bg-[#0B1A30] p-3 font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.75] text-[#9FB3CF]">
        <p><span className="mr-3 text-white/25">13</span>seen = {"{}"}</p>
        <motion.p initial={{ backgroundColor: "rgba(56,189,248,0)" }} animate={on ? { backgroundColor: "rgba(56,189,248,.16)" } : {}} transition={{ delay: 0.5 }} className="-mx-1 rounded px-1 text-white"><span className="mr-3 text-white/25">14</span>for i, x in enumerate(nums):</motion.p>
        <p><span className="mr-3 text-white/25">15</span>{"    "}if target - x in seen:</p>
      </div>
      <svg aria-hidden viewBox="0 0 40 40" className="absolute -bottom-6 left-10 h-8 w-8"><motion.path d="M6 2 C 6 22, 18 30, 34 34" stroke="#38BDF8" strokeWidth="1.6" fill="none" strokeDasharray="3 4" initial={{ pathLength: 0 }} animate={on ? { pathLength: 1 } : {}} transition={{ delay: 0.8, duration: 0.6 }} /></svg>
      <motion.p initial={{ opacity: 0, y: 6 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.3 }} className="ml-16 mt-7 rounded-xl rounded-tl-md bg-primary-muted px-3 py-2 text-[13px] text-[#2E3656]">
        <Mono className="mr-1.5 text-[10px] text-primary">AI</Mono>Line 14 builds a map. The input was sorted. Why pay O(n) space?
      </motion.p>
    </div>
  );
}

export function CrChecks() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.25, once: true });
  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP}>
        <Head n="02" label="What it checks" title={<>Output is half the round. <span className={HL}>You&apos;re</span> the other half.</>}
          sub="Built like the platforms that will test you, plus the part they skip: an interviewer who asks why." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Tile className="md:col-span-3">
            <Mono className="text-[11px] text-primary">HIDDEN TESTS</Mono>
            <h3 className={cn("mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]", INK)}>Debug on public cases. Get judged on hidden ones.</h3>
            <HiddenGrid on={on} />
          </Tile>
          <Tile className="md:col-span-3">
            <Mono className="text-[11px] text-primary">TWO SCORES</Mono>
            <h3 className={cn("mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]", INK)}>Coding 82. Discussion 64. The gap is the surprise.</h3>
            <Rings on={on} />
          </Tile>
          <Tile className="md:col-span-2 bg-[linear-gradient(180deg,#FFFFFF,#F4F1FF)]">
            <Mono className="text-[11px] text-primary">REAL RUNS</Mono>
            <h3 className={cn("mt-1.5 text-[20px] font-extrabold tracking-[-0.03em]", INK)}>Compiled and run for real.</h3>
            <Compile on={on} />
          </Tile>
          <Tile className="md:col-span-4">
            <Mono className="text-[11px] text-primary">THE FOLLOW-UP</Mono>
            <h3 className={cn("mt-1.5 text-[20px] font-extrabold tracking-[-0.03em]", INK)}>It reads your code before it asks.</h3>
            <FollowUp on={on} />
          </Tile>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 03 · THE PROBLEM BANK ═══════════════ */

const CATS: { k: string; p: [string, "Easy" | "Medium" | "Hard", string][] }[] = [
  { k: "Arrays", p: [["Product of array except self", "Medium", "FAANG"], ["Rotate array", "Medium", "Product"], ["Move zeroes", "Easy", "Service"]] },
  { k: "Two pointers", p: [["Two Sum II", "Medium", "FAANG"], ["Container with most water", "Medium", "Product"], ["3Sum", "Medium", "FAANG"]] },
  { k: "Sliding window", p: [["Longest substring without repeats", "Medium", "FAANG"], ["Minimum window substring", "Hard", "FAANG"], ["Max sum subarray of size k", "Easy", "Service"]] },
  { k: "Hash maps", p: [["Group anagrams", "Medium", "Product"], ["Top k frequent", "Medium", "FAANG"], ["Valid anagram", "Easy", "Service"]] },
  { k: "Stacks", p: [["Valid parentheses", "Easy", "Service"], ["Daily temperatures", "Medium", "Product"], ["Largest rectangle in histogram", "Hard", "FAANG"]] },
  { k: "Linked lists", p: [["Reverse a linked list", "Easy", "Service"], ["Merge k sorted lists", "Hard", "FAANG"], ["Detect a cycle", "Easy", "Startup"]] },
  { k: "Trees", p: [["Level order traversal", "Medium", "Product"], ["Lowest common ancestor", "Medium", "FAANG"], ["Max depth", "Easy", "Service"]] },
  { k: "Graphs", p: [["Number of islands", "Medium", "FAANG"], ["Course schedule", "Medium", "Product"], ["Clone graph", "Medium", "Startup"]] },
  { k: "Heaps", p: [["Kth largest element", "Medium", "FAANG"], ["Merge k sorted arrays", "Medium", "Product"], ["Find median from stream", "Hard", "FAANG"]] },
  { k: "Binary search", p: [["Search rotated array", "Medium", "FAANG"], ["Find first and last position", "Medium", "Product"], ["Sqrt(x)", "Easy", "Service"]] },
  { k: "Dynamic programming", p: [["Coin change", "Medium", "FAANG"], ["Longest increasing subsequence", "Medium", "Product"], ["Edit distance", "Hard", "FAANG"]] },
  { k: "Greedy", p: [["Jump game", "Medium", "Product"], ["Gas station", "Medium", "Startup"], ["Assign cookies", "Easy", "Service"]] },
  { k: "Backtracking", p: [["Subsets", "Medium", "Product"], ["Permutations", "Medium", "FAANG"], ["N-Queens", "Hard", "FAANG"]] },
  { k: "Intervals", p: [["Merge intervals", "Medium", "FAANG"], ["Meeting rooms II", "Medium", "Product"], ["Insert interval", "Medium", "Startup"]] },
  { k: "Tries", p: [["Implement a trie", "Medium", "Product"], ["Word search II", "Hard", "FAANG"], ["Longest common prefix", "Easy", "Service"]] },
  { k: "Strings", p: [["Longest palindromic substring", "Medium", "FAANG"], ["String to integer", "Medium", "Product"], ["Reverse words", "Easy", "Service"]] },
  { k: "Matrix", p: [["Spiral order", "Medium", "Product"], ["Set matrix zeroes", "Medium", "Startup"], ["Rotate image", "Medium", "FAANG"]] },
  { k: "Bit manipulation", p: [["Single number", "Easy", "Service"], ["Counting bits", "Easy", "Product"], ["Sum of two integers", "Medium", "FAANG"]] },
];
const DIFF = { Easy: "bg-emerald-50 text-emerald-700", Medium: "bg-amber-50 text-amber-700", Hard: "bg-rose-50 text-rose-700" };

export function CrBank() {
  const [k, setK] = useState(1);
  const cat = CATS[k];
  return (
    <section className={LAVENDER}>
      <div className={WRAP}>
        <Head n="03" label="The problem bank" title={<>Start with the category <span className={HL}>you&apos;re dreading.</span></>}
          sub="A growing bank across 23 categories, each problem tagged by difficulty and by the kind of company that asks it." />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c, i) => (
              <button key={c.k} onClick={() => setK(i)} className={cn("rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition-all duration-200",
                i === k ? "border-[#2E3656] bg-[#2E3656] text-white shadow-[0_10px_24px_-14px_rgba(46,54,86,.9)]" : "border-border bg-white text-[#2E3656] hover:border-primary/40")}>{c.k}</button>
            ))}
            <span className="rounded-full border border-dashed border-primary/30 px-3.5 py-2 text-[13.5px] font-medium text-primary">+ more every release</span>
          </div>
          <div className="rounded-[24px] border border-white bg-white/90 p-5 shadow-[0_30px_60px_-36px_rgba(30,20,90,.5)] backdrop-blur">
            <div className="flex items-center justify-between"><Mono className="text-[11px] text-primary">{cat.k.toUpperCase()}</Mono><Mono className="text-[11px] text-muted-foreground">SAMPLE PROBLEMS</Mono></div>
            <AnimatePresence mode="wait">
              <motion.ul key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="mt-3 divide-y divide-border">
                {cat.p.map(([n, d, tier]) => (
                  <li key={n} className="flex items-center gap-3 py-3">
                    <Code2 className="size-4 shrink-0 text-primary" />
                    <span className={cn("min-w-0 flex-1 truncate text-[15px] font-semibold", INK)}>{n}</span>
                    <Mono className={cn("rounded px-1.5 py-0.5 text-[10px]", DIFF[d])}>{d.toUpperCase()}</Mono>
                    <Mono className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-[#4B5275] max-sm:hidden">{tier.toUpperCase()}</Mono>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
            <a href={MK26_ROUTES.startCoding} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">Start a {cat.k.toLowerCase()} round <ArrowRight className="size-4" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · SKILLS GRAPH (same live graph as the mock-interview page, coding skills) ═══════════════ */

const CODE_HUBS: SkHub[] = [
  { name: "Algorithms", a: -90, leaves: [
    { n: "Two pointers", s: "strong", v: 88, d: 6, why: "Fastest pattern: median 11 minutes, 6 of 6 accepted." },
    { n: "Sliding window", s: "slipping", v: 61, d: -4, why: "Off-by-one on the shrink step in 2 of your last 4 rounds." },
    { n: "Graphs", s: "slipping", v: 55, d: -3, why: "BFS is fine. Cycle detection failed hidden case #7 in Course schedule." },
    { n: "Dynamic programming", s: "slipping", v: 49, d: -5, why: "You find the recurrence, then stall on the table. 3 of 5 rounds timed out." },
  ]},
  { name: "Data structures", a: 0, leaves: [
    { n: "Arrays", s: "strong", v: 90, d: 2, why: "Indexing and in-place edits are second nature now." },
    { n: "Hash maps", s: "strong", v: 86, d: 4, why: "You reach for a map at the right moment, and say why." },
    { n: "Heaps", s: "hidden", v: 72, d: 3, why: "Top-k solved first try, twice. Most candidates avoid heaps." },
    { n: "Trees", s: "strong", v: 75, d: 5, why: "Traversals are clean. Lowest common ancestor took one hint." },
  ]},
  { name: "Code quality", a: 90, leaves: [
    { n: "Edge cases", s: "strong", v: 80, d: 3, why: "You list empty input and duplicates before you start coding." },
    { n: "Readable code", s: "strong", v: 78, d: 2, why: "Clear names. One early return would read cleaner." },
    { n: "Testing", s: "hidden", v: 70, d: 4, why: "You run an extra case of your own before submitting. Rare." },
    { n: "Debugging", s: "strong", v: 76, d: 1, why: "You read the failing case before you change any code." },
  ]},
  { name: "Explaining", a: 180, leaves: [
    { n: "Complexity", s: "strong", v: 82, d: 5, why: "You state time and space unprompted, and get them right." },
    { n: "Trade-offs", s: "slipping", v: 58, d: -2, why: "Name the alternative before you're asked for it." },
    { n: "Thinking aloud", s: "hidden", v: 71, d: 3, why: "You narrate while you type, so the interviewer can follow you." },
    { n: "Pacing", s: "slipping", v: 60, d: -3, why: "You go quiet for about 40 seconds after a hard follow-up." },
  ]},
];
export const CrSkills = () => <SkillsSection n="04" hubs={CODE_HUBS} initial="Dynamic programming" live="LIVE · UPDATED AFTER CODING ROUND 6" />;

/* ═══════════════ 04 · YOUR REPORT (dark panel) ═══════════════ */

/** The coding-round report as the dashboard renders it: header, test results, scored dimensions, annotated code. */
type Focus = "all" | "score" | "tests" | "d0" | "d1" | "d2" | "d3" | "code";
function ReportScreen({ rows, on, focus, onFocus, reg }: { rows: { k: string; v: number; n: string }[]; on: boolean; focus: Focus; onFocus: (f: Focus) => void; reg: (f: Focus) => (el: HTMLDivElement | null) => void }) {
  // the panel in focus gets a ring, the others step back
  const panel = (f: Focus) => cn("cursor-pointer rounded-xl border p-3 transition-all duration-500",
    focus === f ? "border-[#7367F0] bg-white/[.06] shadow-[0_0_0_3px_rgba(115,103,240,.25)]" : "border-white/10 bg-white/[.03]",
    focus !== "all" && focus !== f && "opacity-35");
  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] bg-[#071224] text-left text-white">
      <div className="flex flex-col items-center gap-3 border-r border-white/[.06] bg-[#0B1A30] py-4">
        {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={cn("size-5 rounded-md", i === 2 ? "bg-[#7367F0]" : "bg-white/10")} />)}
      </div>
      <div className="space-y-3 p-4">
        {/* header */}
        <div ref={reg("score")} onClick={() => onFocus("score")} className={cn(panel("score"), "flex items-center gap-3")}>
          <span className="relative grid size-12 shrink-0 place-items-center">
            <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90"><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="4" />
              <motion.circle cx="24" cy="24" r="20" fill="none" stroke="#7367F0" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 0.82 } : {}} transition={{ delay: 0.4, duration: 1.1, ease }} /></svg>
            <span className="text-[14px] font-bold"><CountUp to={82} run={on} /></span>
          </span>
          <div className="min-w-0"><p className="truncate text-[13px] font-semibold">Coding round report · Two Sum II</p><Mono className="text-[9.5px] text-white/50">PYTHON · 21 MIN · MEDIUM · FAANG</Mono></div>
          <Mono className="ml-auto shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9.5px] text-emerald-300">ACCEPTED</Mono>
        </div>
        {/* tests */}
        <div ref={reg("tests")} onClick={() => onFocus("tests")} className={panel("tests")}>
          <div className="flex items-center justify-between"><Mono className="text-[9.5px] text-white/50">TEST CASES</Mono><Mono className="text-[9.5px] text-emerald-300">PUBLIC 3/3 · HIDDEN 11/11</Mono></div>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.6 }} animate={on ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.5 + i * 0.05 }}
                className={cn("grid size-5 place-items-center rounded-[5px]", i < 3 ? "bg-sky-400/20 text-sky-300" : "bg-emerald-400/20 text-emerald-300")}><Check className="size-3" /></motion.span>
            ))}
          </div>
        </div>
        {/* dimensions */}
        <div className="grid grid-cols-2 gap-2">
          {rows.map((r, i) => (
            <div key={r.k} ref={reg(`d${i}` as Focus)} onClick={() => onFocus(`d${i}` as Focus)} className={panel(`d${i}` as Focus)}>
              <div className="flex items-center justify-between"><p className="text-[12px] font-semibold">{r.k}</p><Mono className="text-[12px]">{r.v}</Mono></div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#38BDF8]" initial={{ width: 0 }} animate={on ? { width: `${r.v}%` } : {}} transition={{ delay: 0.6 + i * 0.12, duration: 0.9, ease }} /></div>
              <p className="mt-1.5 text-[10.5px] leading-snug text-[#9FB3CF]">{r.n}</p>
            </div>
          ))}
        </div>
        {/* annotated code */}
        <div ref={reg("code")} onClick={() => onFocus("code")} className={cn(panel("code"), "!bg-[#050E1C] font-[family-name:var(--font-geist-mono)] text-[10.5px] leading-[1.7]")}>
          <Mono className="mb-1 block text-[9.5px] text-white/50">INTERVIEWER NOTES ON YOUR CODE</Mono>
          <p className="text-[#D6E2F5]"><span className="mr-3 text-white/25">2</span>left, right = 0, len(numbers) - 1 <span className="ml-2 rounded bg-emerald-400/15 px-1 text-emerald-300">✓ O(1) space, explained</span></p>
          <p className="text-[#D6E2F5]"><span className="mr-3 text-white/25">5</span>if total == target: <span className="ml-2 rounded bg-amber-400/15 px-1 text-amber-300">! name the unsorted fallback</span></p>
        </div>
      </div>
    </div>
  );
}

const TOUR: { f: Focus; k: string }[] = [
  { f: "all", k: "Overview" }, { f: "score", k: "Score" }, { f: "tests", k: "Hidden tests" },
  { f: "d0", k: "Correctness" }, { f: "d1", k: "Efficiency" }, { f: "d2", k: "Code quality" }, { f: "d3", k: "Explanation" },
  { f: "code", k: "Code notes" },
];
const STOP_MS = 2400;
export function CrReport() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35, once: true });
  const live = useInView(ref, { amount: 0.3 });
  const [k, setK] = useState(0);
  const [restart, setRestart] = useState(0);
  useEffect(() => {
    if (!live || reduce) return;
    const t = setTimeout(() => setK((x) => (x + 1) % TOUR.length), k === 0 ? 1800 : STOP_MS);
    return () => clearTimeout(t);
  }, [k, live, reduce, restart]);
  const go = (f: Focus) => { setK(TOUR.findIndex((t) => t.f === f)); setRestart((r) => r + 1); };
  const stop = TOUR[k];
  const { vp, root, reg, cam } = useFocusCamera<Focus>(stop.f, "all");
  const rows = [
    { k: "Correctness", v: 92, n: "11 of 11 hidden cases on the final submit." },
    { k: "Efficiency", v: 88, n: "O(n) time, O(1) space. You stated it unprompted." },
    { k: "Code quality", v: 81, n: "Clear names. One early return would read cleaner." },
    { k: "Explanation", v: 74, n: "Strong on the why. Slow to name the unsorted fallback." },
  ];
  return (
    <section className={DARK}>
      <CircuitTraces className="opacity-60" />
      <div ref={ref} className={WRAP}>
        <Head dark n="05" label="Your report" title={<>Where the round was won, <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">and where it wasn&apos;t.</span></>}
          sub="Tests, efficiency, code quality and how you explained it, with the next problems to practise." />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-[24px] border border-white/10 bg-white/[.04] p-6 backdrop-blur">
            <Mono className="text-[11px] text-sky-300">TWO SUM II · PYTHON · 21 MIN</Mono>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {[["CODING", 88, "#7367F0"], ["DISCUSSION", 76, "#38BDF8"]].map(([k, v, c]) => (
                <div key={k as string} className="flex flex-col items-center rounded-2xl bg-white/[.04] p-4">
                  <span className="relative grid size-[96px] place-items-center">
                    <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90"><circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="7" />
                      <motion.circle cx="48" cy="48" r="40" fill="none" stroke={c as string} strokeWidth="7" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: (v as number) / 100 } : {}} transition={{ delay: 0.3, duration: 1.2, ease }} /></svg>
                    <span className="text-[26px] font-extrabold text-white"><CountUp to={v as number} run={on} /></span>
                  </span>
                  <Mono className="mt-2 text-[10.5px] text-white/60">{k}</Mono>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 p-4">
              <Mono className="text-[10.5px] text-white/50">PRACTISE NEXT</Mono>
              {["3Sum · Medium", "Container with most water · Medium", "Two Sum (unsorted) · Easy"].map((x, i) => (
                <motion.p key={x} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + i * 0.12 }} className="mt-2 flex items-center gap-2 text-[14px] text-white"><ArrowRight className="size-3.5 text-sky-300" />{x}</motion.p>
              ))}
            </div>
          </div>
          {/* the coding report screen: a quick guided tour, panel by panel; click a panel or a stop to jump */}
          <div>
          <BrowserFrame url="app.interviewtrix.com/dashboard/coding-interviews/two-sum-ii/report">
            <div ref={vp} className="overflow-hidden bg-[#071224]">
              <motion.div ref={root} className="relative" style={{ originX: 0, originY: 0 }} animate={reduce ? { x: 0, y: 0, scale: 1 } : { x: cam.x, y: cam.y, scale: cam.s }} transition={{ type: "spring", stiffness: 90, damping: 20, mass: 0.9 }}>
                <ReportScreen rows={rows} on={on} focus={stop.f} onFocus={go} reg={reg} />
              </motion.div>
            </div>
          </BrowserFrame>
          <div className="mt-4 grid grid-cols-8 gap-1.5">
            {TOUR.map((x, i) => (
              <button key={x.k} onClick={() => go(x.f)} className="group text-left">
                <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                  {i < k && <span className="block h-full w-full rounded-full bg-white/50" />}
                  {i === k && <motion.span key={`${k}-${restart}`} className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#5CC2FF]"
                    initial={{ width: "0%" }} animate={{ width: live && !reduce ? "100%" : "4%" }} transition={{ duration: live && !reduce ? (k === 0 ? 1.8 : STOP_MS / 1000) : 0.2, ease: "linear" }} />}
                </span>
                <Mono className={cn("mt-2 block truncate text-[10.5px] uppercase transition-colors max-sm:hidden", i === k ? "text-white" : "text-white/45 group-hover:text-white/75")}>{x.k}</Mono>
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 05 · ONE MEMORY ═══════════════ */

export function CrAfter() {
  return (
    <Wiring n="06" label="One memory" title={<>Your coding round <span className={HL}>talks to the rest</span> of your prep.</>}
      sub="Solve it once and it counts everywhere: your next mock, your Skills Graph and your iX Score."
      ins={["Your resume", "Past coding rounds", "Your target company"]}
      outs={[
        { t: "Next coding round", d: "Opens on the pattern you were slowest to explain." },
        { t: "Voice mock interview", d: "Knows you code well but rush the trade-offs." },
        { t: "Skills Graph", d: "Two pointers strong, DP slipping, each with evidence." },
        { t: "iX Score", d: "Coding is one of four categories recruiters see." },
      ]}>
      {(on: boolean) => (
        <>
          <Mono className="text-[10.5px] text-sky-300">CODING ROUND · REPORT</Mono>
          <div className="mt-4 flex items-center gap-4">
            <span className="relative grid size-[68px] place-items-center">
              <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90"><circle cx="34" cy="34" r="29" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                <motion.circle cx="34" cy="34" r="29" fill="none" stroke="url(#kit-wire-g)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 0.88 } : {}} transition={{ delay: 0.7, duration: 1.2, ease }} /></svg>
              <span className="text-[22px] font-bold"><CountUp to={88} run={on} /></span>
            </span>
            <div><p className="font-bold">Two Sum II</p><p className="text-[13px] text-[#9FB3CF]">Python · 11/11 hidden · 21 min</p></div>
          </div>
          <div className="mt-5 space-y-2 text-[13.5px]">
            {[["✓", "O(1) space, and you said why", "text-emerald-300"], ["✓", "Clean two-pointer walk", "text-emerald-300"], ["!", "Name the fallback before you're asked", "text-amber-300"]].map(([i, t, c], k) => (
              <motion.p key={t} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + k * 0.15 }} className={c}><span className="mr-1.5">{i}</span>{t}</motion.p>
            ))}
          </div>
        </>
      )}
    </Wiring>
  );
}

export const CrStickyCta = () => <StickyCta product="AI Coding Round" cta="Start free round" href={MK26_ROUTES.startCoding} />;
