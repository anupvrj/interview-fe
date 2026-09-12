"use client";

import { useEffect, useRef } from "react";
import { getAbsoluteAssetUrl } from "@/lib/seo/site-url";
import { cn } from "@/lib/utils";

export type SeoVideoPlayerProps = Readonly<{
  videoUrl: string;
  title: string;
  thumbnailUrl?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  children?: React.ReactNode;
}>;

/**
 * HTML5 video player tuned for public S3 / CloudFront byte-range streaming.
 * Captions/transcripts are kept in JSON-LD only — not rendered on the video.
 */
export function SeoVideoPlayer({
  videoUrl,
  title,
  thumbnailUrl,
  className,
  autoPlay = false,
  loop = false,
  muted = false,
  playsInline = true,
  controls = false,
  preload = "metadata",
  children,
}: SeoVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!autoPlay) return;

    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      void video.play().catch(() => {});
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [autoPlay, videoUrl]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl ? getAbsoluteAssetUrl(thumbnailUrl) : undefined}
        title={title}
        className="h-auto w-full object-contain"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        controls={controls}
        preload={preload}
        aria-label={title}
      />
      {children}
    </div>
  );
}
