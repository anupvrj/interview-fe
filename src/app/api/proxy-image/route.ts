/**
 * Image Proxy for html2canvas
 *
 * html2canvas cannot load cross-origin images (e.g. S3) due to CORS.
 * This API fetches the image server-side and returns it, making it same-origin for the client.
 *
 * Usage: /api/proxy-image?url=<encoded-image-url>
 */

import { NextRequest, NextResponse } from "next/server";

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // CloudFront (common for S3-backed assets; profile pics often use signed CF URLs)
    if (host.endsWith(".cloudfront.net")) {
      return true;
    }

    // Virtual-hosted–style: bucket.s3.amazonaws.com, bucket.s3.region.amazonaws.com
    if (
      host.endsWith(".s3.amazonaws.com") ||
      /\.s3\.[a-z0-9-]+\.amazonaws\.com$/i.test(host)
    ) {
      return true;
    }

    // Dual-stack virtual-hosted: bucket.s3.dualstack.region.amazonaws.com
    if (/\.s3\.dualstack\.[a-z0-9-]+\.amazonaws\.com$/i.test(host)) {
      return true;
    }

    // Path-style regional endpoints: s3.region.amazonaws.com, s3.dualstack.region.amazonaws.com
    if (
      host === "s3.amazonaws.com" ||
      /^s3\.(dualstack\.)?[a-z0-9-]+\.amazonaws\.com$/i.test(host)
    ) {
      return true;
    }

    // Transfer Acceleration
    if (host.endsWith(".s3-accelerate.amazonaws.com")) {
      return true;
    }

    // next dev: MinIO / local S3-compatible endpoints
    if (process.env.NODE_ENV === "development") {
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".localhost")
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const imageUrl = request.nextUrl.searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 },
      );
    }

    // searchParams are already decoded once. decodeURIComponent() again breaks AWS
    // presigned URLs (signatures use %-encoding that must stay exact).
    let targetUrl = imageUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      try {
        targetUrl = decodeURIComponent(imageUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid url parameter" },
          { status: 400 },
        );
      }
    }

    if (!targetUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid URL - must be http(s)" },
        { status: 400 },
      );
    }

    if (!isAllowedUrl(targetUrl)) {
      return NextResponse.json(
        {
          error:
            "URL not allowed - only S3 and CloudFront image URLs are permitted",
        },
        { status: 403 },
      );
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResumeProxy/1.0)",
        Accept: "image/*",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
