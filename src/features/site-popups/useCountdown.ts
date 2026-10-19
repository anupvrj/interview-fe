"use client";

import { useEffect, useState } from "react";

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function split(ms: number): CountdownParts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    done: total <= 0,
  };
}

/** Ticks once a second toward `target`. `offsetMs` (server clock − device clock) corrects a wrong device clock. */
export function useCountdown(target: string | null, offsetMs = 0): CountdownParts | null {
  const offset = offsetMs;
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    if (!target) return;
    const id = window.setInterval(() => setNow(Date.now() + offset), 1000);
    return () => window.clearInterval(id);
  }, [target, offset]);
  if (!target) return null;
  const ms = new Date(target).getTime();
  if (Number.isNaN(ms)) return null;
  return split(ms - now);
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
