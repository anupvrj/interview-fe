import { getSiteUrl } from "@/lib/seo/site-url";
import { marketingVideos } from "@/lib/seo/marketing-video-content";
import { secondsToVideoSitemapDuration } from "@/lib/seo/video-duration";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteAssetUrl(path: string): string {
  const siteUrl = getSiteUrl();
  if (path.startsWith("http")) return path;
  return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function GET() {
  const siteUrl = getSiteUrl();

  const urls = marketingVideos
    .map((video) => {
      const loc =
        video.pagePath === "/"
          ? `${siteUrl}/`
          : `${siteUrl}${video.pagePath}`;

      return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(absoluteAssetUrl(video.thumbnailUrl))}</video:thumbnail_loc>
      <video:title>${escapeXml(video.name)}</video:title>
      <video:description>${escapeXml(video.description)}</video:description>
      <video:content_loc>${escapeXml(video.videoUrl)}</video:content_loc>
      <video:player_loc allow_embed="yes">${escapeXml(video.embedUrl)}</video:player_loc>
      <video:duration>${secondsToVideoSitemapDuration(video.durationSeconds)}</video:duration>
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
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
