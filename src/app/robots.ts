import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com";

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
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/video-sitemap.xml`],
  };
}
