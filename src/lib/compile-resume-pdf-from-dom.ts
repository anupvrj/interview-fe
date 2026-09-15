import { generateResumePdfViaServer } from "@/lib/resume-pdf-export";
import { resumeApi } from "@/lib/api";
import { debugResumePagination } from "@/lib/debug-resume-pagination";
import { fetchPdfBlobFromUrl } from "@/lib/download-pdf";
import { isPdfOverAtsLimit } from "@/lib/resume-pdf-budget";
import { waitForResumePaginationSettled } from "@/lib/wait-for-resume-pagination";

export async function compileResumePdfFromPreviewContainer(options: {
  resumeId: string;
  templateId: string;
  previewContainerId: string;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  filename: string;
}): Promise<{ blob: Blob | null; downloadUrl: string | null }> {
  const { resumeId, templateId, previewContainerId, padding, filename } = options;
  await waitForResumePaginationSettled(previewContainerId);

  const page1Element = document.getElementById(previewContainerId);
  let originalTransform = "";
  if (page1Element) {
    originalTransform = page1Element.style.transform;
    page1Element.style.transform = "scale(1)";
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  try {
    const allPageElements: HTMLElement[] = [];
    if (page1Element) {
      const paginatedContainer = page1Element.querySelector(
        ".flex.flex-col.items-center",
      );
      if (paginatedContainer) {
        const pages = paginatedContainer.querySelectorAll(".resume-page");
        pages.forEach((page) => allPageElements.push(page as HTMLElement));
      }
      if (allPageElements.length === 0) {
        allPageElements.push(page1Element);
      }
    }
    if (allPageElements.length === 0) {
      throw new Error("Preview element not found");
    }

    const allImages: HTMLImageElement[] = [];
    allPageElements.forEach((pageElement) => {
      allImages.push(...Array.from(pageElement.querySelectorAll("img")));
    });
    await Promise.all(
      allImages.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 5000);
          }),
      ),
    );

    if (typeof document !== "undefined" && "fonts" in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    try {
      debugResumePagination("compile:pdfStart", {
        path: "server",
        pageCount: allPageElements.length,
      });
      const result = await generateResumePdfViaServer({
        resumeId,
        templateId,
        pageElements: allPageElements,
        padding,
      });
      const serverBlob = await fetchPdfBlobFromUrl(result.downloadUrl);
      if (!isPdfOverAtsLimit(serverBlob.size)) {
        debugResumePagination("compile:pdfDone", { path: "server" });
        return { blob: serverBlob, downloadUrl: result.downloadUrl };
      }
      console.warn(
        `Server PDF is ${serverBlob.size} bytes (over 2MB). Compressing with client raster.`,
      );
    } catch (serverErr) {
      console.warn("Server PDF failed, falling back to client html2canvas:", serverErr);
    }

    const { generatePDFFromPages, uploadPDFToS3 } = await import(
      "@/lib/pdf-generator"
    );
    const localPdfBlob = await generatePDFFromPages(allPageElements, {
      filename,
    });
    const { uploadUrl, s3Key } = await resumeApi.getPresignedUploadUrl(resumeId);
    await uploadPDFToS3(localPdfBlob, uploadUrl);
    const confirm = await resumeApi.confirmPDFUpload(resumeId, s3Key);
    debugResumePagination("compile:pdfDone", { path: "client" });
    return { blob: localPdfBlob, downloadUrl: confirm.downloadUrl };
  } finally {
    if (page1Element && originalTransform) {
      page1Element.style.transform = originalTransform;
    }
  }
}
