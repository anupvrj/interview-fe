"use client";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Stripe-style silk ribbons, re-coloured to the brand (violet → blue, with a coral and amber edge).
 * Layered gradient strokes with heavy blur, each slowly breathing. Pure SVG, no images.
 */
export function SilkRibbons({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ribbons = [
    { d: "M-100 520 C 200 380, 420 640, 760 420 S 1200 160, 1600 260", w: 150, g: "rg1", dur: 14 },
    { d: "M-100 600 C 260 470, 520 720, 860 500 S 1260 260, 1600 360", w: 110, g: "rg2", dur: 17 },
    { d: "M-100 450 C 240 300, 500 560, 820 360 S 1240 120, 1600 180", w: 70, g: "rg3", dur: 12 },
  ];
  return (
    <svg className={cn("pointer-events-none", className)} viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="rg1" x1="0" x2="1"><stop offset="0" stopColor="#FF8A65" /><stop offset=".35" stopColor="#FF4E8B" /><stop offset=".7" stopColor="#7367F0" /><stop offset="1" stopColor="#1FB6FF" /></linearGradient>
        <linearGradient id="rg2" x1="0" x2="1"><stop offset="0" stopColor="#FFC44D" /><stop offset=".4" stopColor="#FF7A59" /><stop offset=".8" stopColor="#9B8CFF" /><stop offset="1" stopColor="#38B8FF" /></linearGradient>
        <linearGradient id="rg3" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" /><stop offset=".5" stopColor="#3674FF" /><stop offset="1" stopColor="#1FB6FF" /></linearGradient>
        <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
      </defs>
      {ribbons.map((r, i) => (
        <motion.path key={i} d={r.d} fill="none" stroke={`url(#${r.g})`} strokeWidth={r.w} strokeLinecap="round" filter="url(#soft)" opacity={0.85 - i * 0.12}
          animate={reduce ? undefined : { y: [0, -24 + i * 10, 0], x: [0, 30 - i * 12, 0] }}
          transition={{ duration: r.dur, repeat: Infinity, ease: "easeInOut" }} />
      ))}
      {/* thin highlight strands give the silk its sheen */}
      {[0, 1, 2, 3].map((i) => (
        <motion.path key={`h${i}`} d={`M-100 ${500 + i * 22} C 220 ${370 + i * 22}, 460 ${630 + i * 20}, 790 ${420 + i * 20} S 1220 ${170 + i * 20}, 1600 ${260 + i * 20}`}
          fill="none" stroke="#fff" strokeOpacity={0.35 - i * 0.07} strokeWidth="1.2"
          animate={reduce ? undefined : { y: [0, -16, 0] }} transition={{ duration: 14 + i, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </svg>
  );
}

/** Clerk-style circuit traces for dark bands: right-angled paths, vias and a few lit packets. */
export function CircuitTraces({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const traces = [
    "M0 120 H180 V60 H420", "M0 260 H120 V340 H360 V300 H520", "M1440 90 H1260 V170 H1040", "M1440 300 H1300 V230 H1120 V280 H980",
    "M200 900 V760 H340 V700", "M1240 900 V780 H1100 V720", "M560 0 V80 H640", "M880 0 V60 H980 V120",
  ];
  return (
    <svg className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {traces.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#38B8FF" strokeOpacity=".12" strokeWidth="1.2" />
          {!reduce && (
            <motion.path d={d} fill="none" stroke="#9B8CFF" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="10 400"
              animate={{ strokeDashoffset: [410, 0] }} transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "linear", delay: i * 0.6 }} />
          )}
        </g>
      ))}
      {[[180, 60], [420, 60], [120, 340], [520, 300], [1260, 170], [1040, 170], [1120, 280], [340, 700], [1100, 720], [640, 80], [980, 120]].map(([x, y], i) => (
        <rect key={i} x={x - 4} y={y - 4} width="8" height="8" rx="1.5" fill="#0A1628" stroke="#38B8FF" strokeOpacity=".35" />
      ))}
      {[[60, 520], [1360, 560], [720, 840]].map(([x, y], i) => (
        <rect key={`s${i}`} x={x} y={y} width="26" height="26" rx="4" fill="none" stroke="#38B8FF" strokeOpacity=".12" />
      ))}
    </svg>
  );
}

/** Raycast-style diagonal light bars, in brand blue/violet. */
export function LightBars({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const bars = [
    { x: "8%", w: 120, c: "#7367F0", d: 0 }, { x: "22%", w: 80, c: "#1F8FFF", d: 0.6 }, { x: "36%", w: 160, c: "#9B8CFF", d: 1.2 },
    { x: "52%", w: 100, c: "#1FB6FF", d: 0.3 }, { x: "66%", w: 140, c: "#7367F0", d: 0.9 }, { x: "82%", w: 90, c: "#3674FF", d: 1.5 },
  ];
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {bars.map((b, i) => (
        <motion.div key={i} className="absolute -top-1/4 h-[160%] origin-center rotate-[32deg] rounded-full blur-2xl"
          style={{ left: b.x, width: b.w, background: `linear-gradient(to bottom, transparent, ${b.c}, transparent)` }}
          animate={reduce ? { opacity: 0.45 } : { opacity: [0.25, 0.7, 0.25] }} transition={{ duration: 5, repeat: Infinity, delay: b.d, ease: "easeInOut" }} />
      ))}
    </div>
  );
}


/** Oversized kinetic word strip: alternating solid and outline words drifting in opposite rows. */
export function GiantWords() {
  const reduce = useReducedMotion();
  const row1 = ["Practise", "out loud", "Get scored", "Fix it", "Again"];
  const row2 = ["Voice", "Coding", "System design", "Resume", "Get hired"];
  const Row = ({ words, dir }: { words: string[]; dir: 1 | -1 }) => (
    <motion.div className="flex w-max gap-10 whitespace-nowrap"
      animate={reduce ? undefined : { x: dir === 1 ? ["0%", "-50%"] : ["-50%", "0%"] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
      {[...words, ...words, ...words, ...words].map((w, i) => (
        <span key={i} className={cn("text-[64px] font-black leading-none tracking-[-0.05em] md:text-[132px]",
          i % 2 ? "bg-gradient-to-r from-primary/35 to-sky-400/35 bg-clip-text text-transparent" : "text-foreground")}>
          {w}<span className="ml-10 inline-block size-4 rotate-45 rounded-[3px] bg-primary align-middle md:size-7" />
        </span>
      ))}
    </motion.div>
  );
  return (
    <section aria-label="Practise, get scored, fix it, again" className="relative overflow-clip bg-background py-16 md:py-20">
      <div className="mask-x flex flex-col gap-4">
        <Row words={row1} dir={1} />
        <Row words={row2} dir={-1} />
      </div>
    </section>
  );
}

/**
 * The hero's blueprint box grid (48px), kept exactly as before, plus a very light "running" layer:
 * a few faint light pulses travel along the grid lines themselves.
 * Runners sit on multiples of 48px so they ride the actual lines. Masked like the grid.
 */
export function GridRunners({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const rows = [2, 5, 8, 11, 14];          // grid rows (×48px) with horizontal runners
  const cols = [4, 9, 15, 21, 26];         // grid columns (×48px) with vertical runners
  return (
    <div className={cn("mask-fade pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="bg-blueprint absolute inset-0" />
      {!reduce && rows.map((r, i) => (
        <span key={`h${r}`} className="absolute left-0 h-px w-40 bg-gradient-to-r from-transparent via-primary/45 to-transparent [animation:run-x_linear_infinite]"
          style={{ top: r * 48, animationDuration: `${11 + i * 2.3}s`, animationDelay: `${-i * 2.9}s` }} />
      ))}
      {!reduce && cols.map((c, i) => (
        <span key={`v${c}`} className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-sky-400/40 to-transparent [animation:run-y_linear_infinite]"
          style={{ left: c * 48, animationDuration: `${13 + i * 2.1}s`, animationDelay: `${-i * 3.7}s` }} />
      ))}
    </div>
  );
}
