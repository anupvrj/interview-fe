import {
  buildVideoObjectSchema,
  type VideoObjectSchemaInput,
} from "@/lib/seo/video-object-schema";

type SeoVideoJsonLdScriptProps = Readonly<VideoObjectSchemaInput>;

/**
 * Server-rendered VideoObject JSON-LD in the initial HTML (visible to Googlebot
 * without waiting for client JS). Prefer this in route layouts over client Script tags.
 */
export function SeoVideoJsonLdScript(props: SeoVideoJsonLdScriptProps) {
  const schema = buildVideoObjectSchema(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
