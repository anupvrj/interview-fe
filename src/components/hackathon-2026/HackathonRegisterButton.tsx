"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";

export function HackathonRegisterButton({
  children,
  className,
  size = "md",
  idle = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Periodic light sweep to draw the eye (hero CTA only). */
  idle?: boolean;
  onClick?: () => void;
}) {
  const { openRegister } = useHackathonRegister();

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        openRegister();
      }}
      className={cn(
        "hk-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040b17]",
        size === "lg" && "min-h-[3.5rem] px-8 text-base",
        size === "md" && "min-h-12 px-6 text-[15px]",
        size === "sm" && "min-h-10 px-4 text-sm",
        idle && "hk-btn-idle",
        className,
      )}
    >
      {children}
      <ArrowRight className="hk-btn-arrow size-4" aria-hidden />
    </button>
  );
}
