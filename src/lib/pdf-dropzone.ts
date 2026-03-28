/**
 * Shared react-dropzone settings for PDF resume uploads.
 * Mobile Safari / Android often send empty MIME or application/octet-stream for PDFs.
 *
 * @see https://github.com/react-dropzone/react-dropzone/issues/1199
 */

export const PDF_RESUME_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const pdfResumeDropzoneAccept = {
  "application/pdf": [".pdf"],
  "application/octet-stream": [".pdf"],
  "application/x-pdf": [".pdf"],
} as const;

/** Reject non-.pdf by extension; MIME alone is unreliable on mobile. */
export function pdfResumeFileValidator(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return {
      code: "file-invalid-type" as const,
      message: "Only PDF files are allowed",
    };
  }
  return null;
}
