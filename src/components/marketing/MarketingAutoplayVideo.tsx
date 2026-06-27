"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketingVideoAsset } from "@/lib/marketing-videos";
import { cn } from "@/lib/utils";

type MarketingAutoplayVideoProps = Readonly<{
  asset: MarketingVideoAsset;
  poster?: string;
  className?: string;
  ariaLabel: string;
  children?: React.ReactNode;
}>;

export function MarketingAutoplayVideo({
  asset,
  poster,
  className,
  ariaLabel,
  children,
}: MarketingAutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) throw new Error("Missing API URL");

        const response = await fetch(
          `${apiBase}/marketing/videos?asset=${encodeURIComponent(asset)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Failed to load video URL");

        const data = (await response.json()) as { url?: string };
        if (!data.url) throw new Error("Missing signed video URL");
        if (!cancelled) setSrc(data.url);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [asset]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const play = () => {
      void video.play().catch(() => {});
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <video
        ref={videoRef}
        src={src ?? undefined}
        poster={poster}
        className="h-auto w-full object-contain"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={ariaLabel}
      />
      {failed && !src ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 text-sm text-muted-foreground">
          Video unavailable
        </div>
      ) : null}
      {children}
    </div>
  );
}
