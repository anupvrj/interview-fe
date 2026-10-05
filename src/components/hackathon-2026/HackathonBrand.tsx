import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { icon: 32, text: "text-[18px]" },
  md: { icon: 42, text: "text-[22px]" },
  lg: { icon: 48, text: "text-[25px]" },
} as const;

/**
 * Site icon + live-text wordmark. The icon asset is tightly cropped (unlike the
 * padded wordmark PNG), so it renders at its full box size and stays crisp.
 */
export function HackathonBrand({
  size = "md",
  className,
  iconOnlyOnMobile = false,
  priority = false,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  /** Hide the wordmark below `sm` (for very tight headers). */
  iconOnlyOnMobile?: boolean;
  priority?: boolean;
}) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/interviewtrix-icon.png"
        alt=""
        width={s.icon}
        height={s.icon}
        priority={priority}
        className="shrink-0 drop-shadow-[0_0_14px_rgba(124,92,255,0.45)]"
        style={{ width: s.icon, height: s.icon }}
      />
      <span
        className={cn(
          "font-extrabold leading-none tracking-[-0.03em] text-white",
          s.text,
          iconOnlyOnMobile && "hidden sm:inline",
        )}
      >
        Interview<span className="text-[#8f7bff]">Trix</span>
      </span>
    </span>
  );
}
