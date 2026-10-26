"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";
import type { HackathonCtaLocation } from "@/features/hackathon/analytics";

export function HackathonSubmitButton({
  className,
  size = "md",
  ctaLocation = "hero",
}: Readonly<{
  className?: string;
  size?: "sm" | "md" | "lg";
  ctaLocation?: HackathonCtaLocation;
}>) {
  const { openSubmitHackathon, submitHackathonDisabled } = useHackathonRegister();

  return (
    <button
      type="button"
      disabled={submitHackathonDisabled}
      onClick={() => openSubmitHackathon(ctaLocation)}
      className={cn(
        "hk-btn hk-btn-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040b17] disabled:pointer-events-none disabled:opacity-55",
        size === "lg" && "min-h-[3.75rem] px-8 text-base",
        size === "md" && "min-h-12 px-6 text-[15px]",
        size === "sm" && "min-h-10 px-4 text-sm",
        className,
      )}
    >
      Submit Hackathon
      {submitHackathonDisabled ? null : <ArrowRight className="hk-btn-arrow size-4 opacity-90" aria-hidden />}
    </button>
  );
}
