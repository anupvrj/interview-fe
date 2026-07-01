import { getSiteUrl } from "./site-url";

export type VideoObjectSchemaInput = {
  /** Stable id used for JSON-LD @id and DOM anchors */
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  videoUrl: string;
  embedUrl: string;
  transcript: string;
  captionsUrl?: string;
  duration?: string;
};

export function buildVideoObjectSchema(input: VideoObjectSchemaInput) {
  const siteUrl = getSiteUrl();
  const absoluteThumbnail = input.thumbnailUrl.startsWith("http")
    ? input.thumbnailUrl
    : `${siteUrl}${input.thumbnailUrl.startsWith("/") ? "" : "/"}${input.thumbnailUrl}`;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${input.embedUrl}#${input.id}`,
    name: input.name,
    description: input.description,
    thumbnailUrl: absoluteThumbnail,
    uploadDate: input.uploadDate,
    contentUrl: input.videoUrl,
    embedUrl: input.embedUrl,
    transcript: input.transcript,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "Interview Trix",
      url: siteUrl,
    },
    ...(input.duration ? { duration: input.duration } : {}),
    ...(input.captionsUrl
      ? {
          caption: {
            "@type": "MediaObject",
            contentUrl: input.captionsUrl.startsWith("http")
              ? input.captionsUrl
              : `${siteUrl}${input.captionsUrl.startsWith("/") ? "" : "/"}${input.captionsUrl}`,
            encodingFormat: "text/vtt",
          },
        }
      : {}),
  };
}
