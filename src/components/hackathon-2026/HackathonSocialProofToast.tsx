"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

const BURST = [
  { dx: "-42px", dy: "-38px", rot: "-40deg", color: "#ffc44d", delay: "0ms", shape: "rect" },
  { dx: "36px", dy: "-44px", rot: "50deg", color: "#2bd2ff", delay: "40ms", shape: "dot" },
  { dx: "-28px", dy: "32px", rot: "20deg", color: "#1677ff", delay: "70ms", shape: "rect" },
  { dx: "48px", dy: "18px", rot: "-25deg", color: "#ff4e8b", delay: "20ms", shape: "dot" },
  { dx: "-8px", dy: "-52px", rot: "12deg", color: "#29d6a0", delay: "90ms", shape: "rect" },
  { dx: "22px", dy: "40px", rot: "-55deg", color: "#ffc44d", delay: "110ms", shape: "dot" },
  { dx: "-50px", dy: "6px", rot: "70deg", color: "#2aaeff", delay: "50ms", shape: "rect" },
  { dx: "54px", dy: "-16px", rot: "-15deg", color: "#ff4e8b", delay: "130ms", shape: "dot" },
  { dx: "-18px", dy: "-28px", rot: "35deg", color: "#ffffff", delay: "60ms", shape: "star" },
  { dx: "14px", dy: "-36px", rot: "-30deg", color: "#ffc44d", delay: "150ms", shape: "star" },
] as const;

type Activity = {
  id: number;
  name: string;
  city: string;
  text: string;
};

function wait(min: number, max: number) {
  return min + Math.random() * (max - min);
}

async function nextActivity(): Promise<Omit<Activity, "id"> | null> {
  const res = await fetch("/api/hackathon-2026/live", { cache: "no-store" });
  if (res.status === 204 || !res.ok) return null;
  const data = (await res.json()) as { name?: string; city?: string; text?: string };
  if (!data.name || !data.city || !data.text) return null;
  return { name: data.name, city: data.city, text: data.text };
}

export function HackathonSocialProofToast() {
  const [item, setItem] = useState<Activity | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    let showId = 0;
    let hideId = 0;
    let idleId = 0;
    let left = 2 + Math.floor(Math.random() * 2);
    let alive = true;
    let started = false;

    const schedule = (delay: number) => {
      showId = window.setTimeout(() => {
        void (async () => {
          if (!alive || left <= 0) return;
          if (document.hidden) {
            schedule(4000);
            return;
          }
          const row = await nextActivity().catch(() => null);
          if (!alive || !row) return;
          left -= 1;
          setItem({ ...row, id: Date.now() });
          setOpen(true);
          hideId = window.setTimeout(() => {
            setOpen(false);
            if (left > 0) schedule(wait(10000, 20000));
          }, 4800);
        })();
      }, delay);
    };

    const onScroll = () => {
      if (window.scrollY >= 80) begin();
    };

    const begin = () => {
      if (started || !alive) return;
      started = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", begin);
      window.removeEventListener("keydown", begin);
      window.clearTimeout(idleId);
      schedule(wait(1200, 2200));
    };

    idleId = window.setTimeout(begin, 20000);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", begin);
    window.addEventListener("keydown", begin);

    return () => {
      alive = false;
      window.clearTimeout(showId);
      window.clearTimeout(hideId);
      window.clearTimeout(idleId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", begin);
      window.removeEventListener("keydown", begin);
    };
  }, []);

  if (!ready || !item) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-[80] w-[min(22rem,calc(100vw-2rem))] sm:bottom-6 sm:left-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <div key={item.id} className={cn("hk-proof-toast", open && "hk-proof-toast-on")}>
        <span className="hk-proof-burst" aria-hidden>
          {BURST.map((bit, index) => (
            <i
              key={index}
              className={`hk-proof-bit hk-proof-bit-${bit.shape}`}
              style={
                {
                  "--dx": bit.dx,
                  "--dy": bit.dy,
                  "--rot": bit.rot,
                  "--hk-proof-delay": bit.delay,
                  background: bit.color,
                  color: bit.color,
                } as CSSProperties
              }
            />
          ))}
        </span>
        <span
          className="relative grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1677ff] to-[#0b3d8f] text-sm font-bold text-white shadow-[0_0_16px_rgba(22,119,255,0.35)]"
          aria-hidden
        >
          {item.name.slice(0, 1)}
          <PartyPopper className="absolute -right-1.5 -top-1.5 size-4 text-[#ffc44d] drop-shadow-[0_0_8px_rgba(255,196,77,0.85)]" strokeWidth={2.2} />
        </span>
        <p className="min-w-0 text-[13px] leading-snug text-[#e8f1fb] sm:text-sm">
          <span className="font-semibold text-white">{item.name}</span>
          <span className="text-[#9eb2ca]"> from {item.city}</span>
          <span className="block text-[#c5d3e2]">{item.text}</span>
        </p>
        <span className="shrink-0 self-start text-[10px] font-semibold uppercase tracking-[0.12em] text-[#42c4ff]">
          Just now
        </span>
      </div>
    </div>,
    document.body,
  );
}
