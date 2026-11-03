/**
 * Save a PDF in the current tab. Mobile Chrome's PDF viewer (new tab + inline
 * Content-Disposition) often has no download control for cross-origin S3 URLs.
 */

const MAX_FILENAME_LEN = 180;

/**
 * A safe download name with exactly one extension: characters file systems reject are
 * dropped, spaces kept (single). A ".pdf" added twice ("Name.pdf.pdf") or a text file
 * named ".pdf" no longer happens.
 */
export function sanitizeDownloadFilename(input: string | undefined | null, ext: "pdf" | "txt"): string {
  const cleaned = (input ?? "")
    .trim()
    .replace(/(\.(pdf|txt))+$/i, "")
    .replace(/[•●▪◦·]/g, " ")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, " ")
    .replace(/_+/g, "_")
    .trim()
    .slice(0, MAX_FILENAME_LEN)
    .trim();
  return `${cleaned || "resume"}.${ext}`;
}

export function sanitizePdfFilename(input: string | undefined | null): string {
  return sanitizeDownloadFilename(input, "pdf");
}

/** The job a resume was last scored against (the ATS report's job summary), with its company. */
function scoredJob(atsFeedback: unknown): { role: string; company: string } | null {
  const job = (atsFeedback as { jobMatch?: { jobTitle?: unknown; companyName?: unknown } } | null | undefined)?.jobMatch;
  const role = typeof job?.jobTitle === "string" ? job.jobTitle.trim() : "";
  const company = typeof job?.companyName === "string" ? job.companyName.trim() : "";
  return role && company ? { role, company } : null;
}

/** Resumes tailored to a job are titled "Role · Company" (see tailoredResumeTitle). */
function tailoredJob(title?: string | null): { role: string; company: string } | null {
  const parts = (title ?? "").split(" · ").map((p) => p.trim());
  return parts.length === 2 && parts[0] && parts[1] ? { role: parts[0], company: parts[1] } : null;
}

export function resumePdfFilenameFromResume(input?: {
  title?: string | null;
  /** The ATS report: names the job (and company) when the resume was scored against a JD. */
  atsFeedback?: unknown;
  content?: {
    personalInfo?: {
      fullName?: string | null;
      portfolio?: string | null;
      jobTitle?: string | null;
    };
  };
} | null): string {
  // "Candidate Name - Role", plus " - Company" when the resume was tailored to a job: what a
  // recruiter scanning their downloads (or an ATS) expects to see.
  const pi = input?.content?.personalInfo;
  const name = pi?.fullName?.trim();
  if (name) {
    const job = tailoredJob(input?.title) ?? scoredJob(input?.atsFeedback);
    const role = (job?.role ?? pi?.portfolio ?? pi?.jobTitle)?.trim();
    return sanitizePdfFilename([name, role, job?.company].filter(Boolean).join(" - "));
  }
  // No name yet: a real title ("My Resume", "Untitled" say nothing), else the role.
  const title = input?.title?.trim();
  if (title && !isGenericResumeTitle(title)) return sanitizePdfFilename(title);
  return sanitizePdfFilename((pi?.portfolio ?? pi?.jobTitle)?.trim() || "resume");
}

/** Default / placeholder titles that shouldn't become the file name (same rule as the API). */
export function isGenericResumeTitle(title?: string | null): boolean {
  const t = (title ?? "").trim().toLowerCase().replace(/\s*\(\d+\)$/, "").replace(/\s+\d+$/, "");
  return !t || /^(my |new |untitled |copy of )?(resume|cv)$|^untitled( resume)?$/.test(t);
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
  const safeName = sanitizeDownloadFilename(filename, /\.txt$/i.test(filename.trim()) ? "txt" : "pdf");
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

export async function fetchPdfBlobFromUrl(url: string): Promise<Blob> {
  try {
    return await fetchPdfBlob(url);
  } catch {
    const proxy = `/api/proxy-pdf?url=${encodeURIComponent(url)}`;
    return fetchPdfBlob(proxy);
  }
}

/**
 * Download a (usually S3-presigned) PDF URL without opening a new tab.
 * Tries a direct fetch, then the same-origin `/api/proxy-pdf` fallback.
 */
export async function downloadPdfFromUrl(
  url: string,
  filename: string,
): Promise<Blob | null> {
  const safeName = sanitizePdfFilename(filename);

  try {
    const blob = await fetchPdfBlob(url);
    triggerBlobDownload(blob, safeName);
    return blob;
  } catch {
    // Cross-origin S3 often blocks browser GET without CORS.
  }

  const proxy = `/api/proxy-pdf?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeName)}`;
  try {
    const blob = await fetchPdfBlob(proxy);
    triggerBlobDownload(blob, safeName);
    return blob;
  } catch {
    clickDownloadAnchor(proxy, safeName);
    return null;
  }
}
