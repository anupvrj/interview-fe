"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Chrome, Code2, FileText, MessageSquare, Mic, Network, Target, type LucideIcon } from "lucide-react";
import { Index, Mono } from "./primitives";
import { cn } from "@/lib/utils";

/**
 * "One brain. One memory." — the memory thread (Concept B, approved).
 * Sessions sit in a row; each one drops what it learned onto a single gradient thread underneath.
 * The thread ends at the iX brain under Session 4, and memory flows back up into it.
 * Desktop: horizontal row + thread aligned to the same 5-column grid. Mobile: vertical timeline.
 */
type Step = { icon: LucideIcon; t: string; k: string; chip: string };
const STEPS: Step[] = [
  { icon: FileText, t: "Resume + JD", k: "Before session 1", chip: "Kafka missing" },
  { icon: Mic, t: "Session 1", k: "Voice mock", chip: "Pace under pressure" },
  { icon: Code2, t: "Session 2", k: "Coding round", chip: "Defend complexity" },
  { icon: Network, t: "Session 3", k: "System design", chip: "Cache eviction" },
];
const OPENS = ["Cache eviction, first", "Answers timed under 2 min", "Asks you to defend O(n log k)"];
const ALSO = [{ icon: Chrome, t: "Chrome · 14 job posts" }, { icon: MessageSquare, t: "ChatGPT · resume variant" }];
const LAST = STEPS.length; // index of Session 4

