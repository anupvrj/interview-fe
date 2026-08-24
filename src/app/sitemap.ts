import { MetadataRoute } from "next";
import { getSiteUrl, isSearchIndexable } from "@/lib/seo/site-url";
import { fetchBlogSitemapEntries } from "@/lib/blog/server";
import {
  ALL_MARKETING_ROUTES,
  marketingRouteToSitemapEntry,
} from "@/lib/seo/marketing-routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSearchIndexable()) {
    return [];
  }

  const baseUrl = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...ALL_MARKETING_ROUTES.map((route) =>
      marketingRouteToSitemapEntry(route, baseUrl),
    ),
  ];

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchBlogSitemapEntries();
    blogEntries = posts.map((post) => ({
      url: `${baseUrl}/blogs/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    blogEntries = [];
  }

  return [...staticEntries, ...blogEntries];
}
