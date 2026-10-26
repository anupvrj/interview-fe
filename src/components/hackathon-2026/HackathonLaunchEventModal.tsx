"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";
import { HackathonLaunchEventForm } from "./HackathonLaunchEventForm";
import "@/features/hackathon/components/hackathon-dashboard-reel.css";

export function HackathonLaunchEventModal({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const [resetKey, setResetKey] = useState(0);

  const onOpen = (next: boolean) => {
    if (!next) setResetKey((k) => k + 1);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent
        overlayClassName={cn("hk-hackathon-dialog-overlay z-[100] bg-[#020810]/80 backdrop-blur-sm")}
        className={cn(
          hackathonReelFontVars,
          "hk-root hk-modal hk-hackathon-dialog fixed left-1/2 top-1/2 z-[101] max-h-[90svh] w-[calc(100%-1.5rem)] max-w-[26rem] sm:max-w-[31rem] md:max-w-[34rem] lg:max-w-[36rem] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden p-0 text-[#dbe9f8] shadow-none [&>button]:hidden",
        )}
      >
        {open ? (
          <HackathonLaunchEventForm key={resetKey} dialogSemantics onClose={() => onOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
