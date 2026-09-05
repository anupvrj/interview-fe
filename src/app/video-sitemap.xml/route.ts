import {
  marketingVideos,
  getMarketingVideoOpenGraphImage,
} from "@/lib/seo/marketing-video-content";
import { getSiteUrl, isSearchIndexable } from "@/lib/seo/site-url";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  if (!isSearchIndexable()) {
    return new Response("Not found", { status: 404 });
  }

  const siteUrl = getSiteUrl();

  const entries = marketingVideos
    .map((video) => {
      const pageUrl = `${siteUrl}${video.pagePath}`;
      const thumbnail = getMarketingVideoOpenGraphImage(video).url;

      return `
  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbnail)}</video:thumbnail_loc>
      <video:title>${escapeXml(video.name)}</video:title>
      <video:description>${escapeXml(video.description)}</video:description>
      <video:content_loc>${escapeXml(video.videoUrl)}</video:content_loc>
      <video:player_loc>${escapeXml(video.embedUrl)}</video:player_loc>
      <video:duration>${video.durationSeconds}</video:duration>
      <video:publication_date>${escapeXml(video.uploadDate)}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:live>no</video:live>
    </video:video>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
