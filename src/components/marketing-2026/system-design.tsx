"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Circle, Diamond, Eye, MousePointer2, Network, PenLine, Play, Square, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame, LoopVideo, Mono, SoundToggle } from "./primitives";
import { mk26Asset } from "./assets";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { CircuitTraces, GridRunners } from "./graphics";
import { CountUp, DARK, Dots, ease, Head, HL, INK, LAVENDER, LIGHT, StickyCta, useFocusCamera, Wiring, WRAP } from "./landing-kit";
import { SkillsSection, type SkHub } from "./skills-section";
import { Voice } from "./mock-interview";
import { cn } from "@/lib/utils";

/**
 * AI System Design landing page, same kit as the other product pages:
 * hero → 01 the round, start to finish (whiteboard film) → 02 what it does → 03 the systems → 04 skills graph → 05 the rubric report → 06 one memory.
 * The board is a coded recreation of the Excalidraw canvas in /dashboard/system-design/[id]; strokes are hand-jittered like Excalidraw's.
 */

/* ═══════════════ hand-drawn primitives (deterministic, so server and client agree) ═══════════════ */

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const r1 = (n: number) => Math.round(n * 10) / 10;
/** One wobbly line, Excalidraw-style: a slight bow and a small overshoot at both ends. */
function wobble(x1: number, y1: number, x2: number, y2: number, rand: () => number, j = 2.4) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ox = (dx / len) * 2.5, oy = (dy / len) * 2.5;
  const mx = (x1 + x2) / 2 + (rand() - 0.5) * j * 2, my = (y1 + y2) / 2 + (rand() - 0.5) * j * 2;
  return `M${r1(x1 - ox + (rand() - 0.5) * j)} ${r1(y1 - oy + (rand() - 0.5) * j)} Q ${r1(mx)} ${r1(my)} ${r1(x2 + ox + (rand() - 0.5) * j)} ${r1(y2 + oy + (rand() - 0.5) * j)}`;
}
function roughRect(x: number, y: number, w: number, h: number, seed: number) {
  const r = rng(seed);
  const pass = () => [wobble(x, y, x + w, y, r), wobble(x + w, y, x + w, y + h, r), wobble(x + w, y + h, x, y + h, r), wobble(x, y + h, x, y, r)].join(" ");
  return `${pass()} ${pass()}`; // two passes, like a marker going round twice
}
function roughArrow(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const r = rng(seed), a = Math.atan2(y2 - y1, x2 - x1), h = 10;
  const l = wobble(x1, y1, x2, y2, r, 1.2);
  const h1 = wobble(x2, y2, x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45), r, 0.6);
  const h2 = wobble(x2, y2, x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45), r, 0.6);
  return `${l} ${h1} ${h2}`;
}
function roughCircle(cx: number, cy: number, rx: number, ry: number, seed: number) {
  const r = rng(seed); const pts: string[] = [];
  for (let i = 0; i <= 26; i++) { const t = (i / 24) * Math.PI * 2; const k = 1 + (r() - 0.5) * 0.08; pts.push(`${r1(cx + Math.cos(t) * rx * k)} ${r1(cy + Math.sin(t) * ry * k)}`); }
  return `M${pts[0]} ` + pts.slice(1).map((p) => `L${p}`).join(" ");
}

/* ═══════════════ the board ═══════════════ */

type Box = { id: string; x: number; y: number; w: number; h: number; t: string; sub?: string; fill?: string };
const BOXES: Box[] = [
  { id: "client", x: 262, y: 196, w: 112, h: 58, t: "Client", sub: "web · app" },
  { id: "lb", x: 416, y: 196, w: 132, h: 58, t: "Load balancer" },
  { id: "api", x: 590, y: 196, w: 132, h: 58, t: "API service", sub: "stateless" },
  { id: "ids", x: 764, y: 196, w: 120, h: 58, t: "ID ranges", sub: "per server" },
  { id: "cache", x: 590, y: 330, w: 132, h: 58, t: "Redis cache", sub: "LRU + TTL", fill: "#E8F3FF" },
  { id: "db", x: 764, y: 330, w: 120, h: 58, t: "KV store", sub: "sharded", fill: "#EEF9EF" },
];
const ARROWS: [string, string][] = [["client", "lb"], ["lb", "api"], ["api", "ids"], ["api", "cache"], ["cache", "db"]];
const box = Object.fromEntries(BOXES.map((b) => [b.id, b])) as Record<string, Box>;
function link(a: Box, b: Box) {
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
  if (Math.abs(ay - by) < 10) return [a.x + a.w + 4, ay, b.x - 6, by] as const;
  if (Math.abs(ax - bx) < 10) return [ax, a.y + a.h + 4, bx, b.y - 6] as const;
  return [a.x + a.w + 4, ay, b.x - 6, by] as const;
}
const HAND = "font-[family-name:var(--font-hand)]";

