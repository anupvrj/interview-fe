"use client";

/**
 * Page 1 of a saved resume, drawn exactly as the PDF draws it, for the server's headless
 * thumbnail renderer. Not linked anywhere and not indexed; reading the resume needs the
 * short-lived signed token the server puts in the URL (`?t=`).
 *
 * Signals `<body data-render-state="ready">` once layout, fonts and images have settled
 * (or "error"), which is what the renderer waits for before taking the screenshot.
 */
import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PaginatedPreview, type ResumePaginationSnapshot } from "@/components/PaginatedPreview";
import { CanvasEditProvider } from "@/components/resume-canvas/CanvasEditContext";
import { API_URL, resumeApi, type Resume, type ResumeTemplate } from "@/lib/api";
import { cssRegistry } from "@/lib/templateLoader";

type State = "loading" | "ready" | "error";

function setRenderState(state: State) {
  document.body.setAttribute("data-render-state", state);
}

async function imagesSettled(root: ParentNode) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((done) => {
            img.addEventListener("load", () => done(), { once: true });
            img.addEventListener("error", () => done(), { once: true });
            setTimeout(done, 6000);
          }),
    ),
  );
}

/**
 * Some headless browsers never fire requestAnimationFrame (no frames are drawn for a page nobody
 * looks at), and the page layout waits for frames. If a frame doesn't come within 150ms, drive
 * them from a timer. Only on this page.
 */
function ensureAnimationFrames(): Promise<void> {
  return new Promise((done) => {
    let ticked = false;
    requestAnimationFrame(() => {
      ticked = true;
    });
    setTimeout(() => {
      if (!ticked) {
        window.requestAnimationFrame = (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16);
        window.cancelAnimationFrame = (id: number) => window.clearTimeout(id);
      }
      done();
    }, 150);
  });
}

export default function RenderResumePage({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = use(params);
  return (
    <Suspense fallback={null}>
      <RenderResume resumeId={resumeId} />
    </Suspense>
  );
}

function RenderResume({ resumeId }: { resumeId: string }) {
  const token = useSearchParams().get("t") ?? "";
  const [data, setData] = useState<{ resume: Resume; template: ResumeTemplate } | null>(null);
  const signalled = useRef(false);

  useEffect(() => {
    setRenderState("loading");
    let cancelled = false;
    (async () => {
      try {
        await ensureAnimationFrames();
        const res = await fetch(`${API_URL}/resume-render/${encodeURIComponent(resumeId)}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`resume ${res.status}`);
        const resume = (await res.json()).data as Resume;
        const [template] = await Promise.all([resumeApi.getTemplate(resume.templateId), cssRegistry.loadTemplateCSS(resume.templateId)]);
        if (!cancelled) setData({ resume, template });
      } catch {
        if (!cancelled) setRenderState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId, token]);

  const onSnapshot = useCallback((snapshot: ResumePaginationSnapshot) => {
    if (signalled.current || !snapshot.isCalculated || snapshot.pages.length === 0) return;
    signalled.current = true;
    void (async () => {
      try {
        await document.fonts?.ready;
        await imagesSettled(document);
        // Two frames: the page-visibility pass has run and painted.
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        setRenderState("ready");
      } catch {
        setRenderState("error");
      }
    })();
  }, []);

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", padding: 0, margin: 0 }}>
      <meta name="robots" content="noindex, nofollow" />
      {data ? (
        <div className="[&_.resume-page]:!shadow-none [&_.relative.mb-5]:!mb-0">
          <CanvasEditProvider value={null}>
            <PaginatedPreview
              resume={data.resume}
              template={data.template}
              sections={data.resume.sectionOrder ?? undefined}
              layout={data.resume.layout}
              dismissedEmptyTrailingPages={data.resume.layout?.dismissedEmptyTrailingPages ?? 0}
              onPaginationSnapshot={onSnapshot}
            />
          </CanvasEditProvider>
        </div>
      ) : null}
    </div>
  );
}
