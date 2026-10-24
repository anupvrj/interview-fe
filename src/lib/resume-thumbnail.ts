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

    // The live preview is never restyled: the capture renders an off-screen clone (below).
    // Lifting the live page (z-index 9999, position/display changes) put it on top of open
    // dialogs — e.g. the section-order dialog after a drop's autosave — and shifted its layout.
    if (element.offsetWidth < 100) {
      console.warn("Thumbnail skipped: preview is not laid out");
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

    // Clone + rewrite + wait (same strategy as pdf-generator): rewriting only in
    // html2canvas onclone runs too late — images never load before paint, so profile
    // photos from S3 disappear in the thumbnail.
    const proxyBase = `${globalThis.window.location.origin}/api/proxy-image`;
    const pageOrigin = globalThis.window.location.origin;

    const rewriteExternalImageSources = (root: HTMLElement) => {
      root.querySelectorAll("img[src]").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("http") && !src.startsWith(pageOrigin)) {
          img.setAttribute(
            "src",
            `${proxyBase}?url=${encodeURIComponent(src)}`,
          );
          img.removeAttribute("srcset");
        }
      });
    };

    const waitForImagesToLoad = async (root: HTMLElement) => {
      const images = root.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight > 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(() => resolve(), 15000);
              }
            }),
        ),
      );
    };

    console.log("Starting thumbnail capture (clone + proxy + html2canvas)...");

    if (typeof document !== "undefined" && "fonts" in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    // The preview may have re-mounted while we waited (undo, re-pagination): clone the
    // live node, not a detached one (which has no size and yields an empty canvas).
    const source = document.getElementById(elementId) ?? element;
    if (!source.isConnected || source.offsetWidth < 100) {
      console.warn("Thumbnail skipped: preview is re-rendering");
      return null;
    }
    const captureRoot = source.cloneNode(true) as HTMLElement;
    captureRoot.removeAttribute("id");
    // The copy sits in the live document while it is drawn: keep it out of the editor's way
    // (no focusable fields, no data-rx-path matches for "find the field on the page").
    captureRoot.setAttribute("inert", "");
    captureRoot.setAttribute("aria-hidden", "true");
    captureRoot.querySelectorAll<HTMLElement>("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    captureRoot.querySelectorAll<HTMLElement>("[data-rx-path]").forEach((el) => el.removeAttribute("data-rx-path"));
    captureRoot.style.position = "fixed";
    captureRoot.style.left = "-9999px";
    captureRoot.style.top = "0";
    captureRoot.style.width = `${source.offsetWidth}px`;
    captureRoot.style.visibility = "visible";
    captureRoot.style.transform = "none";
    captureRoot.style.opacity = "1";
    captureRoot.style.zIndex = "2147483646";
    captureRoot.style.background = "#ffffff";

    let canvas: HTMLCanvasElement | undefined;
    try {
      document.body.appendChild(captureRoot);
      rewriteExternalImageSources(captureRoot);
      await waitForImagesToLoad(captureRoot);

      canvas = await html2canvas(captureRoot, {
        useCORS: true,
        logging: false,
        background: "#ffffff",
        allowTaint: false,
        imageTimeout: 20000,
        scale: Math.min(2, globalThis.window.devicePixelRatio || 1),
        onclone: (_clonedDoc: Document, cloned: HTMLElement) => {
          cloned.style.transform = "none";
          cloned.style.transition = "none";
          // On-canvas editor: thumbnails show the page, not empty-field hints.
          cloned.querySelectorAll<HTMLElement>("[data-placeholder]").forEach((el) => {
            el.removeAttribute("data-placeholder");
          });
          cloned.querySelectorAll<HTMLElement>("[data-rx-empty-section]").forEach((el) => el.remove());
        },
      } as any);
    } finally {
      captureRoot.remove();
    }

    if (!canvas) {
      return null;
    }

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
      // Sample a grid over the whole page: centred designs (e.g. Classic) have an empty
      // top-left corner, so a corner-only sample rejected real captures as blank.
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const step = Math.max(1, Math.floor(Math.sqrt((canvas.width * canvas.height) / 40000)));
      let nonWhitePixels = 0;
      let totalPixels = 0;

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4;
          totalPixels++;
          // Not white (any channel at or below 250)
          if (imageData.data[i] < 250 || imageData.data[i + 1] < 250 || imageData.data[i + 2] < 250) {
            nonWhitePixels++;
          }
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

      // Light/minimal resumes can be mostly white; avoid rejecting real captures.
      if (contentRatio < 0.002) {
        console.error(
          "❌ Canvas appears to be blank (less than 0.2% non-white pixels)",
        );
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