function Stroke({ d, show, delay = 0, color = "#1E1E2E", w = 1.6, dur = 0.7 }: { d: string; show: boolean; delay?: number; color?: string; w?: number; dur?: number }) {
  return <motion.path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
    initial={{ pathLength: 0, opacity: 0 }} animate={show ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
    // drawing takes its time; wiping is instant, so a new round never starts on a half-erased board
    transition={show ? { pathLength: { delay, duration: dur, ease: "easeInOut" }, opacity: { delay, duration: 0.1 } } : { duration: 0 }} />;
}

/** The whiteboard. `drawn` = how many sketch elements are on the board (0 → all), plus the later layers. */
function Board({ notes, drawn, read, hot, trade }: { notes: number; drawn: number; read: boolean; hot: boolean; trade: boolean }) {
  const NOTE = ["100M new links / day", "10B reads / day (100:1)", "p99 under 50 ms", "links never expire"];
  return (
    <svg viewBox="0 0 900 470" className="block h-full w-full" role="img" aria-label="Whiteboard: a URL shortener sketched as client, load balancer, API service, ID ranges, Redis cache and a sharded key-value store">
      {/* requirements sticky */}
      <g>
        <motion.rect x="22" y="22" width="214" height="150" rx="4" fill="#FFF1A8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: notes > 0 ? 1 : 0, scale: notes > 0 ? 1 : 0.9 }} style={{ transformOrigin: "120px 90px" }}
          className="drop-shadow-[0_6px_10px_rgba(120,90,0,.18)]" />
        {notes > 0 && <text x="36" y="48" className={cn(HAND, "fill-[#6B5200] text-[19px] font-semibold")}>Requirements</text>}
        {NOTE.slice(0, notes).map((n, i) => (
          <motion.text key={n} x="36" y={78 + i * 24} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className={cn(HAND, "fill-[#3B2F00] text-[17px]")}>• {n}</motion.text>
        ))}
      </g>

      {/* the high-level design, drawn box by box */}
      {BOXES.map((b, i) => {
        const on = drawn > i;
        return (
          <g key={b.id}>
            <motion.rect x={b.x} y={b.y} width={b.w} height={b.h} rx="6" fill={b.fill ?? "#FFFFFF"} initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: on ? 0.35 : 0, duration: 0.3 }} />
            <Stroke d={roughRect(b.x, b.y, b.w, b.h, 11 + i * 7)} show={on} />
            {on && <motion.text x={b.x + b.w / 2} y={b.y + (b.sub ? 26 : 34)} textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className={cn(HAND, "fill-[#1E1E2E] text-[19px] font-semibold")}>{b.t}</motion.text>}
            {on && b.sub && <motion.text x={b.x + b.w / 2} y={b.y + 45} textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className={cn(HAND, "fill-[#5B6178] text-[14.5px]")}>{b.sub}</motion.text>}
          </g>
        );
      })}
      {ARROWS.map(([a, b], i) => {
        const on = drawn > Math.max(BOXES.indexOf(box[a]), BOXES.indexOf(box[b]));
        const [x1, y1, x2, y2] = link(box[a], box[b]);
        return <Stroke key={a + b} d={roughArrow(x1, y1, x2, y2, 90 + i * 13)} show={on} delay={0.3} w={1.5} dur={0.45} />;
      })}

      {/* the interviewer reads the board: a scan line, then what it recognised */}
      <AnimatePresence>
        {read && (
          <motion.g key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.rect y="180" width="4" height="230" rx="2" fill="#7367F0" opacity=".55" initial={{ x: 250 }} animate={{ x: [250, 890, 890] }} transition={{ duration: 1.6, times: [0, 0.9, 1], ease: "easeInOut" }} />
            {[["cache", "cache · LRU"], ["db", "store · sharded"], ["lb", "load balancer"]].map(([id, t], i) => (
              <motion.g key={id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.35 }}>
                <rect x={box[id].x + box[id].w / 2 - 62} y={box[id].y - 30} width="124" height="22" rx="11" fill="#7367F0" />
                <text x={box[id].x + box[id].w / 2} y={box[id].y - 15} textAnchor="middle" className="fill-white font-[family-name:var(--font-geist-mono)] text-[11px]">✓ {t}</text>
              </motion.g>
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      {/* the 10x follow-up: an edge cache appears, the hot shard gets circled */}
      <g>
        <motion.rect x="262" y="330" width="112" height="58" rx="6" fill="#FFF0F0" initial={{ opacity: 0 }} animate={{ opacity: hot ? 1 : 0 }} transition={{ delay: hot ? 0.3 : 0 }} />
        <Stroke d={roughRect(262, 330, 112, 58, 301)} show={hot} />
        {hot && <motion.text x="318" y="356" textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={cn(HAND, "fill-[#1E1E2E] text-[19px] font-semibold")}>Edge CDN</motion.text>}
        {hot && <motion.text x="318" y="375" textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className={cn(HAND, "fill-[#5B6178] text-[14.5px]")}>hot links</motion.text>}
        <Stroke d={roughArrow(318, 258, 318, 326, 333)} show={hot} delay={0.7} w={1.5} dur={0.4} />
        <Stroke d={roughCircle(824, 359, 82, 44, 77)} show={hot} delay={1.1} color="#E5484D" w={2.4} dur={0.8} />
        {hot && <motion.text x="752" y="432" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} className={cn(HAND, "fill-[#E5484D] text-[18px] font-semibold")}>hot key! replicate it</motion.text>}
      </g>

      {/* the trade-off, written next to the ID box */}
      {trade && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Stroke d={wobble(600, 182, 850, 182, rng(512), 1)} show color="#1F6FEB" w={2} dur={0.4} />
          <motion.text x="600" y="170" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={cn(HAND, "fill-[#1F6FEB] text-[17px] font-semibold")}>counter &gt; hash: shorter codes</motion.text>
          <motion.text x="600" y="148" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className={cn(HAND, "fill-[#1F6FEB] text-[15px]")}>pre-allocate ranges, no lock</motion.text>
        </motion.g>
      )}
    </svg>
  );
}

const TOOLS = [MousePointer2, Square, Diamond, Circle, ArrowRight, PenLine, Type];
type Cam = "type" | "think" | "talk";
type Caption = { who: "AI" | "YOU"; text: string; talking: boolean };
const AGENDA = ["Requirements", "High-level design", "Deep dive", "Trade-offs"];

/** The system-design room: Excalidraw canvas on the left, people and the agenda on the right. */
function Room({ notes, drawn, read, hot, trade, cam, caption, agenda, compact, clip, sound = false }: { notes: number; drawn: number; read: boolean; hot: boolean; trade: boolean; cam: Cam; caption?: Caption; agenda: number; compact?: boolean; clip?: string; sound?: boolean }) {
  return (
    <div className={cn("relative grid gap-px bg-[#E4E6EF] text-left max-sm:grid-cols-1", compact ? "grid-cols-1" : "grid-cols-[minmax(0,1fr)_200px]")}>
      {/* canvas */}
      <div className="relative bg-white">
        <div className="flex items-center gap-2 border-b border-[#ECEDF3] px-3 py-2">
          <span className="flex items-center gap-0.5 rounded-lg border border-[#ECEDF3] bg-white p-0.5 shadow-[0_2px_6px_rgba(0,0,0,.05)]">
            {TOOLS.map((I, i) => <span key={i} className={cn("grid size-6 place-items-center rounded-md", i === 1 ? "bg-[#E9E7FD] text-[#5A4BE0]" : "text-[#5B6178]")}><I className="size-3.5" /></span>)}
          </span>
          <span className="ml-auto truncate text-[12px] font-semibold text-[#2E3656]">URL shortener · Senior · 45 min</span>
          <Mono className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] text-emerald-700 max-sm:hidden">● LIVE</Mono>
        </div>
        <div className="relative aspect-[900/470] bg-[radial-gradient(#D9DBE6_1px,transparent_1.2px)] bg-[length:18px_18px]">
          <Board notes={notes} drawn={drawn} read={read} hot={hot} trade={trade} />
        </div>
        {/* voice caption: its own strip under the canvas, so it never covers the drawing */}
        {!compact && (
          <div className="flex h-[62px] items-center gap-3 border-t border-[#ECEDF3] bg-[#0B1A30] px-3 text-white">
            {caption?.who === "YOU" || (!caption && cam === "type") ? <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2E3656] text-[10px] font-bold">You</span>
              : <img src="/personas/persona-1.jpg" alt="" className="size-8 shrink-0 rounded-full border border-white/20 object-cover" />}
            <AnimatePresence mode="wait">
              <motion.p key={caption?.text ?? "idle"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="min-w-0 text-[12.5px] leading-snug md:text-[14px]">
                {caption ? <><Mono className={cn("mr-2 text-[9.5px]", caption.who === "AI" ? "text-sky-300" : "text-white/60")}>{caption.who === "AI" ? "INTERVIEWER" : "YOU"}</Mono>{caption.text}</>
                  : <Mono className="text-[11px] text-white/45">{cam === "type" ? "DRAWING ON THE BOARD…" : "LISTENING…"}</Mono>}
              </motion.p>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* people + agenda */}
      {!compact && (
        <div className="flex flex-col gap-px bg-[#E4E6EF] max-sm:grid max-sm:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden bg-black">
            {/* listening loop underneath; the current answer's lip-synced clip mounts over it from its first frame */}
            <div className="absolute inset-0"><LoopVideo name="sd-cand-listen" className="!aspect-auto h-full" priority /></div>
            {/* sketching: eyes down on the laptop, working the board */}
            {/* leaning in: closer to the webcam, head tipped toward the keyboard, a touch of tilt */}
            <motion.div className={cn("absolute inset-0 origin-[50%_30%] transition-opacity duration-500", cam === "type" ? "opacity-100" : "opacity-0")}
              animate={cam === "type" ? { scale: 1.14, y: "5%", rotate: -2.2 } : { scale: 1, y: "0%", rotate: 0 }} transition={{ duration: 0.9, ease }}>
              <LoopVideo name="sd-cand-draw" className="!aspect-auto h-full" priority />
            </motion.div>
            {clip && (
              <div key={clip} className={cn("absolute inset-0 transition-opacity duration-200", cam === "talk" ? "opacity-100" : "opacity-0")}>
                <LoopVideo name={clip.split("#")[0]} loop={false} sound={sound} className="!aspect-auto h-full" priority />
              </div>
            )}
            <Mono className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[8.5px] text-white/80">● CAMERA</Mono>
          </div>
          <div className="flex items-center gap-2 bg-[#0B1A30] p-2.5 text-white">
            <span className="relative size-7 shrink-0">
              {caption?.who === "AI" && caption.talking && <motion.span className="absolute -inset-[3px] rounded-full border-2 border-[#7367F0]" animate={{ scale: [1, 1.15, 1], opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 1.1, repeat: Infinity }} />}
              <img src="/personas/persona-1.jpg" alt="Daniel Reed, the AI interviewer" className="size-full rounded-full border border-white/20 object-cover" />
            </span>
            <div className="min-w-0 leading-tight"><p className="truncate text-[11px] font-semibold">Daniel Reed</p><Mono className="block truncate text-[8.5px] text-white/50">INTERVIEWER · VOICE</Mono></div>
            <span className="ml-auto flex h-5 items-center gap-[2px]">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.span key={i} className="w-[2.5px] rounded-full bg-gradient-to-t from-[#7367F0] to-[#5CC2FF]"
                  animate={caption?.who === "AI" && caption.talking ? { height: [3, 4 + ((i * 37) % 13), 3] } : { height: 3 }} transition={{ duration: 0.7 + (i % 4) * 0.1, repeat: Infinity, delay: (i % 5) * 0.05 }} />
              ))}
            </span>
          </div>
          <div className="flex-1 bg-white p-3 max-sm:col-span-2">
            <Mono className="text-[9.5px] text-muted-foreground">AGENDA</Mono>
            <ul className="mt-2 space-y-1.5">
              {AGENDA.map((a, i) => (
                <li key={a} className={cn("flex items-center gap-2 text-[12px]", i < agenda ? "text-[#2E3656]" : i === agenda ? "font-semibold text-[#5A4BE0]" : "text-[#9AA0B8]")}>
                  <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", i < agenda ? "border-emerald-500 bg-emerald-500 text-white" : i === agenda ? "border-[#7367F0]" : "border-[#D9DBE6]")}>
                    {i < agenda ? <Check className="size-2.5" /> : i === agenda ? <span className="size-1.5 animate-pulse rounded-full bg-[#7367F0]" /> : null}
                  </span>{a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ HERO ═══════════════ */

export function SdHero() {
  const reduce = useReducedMotion();
  const [drawn, setDrawn] = useState(reduce ? BOXES.length : 0);
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setDrawn((d) => (d >= BOXES.length + 3 ? 0 : d + 1)), drawn >= BOXES.length ? 1400 : 900);
    return () => clearTimeout(t);
  }, [drawn, reduce]);

  return (
    <section className="relative overflow-clip pb-24 pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_45%,rgba(115,103,240,.20),transparent_70%),radial-gradient(30%_40%_at_95%_15%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]" />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]"><Network className="size-5" /></span>
            <span className="leading-tight">
              <span className={cn("block text-[17px] font-extrabold tracking-[-0.02em]", INK)}>AI System Design</span>
              <Mono className="text-[11px] text-muted-foreground">LIVE WHITEBOARD · VOICE · RUBRIC-SCORED</Mono>
            </span>
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease }}
            className={cn("mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.055em] md:text-[60px] xl:text-[66px]", INK)}>
            Draw the system. Then get asked what{" "}
            <span className="relative inline-block whitespace-nowrap"><span className={HL}>breaks.</span>
              <svg aria-hidden viewBox="0 0 520 24" preserveAspectRatio="none" className="absolute -bottom-1 left-[2%] h-[0.18em] w-[92%] overflow-visible">
                <defs><linearGradient id="sd-ul" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" stopOpacity=".8" /><stop offset="1" stopColor="#1F8FFF" stopOpacity=".8" /></linearGradient></defs>
                <motion.path d="M4 16 C 120 4, 260 22, 516 8" fill="none" stroke="url(#sd-ul)" strokeWidth="7" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.9, ease }} />
              </svg>
            </span>
          </motion.h1>
          <p className="mt-7 max-w-[48ch] text-[17px] text-[#4B5275] md:text-[18.5px]">
            <span className="max-md:hidden">Sketch it on a real Excalidraw whiteboard. A voice interviewer reads your diagram, pushes it to ten times the traffic, and scores you the way a senior panel would.</span>
            <span className="md:hidden">Sketch it on a real whiteboard. The interviewer reads it and asks what breaks.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-xl px-6 text-[15.5px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
              <StartLink href={MK26_ROUTES.startSystemDesign}>Start my free system design round <ArrowRight /></StartLink>
            </Button>
            <a href="#mk26-sd-film" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#2E3656] hover:text-primary">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-white"><Play className="size-3.5 fill-current" /></span>Watch a round
            </a>
          </div>
          <Mono className="mt-4 block text-[12px] text-muted-foreground">14-day trial · No card · Real Excalidraw canvas</Mono>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-muted-foreground max-md:hidden">Design</span>
            {["URL shortener", "WhatsApp", "Uber", "YouTube", "Rate limiter"].map((l) => <span key={l} className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-[#2E3656]">{l}</span>)}
          </div>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }}>
          <BrowserFrame dark={false} url="app.interviewtrix.com/system-design/url-shortener" className="shadow-[0_60px_120px_-40px_rgba(40,30,140,.55)]">
            <Room compact notes={4} drawn={Math.min(drawn, BOXES.length)} read={false} hot={false} trade={false} cam="type" agenda={1} />
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════ TICKER ═══════════════ */

const FACTS = ["Real Excalidraw whiteboard", "It reads your diagram", "Voice interviewer, no avatar", "Follow-ups at 10× traffic", "4-dimension rubric", "URL shortener to Uber", "A growing set of real systems", "Next drills in every report"];
export function SdTicker() {
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

/* ═══════════════ 01 · THE ROUND, START TO FINISH (whiteboard film) ═══════════════ */

// every line is a real recording: the interviewer's plays as audio, the candidate's as a lip-synced clip; `ms` leaves a beat after `say`
type Line = { who: "AI" | "YOU"; text: string; ms: number; say: number; audio?: string; clip?: string };
const CH: { k: string; agenda: number; lines: Line[]; quiet?: number }[] = [
  { k: "Clarify", agenda: 0, lines: [
    { who: "AI", ms: 8400, say: 7820, audio: "sd-ai-1", text: "Alright, let's design a URL shortener. Before you draw anything — roughly how many new links a day, and how many reads?" },
    { who: "YOU", ms: 8500, say: 7970, clip: "sd-cand-1", text: "Hmm, let's say… a hundred million new links a day. And reads are way heavier — maybe a hundred times that." },
    { who: "AI", ms: 4200, say: 3650, audio: "sd-ai-2", text: "Okay, read heavy. And what about latency?" },
    { who: "YOU", ms: 5800, say: 5270, clip: "sd-cand-2", text: "p99 under fifty milliseconds. Oh — and links never expire." },
  ]},
  { k: "Sketch", agenda: 1, quiet: 5200, lines: [{ who: "AI", ms: 4200, say: 3650, audio: "sd-ai-3", text: "Good. Go ahead and sketch the high level for me — take your time." }] },
  { k: "It reads the board", agenda: 1, lines: [
    { who: "AI", ms: 5800, say: 5240, audio: "sd-ai-4", text: "Okay, I see you've put a cache in front of the store. What's your eviction policy there?" },
    { who: "YOU", ms: 5000, say: 4490, clip: "sd-cand-3", text: "LRU, mostly. With a TTL on the cold links." },
  ]},
  { k: "10× traffic", agenda: 2, lines: [
    { who: "AI", ms: 8300, say: 7740, audio: "sd-ai-5", text: "Mm-hm. Now — a link goes viral. Two million hits a minute, on one key. What breaks first?" },
    { who: "YOU", ms: 6700, say: 6200, clip: "sd-cand-4", text: "That key's shard, for sure. So I'd replicate the hot keys… and serve them from an edge cache." },
  ]},
  { k: "Trade-offs", agenda: 3, lines: [
    { who: "AI", ms: 4900, say: 4330, audio: "sd-ai-6", text: "Nice. Last one — counter or hash for the short code?" },
    { who: "YOU", ms: 6400, say: 5800, clip: "sd-cand-5", text: "Counter — shorter codes. I'd pre-allocate ID ranges per server, so there's no lock." },
  ]},
  { k: "Report", agenda: 4, lines: [], quiet: 4800 },
];
const chMs = (c: (typeof CH)[number]) => c.lines.reduce((n, l) => n + l.ms, 0) + (c.quiet ?? 0);

export function SdFilm() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35 });
  const [c, setC] = useState(0);
  const [t, setT] = useState(0);
  const [restart, setRestart] = useState(0);
  const [sound, setSound] = useState(false);
  const ch = CH[c], ms = chMs(ch);

  useEffect(() => {
    if (reduce) { setC(CH.length - 1); setT(1); return; }
    if (!on) return;
    let raf = 0; const t0 = performance.now();
    const tick = (n: number) => { const k = Math.min(1, (n - t0) / ms); setT(k); if (k < 1) raf = requestAnimationFrame(tick); else { setC((x) => (x + 1) % CH.length); setT(0); } };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [c, on, reduce, ms, restart]);

  // where we are inside the chapter: which line, and is anyone mid-sentence
  let elapsed = t * ms, li = -1, caption: Caption | undefined;
  for (let i = 0; i < ch.lines.length; i++) { if (elapsed <= ch.lines[i].ms) { li = i; caption = { ...ch.lines[i], talking: elapsed < ch.lines[i].say }; break; } elapsed -= ch.lines[i].ms; }
  const line = li >= 0 ? ch.lines[li] : undefined;
  // seconds into the current line, for audio switched on mid-sentence
  const pos = useRef(0);
  pos.current = li >= 0 ? elapsed / 1000 : 0;
  const at = useRef(() => pos.current).current;
  const quietT = ch.quiet && li === -1 ? Math.min(1, elapsed / ch.quiet) : li === -1 ? 1 : 0;

  // what is on the board by now
  const notes = c > 0 ? 4 : li >= 3 ? 4 : li >= 1 ? 2 : 0;
  const drawn = c > 1 ? BOXES.length : c === 1 ? Math.floor(quietT * (BOXES.length + 0.6)) : 0;
  // from "sketch the high level" until the board is done, he is heads-down drawing
  const cam: Cam = c === 1 ? "type" : caption?.who === "YOU" && caption.talking ? "talk" : "think";
  const report = ch.k === "Report";

  return (
    <section id="mk26-sd-film" className="grain relative overflow-clip bg-[hsl(var(--ix-navy))] py-24 text-[#EAF2FF] md:py-32">
      <CircuitTraces className="opacity-50" />
      <div className="pointer-events-none absolute -inset-x-1/2 bottom-0 h-[42%] origin-bottom [transform:perspective(520px)_rotateX(58deg)] bg-[linear-gradient(rgba(31,143,255,.28)_2px,transparent_2px),linear-gradient(90deg,rgba(31,143,255,.28)_2px,transparent_2px)] bg-[length:90px_90px] opacity-50 [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)]" />
      <div ref={ref} className={WRAP}>
        <Head dark n="01" label="The round, start to finish" title={<>A whiteboard that <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">asks questions back.</span></>}
          aside={<Mono className="mb-3 inline-block rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11.5px] text-sky-300">● ONE FULL ROUND · ABOUT A MINUTE</Mono>}
          sub="Clarify the requirements, sketch the system, and defend it while the interviewer reads your board and pushes on scale." />
        <div className="mx-auto max-w-[1080px]">
          <div className="relative">
          <SoundToggle sound={sound} onToggle={() => setSound((x) => !x)} className="absolute -top-5 right-5" />
          <BrowserFrame dark={false} url="app.interviewtrix.com/system-design/url-shortener">
            <div className="relative">
              <Room notes={notes} drawn={drawn} read={c >= 2} hot={c > 3 || (c === 3 && li >= 1)} trade={c > 4 || (c === 4 && li >= 1)} cam={cam} caption={caption} agenda={ch.agenda}
                clip={line?.clip && `${line.clip}#${restart}`} sound={sound} />
              {line?.audio && on && <Voice key={`${line.audio}-${restart}`} src={line.audio} sound={sound} at={at} />}
              {/* warm the cache so each answer starts on its first frame, not after a fetch */}
              {on && <div aria-hidden className="hidden">{CH.flatMap((x) => x.lines).map((l) => l.clip ? <video key={l.clip} src={mk26Asset(`/video/${l.clip}.mp4`)} preload="auto" muted /> : <audio key={l.audio} src={mk26Asset(`/audio/${l.audio}.mp3`)} preload="auto" />)}</div>}
              <AnimatePresence>
                {report && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-[#050E1C]/55 p-4 backdrop-blur-[3px]">
                    <motion.div initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="w-full max-w-[500px] rounded-2xl bg-white p-5 text-[#2E3656] shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]">
                      <div className="flex items-center justify-between"><Mono className="text-[10px] text-primary">SYSTEM DESIGN · REPORT</Mono><Mono className="text-[10px] text-muted-foreground">URL SHORTENER · 41 MIN</Mono></div>
                      <div className="mt-3 flex items-end gap-3"><p className="text-[40px] font-extrabold leading-none"><CountUp to={72} run /></p><Mono className="pb-1 text-[11px] text-muted-foreground">OVERALL / 100</Mono></div>
                      <div className="mt-3 space-y-2">
                        {RUBRIC.map((r, i) => (
                          <div key={r.k} className="flex items-center gap-3 text-[12.5px]">
                            <span className="w-[150px] shrink-0 truncate">{r.k} <span className="text-muted-foreground">· {r.w}%</span></span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><motion.span className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF]" initial={{ width: 0 }} animate={{ width: `${r.v}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease }} /></span>
                            <Mono className="w-6 text-right">{r.v}</Mono>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[12px] text-amber-700">! Hot-key mitigation came only after the follow-up</p>
                      <Mono className="mt-1 block text-[10px] text-muted-foreground">NEXT DRILL · Design a rate limiter</Mono>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BrowserFrame>
          </div>
          <div className="mt-5 grid grid-cols-6 gap-2">
            {CH.map((x, i) => (
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

/* ═══════════════ 02 · WHAT IT DOES (vector graphics) ═══════════════ */

function Tile({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative overflow-hidden rounded-[24px] border border-border bg-white p-6 shadow-[0_24px_50px_-36px_rgba(30,20,80,.45)]", className)}>{children}</div>;
}

/** It reads the diagram: a scan sweeps a mini board and the parts it recognised light up. */
function ReadsIt({ on }: { on: boolean }) {
  const reduce = useReducedMotion();
  const parts = [{ x: 14, y: 30, t: "Client" }, { x: 104, y: 30, t: "API" }, { x: 194, y: 30, t: "Queue" }, { x: 104, y: 96, t: "Cache" }, { x: 194, y: 96, t: "DB" }];
  return (
    <div className="relative mt-5 overflow-hidden rounded-xl border border-[#ECEDF3] bg-[radial-gradient(#D9DBE6_1px,transparent_1.2px)] bg-[length:14px_14px] p-2">
      <svg viewBox="0 0 280 150" className="w-full">
        {parts.map((p, i) => (
          <g key={p.t}>
            <Stroke d={roughRect(p.x, p.y, 70, 36, 40 + i * 9)} show={on} delay={i * 0.15} w={1.4} />
            <text x={p.x + 35} y={p.y + 23} textAnchor="middle" className={cn(HAND, "fill-[#1E1E2E] text-[15px] font-semibold")}>{p.t}</text>
          </g>
        ))}
        <Stroke d={roughArrow(86, 48, 100, 48, 7)} show={on} delay={0.8} w={1.3} dur={0.3} />
        <Stroke d={roughArrow(176, 48, 190, 48, 8)} show={on} delay={0.9} w={1.3} dur={0.3} />
        <Stroke d={roughArrow(139, 68, 139, 92, 9)} show={on} delay={1} w={1.3} dur={0.3} />
        {on && !reduce && <motion.rect y="16" width="3" height="126" rx="1.5" fill="#7367F0" opacity=".6" animate={{ x: [6, 272, 6] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 1.3 }} />}
      </svg>
      <div className="mt-1 flex flex-wrap gap-1.5 px-1 pb-1">
        {["5 components", "3 arrows", "no queue consumer"].map((c, i) => (
          <motion.span key={c} initial={{ opacity: 0, y: 4 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.6 + i * 0.2 }}
            className={cn("rounded-full px-2 py-0.5 font-[family-name:var(--font-geist-mono)] text-[10.5px]", i === 2 ? "bg-amber-50 text-amber-700" : "bg-[#E9E7FD] text-[#5A4BE0]")}>{i === 2 ? "! " : "✓ "}{c}</motion.span>
        ))}
      </div>
    </div>
  );
}

/** 10× traffic: load climbs, one shard redlines. */
function Spike({ on }: { on: boolean }) {
  const pts = [8, 9, 9, 10, 11, 12, 14, 18, 26, 44, 70, 92];
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${10 + i * 22} ${110 - v}`).join(" ");
  return (
    <svg viewBox="0 0 270 130" className="mt-5 w-full">
      <line x1="10" y1="40" x2="262" y2="40" stroke="#E5484D" strokeDasharray="4 4" strokeOpacity=".5" />
      <text x="262" y="34" textAnchor="end" className="fill-[#E5484D] font-[family-name:var(--font-geist-mono)] text-[9.5px]">SHARD 3 CAPACITY</text>
      <motion.path d={d} fill="none" stroke="url(#sd-spike)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 1 } : {}} transition={{ delay: 0.3, duration: 1.6, ease: "easeIn" }} />
      <defs><linearGradient id="sd-spike" x1="0" x2="1"><stop offset="0" stopColor="#7367F0" /><stop offset=".75" stopColor="#1F8FFF" /><stop offset="1" stopColor="#E5484D" /></linearGradient></defs>
      <motion.circle cx={10 + 11 * 22} cy={110 - 92} r="5" fill="#E5484D" initial={{ scale: 0 }} animate={on ? { scale: [0, 1.4, 1] } : {}} transition={{ delay: 1.9 }} />
      <text x="10" y="126" className="fill-[#9AA0B8] font-[family-name:var(--font-geist-mono)] text-[9.5px]">1× → 10× TRAFFIC ON ONE KEY</text>
    </svg>
  );
}

/** The rubric, as it's weighted. */
function Weights({ on }: { on: boolean }) {
  let acc = 0;
  return (
    <div className="mt-5">
      <div className="flex h-9 overflow-hidden rounded-xl">
        {RUBRIC.map((r, i) => {
          const left = acc; acc += r.w;
          return <motion.div key={r.k} className="relative flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: ["#9B8CFF", "#7367F0", "#1F8FFF", "#38BDF8"][i] }}
            initial={{ width: 0 }} animate={on ? { width: `${r.w}%` } : {}} transition={{ delay: 0.2 + left / 100, duration: 0.5, ease }}>{r.w}%</motion.div>;
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {RUBRIC.map((r, i) => (
          <p key={r.k} className="flex items-center gap-2 text-[12.5px] text-[#4B5275]"><span className="size-2.5 shrink-0 rounded-sm" style={{ background: ["#9B8CFF", "#7367F0", "#1F8FFF", "#38BDF8"][i] }} />{r.k}</p>
        ))}
      </div>
    </div>
  );
}

export function SdFeatures() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.25, once: true });
  return (
    <section className={LIGHT}>
      <Dots />
      <div ref={ref} className={WRAP}>
        <Head n="02" label="What it does" title={<>Everything a senior panel has, <span className={HL}>minus the scheduling.</span></>}
          sub="A real whiteboard, an interviewer that reads it, follow-ups at scale and a rubric that weights what senior panels weight." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Tile className="md:col-span-3">
            <div className="flex items-center gap-2"><Eye className="size-4 text-primary" /><Mono className="text-[11px] text-primary">IT READS YOUR DIAGRAM</Mono></div>
            <h3 className={cn("mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]", INK)}>Your board is the answer. It gets read like one.</h3>
            <ReadsIt on={on} />
          </Tile>
          <Tile className="md:col-span-3">
            <Mono className="text-[11px] text-primary">FOLLOW-UPS AT SCALE</Mono>
            <h3 className={cn("mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]", INK)}>Design it. Then design it for ten times the traffic.</h3>
            <Spike on={on} />
          </Tile>
          <Tile className="md:col-span-4">
            <Mono className="text-[11px] text-primary">THE RUBRIC</Mono>
            <h3 className={cn("mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]", INK)}>40% of the score is the deep dive.</h3>
            <Weights on={on} />
          </Tile>
          <Tile className="md:col-span-2 bg-[linear-gradient(180deg,#FFFFFF,#F4F1FF)]">
            <Mono className="text-[11px] text-primary">AN AGENDA, NOT A CHAT</Mono>
            <h3 className={cn("mt-1.5 text-[20px] font-extrabold tracking-[-0.03em]", INK)}>Clarify, sketch, defend.</h3>
            <ol className="mt-4 space-y-2">
              {AGENDA.map((a, i) => (
                <motion.li key={a} initial={{ opacity: 0, x: -8 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.15 }} className="flex items-center gap-2.5 text-[14px] text-[#2E3656]">
                  <span className="grid size-6 place-items-center rounded-full bg-[#E9E7FD] font-[family-name:var(--font-geist-mono)] text-[11px] text-[#5A4BE0]">{i + 1}</span>{a}
                </motion.li>
              ))}
            </ol>
          </Tile>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 03 · THE SYSTEMS ═══════════════ */

const SYSTEMS: { k: string; tag: string; lvl: "Mid" | "Senior" | "Staff"; push: string[] }[] = [
  { k: "URL shortener", tag: "Read-heavy", lvl: "Mid", push: ["ID generation without a lock", "A viral link on one key", "Analytics without slowing redirects"] },
  { k: "Rate limiter", tag: "Infra", lvl: "Mid", push: ["Token bucket or sliding window?", "Limits across many servers", "What happens when Redis is down"] },
  { k: "WhatsApp", tag: "Real-time", lvl: "Senior", push: ["Delivery receipts at scale", "Offline users and message order", "Group fan-out"] },
  { k: "Instagram feed", tag: "Read-heavy", lvl: "Senior", push: ["Push vs pull fan-out", "Celebrity accounts", "Ranking without a cold start"] },
  { k: "YouTube", tag: "Storage", lvl: "Senior", push: ["Upload, transcode, serve", "CDN cost vs latency", "View counts that don't lie"] },
  { k: "Uber", tag: "Geo", lvl: "Senior", push: ["Matching riders to drivers fast", "Geo-sharding a city", "Surge pricing consistency"] },
  { k: "Dropbox", tag: "Storage", lvl: "Senior", push: ["Chunking and dedupe", "Sync conflicts", "Resumable uploads"] },
  { k: "Stripe payments", tag: "Consistency", lvl: "Staff", push: ["Idempotency keys", "Exactly-once, or close to it", "Reconciliation"] },
  { k: "Google Docs", tag: "Real-time", lvl: "Staff", push: ["OT vs CRDT", "Cursor presence", "Offline edits"] },
  { k: "Distributed cache", tag: "Infra", lvl: "Staff", push: ["Consistent hashing", "Hot keys", "Eviction under memory pressure"] },
  { k: "ChatGPT", tag: "AI infra", lvl: "Staff", push: ["Streaming tokens", "GPU scheduling", "Conversation memory"] },
  { k: "LeetCode", tag: "Compute", lvl: "Senior", push: ["Sandboxed code runs", "Judging fairness", "Contest-day spikes"] },
];
const LVL = { Mid: "bg-emerald-50 text-emerald-700", Senior: "bg-amber-50 text-amber-700", Staff: "bg-rose-50 text-rose-700" };

export function SdSystems() {
  const [k, setK] = useState(0);
  const s = SYSTEMS[k];
  return (
    <section className={LAVENDER}>
      <div className={WRAP}>
        <Head n="03" label="The systems" title={<>Pick the one you&apos;d <span className={HL}>least like to be asked.</span></>}
          sub="Real systems from real loops, and the set keeps growing. Every one comes with the follow-ups senior panels actually push on." />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SYSTEMS.map((x, i) => (
              <button key={x.k} onClick={() => setK(i)} className={cn("rounded-2xl border p-3 text-left transition-all duration-200",
                i === k ? "border-[#2E3656] bg-[#2E3656] text-white shadow-[0_14px_30px_-16px_rgba(46,54,86,.9)]" : "border-border bg-white text-[#2E3656] hover:border-primary/40")}>
                <p className="text-[14.5px] font-semibold">{x.k}</p>
                <Mono className={cn("text-[10px]", i === k ? "text-white/60" : "text-muted-foreground")}>{x.tag.toUpperCase()}</Mono>
              </button>
            ))}
          </div>
          <div className="rounded-[24px] border border-white bg-white/90 p-5 shadow-[0_30px_60px_-36px_rgba(30,20,90,.5)] backdrop-blur">
            <div className="flex items-center justify-between"><Mono className="text-[11px] text-primary">{s.k.toUpperCase()}</Mono><Mono className={cn("rounded px-1.5 py-0.5 text-[10px]", LVL[s.lvl])}>{s.lvl.toUpperCase()}</Mono></div>
            <p className={cn("mt-3 text-[13px] text-muted-foreground")}>What you&apos;ll be pushed on</p>
            <AnimatePresence mode="wait">
              <motion.ul key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="mt-2 divide-y divide-border">
                {s.push.map((p, i) => (
                  <li key={p} className="flex items-center gap-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#E9E7FD] font-[family-name:var(--font-geist-mono)] text-[11px] text-[#5A4BE0]">{i + 1}</span><span className={cn("text-[15px] font-semibold", INK)}>{p}</span></li>
                ))}
              </motion.ul>
            </AnimatePresence>
            <a href={MK26_ROUTES.startSystemDesign} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">Design {s.k} now <ArrowRight className="size-4" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 04 · SKILLS GRAPH ═══════════════ */

const SD_HUBS: SkHub[] = [
  { name: "Requirements", a: -90, leaves: [
    { n: "Scoping", s: "strong", v: 82, d: 4, why: "You pin down users, scale and latency before drawing a single box." },
    { n: "Estimation", s: "strong", v: 78, d: 3, why: "Back-of-envelope numbers are right within an order of magnitude." },
    { n: "Non-functionals", s: "slipping", v: 59, d: -3, why: "You skip durability and availability until you're asked." },
    { n: "API design", s: "hidden", v: 71, d: 2, why: "Clean endpoints with idempotency in mind. Rare at your level." },
  ]},
  { name: "Architecture", a: 0, leaves: [
    { n: "Components", s: "strong", v: 80, d: 5, why: "Boxes and arrows a panel can follow on the first read." },
    { n: "Data model", s: "strong", v: 74, d: 2, why: "Keys and access patterns match the reads you described." },
    { n: "Storage choice", s: "slipping", v: 62, d: -2, why: "Picked SQL by default. Say why before you're asked." },
    { n: "Queues", s: "hidden", v: 68, d: 3, why: "You add async work where it belongs without being prompted." },
  ]},
  { name: "Scaling", a: 90, leaves: [
    { n: "Caching", s: "strong", v: 76, d: 4, why: "Read-through cache with a sensible TTL, explained clearly." },
    { n: "Sharding", s: "slipping", v: 58, d: -4, why: "Shard key chosen late. Hot keys came only after the follow-up." },
    { n: "Hot keys", s: "slipping", v: 52, d: -5, why: "The viral-link question is where this round was lost." },
    { n: "Replication", s: "strong", v: 72, d: 2, why: "Read replicas and failover described without hand-waving." },
  ]},
  { name: "Trade-offs", a: 180, leaves: [
    { n: "Consistency", s: "slipping", v: 60, d: -2, why: "Name the consistency model you're choosing, then defend it." },
    { n: "Cost", s: "hidden", v: 66, d: 3, why: "You noticed CDN cost before the interviewer did." },
    { n: "Explaining", s: "strong", v: 79, d: 4, why: "You narrate the board as you draw. Easy to follow." },
    { n: "Alternatives", s: "slipping", v: 57, d: -3, why: "Offer the option you didn't pick, and why not." },
  ]},
];
export const SdSkills = () => <SkillsSection n="04" hubs={SD_HUBS} initial="Hot keys" live="LIVE · UPDATED AFTER DESIGN ROUND 3" />;

/* ═══════════════ 05 · THE RUBRIC REPORT (dark, guided tour) ═══════════════ */

const RUBRIC = [
  { k: "Scope & requirements", w: 15, v: 82, n: "Clarified scale and latency before drawing." },
  { k: "Architecture", w: 25, v: 78, n: "Clear path from client to store; ID service well placed." },
  { k: "Scaling deep-dive", w: 40, v: 64, n: "Hot-key mitigation came only after the follow-up." },
  { k: "Trade-offs & comms", w: 20, v: 74, n: "Counter vs hash argued well; name the consistency model." },
];
type RF = "all" | "overall" | "r0" | "r1" | "r2" | "r3" | "board";
const RTOUR: { f: RF; k: string }[] = [
  { f: "all", k: "Overview" }, { f: "overall", k: "Overall" }, { f: "r0", k: "Scope" }, { f: "r1", k: "Architecture" }, { f: "r2", k: "Deep dive" }, { f: "r3", k: "Trade-offs" }, { f: "board", k: "Your board" },
];

export function SdReport() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.35, once: true });
  const live = useInView(ref, { amount: 0.3 });
  const [k, setK] = useState(0);
  const [restart, setRestart] = useState(0);
  const [held, setHeld] = useState(false); // a visitor scrolling the report takes over from the tour
  useEffect(() => {
    if (!live || reduce || held) return;
    const t = setTimeout(() => setK((x) => (x + 1) % RTOUR.length), k === 0 ? 1800 : 2400);
    return () => clearTimeout(t);
  }, [k, live, reduce, restart, held]);
  const go = (f: RF) => { setHeld(false); setK(RTOUR.findIndex((t) => t.f === f)); setRestart((r) => r + 1); };
  const focus = RTOUR[k].f;
  // camera: overview fits the whole report, every stop zooms in and centres its panel
  const { vp, root, reg, cam } = useFocusCamera<RF>(focus, "all", 1.8);
  const panel = (f: RF) => cn("cursor-pointer rounded-xl border p-3 transition-all duration-500",
    focus === f ? "border-[#7367F0] bg-white/[.06] shadow-[0_0_0_3px_rgba(115,103,240,.25)]" : "border-white/10 bg-white/[.03]", focus !== "all" && focus !== f && "opacity-40");

  return (
    <section className={DARK}>
      <CircuitTraces className="opacity-60" />
      <div ref={ref} className={WRAP}>
        <Head dark n="05" label="Your report" title={<>Scored on what <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CC2FF] bg-clip-text pr-[0.06em] text-transparent">senior panels score.</span></>}
          sub="Four weighted dimensions, what you did well in your own words, what you missed, and the next system to drill." />
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
          <div className="rounded-[24px] border border-white/10 bg-white/[.04] p-5 backdrop-blur">
            <Mono className="text-[11px] text-sky-300">URL SHORTENER · SENIOR · 41 MIN</Mono>
            <div className="mt-4 flex items-center gap-5">
              <span className="relative grid size-[96px] shrink-0 place-items-center">
                <svg viewBox="0 0 110 110" className="absolute inset-0 -rotate-90"><circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
                  <motion.circle cx="55" cy="55" r="46" fill="none" stroke="url(#kit-wire-g)" strokeWidth="8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 0.72 } : {}} transition={{ delay: 0.3, duration: 1.2, ease }} /></svg>
                <span className="text-[30px] font-extrabold text-white"><CountUp to={72} run={on} /></span>
              </span>
              <div><p className="text-[15px] font-semibold text-white">Overall</p><p className="mt-1 text-[13.5px] text-[#9FB3CF]">Weighted: the deep dive counts for 40%.</p></div>
            </div>
            {/* what went well, in the candidate's own words */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6 }} className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.06] p-3.5">
              <Mono className="text-[10.5px] text-emerald-300">WHAT WENT WELL · IN YOUR WORDS</Mono>
              <p className="mt-2 text-[14.5px] leading-relaxed text-white">“A counter gives shorter codes, so I&apos;d pre-allocate ID ranges per server. No lock.”</p>
              <Mono className="mt-1.5 block text-[10px] text-white/45">TRADE-OFFS · 18:40</Mono>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.75 }} className="mt-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-3.5">
              <Mono className="text-[10.5px] text-amber-300">MISSED OR WEAK</Mono>
              <ul className="mt-2 space-y-1.5 text-[14px] text-white">
                <li>! Hot keys raised only after the follow-up</li>
                <li>! No consistency model named for the store</li>
              </ul>
            </motion.div>
            <div className="mt-2.5 rounded-2xl border border-white/10 p-3.5">
              <div className="flex items-center justify-between"><Mono className="text-[10.5px] text-white/50">APPROACHES COVERED</Mono><Mono className="text-[10.5px] text-white">5 / 7</Mono></div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {[["Caching", 1], ["Sharding", 1], ["ID ranges", 1], ["CDN", 1], ["Replication", 1], ["Rate limiting", 0], ["Analytics pipeline", 0]].map(([t, ok]) => (
                  <span key={t as string} className={cn("rounded-full px-2.5 py-1 text-[12px]", ok ? "bg-white/10 text-white" : "border border-dashed border-white/20 text-white/45")}>{ok ? "✓ " : ""}{t}</span>
                ))}
              </div>
            </div>
            <div className="mt-2.5 rounded-2xl border border-white/10 p-3.5">
              <Mono className="text-[10.5px] text-white/50">DRILL NEXT</Mono>
              {["Rate limiter · hot keys again", "Distributed cache · consistent hashing", "Instagram feed · fan-out"].map((x, i) => (
                <motion.p key={x} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + i * 0.12 }} className="mt-2 flex items-center gap-2 text-[14px] text-white"><ArrowRight className="size-3.5 text-sky-300" />{x}</motion.p>
              ))}
            </div>
          </div>
          <div>
            <BrowserFrame url="app.interviewtrix.com/dashboard/system-design/url-shortener/report">
              <div ref={vp} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} className="relative h-[640px] overflow-hidden bg-[#071224]">
                <motion.div ref={root} className="relative" style={{ originX: 0, originY: 0 }} animate={reduce ? { x: cam.x, y: cam.y, scale: cam.s } : { x: cam.x, y: cam.y, scale: cam.s }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 20, mass: 0.9 }}>
                  <div className="relative space-y-3 p-4 text-left text-white">
                    <div ref={reg("overall")} onClick={() => go("overall")} className={cn(panel("overall"), "flex items-center gap-3")}>
                      <span className="grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-[#7367F0] text-[15px] font-bold">72</span>
                      <div className="min-w-0"><p className="truncate text-[13px] font-semibold">System design report · URL shortener</p><Mono className="text-[9.5px] text-white/50">SENIOR · 41 MIN · 4 DIMENSIONS</Mono></div>
                      <Mono className="ml-auto shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[9.5px] text-amber-300">HIRE-LEANING</Mono>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {RUBRIC.map((r, i) => (
                        <div key={r.k} ref={reg(`r${i}` as RF)} onClick={() => go(`r${i}` as RF)} className={panel(`r${i}` as RF)}>
                          <div className="flex items-center justify-between"><p className="text-[12px] font-semibold">{r.k}</p><Mono className="text-[12px]">{r.v}</Mono></div>
                          <Mono className="text-[9px] text-white/40">WEIGHT {r.w}%</Mono>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#38BDF8]" initial={{ width: 0 }} animate={on ? { width: `${r.v}%` } : {}} transition={{ delay: 0.5 + i * 0.12, duration: 0.9, ease }} /></div>
                          <p className="mt-1.5 text-[10.5px] leading-snug text-[#9FB3CF]">{r.n}</p>
                        </div>
                      ))}
                    </div>
                    <div ref={reg("board")} onClick={() => go("board")} className={panel("board")}>
                      <div className="flex items-center justify-between"><Mono className="text-[9.5px] text-white/50">YOUR FINAL BOARD</Mono><Mono className="text-[9.5px] text-amber-300">1 GAP MARKED</Mono></div>
                      <div className="mt-2 overflow-hidden rounded-lg bg-white bg-[radial-gradient(#D9DBE6_1px,transparent_1.2px)] bg-[length:12px_12px]"><div className="aspect-[900/470]"><Board notes={4} drawn={BOXES.length} read={false} hot trade /></div></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </BrowserFrame>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {RTOUR.map((x, i) => (
                <button key={x.k} onClick={() => go(x.f)} className="group text-left">
                  <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                    {i < k && <span className="block h-full w-full rounded-full bg-white/50" />}
                    {i === k && <motion.span key={`${k}-${restart}`} className="block h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#5CC2FF]" initial={{ width: "0%" }} animate={{ width: live && !reduce ? "100%" : "4%" }} transition={{ duration: live && !reduce ? (k === 0 ? 1.8 : 2.4) : 0.2, ease: "linear" }} />}
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

/* ═══════════════ 06 · ONE MEMORY ═══════════════ */

export function SdAfter() {
  return (
    <Wiring n="06" label="One memory" title={<>Your board <span className={HL}>doesn&apos;t get thrown away.</span></>}
      sub="Every round you draw feeds the next one, your Skills Graph and your iX Score."
      ins={["Your resume", "Past design rounds", "Your target level"]}
      outs={[
        { t: "Next design round", d: "Opens on hot keys, where this one was lost." },
        { t: "Coding round", d: "Knows you think in systems, and checks the code holds up." },
        { t: "Skills Graph", d: "Caching strong, sharding slipping, each with evidence." },
        { t: "iX Score", d: "System design is one of four categories recruiters see." },
      ]}>
      {(on: boolean) => (
        <>
          <Mono className="text-[10.5px] text-sky-300">SYSTEM DESIGN · REPORT</Mono>
          <div className="mt-4 flex items-center gap-4">
            <span className="relative grid size-[68px] place-items-center">
              <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90"><circle cx="34" cy="34" r="29" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                <motion.circle cx="34" cy="34" r="29" fill="none" stroke="url(#kit-wire-g)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={on ? { pathLength: 0.72 } : {}} transition={{ delay: 0.7, duration: 1.2, ease }} /></svg>
              <span className="text-[22px] font-bold"><CountUp to={72} run={on} /></span>
            </span>
            <div><p className="font-bold">URL shortener</p><p className="text-[13px] text-[#9FB3CF]">Senior · 41 min · 4 dimensions</p></div>
          </div>
          <div className="mt-5 space-y-2 text-[13.5px]">
            {[["✓", "Requirements before boxes", "text-emerald-300"], ["✓", "Counter vs hash, argued well", "text-emerald-300"], ["!", "Hot keys only after the follow-up", "text-amber-300"]].map(([i, t, c], n) => (
              <motion.p key={t} initial={{ opacity: 0, x: -6 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + n * 0.15 }} className={c}><span className="mr-1.5">{i}</span>{t}</motion.p>
            ))}
          </div>
        </>
      )}
    </Wiring>
  );
}

export const SdStickyCta = () => <StickyCta product="AI System Design" cta="Start free round" href={MK26_ROUTES.startSystemDesign} />;
