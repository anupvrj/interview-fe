"use client";

import { PHASE_COPY } from "../copy";
import { Countdown } from "./Countdown";

export function HackathonStartCountdown({
  target,
  serverNow,
  onDone,
  className,
  variant = "default",
}: Readonly<{
  target: string;
  serverNow: string;
  onDone?: () => void;
  className?: string;
  variant?: "default" | "amber";
}>) {
  const amber = variant === "amber";
  return (
    <div className={className}>
      <p
        className={
          amber
            ? "mb-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-[#ffc44d] sm:text-base"
            : "mb-4 text-center text-sm font-semibold uppercase tracking-[0.12em] text-[#9eb2ca] sm:text-base"
        }
      >
        {PHASE_COPY.startCountdownLabel}
      </p>
      <Countdown target={target} serverNow={serverNow} onDone={onDone} variant={variant} />
    </div>
  );
}
