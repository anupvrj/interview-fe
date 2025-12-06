/**
 * Resume Thumbnail Utilities
 * Capture and upload resume thumbnails
 */

import html2canvas from "html2canvas";
import { apiClient } from "./api";

/**
 * Capture screenshot of resume preview
 */
export async function captureResumeThumbnail(
  elementId: string = "resume-preview-container"
): Promise<Blob | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ Element with id "${elementId}" not found`);
      return null;
    }

    console.log("📸 Capturing thumbnail for element:", elementId);
    console.log("Element dimensions:", {
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    // Capture the screenshot with optimized settings
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
    });

    console.log("✅ Canvas created:", {
      width: canvas.width,
      height: canvas.height,
    });

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("✅ Blob created:", {
              size: blob.size,
              type: blob.type,
            });
          } else {
            console.error("❌ Failed to create blob from canvas");
          }
          resolve(blob);
        },
        "image/png",
        0.8
      );
    });
  } catch (error) {
    console.error("❌ Error capturing thumbnail:", error);
    return null;
  }
}

/**
 * Upload thumbnail to backend
 */
export async function uploadResumeThumbnail(
  resumeId: string,
  blob: Blob
): Promise<{ success: boolean; thumbnailUrl?: string; error?: string }> {
  try {
    console.log("📤 Uploading thumbnail to backend...", {
      resumeId,
      blobSize: blob.size,
      blobType: blob.type,
    });

    const formData = new FormData();
    formData.append("file", blob, "thumbnail.png");

    console.log("Using authenticated API client for upload");

    // Use apiClient which automatically adds auth headers
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { thumbnailS3Key: string; thumbnailUrl: string };
    }>(`/resumes/${resumeId}/thumbnail`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Upload successful:", response.data);

    return {
      success: true,
      thumbnailUrl: response.data.data.thumbnailUrl,
    };
  } catch (error: any) {
    console.error("❌ Error uploading thumbnail:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to upload thumbnail";
    console.error("Error details:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Capture and upload thumbnail in one call
 */
export async function captureAndUploadThumbnail(
  resumeId: string,
  elementId: string = "resume-preview-container"
): Promise<{ success: boolean; thumbnailUrl?: string; error?: string }> {
  try {
    // Capture thumbnail
    const blob = await captureResumeThumbnail(elementId);
    if (!blob) {
      return {
        success: false,
        error: "Failed to capture thumbnail",
      };
    }

    // Upload thumbnail
    return await uploadResumeThumbnail(resumeId, blob);
  } catch (error: any) {
    console.error("Error in captureAndUploadThumbnail:", error);
    return {
      success: false,
      error: error.message || "Failed to process thumbnail",
    };
  }
}
