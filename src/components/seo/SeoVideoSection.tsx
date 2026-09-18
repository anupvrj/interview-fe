"use client";

import { cn } from "@/lib/utils";
import type { MarketingVideoContent } from "@/lib/seo/marketing-video-content";
import { SeoVideoPlayer } from "./SeoVideoPlayer";

export type SeoVideoSectionProps = Readonly<{
  content: MarketingVideoContent;
  /** Hero: player only. Feature: same player layout. Transcripts stay in JSON-LD only. */
  variant?: "hero" | "feature";
  className?: string;
  playerClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  children?: React.ReactNode;
}>;

export function SeoVideoSection({
  content,
  className,
  playerClassName,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = false,
  children,
}: SeoVideoSectionProps) {
  const headingId = `${content.id}-heading`;

  return (
    <section
      className={cn("min-w-0", className)}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="sr-only">
        {content.name}
      </h2>

      <SeoVideoPlayer
        videoUrl={content.videoUrl}
        title={content.name}
        thumbnailUrl={content.thumbnailUrl}
        className={playerClassName}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
      >
        {children}
      </SeoVideoPlayer>
    </section>
  );
}
