"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type SeoVideoPlayerProps = Readonly<{
  videoUrl: string;
  title: string;
  thumbnailUrl?: string;
  captionsUrl?: string;
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
 * crossOrigin="anonymous" enables WebVTT captions when served from another origin.
 */
export function SeoVideoPlayer({
  videoUrl,
  title,
  thumbnailUrl,
  captionsUrl,
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
        poster={thumbnailUrl}
        title={title}
        className="h-auto w-full object-contain"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        controls={controls}
        preload={preload}
        crossOrigin={captionsUrl ? "anonymous" : undefined}
        aria-label={title}
      >
        {captionsUrl ? (
          <track
            kind="captions"
            srcLang="en"
            label="English captions"
            src={captionsUrl}
            default
          />
        ) : null}
      </video>
      {children}
    </div>
  );
}
