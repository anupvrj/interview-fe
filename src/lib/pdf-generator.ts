/**
 * Client-side PDF Generator
 * Generates PDFs from HTML elements using html2canvas and jspdf
 * This ensures the PDF matches exactly what the user sees in the preview
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface PDFGenerationOptions {
  filename?: string;
  format?: string;
  margin?: number | [number, number, number, number];
  orientation?: "portrait" | "landscape";
}

/**
 * Generate PDF from multiple HTML page elements
 * @param pageElements - Array of HTML elements representing each page
 * @param options - PDF generation options
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generatePDFFromPages(
  pageElements: HTMLElement[],
  _options: PDFGenerationOptions = {},
): Promise<Blob> {
  const rewriteExternalImageSources = (
    root: HTMLElement,
    proxyBase: string,
    origin: string,
  ) => {
    const imgs = root.querySelectorAll("img[src]");
    imgs.forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("http") && !src.startsWith(origin)) {
        img.setAttribute("src", `${proxyBase}?url=${encodeURIComponent(src)}`);
      }
    });
  };

  const waitForImagesToLoad = async (root: HTMLElement) => {
    const images = root.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight > 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(() => resolve(), 5000);
            }
          }),
      ),
    );
  };

  try {
    if (pageElements.length === 0) {
      throw new Error("No page elements provided");
    }

    // A4 dimensions in mm
    const a4Width = 210;

    // Create PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Process each page
    for (let i = 0; i < pageElements.length; i++) {
      const pageElement = pageElements[i];

      // Clone the element to avoid modifying the original
      const clonedElement = pageElement.cloneNode(true) as HTMLElement;
      clonedElement.setAttribute("data-pdf-capture-root", "true");

      // Replace cross-origin image URLs with proxy BEFORE html2canvas (avoids CORS)
      const proxyBase =
        typeof window !== "undefined"
          ? `${window.location.origin}/api/proxy-image`
          : "";
      rewriteExternalImageSources(
        clonedElement,
        proxyBase,
        window.location.origin,
      );

      // Remove any shadows, transforms, or margins that might affect rendering
      clonedElement.style.boxShadow = "none";
      clonedElement.style.transform = "none";
      clonedElement.style.margin = "0";
      clonedElement.style.marginBottom = "0";

      // Create a temporary container for the cloned element
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "210mm";
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      try {
        // Ensure web fonts are fully resolved before rasterizing.
        if (typeof document !== "undefined" && "fonts" in document) {
          await (document as Document & { fonts: FontFaceSet }).fonts.ready;
        }

        // Wait for images to load (now from proxy - same origin)
        await waitForImagesToLoad(clonedElement);

        // Convert HTML to canvas
        const canvas = await html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: false,
          backgroundColor: "#ffffff",
          logging: false,
          width: clonedElement.offsetWidth,
          height: clonedElement.offsetHeight,
          windowWidth: clonedElement.offsetWidth,
          windowHeight: clonedElement.offsetHeight,
          onclone: (clonedDoc: Document) => {
            // Universal export normalization: html2canvas tends to render heading glyphs
            // slightly lower than browser preview. Use one relative adjustment for all templates.
            const style = clonedDoc.createElement("style");
            style.setAttribute(
              "data-pdf-export-fixes",
              "universal-section-heading",
            );
            style.textContent = `
              [data-pdf-capture-root] h3[class$="-section-header"] {
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1 !important;
                display: inline-block !important;
                vertical-align: middle !important;
                transform: translateY(-0.3em) !important;
              }
              /* Normalize rich-text bullet alignment for html2canvas export */
              [data-pdf-capture-root] .resume-content ul {
                list-style: none !important;
                margin: 4px 0 8px 0 !important;
                padding-left: 0 !important;
              }
              [data-pdf-capture-root] .resume-content ul > li {
                position: relative !important;
                display: flex !important;
                align-items: flex-start !important;
                margin-bottom: 2px !important;
                line-height: 1.4 !important;
                padding-left: 0 !important;
              }
              [data-pdf-capture-root] .resume-content ul > li .pdf-bullet {
                display: inline-block;
                width: 10px;
                flex-shrink: 0;
                line-height: 1.4;
                margin-right: 4px;
              }
              [data-pdf-capture-root] .resume-content ul > li .pdf-bullet-content {
                flex: 1;
                min-width: 0;
              }
            `;
            clonedDoc.head.appendChild(style);

            // Inject real bullet characters for html2canvas reliability.
            const richListItems = clonedDoc.querySelectorAll<HTMLElement>(
              "[data-pdf-capture-root] .resume-content ul > li",
            );
            richListItems.forEach((li) => {
              if (li.querySelector(":scope > .pdf-bullet")) {
                return;
              }

              const originalChildren = Array.from(li.childNodes);
              const contentWrapper = clonedDoc.createElement("span");
              contentWrapper.className = "pdf-bullet-content";
              originalChildren.forEach((child) =>
                contentWrapper.appendChild(child),
              );

              const bullet = clonedDoc.createElement("span");
              bullet.className = "pdf-bullet";
              bullet.textContent = "•";
              bullet.setAttribute("aria-hidden", "true");

              li.appendChild(bullet);
              li.appendChild(contentWrapper);
            });

            // Atlantic Blue: ensure full-height left background coverage in export.
            // Keep column backgrounds intact; this only fills any tiny clone/render gaps.
            const captureRoot = clonedDoc.querySelector<HTMLElement>(
              "[data-pdf-capture-root]",
            );
            const hasAtlanticBlue =
              captureRoot?.querySelector(".atlantic-blue-left-column") !== null;
            if (captureRoot && hasAtlanticBlue) {
              captureRoot.style.background =
                "linear-gradient(to right, #2c3e50 0 40%, #ffffff 40% 100%)";
            }
          },
        } as any);

        // Convert canvas to image.
        // PNG avoids JPEG banding/seam artifacts on flat colored sidebars.
        const imgData = canvas.toDataURL("image/png");

        // Calculate dimensions to fit A4
        const imgWidth = a4Width;
        const imgHeight = (canvas.height * a4Width) / canvas.width;

        // Add new page if not the first page
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF
        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
        );
      } finally {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
      }
    }

    // Generate PDF blob
    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Generate PDF from a single HTML element
 * @param element - The HTML element to convert to PDF
 * @param options - PDF generation options
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFGenerationOptions = {},
): Promise<Blob> {
  return generatePDFFromPages([element], options);
}

/**
 * Upload PDF Blob to S3 using presigned URL
 * @param blob - The PDF Blob to upload
 * @param presignedUrl - The presigned URL from the backend
 * @returns Promise<void>
 */
export async function uploadPDFToS3(
  blob: Blob,
  presignedUrl: string,
): Promise<void> {
  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error uploading PDF to S3:", error);
    throw new Error("Failed to upload PDF");
  }
}
