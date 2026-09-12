import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/** Known assets with correct intrinsic dimensions for `next/image`. */
const PRESETS = {
  /** Full-color wordmark (transparent PNG) */
  default: { src: "/brand/interviewtrix-logo.png", width: 1067, height: 234 },
  /** Wordmark on dark backgrounds (e.g. sidebar) */
  white: { src: "/brand/interviewtrix-logo.png", width: 1067, height: 234 },
  /** Footer wordmark on dark backgrounds */
  footer: {
    src: "/brand/interview-trix-logo-footer.png",
    width: 2144,
    height: 733,
  },
  /** Wordmark on soft / gradient panels (auth marketing column) */
  onLightBg: { src: "/brand/interviewtrix-logo.png", width: 1067, height: 234 },
  /** Square mark for compact UI */
  icon: { src: "/brand/interviewtrix-icon.png", width: 269, height: 269 },
} as const;

export type InterviewTrixLogoVariant = keyof typeof PRESETS;

export interface InterviewTrixLogoProps
  extends Omit<ImageProps, "src" | "width" | "height" | "alt"> {
  /** Preset asset; ignored when `asset` is set */
  variant?: InterviewTrixLogoVariant;
  /** Custom path and dimensions (e.g. new file before adding a preset) */
  asset?: { src: string; width: number; height: number };
  alt?: string;
}

/**
 * Brand wordmark. Prefer `variant`; use `asset` for one-off files.
 * Control size with `className` (e.g. `h-7 sm:h-8 lg:h-10 w-auto`).
 */
export function InterviewTrixLogo({
  variant = "default",
  asset,
  className,
  alt = "InterviewTrix",
  ...props
}: InterviewTrixLogoProps) {
  const resolved = asset ?? PRESETS[variant];
  return (
    <Image
      src={resolved.src}
      alt={alt}
      width={resolved.width}
      height={resolved.height}
      className={cn("w-auto", className)}
      {...props}
    />
  );
}
