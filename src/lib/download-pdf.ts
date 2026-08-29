/**
 * Save a PDF in the current tab. Mobile Chrome's PDF viewer (new tab + inline
 * Content-Disposition) often has no download control for cross-origin S3 URLs.
 */

const MAX_FILENAME_LEN = 180;

export function sanitizePdfFilename(input: string | undefined | null): string {
  const trimmed = (input ?? "").trim();
  const withoutExt = trimmed.replace(/\.pdf$/i, "");
  const cleaned = withoutExt
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s/g, "_")
    .split("_")
    .filter(Boolean)
    .join("_")
    .slice(0, MAX_FILENAME_LEN);
  return `${cleaned || "resume"}.pdf`;
}

export function resumePdfFilenameFromResume(input?: {
  title?: string | null;
  content?: {
    personalInfo?: {
      fullName?: string | null;
      portfolio?: string | null;
      jobTitle?: string | null;
    };
  };
} | null): string {
  const pi = input?.content?.personalInfo;
  const name = pi?.fullName?.trim();
  const role = (pi?.portfolio ?? pi?.jobTitle)?.trim();
  const fromPerson = [name, role].filter(Boolean).join("_");
  return sanitizePdfFilename(fromPerson || input?.title || "resume");
}

function clickDownloadAnchor(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Trigger a native file download from an in-memory blob (same-origin). */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const safeName = sanitizePdfFilename(filename);
  const objectUrl = URL.createObjectURL(blob);
  clickDownloadAnchor(objectUrl, safeName);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
}

async function fetchPdfBlob(src: string): Promise<Blob> {
  const res = await fetch(src, { mode: "cors", credentials: "omit" });
  if (!res.ok) {
    throw new Error(`PDF fetch failed (${res.status})`);
  }
  return res.blob();
}

/**
 * Download a (usually S3-presigned) PDF URL without opening a new tab.
 * Tries a direct fetch, then the same-origin `/api/proxy-pdf` fallback.
 */
export async function downloadPdfFromUrl(
  url: string,
  filename: string,
): Promise<void> {
  const safeName = sanitizePdfFilename(filename);

  try {
    triggerBlobDownload(await fetchPdfBlob(url), safeName);
    return;
  } catch {
    // Cross-origin S3 often blocks browser GET without CORS.
  }

  const proxy = `/api/proxy-pdf?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeName)}`;
  try {
    triggerBlobDownload(await fetchPdfBlob(proxy), safeName);
    return;
  } catch {
    // Last resort: navigate the same-origin proxy (attachment headers).
    clickDownloadAnchor(proxy, safeName);
  }
}
