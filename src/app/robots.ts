import { MetadataRoute } from "next";
import { getSiteUrl, isSearchIndexable } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexable()) {
    return {
      rules: [
        { userAgent: "*", disallow: "/" },
        { userAgent: "Googlebot", disallow: "/" },
      ],
    };
  }

  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/*", "/api/*", "/onboarding", "/(auth)/*"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/dashboard/*", "/api/*", "/onboarding", "/(auth)/*"],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/video-sitemap.xml`,
      `${baseUrl}/blogs/rss.xml`,
    ],
  };
}
