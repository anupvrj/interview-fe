import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Hackathon edition of the InterviewTrix logo (recoloured from /brand/interviewtrix-logo.png):
 * gradient iX + white "Interview" + gradient "Trix". Trimmed, intrinsic 1039×214.
 */
const LOGO = { src: "/brand/hackathon-logo.png", width: 1039, height: 214 } as const;
/** iX mark cut from the same artwork, for tight headers. Intrinsic 236×214. */
const MARK = { src: "/brand/hackathon-logo-mark.png", width: 236, height: 214 } as const;

/** Rendered logo height in px; width follows the artwork's aspect ratio. */
const SIZES = {
  sm: 28,
  md: 34,
  lg: 42,
} as const;

/**
 * Hackathon brand logo. The artwork is trimmed to its content (no padding),
 * so the given height is the visible logo height.
 */
export function HackathonBrand({
  size = "md",
  className,
  iconOnlyOnMobile = false,
  priority = false,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  /** Show only the iX mark below `sm` (for very tight headers). */
  iconOnlyOnMobile?: boolean;
  priority?: boolean;
}) {
  const h = SIZES[size];
  const w = Math.round((h * LOGO.width) / LOGO.height);
  const markH = Math.max(28, h);
  const markW = Math.round((markH * MARK.width) / MARK.height);

  return (
    <span className={cn("inline-flex items-center", className)}>
      {iconOnlyOnMobile ? (
        <Image
          src={MARK.src}
          alt="InterviewTrix"
          width={markW}
          height={markH}
          priority={priority}
          className="shrink-0 sm:hidden"
          style={{ width: markW, height: markH }}
        />
      ) : null}
      <Image
        src={LOGO.src}
        alt="InterviewTrix"
        width={w}
        height={h}
        priority={priority}
        className={cn("shrink-0", iconOnlyOnMobile && "hidden sm:block")}
        style={{ width: w, height: h }}
      />
    </span>
  );
}
