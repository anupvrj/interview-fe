"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Trash2 } from "lucide-react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import { ResumeRenderer } from "./ResumeRenderer";
import { useResumePagination } from "@/hooks/useResumePagination";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  ATLANTIC_BLUE_PAGINATED_PAGE_BG,
  pageVerticalGuttersMm,
  resolveEffectiveLayoutPaddingMm,
} from "@/lib/resume-page-dimensions";
import { debugResumePagination } from "@/lib/debug-resume-pagination";
import { buildResumeContentMeasureKey } from "@/lib/resume-content-measure-key";
import type { PageData } from "@/hooks/useResumePagination";
import { cn } from "@/lib/utils";

export interface ResumePaginationSnapshot {
  pages: PageData[];
  rawPages: PageData[];
  pageUnits: string[][];
  measureRoot: HTMLElement | null;
  isCalculated: boolean;
}

interface PaginatedPreviewProps {
  resume: Resume;
  template: ResumeTemplate;
  sections?: any[];
  layout?: any;
  dismissedEmptyTrailingPages?: number;
  onPageDelete?: (payload: { pageNumber: number; totalPages: number }) => void;
  onPaginationSnapshot?: (snapshot: ResumePaginationSnapshot) => void;
}

interface PreviewFrame {
  key: string;
  pages: PageData[];
  pageUnits: string[][];
  allUnitIds: string[];
  resume: Resume;
  sections: any[] | undefined;
  layout: any;
  template: ResumeTemplate;
}

const ALL_UNIT_SELECTOR =
  '[data-item-id],[data-section-id],[data-section="personalInfo"]';

function nodeUnitId(node: HTMLElement): string | null {
  if (node.getAttribute("data-section") === "personalInfo") return "personalInfo";
  return (
    node.getAttribute("data-section-id") ?? node.getAttribute("data-item-id") ?? null
  );
}

function nearestAncestorSectionId(node: HTMLElement): string | null {
  let cur: HTMLElement | null = node.parentElement;
  while (cur) {
    const sec = cur.getAttribute("data-section");
    if (sec) return sec;
    cur = cur.parentElement;
  }
  return null;
}

/** Hide every unit node whose id is a known unit but not visible on this page.
 *  Also hide entire section wrappers (`[data-section=X]`) that have no visible
 *  units on this page, so unmarked residual content (empty-state placeholders,
 *  body paragraphs not wrapped in a marker) cannot leak onto other pages.
 *  Uses !important because some template CSS (e.g. atlantic-blue section headers)
 *  declares `display: flex !important`, which would override a plain inline none. */
function applyPageVisibility(root: HTMLElement, all: Set<string>, visible: Set<string>) {
  // Sections that have at least one known unit (so we may safely toggle the wrapper)
  // and sections that have at least one visible unit on this page (keep their wrapper).
  const knownSections = new Set<string>();
  const visibleSections = new Set<string>();
  for (const node of Array.from(root.querySelectorAll(ALL_UNIT_SELECTOR)) as HTMLElement[]) {
    const id = nodeUnitId(node);
    if (!id || !all.has(id)) continue;
    const sec = nearestAncestorSectionId(node);
    if (!sec) continue;
    knownSections.add(sec);
    if (visible.has(id)) visibleSections.add(sec);
  }

  // Hide entire known section wrappers with no visible units on this page.
  for (const sec of Array.from(root.querySelectorAll("[data-section]")) as HTMLElement[]) {
    const sid = sec.getAttribute("data-section");
    if (!sid || !knownSections.has(sid)) continue;
    if (visibleSections.has(sid)) {
      sec.style.removeProperty("display");
    } else {
      sec.style.setProperty("display", "none", "important");
    }
  }

  // Within visible sections, hide individual marked units not on this page.
  for (const node of Array.from(root.querySelectorAll(ALL_UNIT_SELECTOR)) as HTMLElement[]) {
    const id = nodeUnitId(node);
    if (!id || !all.has(id)) continue;
    if (visible.has(id)) {
      node.style.removeProperty("display");
    } else {
      node.style.setProperty("display", "none", "important");
    }
  }
}

