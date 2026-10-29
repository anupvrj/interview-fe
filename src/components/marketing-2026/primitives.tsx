"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { mk26Asset } from "./assets";

/** The one sound control for every voiced film: pinned on the card's edge so it's easy to find mid-scroll.
 *  Films start muted; a click is the only way browsers let the voices play. */
export function SoundToggle({ sound, onToggle, className }: { sound: boolean; onToggle: () => void; className?: string }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={sound} aria-label={sound ? "Mute the interview" : "Turn on the interview's sound"}
      className={cn("z-30 inline-flex items-center gap-2 rounded-full py-2 pl-2 pr-4 text-[13px] font-semibold shadow-[0_16px_36px_-14px_rgba(40,30,140,.6)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        sound ? "border border-white bg-white/95 text-[#2E3656] backdrop-blur hover:bg-white" : "bg-primary text-white hover:bg-primary/90", className)}>
      <span className={cn("relative grid size-7 place-items-center rounded-full", sound ? "bg-primary text-white" : "bg-white/20")}>
        {sound ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
        {!sound && <span className="absolute inset-0 animate-ping rounded-full bg-white/30 motion-reduce:hidden" />}
      </span>
      {sound ? "Sound on" : "Tap for sound"}
    </button>
  );
}

export function Mono({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("font-[family-name:var(--font-geist-mono)]", className)} {...p} />;
}

/** Chapter eyebrow — the homepage reads as one story, so each chapter carries its number and name. */
export function Index({ n, label, dark }: { n: string; label?: string; dark?: boolean }) {
  return (
    <div className={cn("mb-5 flex items-center gap-3 text-[13px] tracking-wider", dark ? "text-sky-400" : "text-primary")}>
      <Mono>— {n}{label && ` · ${label.toUpperCase()}`} —</Mono>
      <span className={cn("h-px w-28 border-t-2 border-dotted", dark ? "border-sky-400/40" : "border-primary/40")} />
    </div>
  );
}

export function LivePill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px]", className)}>
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <Mono>{children}</Mono>
    </span>
  );
}

