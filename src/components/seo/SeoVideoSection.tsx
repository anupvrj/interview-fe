"use client";

import { cn } from "@/lib/utils";
import type { MarketingVideoContent } from "@/lib/seo/marketing-video-content";
import { SeoVideoJsonLd } from "./SeoVideoJsonLd";
import { SeoVideoPlayer } from "./SeoVideoPlayer";

export type SeoVideoSectionProps = Readonly<{
  content: MarketingVideoContent;
  /** Hero: player only. Feature: same player layout (transcript always SEO-hidden). */
  variant?: "hero" | "feature";
  className?: string;
  playerClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  captionsUrl?: string;
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
  captionsUrl,
  children,
}: SeoVideoSectionProps) {
  const headingId = `${content.id}-heading`;
  const transcriptId = `${content.id}-transcript`;

  return (
    <section
      className={cn("min-w-0", className)}
      aria-labelledby={headingId}
      itemScope
      itemType="https://schema.org/VideoObject"
    >
      <SeoVideoJsonLd
        id={content.id}
        name={content.name}
        description={content.description}
        thumbnailUrl={content.thumbnailUrl}
        uploadDate={content.uploadDate}
        videoUrl={content.videoUrl}
        embedUrl={content.embedUrl}
        transcript={content.transcript}
        duration={content.duration}
        captionsUrl={captionsUrl ?? content.captionsUrl}
      />

      <meta itemProp="name" content={content.name} />
      <meta itemProp="description" content={content.description} />
      <meta itemProp="contentUrl" content={content.videoUrl} />
      <meta itemProp="embedUrl" content={content.embedUrl} />
      <meta itemProp="uploadDate" content={content.uploadDate} />
      <meta itemProp="transcript" content={content.transcript} />
      {content.duration ? (
        <meta itemProp="duration" content={content.duration} />
      ) : null}

      <h2 id={headingId} className="sr-only">
        {content.name}
      </h2>

      <SeoVideoPlayer
        videoUrl={content.videoUrl}
        title={content.name}
        thumbnailUrl={content.thumbnailUrl}
        captionsUrl={captionsUrl ?? content.captionsUrl}
        className={playerClassName}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
      >
        {children}
      </SeoVideoPlayer>

      {/* Transcript: in DOM + JSON-LD for crawlers/AEO; sr-only keeps it out of the visual UX. */}
      <div id={transcriptId} className="sr-only">
        <h3>Video transcript</h3>
        <p itemProp="transcript">{content.transcript}</p>
      </div>
    </section>
  );
}
