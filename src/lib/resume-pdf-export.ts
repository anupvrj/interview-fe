/**
 * Server-side resume PDF (Puppeteer on interview-core) — same HTML/CSS as preview,
 * rendered with headless Chrome instead of html2canvas bitmaps.
 */

import { resumeApi } from "@/lib/api";

/** Mirrors globals.css rich-text rules so TipTap `.prose` content matches in PDF. */
const RICH_TEXT_PROSE_CSS = `
  .prose strong { font-weight: bold; }
  .prose em { font-style: italic; }
  .prose u { text-decoration: underline; }
  .prose ul {
    list-style-type: disc;
    padding-left: 20px !important;
    margin-left: 4px !important;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .prose ol {
    list-style-type: decimal;
    padding-left: 20px !important;
    margin-left: 4px !important;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .prose ul li,
  .prose ol li {
    padding-left: 4px !important;
    margin-left: 0 !important;
    margin-top: 0.25rem !important;
    margin-bottom: 0.25rem !important;
    list-style-position: outside;
    line-height: 1.5;
  }
  .prose ul, .prose ol { padding-inline-start: 20px !important; }
  .prose h1 { font-size: 1.5rem; font-weight: bold; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .prose h2 { font-size: 1.25rem; font-weight: bold; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .prose h3 { font-size: 1.125rem; font-weight: bold; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .prose p { margin-top: 0.5rem; margin-bottom: 0.5rem; }
`;

export async function fetchTemplateCssForPdf(templateId: string): Promise<string> {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const base = `${origin}/resume-templates/${templateId}/style.css`;

  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Template CSS not found (${res.status}): ${base}. Run npm run copy-template-css before build.`,
    );
  }
  let css = await res.text();

  if (templateId === "mercury") {
    try {
      const ov = await fetch(
        `${origin}/resume-templates/mercury/mercury-overrides.css`,
        { cache: "no-store" },
      );
      if (ov.ok) {
        css += `\n/* mercury editor overrides */\n${await ov.text()}`;
      }
    } catch {
      /* optional */
    }
  }

  return `${css}\n${RICH_TEXT_PROSE_CSS}`;
}

/**
 * Serialize paginated `.resume-page` nodes for Puppeteer: strip preview-only chrome
 * (shadow, gap margin). Each page is already A4 (210×297mm) with gutters from
 * `resume.layout.padding` in the DOM — the API uses @page margin 0 for this HTML.
 *
 * `padding` in the request body is kept for legacy HTML-only PDFs; snapshot exports
 * are normalized on the server when `resume-page` is present.
 */
export function serializeResumePagesHtml(pages: HTMLElement[]): string {
  return pages
    .map((page) => {
      const clone = page.cloneNode(true) as HTMLElement;
      clone.style.boxShadow = "none";
      clone.style.marginBottom = "0";
      return clone.outerHTML;
    })
    .join("\n");
}

export interface GenerateResumePdfServerParams {
  resumeId: string;
  templateId: string;
  pageElements: HTMLElement[];
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Generate PDF via API (Puppeteer). Returns presigned download URL.
 */
export async function generateResumePdfViaServer(
  params: GenerateResumePdfServerParams,
): Promise<{ downloadUrl: string; s3Key: string }> {
  const { resumeId, templateId, pageElements, padding } = params;
  const templateCSS = await fetchTemplateCssForPdf(templateId);
  const htmlContent = serializeResumePagesHtml(pageElements);
  return resumeApi.generatePDF(resumeId, htmlContent, padding, templateCSS);
}
