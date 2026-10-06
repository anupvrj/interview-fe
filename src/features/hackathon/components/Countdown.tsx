"use client";

import { useEffect, useRef, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

/**
 * Counts down to `target` using the server clock offset, so a wrong device
 * clock doesn't show the wrong time. Calls `onDone` once when it reaches zero.
 */
export function Countdown({
  target,
  serverNow,
  onDone,
  compact = false,
}: Readonly<{ target: string; serverNow: string; onDone?: () => void; compact?: boolean }>) {
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [now, setNow] = useState(() => Date.now() + offset);
  const targetMs = new Date(target).getTime();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(timer);
  }, [offset]);

  const remaining = targetMs - now;
  const firedRef = useRef(false);
  useEffect(() => {
    if (remaining > 0 || firedRef.current) return;
    firedRef.current = true;
    onDone?.();
  }, [remaining, onDone]);

  const p = parts(remaining);
  if (compact) {
    return (
      <span className="tabular-nums">
        {p.days > 0 ? `${p.days}d ` : ""}
        {String(p.hours).padStart(2, "0")}h {String(p.minutes).padStart(2, "0")}m
      </span>
    );
  }
  const cells: Array<[number, string]> = [
    [p.days, "Days"],
    [p.hours, "Hours"],
    [p.minutes, "Minutes"],
    [p.seconds, "Seconds"],
  ];
  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="timer" aria-live="off">
      {cells.map(([value, label]) => (
        <div
          key={label}
          className="flex w-[4.25rem] flex-col items-center rounded-2xl border border-[#27547d] bg-[#0a1930]/80 py-3 sm:w-20"
        >
          <span className="text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7189a6]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
