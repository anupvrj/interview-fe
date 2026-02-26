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
  elementId: string = "resume-preview-container",
): Promise<Blob | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ Element with id "${elementId}" not found`);
      return null;
    }

    console.log("📸 Capturing thumbnail for element:", elementId);

    // Check if element has content - if it's empty or has zero dimensions, wait and retry
    let retries = 0;
    const maxRetries = 10;
    while (retries < maxRetries) {
      const width =
        element.offsetWidth || element.scrollWidth || element.clientWidth;
      const height =
        element.offsetHeight || element.scrollHeight || element.clientHeight;

      console.log(`Attempt ${retries + 1}: Element dimensions:`, {
        width,
        height,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        innerHTML: element.innerHTML.substring(0, 100), // First 100 chars for debugging
      });

      // If element has reasonable dimensions, proceed
      if (width > 100 && height > 100) {
        break;
      }

      // Wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, 300));
      retries++;
    }

    // Final check - if still no dimensions, return null
    const finalWidth =
      element.offsetWidth || element.scrollWidth || element.clientWidth;
    const finalHeight =
      element.offsetHeight || element.scrollHeight || element.clientHeight;

    if (finalWidth < 100 || finalHeight < 100) {
      console.error("❌ Element has invalid dimensions after retries:", {
        width: finalWidth,
        height: finalHeight,
      });
      return null;
    }

    // Check if element has content (text or child elements)
    const hasTextContent =
      element.textContent && element.textContent.trim().length > 0;
    const hasChildElements = element.children.length > 0;

    if (!hasTextContent && !hasChildElements) {
      console.error("❌ Element appears to be empty (no text or children)");
      return null;
    }

    console.log("✅ Element validation passed:", {
      hasTextContent,
      hasChildElements,
      textLength: element.textContent?.length || 0,
      childrenCount: element.children.length,
    });

    // Wait for all images to load before capturing
    const images = element.querySelectorAll("img");
    console.log(`Found ${images.length} images to load`);
    await Promise.all(
      Array.from(images).map((img) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if image fails
            // Timeout after 3 seconds
            setTimeout(() => resolve(), 3000);
          }
        });
      }),
    );

    // Store original styles to restore later
    const originalStyles = {
      display: element.style.display,
      visibility: element.style.visibility,
      opacity: element.style.opacity,
      position: element.style.position,
      zIndex: element.style.zIndex,
    };

    // Ensure element is visible and in viewport
    element.style.display = element.style.display || "block";
    element.style.visibility = "visible";
    element.style.opacity = "1";
    element.style.position = "relative";
    element.style.zIndex = "9999";

    // Check if element or its parents are hidden
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentStyle = globalThis.getComputedStyle(parent);
      if (
        parentStyle.display === "none" ||
        parentStyle.visibility === "hidden" ||
        parentStyle.opacity === "0"
      ) {
        console.warn("⚠️ Parent element is hidden, making it visible:", parent);
        const parentEl = parent as HTMLElement;
        parentEl.style.display = "block";
        parentEl.style.visibility = "visible";
        parentEl.style.opacity = "1";
      }
      parent = parent.parentElement;
    }

    // Scroll element into view and to top
    element.scrollIntoView({ behavior: "instant", block: "start" });
    const scrollPosition = window.scrollY;
    window.scrollTo(0, 0);

    // Force a reflow to ensure styles are applied
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    element.offsetHeight;

    // Wait for rendering to settle and ensure content is visible
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Double-check element is still visible and has content after all style changes
    const computedStyle = globalThis.getComputedStyle(element);
    if (
      computedStyle.display === "none" ||
      computedStyle.visibility === "hidden" ||
      computedStyle.opacity === "0"
    ) {
      console.error("❌ Element is still hidden after making it visible");
      // Restore styles before returning
      element.style.display = originalStyles.display;
      element.style.visibility = originalStyles.visibility;
      element.style.opacity = originalStyles.opacity;
      element.style.position = originalStyles.position;
      element.style.zIndex = originalStyles.zIndex;
      return null;
    }

    // Get the actual dimensions of the element
    const rect = element.getBoundingClientRect();
    // For thumbnails, we want to capture the visible area, but ensure we get the full first page
    // Limit height to A4 page height (297mm ≈ 1123px at 96 DPI) to avoid capturing multiple pages
    const maxHeight = 1123; // A4 height in pixels at 96 DPI
    const width = Math.max(
      rect.width || finalWidth,
      element.offsetWidth || finalWidth,
      element.scrollWidth || finalWidth,
    );
    const height = Math.min(
      Math.max(
        rect.height || finalHeight,
        element.offsetHeight || finalHeight,
        element.scrollHeight || finalHeight,
      ),
      maxHeight,
    );

    console.log("Final capturing dimensions:", {
      width,
      height,
      maxHeight,
      rect,
    });

    console.log("Element computed style:", {
      display: globalThis.getComputedStyle(element).display,
      visibility: globalThis.getComputedStyle(element).visibility,
      opacity: globalThis.getComputedStyle(element).opacity,
      width: globalThis.getComputedStyle(element).width,
      height: globalThis.getComputedStyle(element).height,
    });

    // Don't specify width/height - let html2canvas auto-detect from the element
    // This avoids issues with CSS units like "mm" that html2canvas might not handle well
    console.log("Starting html2canvas capture (auto-detecting dimensions)...");

    // Replace cross-origin image URLs with proxy URLs so html2canvas can fetch them
    const proxyBase =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/proxy-image`
        : "";
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: true, // Enable logging to debug
      background: "#ffffff",
      allowTaint: false,
      onclone: (_clonedDoc, clonedElement) => {
        // Replace S3/external img src with proxy URL before html2canvas fetches
        const imgs = clonedElement.querySelectorAll("img[src]");
        imgs.forEach((img) => {
          const src = img.getAttribute("src");
          if (
            src &&
            src.startsWith("http") &&
            !src.startsWith(window.location.origin)
          ) {
            img.setAttribute(
              "src",
              `${proxyBase}?url=${encodeURIComponent(src)}`,
            );
          }
        });
      },
    });

    // Restore element styles
    element.style.display = originalStyles.display;
    element.style.visibility = originalStyles.visibility;
    element.style.opacity = originalStyles.opacity;
    element.style.position = originalStyles.position;
    element.style.zIndex = originalStyles.zIndex;

    // Restore scroll position
    window.scrollTo(0, scrollPosition);

    console.log("✅ Canvas created:", {
      width: canvas.width,
      height: canvas.height,
    });

    // Validate canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      console.error("❌ Canvas has zero dimensions");
      return null;
    }

    // Check if canvas has any non-white pixels (basic content check)
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Sample multiple areas of the canvas to check for content
      const sampleSize = Math.min(200, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      let nonWhitePixels = 0;
      let totalPixels = 0;

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        totalPixels++;

        // Check if pixel is not white (RGB all > 250)
        if (r < 250 || g < 250 || b < 250) {
          nonWhitePixels++;
        }
      }

      const contentRatio = nonWhitePixels / totalPixels;
      console.log("Canvas content check:", {
        totalPixels,
        nonWhitePixels,
        contentRatio: (contentRatio * 100).toFixed(2) + "%",
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      });

      if (contentRatio < 0.01) {
        console.error(
          "❌ Canvas appears to be blank (less than 1% non-white pixels)",
        );
        // Restore styles before returning
        element.style.display = originalStyles.display;
        element.style.visibility = originalStyles.visibility;
        element.style.opacity = originalStyles.opacity;
        element.style.position = originalStyles.position;
        element.style.zIndex = originalStyles.zIndex;
        return null;
      }
    } else {
      console.error("❌ Failed to get canvas context");
      return null;
    }

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            console.log("✅ Blob created:", {
              size: blob.size,
              type: blob.type,
            });
            resolve(blob);
          } else {
            console.error(
              "❌ Failed to create blob from canvas or blob is empty",
              {
                blobSize: blob?.size,
              },
            );
            resolve(null);
          }
        },
        "image/png",
        0.9, // Increased quality
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
  blob: Blob,
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
  elementId: string = "resume-preview-container",
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