export function BrowserFrame({ url, dark = true, className, children }: { url: string; dark?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-[18px] border shadow-[0_40px_80px_-30px_rgba(15,20,45,.45)]", dark ? "border-[#1B3C62] bg-[#071224]" : "border-border bg-card", className)}>
      <div className={cn("flex h-9 items-center gap-1.5 border-b px-3.5", dark ? "border-[#1B3C62] bg-[#0B1A30]" : "border-border bg-[#FBFBFD]")}>
        <i className="size-2.5 rounded-full bg-[#FF6159]" /><i className="size-2.5 rounded-full bg-[#FFBD2E]" /><i className="size-2.5 rounded-full bg-[#28C941]" />
        <Mono className={cn("ml-3 truncate rounded-md px-2.5 py-1 text-[11px]", dark ? "bg-[#132A48] text-[#8FB0D6]" : "bg-muted text-muted-foreground")}>{url}</Mono>
      </div>
      {children}
    </div>
  );
}

/** Muted looping product capture. Plays only while on screen; poster is the LCP-safe first frame. */
/** `loop={false}` plays once and holds the last frame; `rate` slows or speeds the capture; `sound` unmutes it (only after a click, or browsers block play). */
export function LoopVideo({ name, className, priority, loop = true, rate = 1, sound = false }: { name: string; className?: string; priority?: boolean; loop?: boolean; rate?: number; sound?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  // React doesn't keep the `muted` attribute in sync, so set the property
  useEffect(() => { if (ref.current) ref.current.muted = !sound; }, [sound]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.playbackRate = rate;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, [name, rate]);
  return (
    <video
      ref={ref}
      key={name}
      className={cn("block aspect-video w-full object-cover", className)}
      src={mk26Asset(`/video/${name}.mp4`)}
      poster={mk26Asset(`/video/${name}.jpg`)}
      muted
      loop={loop}
      playsInline
      preload={priority ? "auto" : "none"}
      aria-label={`InterviewTrix product capture: ${name}`}
    />
  );
}

export function Brackets({ className }: { className?: string }) {
  return (
    <>
      <span className={cn("pointer-events-none absolute -left-2 -top-2 size-4 border-l-[1.5px] border-t-[1.5px] border-primary/60", className)} />
      <span className={cn("pointer-events-none absolute -bottom-2 -right-2 size-4 border-b-[1.5px] border-r-[1.5px] border-primary/60", className)} />
    </>
  );
}

/** True at ≥1024px. Pinned scroll stories only pin on desktop; phones get a stacked version. */
export function useDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return d;
}

export type EmblemKind = "voice" | "code" | "layers" | "seats" | "spark" | "resume" | "whiteboard" | "peers" | "graph" | "mail" | "calendar" | "clock" | "refund" | "shield" | "scroll";

/**
 * Hand-drawn product emblems: a gradient mark on a glass tile. Used instead of stock icons wherever a product or plan
 * needs a face (pricing passes, the About page). `tone="light"` for white sections.
 */
export function Emblem({ kind, glow = false, tone = "dark", className }: { kind: EmblemKind; glow?: boolean; tone?: "dark" | "light"; className?: string }) {
  // one gradient per look; identical definitions can share an id, and it stays the same on server and client
  const g = `em-${tone}${glow ? "-glow" : ""}`;
  const st = { fill: "none", stroke: `url(#${g})`, strokeWidth: 2.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const mark = {
    // voice: a mic capsule with the round's waveform either side
    voice: <><rect x="21" y="11" width="10" height="18" rx="5" {...st} /><path d="M16 25a10 10 0 0 0 20 0M26 35v5M21 40h10" {...st} /><path d="M9 22v6M13 19v12M39 19v12M43 22v6" {...st} strokeWidth={2} opacity=".7" /></>,
    // code: brackets around a blinking cursor
    code: <><path d="M17 15 8 26l9 11M35 15l9 11-9 11" {...st} /><rect x="22" y="20" width="8" height="12" rx="1.5" fill={`url(#${g})`} className="motion-safe:animate-pulse" /></>,
    // architecture: three stacked layers and a spark on top
    layers: <><path d="M26 14 42 22 26 30 10 22Z" {...st} /><path d="m10 28 16 8 16-8M10 34l16 8 16-8" {...st} opacity=".75" /><path d="M40 6v6M37 9h6" {...st} strokeWidth={2} /></>,
    // teams: a grid of seats
    seats: <>{[12, 24, 36].flatMap((x) => [14, 26, 38].map((y) => <rect key={`${x}${y}`} x={x - 4} y={y - 4} width="8" height="8" rx="2" {...st} strokeWidth={1.8} />))}</>,
    // a four-point spark
    spark: <path d="M26 8c1.5 9 4 12 18 18-14 6-16.5 9-18 18-1.5-9-4-12-18-18 14-6 16.5-9 18-18Z" {...st} />,
    // resume: a page with lines and an ATS tick
    resume: <><path d="M14 8h17l8 8v28H14Z" {...st} /><path d="M31 8v8h8M19 24h14M19 30h10" {...st} opacity=".75" /><path d="m30 38 4 4 8-9" {...st} /></>,
    // whiteboard: three nodes wired together
    whiteboard: <><rect x="7" y="9" width="14" height="10" rx="2.5" {...st} /><rect x="31" y="9" width="14" height="10" rx="2.5" {...st} /><rect x="19" y="33" width="14" height="10" rx="2.5" {...st} /><path d="M21 14h10M14 19l8 14M38 19l-8 14" {...st} opacity=".75" /></>,
    // peers: two people, side by side
    peers: <><circle cx="19" cy="18" r="6" {...st} /><circle cx="35" cy="20" r="5" {...st} opacity=".8" /><path d="M8 41c1-7 5.5-11 11-11s10 4 11 11M30 41c.5-5 3-8 6-8s6.5 3 7 8" {...st} /></>,
    // graph: a hub with skills branching out
    graph: <><circle cx="26" cy="26" r="5" fill={`url(#${g})`} /><path d="M26 21V11M30.5 28.5l8.5 5M21.5 28.5 13 33.5" {...st} opacity=".75" /><circle cx="26" cy="9" r="3.5" {...st} /><circle cx="41" cy="35" r="3.5" {...st} /><circle cx="11" cy="35" r="3.5" {...st} /></>,
    // shield: privacy, with a lock keyhole
    shield: <><path d="M26 7 41 12.5v11c0 10-6.5 17-15 21-8.5-4-15-11-15-21v-11Z" {...st} /><circle cx="26" cy="23" r="4" {...st} /><path d="M26 27v7" {...st} /></>,
    // scroll: terms, a page with a seal
    scroll: <><path d="M13 8h20l7 7v29H13Z" {...st} /><path d="M33 8v7h7M18 20h14M18 26h10" {...st} opacity=".75" /><circle cx="32" cy="35" r="4.5" {...st} /></>,
    // mail: an envelope with a little send spark
    mail: <><rect x="8" y="14" width="32" height="24" rx="4" {...st} /><path d="m9 16 15 11 15-11" {...st} opacity=".8" /><path d="M43 8v6M40 11h6" {...st} strokeWidth={2} /></>,
    // calendar: a month with the working days ticked
    calendar: <><rect x="9" y="12" width="34" height="30" rx="5" {...st} /><path d="M9 21h34M18 8v8M34 8v8" {...st} /><path d="M16 29h4M24 29h4M32 29h4M16 35h4M24 35h4" {...st} strokeWidth={2.4} opacity=".75" /></>,
    // clock: a dial with a reply arrow around it
    clock: <><circle cx="26" cy="27" r="15" {...st} /><path d="M26 19v8l6 4" {...st} /><path d="M38 9a20 20 0 0 1 6 7M44 10v6h-6" {...st} strokeWidth={2} opacity=".75" /></>,
    // refund: a coin with a return arrow
    refund: <><circle cx="28" cy="27" r="13" {...st} /><path d="M28 21v12M24 24.5c0-2 2-3 4-3s4 1 4 3-2 2.5-4 3-4 1-4 3 2 3 4 3 4-1 4-3" {...st} strokeWidth={2.2} opacity=".85" /><path d="M10 18a20 20 0 0 1 6-7M9 11v7h7" {...st} strokeWidth={2} /></>,
  }[kind];
  return (
    <span className={cn("relative grid size-14 shrink-0 place-items-center rounded-2xl border bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,.12)]",
      tone === "light" ? "border-primary/15 from-[#F1EEFF] to-[#E3EEFF] shadow-[0_12px_26px_-16px_rgba(75,63,208,.6),inset_0_1px_0_#fff]"
        : glow ? "border-primary/60 from-[#3B2F8F] to-[#16285A] shadow-[0_0_34px_-6px_rgba(115,103,240,.9),inset_0_1px_0_rgba(255,255,255,.15)]" : "border-[#24497A] from-[#173462] to-[#0F223F]", className)}>
      <svg viewBox="0 0 52 52" className={cn("size-9", tone === "dark" && "drop-shadow-[0_0_6px_rgba(140,170,255,.55)]")} aria-hidden>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            {tone === "light" ? <><stop offset="0" stopColor="#7367F0" /><stop offset="1" stopColor="#1F8FFF" /></> : <><stop offset="0" stopColor="#D2CBFF" /><stop offset=".5" stopColor="#A99CFF" /><stop offset="1" stopColor="#5CD3FF" /></>}
          </linearGradient>
        </defs>
        {mark}
      </svg>
    </span>
  );
}