export function MemoryStory() {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { amount: 0.4 });
  const [n, setN] = useState(reduce ? LAST : -1); // -1 nothing yet, 0..3 steps written, 4 = session 4 reads
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (reduce || held || !inView) return;
    const t = setTimeout(() => setN((x) => (x >= LAST ? -1 : x + 1)), n >= LAST ? 4200 : n < 0 ? 500 : 1300);
    return () => clearTimeout(t);
  }, [n, inView, reduce, held]);

  const jump = (i: number) => { setN(i); setHeld(true); };
  const fill = n < 0 ? 0 : Math.min(n + 1, LAST + 1) / (LAST + 1);
  const memories = Math.max(0, Math.min(n + 1, LAST)) + (n >= LAST ? ALSO.length : 0);

  return (
    <section aria-labelledby="memory-h" className="relative overflow-clip bg-background py-24 md:py-32">
      <div className="bg-dots mask-fade pointer-events-none absolute inset-0 opacity-50" />
      <div ref={box} className="relative mx-auto max-w-[1240px] px-5">
        <div>
          <Index n="04" label="It remembers" />
          <h2 id="memory-h" className="text-[46px] font-black leading-[0.95] tracking-[-0.05em] md:text-[84px] lg:whitespace-nowrap">One brain. One memory.</h2>
          <p className="mt-5 max-w-[56ch] text-[17px] text-muted-foreground md:text-[19px]">Everything you practise, upload or open feeds one memory. Every session after that starts from it.</p>
        </div>

        {/* ───── desktop ───── */}
        <div className="mt-16 hidden md:block" onMouseLeave={() => setHeld(false)}>
          <div className="grid grid-cols-5 gap-4">
            {STEPS.map((s, i) => {
              const on = i <= n, now = i === n;
              return (
                <button key={s.t} onClick={() => jump(i)} aria-pressed={now}
                  className={cn("rounded-[22px] border bg-white p-5 text-left transition-all duration-500",
                    on ? "border-border shadow-[0_22px_44px_-30px_rgba(47,43,61,.55)]" : "border-dashed border-border opacity-55",
                    now && "-translate-y-1 border-primary/40 shadow-[0_28px_50px_-28px_rgba(115,103,240,.6)]")}>
                  <s.icon className={cn("size-5 transition-colors", on ? "text-primary" : "text-muted-foreground")} />
                  <p className="mt-6 text-[19px] font-bold tracking-tight">{s.t}</p>
                  <Mono className="text-[11px] text-muted-foreground">{s.k.toUpperCase()}</Mono>
                </button>
              );
            })}
            <button onClick={() => jump(LAST)} aria-pressed={n === LAST}
              className={cn("relative overflow-hidden rounded-[22px] bg-foreground p-5 text-left text-white transition-all duration-500",
                n >= LAST ? "-translate-y-1 shadow-[0_34px_64px_-26px_rgba(115,103,240,.85)] ring-2 ring-primary" : "opacity-70")}>
              <Target className="size-5 text-[#9B8CFF]" />
              <p className="mt-6 text-[19px] font-bold tracking-tight">Session 4</p>
              <Mono className="text-[11px] text-white/60">STARTS FROM {memories} {memories === 1 ? "MEMORY" : "MEMORIES"}</Mono>
            </button>
          </div>

          {/* drop lines between cards and thread */}
          <div className="grid h-10 grid-cols-5 gap-4">
            {[...STEPS, null].map((s, i) => {
              const active = s ? i === n : n >= LAST;
              const done = s ? i < n : false;
              return (
                <div key={i} className="relative flex justify-center">
                  <span className={cn("h-full w-px border-l border-dashed transition-colors", active || done ? "border-primary/50" : "border-border")} />
                  {active && !reduce && (
                    <motion.span key={`dot-${i}-${n}`} className="absolute left-1/2 size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(115,103,240,.18)]"
                      initial={{ top: s ? "0%" : "100%" }} animate={{ top: s ? "100%" : "0%" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], repeat: s ? 0 : Infinity, repeatDelay: 0.4 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* the thread */}
          <div className="relative rounded-full border border-white bg-white/90 p-2 shadow-[inset_0_1px_0_#fff,0_24px_48px_-32px_rgba(47,43,61,.55)]">
            <div className="relative h-12 overflow-hidden rounded-full bg-muted">
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#7367F0] via-[#3674FF] to-[#1FB6FF]"
                initial={false} animate={{ width: `${fill * 100}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
              {!reduce && n >= 0 && <div className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)] bg-[length:40%_100%] bg-no-repeat [animation:thread-shine_2.4s_linear_infinite]" style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0 round 999px)` }} />}
            </div>
            <div className="pointer-events-none absolute inset-2 grid grid-cols-5 items-center gap-4">
              {STEPS.map((s, i) => (
                <div key={s.chip} className="flex justify-center">
                  <AnimatePresence>
                    {i <= n && (
                      <motion.span initial={{ opacity: 0, y: -18, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.25 }}
                        className="whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-foreground shadow-[0_6px_14px_-8px_rgba(20,10,60,.6)]">{s.chip}</motion.span>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              <div className="flex justify-center">
                <span className={cn("grid size-[68px] place-items-center rounded-[22px] bg-white transition-shadow duration-500", n >= LAST ? "shadow-[0_0_0_6px_rgba(115,103,240,.18),0_20px_40px_-12px_rgba(115,103,240,.75)]" : "shadow-[0_14px_30px_-14px_rgba(115,103,240,.6)]")}>
                  <Image src="/marketing-2026/shots/interviewtrix-icon.png" alt="InterviewTrix memory" width={44} height={44} className="h-10 w-auto" />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-4">
            <div className="col-span-3 flex flex-wrap items-center gap-3 text-[13px]">
              <Mono className="text-[11px] text-muted-foreground">ALSO FEEDS IT</Mono>
              {ALSO.map((s) => <span key={s.t} className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 font-medium"><s.icon className="size-4 text-primary" />{s.t}</span>)}
            </div>
            <div className="col-span-2">
              {/* always mounted so the section height never changes; only fades */}
              <motion.div initial={false} animate={{ opacity: n >= LAST ? 1 : 0, y: n >= LAST ? 0 : 8 }} transition={{ duration: 0.4 }} aria-hidden={n < LAST}
                className="ml-auto max-w-[460px] rounded-2xl border border-primary/20 bg-white p-4">
                <Mono className="text-[10.5px] text-primary">SESSION 4 OPENS WITH</Mono>
                <div className="mt-2 flex flex-wrap gap-1.5">{OPENS.map((o) => <span key={o} className="rounded-lg bg-primary-muted px-2.5 py-1 text-[13px] font-medium text-foreground">{o}</span>)}</div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ───── mobile: vertical thread ───── */}
        <ol className="relative mt-10 space-y-3 pl-8 md:hidden">
          <span className="absolute bottom-6 left-[11px] top-4 w-1.5 overflow-hidden rounded-full bg-muted">
            <motion.span className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-[#7367F0] via-[#3674FF] to-[#1FB6FF]" initial={false} animate={{ height: `${fill * 100}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
          </span>
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative">
              <span className={cn("absolute -left-[26px] top-5 size-3.5 rounded-full border-2 border-white transition-colors", i <= n ? "bg-primary" : "bg-border")} />
              <div className={cn("rounded-2xl border bg-white p-4 transition-opacity", i <= n ? "border-border" : "border-dashed border-border opacity-60")}>
                <div className="flex items-center gap-2.5"><s.icon className="size-4 text-primary" /><p className="font-bold">{s.t}</p><Mono className="ml-auto text-[10.5px] text-muted-foreground">{s.k.toUpperCase()}</Mono></div>
                <motion.span initial={false} animate={{ opacity: i <= n ? 1 : 0, y: i <= n ? 0 : -6 }} className="mt-2.5 inline-block rounded-full bg-primary-muted px-3 py-1 text-[12.5px] font-semibold">{s.chip}</motion.span>
              </div>
            </li>
          ))}
          <li className="relative">
            <span className="absolute -left-[34px] top-3 grid size-8 place-items-center rounded-xl bg-white shadow-[0_8px_20px_-8px_rgba(115,103,240,.7)]"><Image src="/marketing-2026/shots/interviewtrix-icon.png" alt="" width={20} height={20} className="h-5 w-auto" /></span>
            <div className={cn("rounded-2xl bg-foreground p-4 text-white transition-all", n >= LAST ? "ring-2 ring-primary" : "opacity-70")}>
              <div className="flex items-center gap-2.5"><Target className="size-4 text-[#9B8CFF]" /><p className="font-bold">Session 4</p><Mono className="ml-auto text-[10.5px] text-white/60">{memories} MEMORIES</Mono></div>
              <div className={cn("mt-2.5 flex flex-wrap gap-1.5 transition-opacity duration-500", n >= LAST ? "opacity-100" : "opacity-0")}>{OPENS.map((o) => <span key={o} className="rounded-lg bg-white/10 px-2.5 py-1 text-[12.5px]">{o}</span>)}</div>
            </div>
          </li>
          <li className="flex flex-wrap gap-2 pt-1 text-[12.5px]">
            {ALSO.map((s) => <span key={s.t} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 font-medium"><s.icon className="size-3.5 text-primary" />{s.t}</span>)}
          </li>
        </ol>
      </div>
    </section>
  );
}
