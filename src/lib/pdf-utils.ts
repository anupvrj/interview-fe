/**
 * PDF Utilities for Frontend
 * Extracts text from PDF files
 */

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Use PDF.js to extract text from PDF
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source - use local worker file copied from node_modules during build
    // This ensures the worker version always matches the installed pdfjs-dist version
    if (typeof window !== "undefined") {
      // Use local worker file (copied from node_modules by build script)
      // This prevents version mismatch between library and worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }

    const arrayBuffer = await file.arrayBuffer();
    
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        verbosity: 0, // Reduce console warnings
      }).promise;
    } catch (error: any) {
      console.error("PDF.js getDocument error:", error);
      if (error.name === "InvalidPDFException") {
        throw new Error("Invalid PDF file. The file may be corrupted or not a valid PDF.");
      } else if (error.name === "MissingPDFException") {
        throw new Error("PDF file is missing or could not be loaded.");
      } else if (error.name === "UnexpectedResponseException") {
        throw new Error("Failed to load PDF. Please try again.");
      }
      throw new Error(`Failed to parse PDF: ${error.message || "Unknown error"}`);
    }

    if (!pdf || pdf.numPages === 0) {
      throw new Error("PDF has no pages or is empty.");
    }

    let fullText = "";

    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        if (!textContent || !textContent.items || textContent.items.length === 0) {
          // This page has no extractable text (might be image-based/scanned)
          console.warn(`Page ${i} has no extractable text. This might be a scanned PDF.`);
          continue;
        }
        
        const pageText = textContent.items
          .map((item: any) => item.str || "")
          .filter((str: string) => str.trim().length > 0)
          .join(" ");
        
        fullText += pageText + "\n";
      }
    } catch (error: any) {
      throw new Error(`Failed to extract text from PDF pages: ${error.message || "Unknown error"}`);
    }

    const trimmedText = fullText.trim();
    
    if (trimmedText.length === 0) {
      throw new Error(
        "No text could be extracted from this PDF. " +
        "This might be a scanned PDF (image-based). " +
        "Please ensure your PDF contains selectable text."
      );
    }

    return trimmedText;
  } catch (error: any) {
    // Re-throw with more context if it's already our custom error
    if (error.message && (error.message.includes("PDF") || error.message.includes("scanned"))) {
      throw error;
    }
    // Otherwise wrap unknown errors
    console.error("PDF extraction error:", error);
    throw new Error(`PDF extraction failed: ${error.message || "Unknown error occurred"}`);
  }
}
