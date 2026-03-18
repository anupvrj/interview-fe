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
    // Allow S3 buckets: bucket.s3.amazonaws.com, bucket.s3.region.amazonaws.com
    return (
      host.endsWith(".s3.amazonaws.com") ||
      host.endsWith(".s3.ap-south-1.amazonaws.com") ||
      /\.s3\.[a-z0-9-]+\.amazonaws\.com$/.test(host)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 },
      );
    }

    const decodedUrl = decodeURIComponent(imageUrl);

    if (!decodedUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid URL - must be http(s)" },
        { status: 400 },
      );
    }

    if (!isAllowedUrl(decodedUrl)) {
      return NextResponse.json(
        { error: "URL not allowed - only S3 domains permitted" },
        { status: 403 },
      );
    }

    const response = await fetch(decodedUrl, {
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
