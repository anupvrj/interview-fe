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
  /**
   * Only a server-made (text) PDF will do — e.g. a hackathon submission: if the server
   * can't make it, throw instead of falling back to the screenshot PDF ATS can't read.
   */
  requireServerPdf?: boolean;
}): Promise<{ blob: Blob | null; downloadUrl: string | null }> {
  const { resumeId, templateId, previewContainerId, padding, filename, requireServerPdf } = options;
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
      // The server made and saved a text PDF. Reading it back can still fail (S3 not
      // answering yet, CORS — the "404" pair seen on Save and return); that must not
      // replace it with the screenshot PDF below. Retry once, else return just the link.
      let serverBlob: Blob;
      try {
        serverBlob = await fetchPdfBlobFromUrl(result.downloadUrl);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        try {
          serverBlob = await fetchPdfBlobFromUrl(result.downloadUrl);
        } catch (readBackErr) {
          console.warn("Server PDF saved; reading it back failed, continuing with its link:", readBackErr);
          return { blob: null, downloadUrl: result.downloadUrl };
        }
      }
      // Always keep the server PDF: it has real, selectable text that applicant tracking
      // systems can read. The server already shrinks oversized images, so it is rarely over
      // 2 MB; a screenshot PDF would be smaller but unreadable to an ATS.
      if (isPdfOverAtsLimit(serverBlob.size)) {
        console.warn(`Server PDF is ${serverBlob.size} bytes (over 2MB); keeping it for its text layer.`);
      }
      debugResumePagination("compile:pdfDone", { path: "server" });
      return { blob: serverBlob, downloadUrl: result.downloadUrl };
    } catch (serverErr) {
      if (requireServerPdf) throw serverErr;
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