export const PaginatedPreview: React.FC<PaginatedPreviewProps> = ({
  resume,
  template,
  sections,
  layout,
  dismissedEmptyTrailingPages = 0,
  onPageDelete,
  onPaginationSnapshot,
}) => {
  const currentLayout = layout || resume.layout || { type: "single" };
  const isAtlanticBlue = template.id === "atlantic-blue";

  const paddingMm = useMemo(() => {
    const templatePadding = getTemplateStyle(getExtendedTemplate(template)).padding;
    return resolveEffectiveLayoutPaddingMm(
      template.id,
      currentLayout.padding as
        | { top: number; bottom: number; left: number; right: number }
        | undefined,
      templatePadding,
    );
  }, [template, currentLayout.type, currentLayout.padding?.top, currentLayout.padding?.bottom, currentLayout.padding?.left, currentLayout.padding?.right]);

  const { contentHeightMm: CONTENT_HEIGHT_MM } = pageVerticalGuttersMm(paddingMm);
  const pageHeightLimit = (CONTENT_HEIGHT_MM / A4_HEIGHT_MM) * 1122.5;

  const typographyKey = useMemo(() => {
    const fs = currentLayout.fontSize as
      | { heading?: number; subheading?: number; body?: number; small?: number; sectionHeader?: number }
      | undefined;
    return [fs?.heading ?? "", fs?.subheading ?? "", fs?.body ?? "", fs?.small ?? "", fs?.sectionHeader ?? "", currentLayout.fontFamily ?? ""].join("|");
  }, [currentLayout.fontSize, currentLayout.fontFamily]);

  const contentMeasureKey = useMemo(() => buildResumeContentMeasureKey(resume), [resume]);
  const sectionOrderKey = useMemo(
    () => sections?.map((s, idx) => `${idx}:${s.id}-${s.visible}-${s.column ?? ""}`).join("|") ?? "",
    [sections],
  );
  const rendererKey = useMemo(() => {
    const padKey = `${paddingMm.top}-${paddingMm.bottom}-${paddingMm.left}-${paddingMm.right}`;
    return `${sectionOrderKey}-${template.id}-${currentLayout.type}-${padKey}-${typographyKey}-${contentMeasureKey}`;
  }, [sectionOrderKey, template.id, currentLayout.type, paddingMm, typographyKey, contentMeasureKey]);

  const { pages, pageUnits, pagesKey, isPaginating, measuringRef, allUnitIds } =
    useResumePagination({
      resume,
      sections: sections || [],
      pageHeightLimit,
      measureKey: rendererKey,
    });

  const [frame, setFrame] = useState<PreviewFrame>(() => ({
    key: "", pages: [], pageUnits: [], allUnitIds: [], resume, sections, layout, template,
  }));

  useLayoutEffect(() => {
    if (pagesKey && pagesKey === rendererKey && pages.length > 0) {
      setFrame({ key: rendererKey, pages, pageUnits, allUnitIds, resume, sections, layout, template });
    }
  }, [pagesKey, rendererKey, pages, pageUnits, allUnitIds, resume, sections, layout, template]);

  const frameIsCurrent = frame.key === rendererKey;
  const visiblePages = frame.pages;
  const visiblePageUnits = frame.pageUnits;
  const allUnitSet = useMemo(() => new Set(frame.allUnitIds), [frame.allUnitIds]);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Apply display:none visibility per page whenever the frame or DOM changes.
  useLayoutEffect(() => {
    visiblePageUnits.forEach((unitIds, i) => {
      const root = pageRefs.current[i];
      if (!root) return;
      applyPageVisibility(root, allUnitSet, new Set(unitIds));
    });
  }, [visiblePageUnits, allUnitSet, frame.key]);

  const totalPreviewPages = visiblePages.length;

  const isPageEmpty = useCallback(
    (idx: number) => (visiblePageUnits[idx]?.length ?? 0) === 0,
    [visiblePageUnits],
  );

  const canShowPageDeleteControl = useCallback(
    (idx: number) => idx + 1 < totalPreviewPages,
    [totalPreviewPages],
  );

  useLayoutEffect(() => {
    onPaginationSnapshot?.({
      pages: visiblePages,
      rawPages: frame.pages,
      pageUnits: visiblePageUnits,
      measureRoot: measuringRef.current,
      isCalculated: frameIsCurrent && !isPaginating,
    });
  }, [visiblePages, visiblePageUnits, frame, frameIsCurrent, isPaginating, onPaginationSnapshot, measuringRef]);

  const handlePageDeleteClick = useCallback(
    (idx: number) => {
      if (!onPageDelete || !isPageEmpty(idx)) return;
      onPageDelete({ pageNumber: idx + 1, totalPages: totalPreviewPages });
    },
    [isPageEmpty, onPageDelete, totalPreviewPages],
  );

  useEffect(() => {
    debugResumePagination("PaginatedPreview:frame", {
      resumeId: resume.resumeId,
      templateId: template.id,
      rendererKeyHead: rendererKey.slice(0, 80),
      pagesCount: pages.length,
      framePages: frame.pages.length,
      frameIsCurrent,
      isPaginating,
    });
  }, [resume.resumeId, template.id, rendererKey, pages.length, frame.pages.length, frameIsCurrent, isPaginating]);

  const showSpinner = visiblePages.length === 0;

  return (
    <>
      {/* Hidden measure DOM — always renders the LIVE props (nothing hidden). */}
      <div
        ref={measuringRef}
        id={`resume-measure-${resume.resumeId}`}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          top: -10000,
          left: -10000,
          width: `${A4_WIDTH_MM}mm`,
        }}
      >
        <ResumeRenderer resume={resume} template={template} sections={sections} layout={layout} />
      </div>

      {showSpinner && isPaginating && (
        <div className="text-gray-400 text-sm mt-4 animate-pulse">Optimizing layout...</div>
      )}

      {visiblePages.length > 0 && (
        <div className="inline-block" style={{ paddingRight: onPageDelete ? "44px" : undefined }}>
          <div className="flex flex-col items-center">
            {visiblePages.map((page, index) => (
              <div key={`page-wrap-${index}-${frame.key}`} className="relative mb-5" style={{ width: `${A4_WIDTH_MM}mm` }}>
                <div
                  className={isAtlanticBlue ? "resume-page resume-page--atlantic-blue" : "resume-page"}
                  style={{
                    width: `${A4_WIDTH_MM}mm`,
                    height: `${A4_HEIGHT_MM}mm`,
                    maxHeight: `${A4_HEIGHT_MM}mm`,
                    overflow: "hidden",
                    position: "relative",
                    background: isAtlanticBlue ? ATLANTIC_BLUE_PAGINATED_PAGE_BG : "#ffffff",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div
                    ref={(el) => { pageRefs.current[index] = el; }}
                    style={{ width: "100%", height: "100%", boxSizing: "border-box" }}
                  >
                    <ResumeRenderer
                      resume={frame.resume}
                      template={frame.template}
                      sections={frame.sections}
                      layout={frame.layout}
                      pageNumber={page.pageNumber}
                    />
                  </div>
                </div>

                {onPageDelete && canShowPageDeleteControl(index) ? (
                  <button
                    type="button"
                    disabled={!isPageEmpty(index)}
                    onClick={() => handlePageDeleteClick(index)}
                    className={cn(
                      "absolute top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-background shadow-sm transition-colors",
                      isPageEmpty(index)
                        ? "text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        : "cursor-not-allowed text-muted-foreground/40 opacity-50",
                    )}
                    style={{ left: `calc(${A4_WIDTH_MM}mm + 12px)` }}
                    title={isPageEmpty(index) ? `Remove blank page ${page.pageNumber}` : `Page ${page.pageNumber} has content`}
                    aria-label={isPageEmpty(index) ? `Remove blank page ${page.pageNumber}` : `Page ${page.pageNumber} has content`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
