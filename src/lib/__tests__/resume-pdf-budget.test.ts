import { describe, expect, it } from "vitest";
import {
  ATS_RESUME_PDF_MAX_BYTES,
  PDF_RASTER_ATTEMPTS,
  isPdfOverAtsLimit,
} from "@/lib/resume-pdf-budget";

describe("resume-pdf-budget", () => {
  it("uses the 2MB Easy Apply / ATS cap", () => {
    expect(ATS_RESUME_PDF_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(isPdfOverAtsLimit(ATS_RESUME_PDF_MAX_BYTES)).toBe(false);
    expect(isPdfOverAtsLimit(ATS_RESUME_PDF_MAX_BYTES + 1)).toBe(true);
  });

  it("falls back from PNG to smaller JPEG rasters", () => {
    expect(PDF_RASTER_ATTEMPTS[0]?.format).toBe("PNG");
    expect(PDF_RASTER_ATTEMPTS.at(-1)?.format).toBe("JPEG");
    expect(PDF_RASTER_ATTEMPTS.at(-1)?.scale).toBeLessThan(
      PDF_RASTER_ATTEMPTS[0]!.scale,
    );
  });
});
