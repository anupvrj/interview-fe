import { extractTextFromPDF } from "@/lib/pdf-utils";
import { atsGuestApi, isATSReportV3, resumeApi, resumeDataExtractionApi, type ATSGuestTeaser, type GuestRewrite } from "@/lib/api";
import { applyPersistedJobMatchScore } from "@/lib/atsReportNormalize";
import { buildResumeTemplateApplication } from "@/lib/applyResumeTemplate";
import { sha256OfFile } from "@/lib/pdf-snapshot";
import { getQueryClient } from "@/lib/query-client";
import { invalidateResumes } from "@/lib/invalidate-queries";
import type { ATSReportV3 } from "@/types/atsReport";
import { scanFactsFromContent, type ScanFacts } from "@/lib/atsScanFacts";
import { clearPendingUpload, loadPendingUpload, savePendingUpload } from "@/lib/atsPendingFile";
import {
  forgetGuestCheck,
  isGuestFlowBrowser,
  loadGuestCheckResult,
  loadGuestCheckToken,
  rememberGuestCheck,
  rememberGuestTemplate,
  takeGuestTemplate,
} from "@/lib/atsGuestState";

export {
  clearPendingUpload as clearPendingATSUpload,
  loadPendingUpload as loadPendingATSUpload,
  type PendingUpload as PendingATSUpload,
} from "@/lib/atsPendingFile";
export { hasUnclaimedGuestCheck as hasUnclaimedGuestATSCheck } from "@/lib/atsGuestState";

/** A signed-in check in progress: a refresh mid-scan reuses its resume instead of making another. */
const IN_PROGRESS_KEY = "ats-checker-in-progress";

export interface ATSAnalysisResult {
  report: ATSReportV3;
  resumeId: string;
}

import {
  mapExtractedSectionsToContent,
  sectionOrderForExtractedContent,
  type ExtractedSectionPayload,
} from "@/lib/resume-data-import";

/** Every uploaded resume is rebuilt in this template; the user can change it from the report. */
export const ATS_RESUME_TEMPLATE_ID = "condensed-rule";

export { mapExtractedSectionsToContent };
export type { ExtractedSectionPayload };

/** Keep the PDF until its check is done, so nobody uploads it twice. */
export async function savePendingATSUpload(file: File, jobDescription: string): Promise<void> {
  await savePendingUpload(file, jobDescription);
}

function readInProgress(): { hash: string; resumeId: string } | null {
  try {
    return JSON.parse(sessionStorage.getItem(IN_PROGRESS_KEY) ?? "null");
  } catch {
    return null;
  }
}

function writeInProgress(value: { hash: string; resumeId: string } | null): void {
  try {
    if (value) sessionStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(IN_PROGRESS_KEY);
  } catch {
    /* private mode: a refresh mid-scan makes a second resume, nothing worse */
  }
}

export async function runATSAnalysis(
  userId: string,
  file: File,
  jobDescription: string,
  onStep?: (step: number) => void,
  /** What was read from the resume, as soon as it's known (for the scan screen). */
  onFacts?: (facts: ScanFacts) => void,
): Promise<ATSAnalysisResult> {
  onStep?.(0);
  const sourceFileHash = await sha256OfFile(file);
  // The same PDF they already checked, untouched since: same score, no second wait.
  const earlierId = sourceFileHash
    ? await atsGuestApi.findOwnCheck(sourceFileHash, jobDescription.trim() || undefined).catch(() => null)
    : null;
  if (earlierId) {
    const earlier = await resumeApi.get(earlierId);
    if (isATSReportV3(earlier.atsFeedback)) {
      return {
        report: applyPersistedJobMatchScore(earlier.atsFeedback, earlier.jobMatchScore),
        resumeId: earlierId,
      };
    }
  }

  const resumeText = await extractTextFromPDF(file);

  onStep?.(1);
  // Refreshed mid-scan: carry on with the resume already made for this file.
  const unfinished = readInProgress();
  const reusedId =
    sourceFileHash && unfinished?.hash === sourceFileHash
      ? await resumeApi.get(unfinished.resumeId).then((r) => r.resumeId, () => null)
      : null;
  const newResume = reusedId
    ? { resumeId: reusedId }
    : await resumeApi.create(userId, {
        title: "ATS Check - " + file.name,
        templateId: ATS_RESUME_TEMPLATE_ID,
        content: { personalInfo: {} },
        forAtsCheckOnly: true,
      });
  if (sourceFileHash) writeInProgress({ hash: sourceFileHash, resumeId: newResume.resumeId });
  await invalidateResumes(getQueryClient(), userId);

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
      ATS_RESUME_TEMPLATE_ID,
      { resumeText, enhance: false },
    );
    const content = mapExtractedSectionsToContent(extractedData.sections);
    const sectionOrder = await sectionOrderForExtractedContent(ATS_RESUME_TEMPLATE_ID, content);
    onFacts?.(scanFactsFromContent(content, sectionOrder));
    await resumeApi.update(newResume.resumeId, {
      content,
      sectionOrder,
      profileSummary: typeof content.profileSummary === "string" ? content.profileSummary : undefined,
    });
  } catch {
    /* continue */
  }

  onStep?.(3);
  const updatedResume = await resumeApi.recalculateATS(newResume.resumeId, {
    jobDescription: jobDescription.trim() || undefined,
    rawPdfText: resumeText,
    sourceFileHash,
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
    writeInProgress(null);
    return {
      report: applyPersistedJobMatchScore(
        updatedResume.atsFeedback,
        updatedResume.jobMatchScore,
      ),
      resumeId: newResume.resumeId,
    };
  }

  throw new Error("Unexpected ATS report format. Please try again.");
}

