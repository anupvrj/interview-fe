import { fetchPublishedBlogs } from "@/lib/blog/server";
import { getSiteUrl } from "@/lib/seo/site-url";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();
  let items: Awaited<ReturnType<typeof fetchPublishedBlogs>>["items"] = [];

  try {
    const data = await fetchPublishedBlogs({ page: 1, limit: 100 });
    items = data.items;
  } catch {
    items = [];
  }

  const rssItems = items
    .map((post) => {
      const link = `${siteUrl}/blogs/${post.slug}`;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${post.thumbnailUrl ? `<enclosure url="${escapeXml(post.thumbnailUrl)}" type="image/jpeg" />` : ""}
      ${post.categories.map((c) => `<category>${escapeXml(c)}</category>`).join("\n      ")}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Interview Trix Blog</title>
    <link>${siteUrl}/blogs</link>
    <description>Expert guides on AI interview preparation, resume optimization, and career growth.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blogs/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
