import { extractTextFromPDF } from "@/lib/pdf-utils";
import { isATSReportV3, resumeApi, resumeDataExtractionApi } from "@/lib/api";
import { getQueryClient } from "@/lib/query-client";
import { invalidateResumes } from "@/lib/invalidate-queries";
import type { ATSReportV3 } from "@/types/atsReport";

export const PENDING_ATS_STORAGE_KEY = "ats-checker-pending-upload";

export interface PendingATSUpload {
  fileDataUrl: string;
  fileName: string;
  fileType: string;
  jobDescription: string;
}

export interface ATSAnalysisResult {
  report: ATSReportV3;
  resumeId: string;
}

import {
  mapExtractedSectionsToContent,
  type ExtractedSectionPayload,
} from "@/lib/resume-data-import";

export { mapExtractedSectionsToContent };
export type { ExtractedSectionPayload };

export async function savePendingATSUpload(
  file: File,
  jobDescription: string,
): Promise<void> {
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const payload: PendingATSUpload = {
    fileDataUrl,
    fileName: file.name,
    fileType: file.type || "application/pdf",
    jobDescription,
  };
  sessionStorage.setItem(PENDING_ATS_STORAGE_KEY, JSON.stringify(payload));
}

export function loadPendingATSUpload(): PendingATSUpload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_ATS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingATSUpload;
  } catch {
    return null;
  }
}

export function clearPendingATSUpload(): void {
  sessionStorage.removeItem(PENDING_ATS_STORAGE_KEY);
}

export function pendingUploadToFile(pending: PendingATSUpload): File {
  const [header, base64] = pending.fileDataUrl.split(",");
  const mime =
    pending.fileType ||
    header.match(/data:(.*?);/)?.[1] ||
    "application/pdf";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], pending.fileName, { type: mime });
}

export async function runATSAnalysis(
  userId: string,
  file: File,
  jobDescription: string,
  onStep?: (step: number) => void,
): Promise<ATSAnalysisResult> {
  onStep?.(0);
  const resumeText = await extractTextFromPDF(file);

  onStep?.(1);
  const newResume = await resumeApi.create(userId, {
    title: "ATS Check - " + file.name,
    templateId: "classic",
    content: { personalInfo: {} },
    forAtsCheckOnly: true,
  });
  await invalidateResumes(getQueryClient(), userId);

  if (resumeText) {
    try {
      await resumeApi.update(newResume.resumeId, {
        profileSummary: resumeText.substring(0, 500),
      });
    } catch {
      /* non-fatal */
    }
  }

  const { uploadUrl, s3Key } = await resumeApi.getPresignedUploadUrl(
    newResume.resumeId,
  );

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": "application/pdf" },
  });

  if (!uploadResponse.ok) throw new Error("Failed to upload PDF");

  await resumeApi.confirmPDFUpload(newResume.resumeId, s3Key);
  onStep?.(2);

  try {
    const extractedData = await resumeDataExtractionApi.extractResumeData(
      "classic",
      { resumeText },
    );
    const content = mapExtractedSectionsToContent(extractedData.sections);
    await resumeApi.update(newResume.resumeId, { content });
  } catch {
    /* continue */
  }

  onStep?.(3);
  const updatedResume = await resumeApi.recalculateATS(newResume.resumeId, {
    jobDescription: jobDescription.trim() || undefined,
    rawPdfText: resumeText,
    fileMetadata: {
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || "application/pdf",
      rawTextLength: resumeText.length,
    },
  });

  if (
    updatedResume.atsFeedback &&
    isATSReportV3(updatedResume.atsFeedback)
  ) {
    return {
      report: updatedResume.atsFeedback,
      resumeId: newResume.resumeId,
    };
  }

  throw new Error("Unexpected ATS report format. Please try again.");
}

export async function rerunATSAnalysis(
  resumeId: string,
  jobDescription: string,
): Promise<ATSReportV3> {
  const resume = await resumeApi.get(resumeId);
  const updatedResume = await resumeApi.recalculateATS(resumeId, {
    jobDescription: jobDescription.trim() || undefined,
    rawPdfText: resume.atsScoringContext?.rawPdfText,
  });

  if (
    updatedResume.atsFeedback &&
    isATSReportV3(updatedResume.atsFeedback)
  ) {
    return updatedResume.atsFeedback;
  }

  throw new Error("Unexpected ATS report format. Please try again.");
}
