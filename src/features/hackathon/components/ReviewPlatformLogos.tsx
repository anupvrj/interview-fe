import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/** Brand marks in /public/review-logos */

export function ProductHuntLogo({ className }: Readonly<{ className?: string }>) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {/* Logo file already includes the white wordmark panel — no extra white pill. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset in public/ */}
      <img
        src="/brand/producthunt-j-logo.png"
        alt=""
        aria-hidden
        width={350}
        height={69}
        className="h-[1.6rem] w-auto max-w-[min(100%,10.24rem)] object-contain shadow-sm ring-1 ring-white/10 sm:h-[1.76rem] sm:max-w-[11.52rem]"
      />
      <ExternalLink
        className="size-3.5 shrink-0 text-[#6fc0ff] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden
      />
    </span>
  );
}

export function CapterraLogo({ className }: Readonly<{ className?: string }>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset in public/
    <img
      src="/review-logos/capterra.png"
      alt=""
      aria-hidden
      width={480}
      height={480}
      className={cn("size-full object-contain p-1", className)}
    />
  );
}
