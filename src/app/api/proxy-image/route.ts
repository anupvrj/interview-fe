/**
 * Image Proxy for html2canvas
 *
 * html2canvas cannot load cross-origin images (e.g. S3) due to CORS.
 * This API fetches the image server-side and returns it, making it same-origin for the client.
 *
 * Usage: /api/proxy-image?url=<encoded-image-url>
 */

import { NextRequest, NextResponse } from "next/server";
import { isAllowedAssetProxyUrl } from "@/lib/allowed-asset-proxy-url";

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

    if (!isAllowedAssetProxyUrl(targetUrl)) {
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
