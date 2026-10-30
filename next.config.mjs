import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: ["@mediapipe/tasks-vision"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "interview-trix-public.s3.ap-south-1.amazonaws.com",
        pathname: "/blog/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        pathname: "/blog/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    /** Optional CloudFront base for public marketing videos (see scripts/configure-public-video-bucket-cors.sh) */
    NEXT_PUBLIC_VIDEO_CDN_BASE: process.env.NEXT_PUBLIC_VIDEO_CDN_BASE ?? "",
    /** Exposes Vercel deployment type to the client (preview vs production). */
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
  async redirects() {
    return [
      // Job search isn't offered any more; send old links and search results home.
      { source: "/ai-job-search", destination: "/", permanent: true },
      { source: "/ai-job-search/:path*", destination: "/", permanent: true },
      {
        source: "/dashboard/super-admin",
        destination: "/super-admin",
        permanent: true,
      },
      {
        source: "/dashboard/super-admin/:path*",
        destination: "/super-admin/:path*",
        permanent: true,
      },
      // Hackathon renamed to /hiring-games-hackathon-2026. Only page URLs move:
      // /hackathon-2026/*.webp etc. are still static assets under public/.
      {
        source: "/hackathon-2026",
        destination: "/hiring-games-hackathon-2026",
        permanent: true,
      },
      {
        source: "/hackathon-2026/:page(dashboard|profile)",
        destination: "/hiring-games-hackathon-2026/:page",
        permanent: true,
      },
      {
        source: "/hackathon-2026/reminders/:path*",
        destination: "/hiring-games-hackathon-2026/reminders/:path*",
        permanent: true,
      },
      {
        source: "/hackathon/hackathon-2026",
        destination: "/hackathon/hiring-games-hackathon-2026",
        permanent: true,
      },
      {
        source: "/hackathon/hackathon-2026/:path*",
        destination: "/hackathon/hiring-games-hackathon-2026/:path*",
        permanent: true,
      },
      {
        source: "/hackathon/hiring-games-hackathon-2026",
        destination: "/hiring-games-hackathon-2026",
        permanent: true,
      },
      {
        source: "/event-registration",
        destination: "/product-launch",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/captions/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "text/vtt; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
