"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { mk26Asset } from "./assets";

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
/** `loop={false}` plays once and holds the last frame; `rate` slows or speeds the capture. */
export function LoopVideo({ name, className, priority, loop = true, rate = 1 }: { name: string; className?: string; priority?: boolean; loop?: boolean; rate?: number }) {
  const ref = useRef<HTMLVideoElement>(null);
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
