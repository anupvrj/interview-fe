const DEFAULT_S3_VIDEO_ORIGIN =
  "https://interview-trix-public.s3.ap-south-1.amazonaws.com/videos";

/**
 * Prefer CloudFront (or another CDN) when `NEXT_PUBLIC_VIDEO_CDN_BASE` is set.
 * Example: https://d111111abcdef8.cloudfront.net/videos
 */
export function getPublicVideoUrl(filename: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_VIDEO_CDN_BASE?.replace(/\/$/, "");
  if (cdnBase) {
    return `${cdnBase}/${filename.replace(/^\//, "")}`;
  }
  return `${DEFAULT_S3_VIDEO_ORIGIN}/${filename.replace(/^\//, "")}`;
}

export function getDefaultVideoOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_VIDEO_CDN_BASE?.replace(/\/$/, "") ??
    DEFAULT_S3_VIDEO_ORIGIN
  );
}
