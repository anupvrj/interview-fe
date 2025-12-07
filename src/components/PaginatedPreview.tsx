"use client";

import React, { useEffect, useRef, useState } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { ResumeRenderer } from "./ResumeRenderer";

interface PaginatedPreviewProps {
  resume: Resume;
  template: ResumeTemplate;
  sections?: any[];
  layout?: any;
}

export const PaginatedPreview: React.FC<PaginatedPreviewProps> = ({
  resume,
  template,
  sections,
  layout,
}) => {
  const sourceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Debounce the pagination
    const timer = setTimeout(() => {
      paginate();
    }, 100);
    return () => clearTimeout(timer);
  }, [resume, template, sections, layout]);

  const paginate = () => {
    if (!sourceRef.current || !targetRef.current) return;

    targetRef.current.innerHTML = "";
    setIsReady(false);

    const sourcePage = sourceRef.current.querySelector(
      ".resume-page"
    ) as HTMLElement;
    if (!sourcePage) return;

    const pageStyle = sourcePage.getAttribute("style") || "";
    const pageClass = sourcePage.className;

    let pages: HTMLElement[] = [];

    const createNewPage = () => {
      const page = document.createElement("div");
      page.className = pageClass;
      page.setAttribute("style", pageStyle);
      page.style.minHeight = "297mm";
      page.style.height = "auto";
      page.style.overflow = "hidden";
      page.style.marginBottom = "20px";
      page.style.position = "relative";
      page.style.background = "white";
      page.style.boxShadow =
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      targetRef.current?.appendChild(page);
      pages.push(page);
      return page;
    };

    // Dynamically measure A4 height for zoom/DPI compatibility
    const measureDiv = document.createElement("div");
    measureDiv.style.height = "297mm";
    measureDiv.style.position = "absolute";
    measureDiv.style.visibility = "hidden";
    document.body.appendChild(measureDiv);
    const PAGE_HEIGHT_LIMIT = measureDiv.offsetHeight + 2;
    document.body.removeChild(measureDiv);

    const hasOverflowed = (page: HTMLElement) => {
      return page.scrollHeight > PAGE_HEIGHT_LIMIT;
    };

    let currentPage = createNewPage();

    const sourceChildren = Array.from(sourcePage.children).map(
      (child) => child.cloneNode(true) as HTMLElement
    );

    sourceChildren.forEach((child) => {
      const isFlexContainer =
        child.style.display === "flex" && child.children.length === 2;

      if (isFlexContainer) {
        // Double Column Layout
        const startPageIndex = pages.length - 1;
        let flexWrapper = child.cloneNode(false) as HTMLElement;
        currentPage.appendChild(flexWrapper);

        const leftSource = child.children[0] as HTMLElement;
        const rightSource = child.children[1] as HTMLElement;

        let leftTarget = leftSource.cloneNode(false) as HTMLElement;
        let rightTarget = rightSource.cloneNode(false) as HTMLElement;

        flexWrapper.appendChild(leftTarget);
        flexWrapper.appendChild(rightTarget);

        const sectionFlexWrappers: HTMLElement[] = [];
        sectionFlexWrappers[startPageIndex] = flexWrapper;

        // Fill Left Column
        Array.from(leftSource.children).forEach((section) => {
          leftTarget.appendChild(section);

          if (hasOverflowed(currentPage)) {
            leftTarget.removeChild(section);
            currentPage = createNewPage();

            flexWrapper = child.cloneNode(false) as HTMLElement;
            currentPage.appendChild(flexWrapper);
            sectionFlexWrappers[pages.length - 1] = flexWrapper;

            leftTarget = leftSource.cloneNode(false) as HTMLElement;
            rightTarget = rightSource.cloneNode(false) as HTMLElement;

            flexWrapper.appendChild(leftTarget);
            flexWrapper.appendChild(rightTarget);

            leftTarget.appendChild(section);
          }
        });

        // Fill Right Column
        let rightColPageIndex = startPageIndex;
        let currentRightPage = pages[rightColPageIndex];
        let currentFlex = sectionFlexWrappers[rightColPageIndex];
        let currentRightTarget = currentFlex.children[1] as HTMLElement;

        Array.from(rightSource.children).forEach((section) => {
          currentRightTarget.appendChild(section);

          if (hasOverflowed(currentRightPage)) {
            currentRightTarget.removeChild(section);
            rightColPageIndex++;

            if (rightColPageIndex >= pages.length) {
              currentPage = createNewPage();

              const newFlex = child.cloneNode(false) as HTMLElement;
              currentPage.appendChild(newFlex);
              sectionFlexWrappers[pages.length - 1] = newFlex;

              const newLeft = leftSource.cloneNode(false) as HTMLElement;
              const newRight = rightSource.cloneNode(false) as HTMLElement;

              newFlex.appendChild(newLeft);
              newFlex.appendChild(newRight);
            }

            currentRightPage = pages[rightColPageIndex];
            currentFlex = sectionFlexWrappers[rightColPageIndex];

            if (!currentFlex) {
              const newFlex = child.cloneNode(false) as HTMLElement;
              currentRightPage.appendChild(newFlex);
              sectionFlexWrappers[rightColPageIndex] = newFlex;

              const newLeft = leftSource.cloneNode(false) as HTMLElement;
              const newRight = rightSource.cloneNode(false) as HTMLElement;

              newFlex.appendChild(newLeft);
              newFlex.appendChild(newRight);
              currentFlex = newFlex;
            }

            currentRightTarget = currentFlex.children[1] as HTMLElement;
            currentRightTarget.appendChild(section);
          }
        });
      } else {
        // Single Column Layout
        const hasSectionChildren = child.querySelector("[data-section]");
        const isWrapper =
          !child.hasAttribute("data-section") && hasSectionChildren;

        if (isWrapper) {
          let wrapperClone = child.cloneNode(false) as HTMLElement;
          currentPage.appendChild(wrapperClone);

          Array.from(child.children).forEach((section) => {
            wrapperClone.appendChild(section);

            if (hasOverflowed(currentPage)) {
              wrapperClone.removeChild(section);
              currentPage = createNewPage();
              wrapperClone = child.cloneNode(false) as HTMLElement;
              currentPage.appendChild(wrapperClone);
              wrapperClone.appendChild(section);
            }
          });
        } else {
          currentPage.appendChild(child);

          if (hasOverflowed(currentPage)) {
            currentPage.removeChild(child);
            currentPage = createNewPage();
            currentPage.appendChild(child);
          }
        }
      }
    });

    setIsReady(true);
  };

  return (
    <>
      <div
        ref={sourceRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          top: -10000,
          left: -10000,
          width: "210mm",
        }}
      >
        <ResumeRenderer
          resume={resume}
          template={template}
          sections={sections}
          layout={layout}
        />
      </div>

      <div ref={targetRef} className="flex flex-col items-center" />

      {!isReady && (
        <div className="text-gray-400 text-sm mt-4 animate-pulse">
          Formatting pages...
        </div>
      )}
    </>
  );
};
