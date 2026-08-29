/**
 * Allowlist for Next.js asset proxies (images, PDFs) that fetch S3 / CloudFront
 * server-side so the browser can treat the response as same-origin.
 */
export function isAllowedAssetProxyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.endsWith(".cloudfront.net")) {
      return true;
    }

    if (
      host.endsWith(".s3.amazonaws.com") ||
      /\.s3\.[a-z0-9-]+\.amazonaws\.com$/i.test(host)
    ) {
      return true;
    }

    if (/\.s3\.dualstack\.[a-z0-9-]+\.amazonaws\.com$/i.test(host)) {
      return true;
    }

    if (
      host === "s3.amazonaws.com" ||
      /^s3\.(dualstack\.)?[a-z0-9-]+\.amazonaws\.com$/i.test(host)
    ) {
      return true;
    }

    if (host.endsWith(".s3-accelerate.amazonaws.com")) {
      return true;
    }

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
