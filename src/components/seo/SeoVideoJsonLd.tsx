import Script from "next/script";
import {
  buildVideoObjectSchema,
  type VideoObjectSchemaInput,
} from "@/lib/seo/video-object-schema";

type SeoVideoJsonLdProps = Readonly<VideoObjectSchemaInput>;

/**
 * Renders Schema.org VideoObject JSON-LD for search engines and AI answer engines.
 * Safe serialization — JSON.stringify escapes script-breaking characters.
 */
export function SeoVideoJsonLd(props: SeoVideoJsonLdProps) {
  const schema = buildVideoObjectSchema(props);

  return (
    <Script
      id={`video-object-jsonld-${props.id}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
