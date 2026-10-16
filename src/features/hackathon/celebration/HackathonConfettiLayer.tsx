"use client";

import { useEffect, useRef } from "react";

type ConfettiFn = (options?: Record<string, unknown>) => void;

export function HackathonConfettiLayer({ active }: Readonly<{ active: boolean }>) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || firedRef.current) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    firedRef.current = true;
    let cancelled = false;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      fireCelebration(confetti);
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active) firedRef.current = false;
  }, [active]);

  return null;
}

function fireCelebration(confetti: ConfettiFn) {
  const duration = 2200;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#29d6a0", "#6fc0ff", "#ffc44d", "#ff6f9f", "#7367F0"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#29d6a0", "#6fc0ff", "#ffc44d", "#ff6f9f", "#7367F0"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.55 },
    colors: ["#29d6a0", "#6fc0ff", "#ffc44d", "#ff6f9f"],
  });
  frame();
}
