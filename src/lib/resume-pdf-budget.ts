import { PDF_RESUME_MAX_BYTES } from "@/lib/pdf-dropzone";

/** LinkedIn Easy Apply and typical ATS upload caps. */
export const ATS_RESUME_PDF_MAX_BYTES = PDF_RESUME_MAX_BYTES;

export type PdfRasterAttempt = {
  scale: number;
  format: "PNG" | "JPEG";
  quality: number;
};

/**
 * First attempt keeps PNG for sidebar color fidelity. Later attempts trade
 * quality for size so Easy Apply (2MB) still accepts the file.
 */
export const PDF_RASTER_ATTEMPTS: PdfRasterAttempt[] = [
  { scale: 2, format: "PNG", quality: 1 },
  { scale: 2, format: "JPEG", quality: 0.82 },
  { scale: 1.5, format: "JPEG", quality: 0.7 },
  { scale: 1.25, format: "JPEG", quality: 0.58 },
];

export function isPdfOverAtsLimit(byteLength: number): boolean {
  return byteLength > ATS_RESUME_PDF_MAX_BYTES;
}
