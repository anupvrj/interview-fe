/**
 * PDF Utilities for Frontend
 * Extracts text from PDF files
 */

export async function extractTextFromPDF(file: File): Promise<string> {
  // Use PDF.js to extract text from PDF
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source - use local worker file from public folder
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0, // Reduce console warnings
  }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}
