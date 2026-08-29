/**
 * Same-origin PDF proxy so mobile browsers can save a file instead of opening
 * a cross-origin S3 URL in Chrome's PDF viewer (no download control).
 *
 * Usage: /api/proxy-pdf?url=<encoded-s3-url>&filename=Name.pdf
 */

import { NextRequest, NextResponse } from "next/server";
import { isAllowedAssetProxyUrl } from "@/lib/allowed-asset-proxy-url";
import { sanitizePdfFilename } from "@/lib/download-pdf";

function attachmentContentDisposition(filename: string): string {
  const ascii = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_")
    .slice(0, 200);
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: NextRequest) {
  try {
    const pdfUrl = request.nextUrl.searchParams.get("url");
    const filename = sanitizePdfFilename(
      request.nextUrl.searchParams.get("filename"),
    );

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 },
      );
    }

    let targetUrl = pdfUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      try {
        targetUrl = decodeURIComponent(pdfUrl);
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
            "URL not allowed - only S3 and CloudFront PDF URLs are permitted",
        },
        { status: 403 },
      );
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResumeProxy/1.0)",
        Accept: "application/pdf,*/*",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status}` },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") || "application/pdf";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": attachmentContentDisposition(filename),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Proxy PDF error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
