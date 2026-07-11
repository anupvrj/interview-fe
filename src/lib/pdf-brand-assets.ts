/** Cached data URI for PDF / Puppeteer HTML (no external fetch at render time). */
let logoDataUriCache: string | null = null;

/**
 * Load InterviewTrix wordmark as a base64 data URI for inline PDF HTML.
 * Puppeteer on the server cannot resolve relative `/brand/...` paths from the client bundle.
 */
export async function getInterviewTrixLogoDataUri(): Promise<string> {
  if (logoDataUriCache) return logoDataUriCache;

  const res = await fetch("/brand/interviewtrix-logo.png");
  if (!res.ok) {
    throw new Error("Could not load InterviewTrix logo for PDF");
  }

  const blob = await res.blob();
  logoDataUriCache = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not encode logo for PDF"));
    };
    reader.onerror = () => reject(new Error("Could not read logo for PDF"));
    reader.readAsDataURL(blob);
  });

  return logoDataUriCache;
}
