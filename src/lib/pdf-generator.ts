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
  options: PDFGenerationOptions = {},
): Promise<Blob> {
  const { filename = "resume.pdf" } = options;

  try {
    if (pageElements.length === 0) {
      throw new Error("No page elements provided");
    }

    // A4 dimensions in mm
    const a4Width = 210;
    const a4Height = 297;

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
        // Wait for images to load
        const images = clonedElement.querySelectorAll("img");
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) {
                  resolve();
                } else {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                  setTimeout(() => resolve(), 3000);
                }
              }),
          ),
        );

        // Convert HTML to canvas
        const canvas = await html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: clonedElement.offsetWidth,
          height: clonedElement.offsetHeight,
          windowWidth: clonedElement.offsetWidth,
          windowHeight: clonedElement.offsetHeight,
        } as any);

        // Convert canvas to image
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

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
          "JPEG",
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
