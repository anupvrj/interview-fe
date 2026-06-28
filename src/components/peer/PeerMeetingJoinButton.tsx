"use client";

import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canJoinPeerMeeting,
  DEFAULT_PEER_TIMEZONE,
  peerJoinDisabledTooltip,
  peerJoinOpensAtMs,
} from "@/components/peer/peerSlotTime";

type PeerMeetingJoinButtonProps = {
  videoLink: string;
  start: string;
  end?: string;
  timezone?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
};

export function PeerMeetingJoinButton({
  videoLink,
  start,
  end,
  timezone = DEFAULT_PEER_TIMEZONE,
  label = "Join",
  size = "sm",
  variant = "outline",
  className,
}: PeerMeetingJoinButtonProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const intervalMs = 30_000;
    const id = globalThis.setInterval(tick, intervalMs);

    const opensAt = peerJoinOpensAtMs(start);
    const endAt = end ? new Date(end).getTime() : opensAt + 70 * 60 * 1000;
    const delays = [opensAt - Date.now(), endAt - Date.now()].filter((d) => d > 0 && d < 86_400_000);
    const timeouts = delays.map((delay) => globalThis.setTimeout(tick, delay));

    return () => {
      globalThis.clearInterval(id);
      for (const timeoutId of timeouts) globalThis.clearTimeout(timeoutId);
    };
  }, [start, end]);

  const joinable = canJoinPeerMeeting(start, end, nowMs);
  const tooltip = peerJoinDisabledTooltip(start, timezone);

  const button = (
    <Button
      size={size}
      variant={variant}
      disabled={!joinable}
      className={cn("gap-1", className)}
    >
      <Video className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
    </Button>
  );

  if (joinable) {
    return (
      <Button
        asChild
        size={size}
        variant={variant}
        className={cn("gap-1", className)}
      >
        <a href={videoLink} target="_blank" rel="noreferrer">
          <Video className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {label}
        </a>
      </Button>
    );
  }

  return (
    <span className="group relative inline-flex">
      {button}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-[14rem] -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-foreground shadow-lg group-hover:block"
      >
        {tooltip}
      </span>
    </span>
  );
}
