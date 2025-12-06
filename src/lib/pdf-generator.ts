/**
 * Client-side PDF Generator using html2pdf.js
 * Generates ATS-friendly PDFs with proper SVG rendering
 */

import html2pdf from "html2pdf.js";

export interface PDFGenerationOptions {
  filename?: string;
  format?: string;
  margin?: number | [number, number, number, number];
  orientation?: "portrait" | "landscape";
}

/**
 * Generate ATS-friendly PDF from HTML element
 * @param element - The HTML element to convert to PDF
 * @param options - PDF generation options
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFGenerationOptions = {}
): Promise<Blob> {
  const {
    filename = "resume.pdf",
    format = "a4",
    margin = 0,
    orientation = "portrait",
  } = options;

  try {
    // Clone element and prepare for PDF generation
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.transform = "none";
    clonedElement.style.boxShadow = "none";
    clonedElement.style.width = "210mm";
    clonedElement.style.height = "297mm";
    clonedElement.style.maxHeight = "297mm";
    clonedElement.style.overflow = "hidden";

    // Configure html2pdf options - strict single page
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI - strict limit
        windowWidth: 794,
        windowHeight: 1123,
        scrollY: 0,
        scrollX: 0,
      },
      jsPDF: {
        unit: "mm",
        format: [210, 297], // Exact A4 dimensions
        orientation: "portrait",
        compress: true,
      },
      pagebreak: {
        mode: ["avoid-all"],
      },
    };

    // Generate PDF - strict single page
    const pdfBlob = await new Promise<Blob>((resolve, reject) => {
      html2pdf()
        .set(opt)
        .from(clonedElement)
        .toPdf()
        .get("pdf")
        .then((pdf: any) => {
          // Get total pages
          const totalPages = pdf.internal.getNumberOfPages();

          // Delete all pages except the first one
          for (let i = totalPages; i > 1; i--) {
            pdf.deletePage(i);
          }

          // Output as blob
          const blob = pdf.output("blob");
          resolve(blob);
        })
        .catch(reject);
    });

    return pdfBlob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Upload PDF Blob to S3 using presigned URL
 * @param blob - The PDF Blob to upload
 * @param presignedUrl - The presigned URL from the backend
 * @returns Promise<void>
 */
export async function uploadPDFToS3(
  blob: Blob,
  presignedUrl: string
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
