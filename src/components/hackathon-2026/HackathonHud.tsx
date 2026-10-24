"use client";

import { useEffect, useRef, useState } from "react";

/** Live IST clock for the hero HUD. Renders a placeholder on the server to avoid hydration mismatch. */
function useIstClock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setT(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

/** Reel-style HUD bar: brand path on the left, live IST clock on the right, running segmented rail below. */
export function HackathonHeroHud({ className = "" }: { className?: string }) {
  const clock = useIstClock();
  return (
    <div className={className} aria-hidden>
      <div className="hk-hud">
        <span>
          <b>IX</b> / The Hiring Games
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="hk-live-dot" />
          Live · <span className="tabular-nums text-white">{clock}</span> IST
        </span>
      </div>
      <div className="hk-hud-rail">
        <span className="on" />
        <span className="run" />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

/** Fixed, segmented scroll-progress rail across the top of the viewport (one segment per section). */
export function HackathonScrollRail({ segments = 8 }: { segments?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const bars = el.children;
      for (let i = 0; i < bars.length; i++) {
        const local = Math.min(1, Math.max(0, p * bars.length - i));
        (bars[i] as HTMLElement).style.setProperty("--p", String(local));
      }
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className="hk-scroll-rail" aria-hidden>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i}>
          <i />
        </span>
      ))}
    </div>
  );
}