export type GuestATSCheck = {
  token: string;
  teaser: ATSGuestTeaser;
  /** The report with some checks locked until sign-up. */
  report: ATSReportV3;
  content: Record<string, unknown>;
  sectionOrder: unknown[];
  /** The AI rewrite, when the same file was checked and rewritten before. */
  improved?: GuestRewrite;
  /** Came back from an earlier check of the same file (no new analysis ran). */
  reused?: boolean;
};

/** How long after scoring starts the steps move on to the last one. */
const LAST_STEP_AFTER_MS = 15_000;

/** The check for a signed-out visitor: nothing is saved to an account until they sign up. */
export async function runGuestATSCheck(
  file: File,
  jobDescription: string,
  onStep?: (step: number) => void,
  onFacts?: (facts: ScanFacts) => void,
): Promise<GuestATSCheck> {
  const jd = jobDescription.trim() || undefined;
  onStep?.(0);
  const fileHash = await sha256OfFile(file);
  // The same PDF again: same score, without running the analyser.
  const earlier = fileHash ? await atsGuestApi.findSameFile(fileHash, jd).catch(() => null) : null;
  if (earlier) {
    onStep?.(3);
    return { ...earlier, reused: true };
  }

  const resumeText = await extractTextFromPDF(file);

  onStep?.(1);
  const sections = await atsGuestApi.extractSections(resumeText);
  const content = mapExtractedSectionsToContent(sections);
  const sectionOrder = await sectionOrderForExtractedContent(ATS_RESUME_TEMPLATE_ID, content);
  onFacts?.(scanFactsFromContent(content, sectionOrder));

  onStep?.(2);
  const lastStep = window.setTimeout(() => onStep?.(3), LAST_STEP_AFTER_MS);
  try {
    const { token, teaser, report, improved } = await atsGuestApi.score({
      content,
      sectionOrder,
      resumeText,
      jobDescription: jd,
      fileHash,
      fileMetadata: {
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/pdf",
        rawTextLength: resumeText.length,
      },
    });
    // The rewrite runs alongside the scoring; when it's already done it comes back here.
    return { token, teaser, report, content, sectionOrder, ...(improved ? { improved } : {}) };
  } finally {
    window.clearTimeout(lastStep);
  }
}

/** What the guest page shows again after a refresh, or on coming back from sign-up. */
export type StoredGuestATSCheck = { check: GuestATSCheck; fileName?: string };

/** Keep the check (and what's on screen) until it is claimed or replaced. */
export function rememberGuestATSCheck(check: GuestATSCheck, fileName?: string): void {
  rememberGuestCheck<StoredGuestATSCheck>(check.token, { check, fileName });
}

/** The check on screen before a refresh or a trip to sign-up, if it can still be claimed. */
export function loadGuestATSCheck(): StoredGuestATSCheck | null {
  const stored = loadGuestCheckResult<StoredGuestATSCheck>();
  const check = stored?.check;
  if (!check?.token || !check.teaser || !check.content || !isATSReportV3(check.report)) return null;
  return check.token === loadGuestCheckToken() ? stored : null;
}

/** "Check another", a claim, or an expired check: none of it should come back. */
export async function forgetGuestATSCheck(): Promise<void> {
  forgetGuestCheck();
  await clearPendingUpload();
}

/** The design they tried on before signing up; their resume opens in it. */
export function rememberGuestATSTemplate(templateId: string): void {
  rememberGuestTemplate(templateId);
}

/** Puts the claimed resume in the design they picked. Failing only means they pick it again. */
export async function applyGuestATSTemplate(resumeId: string): Promise<void> {
  try {
    const templateId = takeGuestTemplate();
    if (!templateId || templateId === ATS_RESUME_TEMPLATE_ID) return;
    const resume = await resumeApi.get(resumeId);
    await resumeApi.update(resumeId, await buildResumeTemplateApplication(templateId, resume));
  } catch {
    /* non-fatal */
  }
}

export function loadGuestATSToken(): string | null {
  return loadGuestCheckToken();
}

/**
 * Someone who signed up for their ATS report goes straight to it and can edit their resume;
 * onboarding waits until they open the rest of the dashboard.
 */
export function isGuestATSFlowPath(pathname: string): boolean {
  if (!pathname.startsWith("/dashboard/ats-checker") && !pathname.startsWith("/dashboard/resumes/")) {
    return false;
  }
  if (pathname === "/dashboard/resumes/new") return false;
  return isGuestFlowBrowser();
}

/** Keep the original PDF with the resume. The report works without it, so failures are ignored. */
export async function attachPendingPDF(resumeId: string): Promise<void> {
  const pending = await loadPendingUpload();
  await clearPendingUpload();
  if (!pending) return;
  try {
    const { uploadUrl, s3Key } = await resumeApi.getPresignedUploadUrl(resumeId);
    const uploaded = await fetch(uploadUrl, {
      method: "PUT",
      body: pending.file,
      headers: { "Content-Type": "application/pdf" },
    });
    if (uploaded.ok) await resumeApi.confirmPDFUpload(resumeId, s3Key);
  } catch {
    /* non-fatal */
  }
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
    return applyPersistedJobMatchScore(
      updatedResume.atsFeedback,
      updatedResume.jobMatchScore,
    );
  }

  throw new Error("Unexpected ATS report format. Please try again.");
}
