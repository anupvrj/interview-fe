"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";

/**
 * The one full-screen loader from "Continue with Google" until the challenge page is ready
 * (sign-in callback, route loading, feature check, profile, dashboard). Same look and title
 * at every step, fixed over the page, so the hand-offs read as one continuous load instead of
 * a blank page followed by a different spinner. No enter animation for the same reason.
 * Portaled to <body> so it also covers the shell header (the shell content is its own
 * stacking context, so z-index alone can't lift it out). Above the header (z-30), below
 * dialogs (z-50) so the registering modal and the stuck-loading pop-up still show.
 */
export function HackathonPageLoader({
  message = "Getting your challenge ready…",
  className,
}: Readonly<{ message?: string; className?: string }>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loader = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-[45] flex flex-col items-center justify-center bg-[#040b17] px-6 text-center",
        hackathonReelFontVars,
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_40%,rgba(31,149,255,0.16),transparent_70%)]"
      />
      <div className="relative grid size-[4.5rem] place-items-center rounded-full border-2 border-[#3aa6ff]/45 bg-[#0d2550]/80">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#3aa6ff]/15" aria-hidden />
        <Loader2 className="size-9 animate-spin text-[#6fc0ff]" aria-hidden />
      </div>
      <p
        className="relative mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#6fc0ff]"
        style={{ fontFamily: "var(--font-hk-mono), ui-monospace, monospace" }}
      >
        The Hiring Games
      </p>
      <p className="relative mt-2 text-lg font-extrabold tracking-tight text-white sm:text-xl">{message}</p>
    </div>
  );
  return mounted ? createPortal(loader, document.body) : loader;
}
