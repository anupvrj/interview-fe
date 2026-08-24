import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    domains: ["img.clerk.com"],
    remotePatterns: [
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
