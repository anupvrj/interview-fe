import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  blue: "border-[#2a64b0]/80 from-[#0f2a52]/90 to-[#0a1b36]/90 text-[#6fc0ff]",
  amber: "border-[#8a6a20]/80 from-[#2e2410]/90 to-[#1a150b]/90 text-[#ffc44d]",
  rose: "border-[#8a3560]/80 from-[#2e1330]/90 to-[#1a0f24]/90 text-[#ff5f97]",
  teal: "border-[#1f8a82]/80 from-[#0c3238]/90 to-[#0a1f2b]/90 text-[#4ee6cf]",
} as const;

export function PhaseNotice({
  icon: Icon,
  title,
  message,
  tone = "blue",
  children,
  className,
}: Readonly<{
  icon: LucideIcon;
  title: string;
  message?: React.ReactNode;
  tone?: keyof typeof TONES;
  children?: React.ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-2xl rounded-[28px] border bg-gradient-to-b px-6 py-10 text-center backdrop-blur-sm sm:px-10",
        TONES[tone],
        className,
      )}
    >
      <span className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Icon className="size-8" strokeWidth={1.9} aria-hidden />
      </span>
      <h1 className="text-[clamp(1.6rem,3.6vw,2.3rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
        {title}
      </h1>
      {message ? <div className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-[#cfdbe8]">{message}</div> : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}
