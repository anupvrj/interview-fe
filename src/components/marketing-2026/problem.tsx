"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookMarked, CalendarDays, FileText, Layers, ListChecks, MessageCircle, Mic, NotebookPen, Sheet, Youtube } from "lucide-react";
import { Index, Mono } from "./primitives";
import { CircuitTraces } from "./graphics";
import { cn } from "@/lib/utils";

/**
 * The film's opening, told as four looping vignettes (GIF-like, but coded: crisp, ~0 KB, reduced-motion aware).
 * BG: navy + drifting vector contours + one HUD rail. Each tile is a "recording" with a REC label.
 */
export function Problem() {
  return (
    <section id="problem" className="ix-panel grain relative overflow-clip bg-[hsl(var(--ix-navy))] pb-20 pt-28 text-[#EAF2FF] md:pb-24 md:pt-36">
      <Contours />
      <CircuitTraces />
      <div className="relative mx-auto max-w-[1180px] px-5">
        <div className="grid items-end gap-6 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <Index n="01" label="The problem" dark />
            <h2 className="text-[38px] font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[64px]">
              Every interview you lost had the same problem.
            </h2>
          </div>
          <p className="max-w-[40ch] text-[18px] text-[#9FB3CF] md:pb-2 md:text-[20px]">
            It was the first time you'd ever said that answer out loud. And everybody in the room could tell.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-6 md:grid-rows-[auto_auto]">
          <Tile className="md:col-span-3" label="INBOX · 3 UNREAD"><Inbox /></Tile>
          <Tile className="md:col-span-3" label="REC · FIRST TIME OUT LOUD" rec><OutLoud /></Tile>
          <Tile className="md:col-span-2" label="THE BAR · SDE-2"><BarMoved /></Tile>
          <Tile className="md:col-span-4" label="YOUR PREP STACK"><Forget /></Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ label, rec, className, children }: { label: string; rec?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-b from-[#0E2140] to-[#0A1628] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]", className)}>
      <div className="mb-4 flex items-center justify-between">
        <Mono className="text-[11px] tracking-wider text-[#6E86A8]">{label}</Mono>
        {rec && <Mono className="flex items-center gap-1.5 text-[11px] text-[#FF6B6B]"><span className="size-2 animate-pulse rounded-full bg-[#FF6B6B]" />REC</Mono>}
      </div>
      {children}
    </div>
  );
}

/* A. rejection emails keep arriving, one on top of another */
const mails = [
  { from: "Razorpay Talent", round: "Onsite · System design", time: "09:14" },
  { from: "Flipkart Careers", round: "Round 2 · Coding", time: "Yesterday" },
  { from: "Swiggy Hiring", round: "Final · Hiring manager", time: "Mon" },
  { from: "PhonePe Recruiting", round: "Round 1 · Screening", time: "12 Oct" },
];
function Inbox() {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? 3 : 0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setN((x) => (x + 1) % (mails.length + 2)), 1500);
    return () => clearInterval(t);
  }, [reduce]);
  const shown = mails.slice(0, Math.min(n, mails.length));
  return (
    <div className="relative h-[230px]">
      <AnimatePresence>
        {shown.map((m, i) => (
          <motion.div key={m.from}
            initial={{ y: 90, opacity: 0, scale: 1.02 }}
            animate={{ y: 40 - (shown.length - 1 - i) * 14, opacity: 1 - (shown.length - 1 - i) * 0.22, scale: 1 - (shown.length - 1 - i) * 0.05 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="absolute inset-x-0 top-0 rounded-2xl border border-white/10 bg-[#13294A] p-4"
            style={{ zIndex: i }}>
            <div className="flex items-center justify-between text-[13px]"><b className="font-semibold">{m.from}</b><Mono className="text-[11px] text-[#6E86A8]">{m.time}</Mono></div>
            <p className="mt-1 truncate text-[13.5px] text-[#CFE0F7]">Update on your application · <span className="text-[#9FB3CF]">Unfortunately, we've decided to move forward with…</span></p>
            <Mono className="mt-2 inline-block rounded-md bg-[#FF4E8B]/12 px-2 py-0.5 text-[10.5px] text-[#FF8FB2]">{m.round} · not selected</Mono>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* B. a live waveform + transcript where filler words pop out as chips */
const said = ["So", "um,", "basically", "I'd", "put", "a", "cache", "like", "in", "front", "of", "the,", "uh,", "feed…"];
const fillers = new Set(["um,", "basically", "like", "uh,"]);
function OutLoud() {
  const reduce = useReducedMotion();
  const [k, setK] = useState(reduce ? said.length : 0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setK((x) => (x >= said.length + 6 ? 0 : x + 1)), 320);
    return () => clearInterval(t);
  }, [reduce]);
  const count = said.slice(0, k).filter((w) => fillers.has(w)).length;
  return (
    <div className="h-[230px]">
      <div className="flex h-16 items-center gap-[3px]">
        {Array.from({ length: 56 }).map((_, i) => (
          <motion.span key={i} className="w-[3px] flex-none rounded-full bg-sky-400/80"
            animate={reduce ? { height: 14 } : { height: [6, 8 + ((i * 37) % 40), 6] }}
            transition={{ duration: 0.9 + ((i * 13) % 7) / 10, repeat: Infinity, ease: "easeInOut", delay: (i % 9) * 0.05 }} />
        ))}
      </div>
      <p className="mt-4 min-h-[56px] text-[18px] leading-relaxed">
        {said.slice(0, k).map((w, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={cn("mr-1.5 inline-block", fillers.has(w) && "rounded-md bg-[#FFC44D]/15 px-1 text-[#FFC44D] line-through decoration-[#FFC44D]/60")}>{w}</motion.span>
        ))}
      </p>
      <div className="mt-3 flex gap-2">
        <Mono className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px]">Filler words <b className="ml-1 text-[#FFC44D]">{count}</b></Mono>
        <Mono className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px]">Pace <b className="ml-1 text-[#FF8FB2]">171 wpm</b></Mono>
        <Mono className="hidden rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] sm:block">Pause <b className="ml-1">4.2s</b></Mono>
      </div>
    </div>
  );
}

/* C. the hiring bar climbs past a candidate who stayed flat */
function BarMoved() {
  return (
    <div className="h-[230px]">
      <svg viewBox="0 0 300 170" className="h-[170px] w-full overflow-visible">
        {[30, 70, 110, 150].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(159,179,207,.12)" />)}
        <motion.path d="M10 120 C 80 118, 140 100, 200 70 S 280 30, 290 26" fill="none" stroke="#38B8FF" strokeWidth="2.5"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: false, amount: 0.6 }} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }} />
        <path d="M10 104 L 290 100" fill="none" stroke="#9FB3CF" strokeWidth="2" strokeDasharray="5 5" />
        <text x="284" y="16" textAnchor="end" fill="#38B8FF" fontSize="11" fontFamily="var(--font-geist-mono)">hiring bar</text>
        <text x="284" y="120" textAnchor="end" fill="#9FB3CF" fontSize="11" fontFamily="var(--font-geist-mono)">you, practising alone</text>
        {["2022", "2024", "2026"].map((t, i) => <text key={t} x={10 + i * 140} y="166" fill="#6E86A8" fontSize="10" fontFamily="var(--font-geist-mono)">{t}</text>)}
      </svg>
      <p className="text-[14.5px] text-[#CFE0F7]">More people in every queue. The bar kept moving.</p>
    </div>
  );
}

/* D. ten tools light up, then go cold: they forget you */
const tools = [
  { i: NotebookPen, l: "Notes" }, { i: FileText, l: "Docs" }, { i: Layers, l: "Flashcards" }, { i: ListChecks, l: "LeetCode" },
  { i: Youtube, l: "YouTube" }, { i: Sheet, l: "Sheets" }, { i: MessageCircle, l: "AI chat" }, { i: Mic, l: "Mock app" },
  { i: BookMarked, l: "Bookmarks" }, { i: CalendarDays, l: "Planner" },
];
function Forget() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-[230px] flex-col justify-between">
      <div className="grid grid-cols-5 gap-2.5">
        {tools.map(({ i: I, l }, k) => (
          <motion.div key={l} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[.04] py-3"
            animate={reduce ? { opacity: 0.4 } : { opacity: [0.25, 1, 1, 0.25], filter: ["blur(1.5px) grayscale(1)", "blur(0px) grayscale(0)", "blur(0px) grayscale(0)", "blur(1.5px) grayscale(1)"] }}
            transition={{ duration: 4.5, repeat: Infinity, delay: k * 0.22, times: [0, 0.15, 0.55, 1] }}>
            <I className="size-5 text-sky-300" />
            <Mono className="text-[10.5px] text-[#9FB3CF]">{l}</Mono>
          </motion.div>
        ))}
      </div>
      <p className="text-[22px] font-bold tracking-tight md:text-[26px]">Ten tools. Every one of them <span className="text-[#FFC44D]">forgets</span> you when you close the tab.</p>
    </div>
  );
}

/* Background vectors: slow drifting topographic contours, like the film's dark plates */
function Contours() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[.35]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="pg" cx="80%" cy="10%" r="60%"><stop offset="0" stopColor="#1F8FFF" stopOpacity=".35" /><stop offset="1" stopColor="#1F8FFF" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#pg)" />
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.path key={i} fill="none" stroke="#38B8FF" strokeOpacity={0.14 - i * 0.012} strokeWidth="1"
          d={`M-50 ${180 + i * 70} C 300 ${120 + i * 60}, 600 ${320 + i * 55}, 900 ${220 + i * 62} S 1300 ${140 + i * 70}, 1500 ${260 + i * 64}`}
          animate={{ x: [0, 30, 0] }} transition={{ duration: 18 + i * 2, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </svg>
  );
}
