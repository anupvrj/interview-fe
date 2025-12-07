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

  // Helper function to identify sections with splittable items
  const isSplittableSection = (section: HTMLElement): boolean => {
    const sectionType = section.dataset.section;
    return [
      "experience",
      "projects",
      "education",
      "courses",
      "publications",
      "references",
    ].includes(sectionType || "");
  };

  // Helper function to get splittable items from a section
  const getSplittableItems = (section: HTMLElement): HTMLElement[] => {
    // Look for the container div that holds the items (usually after the header)
    const containers = Array.from(section.children).filter((child) => {
      const element = child as HTMLElement;
      return (
        element.tagName === "DIV" &&
        !element.style.fontWeight?.includes("bold") &&
        !element.style.borderBottom
      );
    });

    if (containers.length === 0) return [];

    // Get the main content container (usually the last div)
    const itemContainer = containers.at(-1) as HTMLElement;

    // Get direct children that represent individual items
    return Array.from(itemContainer.children).filter((child) => {
      const element = child as HTMLElement;
      // Items typically have marginBottom and are block elements
      return element.style.marginBottom && element.tagName === "DIV";
    }) as HTMLElement[];
  };

  // Enhanced function to split sections at item level
  const splitSectionItems = (
    section: HTMLElement,
    targetContainer: HTMLElement,
    hasOverflowed: (page: HTMLElement) => boolean,
    createNewPage: () => HTMLDivElement,
    pages: HTMLDivElement[]
  ): HTMLDivElement => {
    if (!isSplittableSection(section)) {
      // No splittable items, treat as regular section
      targetContainer.appendChild(section);
      return (
        (targetContainer.closest(".resume-page") as HTMLDivElement) ||
        pages.at(-1)!
      );
    }

    const items = getSplittableItems(section);

    if (items.length === 0) {
      // No items found, treat as regular section
      targetContainer.appendChild(section);
      return (
        (targetContainer.closest(".resume-page") as HTMLDivElement) ||
        pages.at(-1)!
      );
    }

    // Find the item container
    const containers = Array.from(section.children).filter((child) => {
      const element = child as HTMLElement;
      return (
        element.tagName === "DIV" &&
        !element.style.fontWeight?.includes("bold") &&
        !element.style.borderBottom
      );
    });
    const itemContainer = containers.at(-1) as HTMLElement;

    // Clone section structure without items
    const sectionClone = section.cloneNode(false) as HTMLElement;

    // Recreate section structure
    Array.from(section.children).forEach((child) => {
      if (child === itemContainer) {
        // Create empty container for items
        const emptyContainer = child.cloneNode(false) as HTMLElement;
        sectionClone.appendChild(emptyContainer);
      } else {
        // Copy headers and other elements
        sectionClone.appendChild(child.cloneNode(true));
      }
    });

    targetContainer.appendChild(sectionClone);
    const targetItemContainer = Array.from(sectionClone.children).at(
      -1
    ) as HTMLElement;

    let currentPage =
      (targetContainer.closest(".resume-page") as HTMLDivElement) ||
      pages.at(-1)!;
    let currentTargetContainer = targetContainer;
    let currentSectionClone = sectionClone;
    let currentItemContainer = targetItemContainer;

    // Add items one by one
    items.forEach((item) => {
      const itemClone = item.cloneNode(true) as HTMLElement;
      // Remove pageBreakInside: avoid to allow splitting
      itemClone.style.pageBreakInside = "auto";

      currentItemContainer.appendChild(itemClone);

      if (hasOverflowed(currentPage)) {
        // Remove the item that caused overflow
        currentItemContainer.removeChild(itemClone);

        // Create new page
        currentPage = createNewPage();

        // Create new section structure on new page
        const newSectionClone = section.cloneNode(false) as HTMLElement;
        Array.from(section.children).forEach((child) => {
          if (child === itemContainer) {
            const emptyContainer = child.cloneNode(false) as HTMLElement;
            newSectionClone.appendChild(emptyContainer);
          } else {
            newSectionClone.appendChild(child.cloneNode(true));
          }
        });

        currentPage.appendChild(newSectionClone);
        currentSectionClone = newSectionClone;
        currentItemContainer = Array.from(newSectionClone.children).at(
          -1
        ) as HTMLElement;

        // Add the item to new page
        currentItemContainer.appendChild(itemClone);
      }
    });

    return currentPage;
  };

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

    let pages: HTMLDivElement[] = [];

    const createNewPage = (): HTMLDivElement => {
      const page = document.createElement("div");
      page.className = pageClass;
      page.setAttribute("style", pageStyle);
      page.style.minHeight = "297mm";
      page.style.height = "auto";
      page.style.overflow = "visible";
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

    let currentPage: HTMLDivElement = createNewPage();

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

        // Fill Left Column with item-level splitting
        Array.from(leftSource.children).forEach((section) => {
          const sectionElement = section as HTMLElement;

          if (isSplittableSection(sectionElement)) {
            // Use item-level splitting for splittable sections
            currentPage = splitSectionItems(
              sectionElement,
              leftTarget,
              hasOverflowed,
              () => {
                currentPage = createNewPage();
                flexWrapper = child.cloneNode(false) as HTMLElement;
                currentPage.appendChild(flexWrapper);
                sectionFlexWrappers[pages.length - 1] = flexWrapper;
                leftTarget = leftSource.cloneNode(false) as HTMLElement;
                rightTarget = rightSource.cloneNode(false) as HTMLElement;
                flexWrapper.appendChild(leftTarget);
                flexWrapper.appendChild(rightTarget);
                return currentPage;
              },
              pages
            );
          } else {
            // Regular section handling
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
          }
        });

        // Fill Right Column
        let rightColPageIndex = startPageIndex;
        let currentRightPage = pages[rightColPageIndex];
        let currentFlex = sectionFlexWrappers[rightColPageIndex];
        let currentRightTarget = currentFlex.children[1] as HTMLElement;

        // Balanced overflow check for right column
        const checkRightColumnOverflow = (page: HTMLElement) => {
          const flex = page.querySelector(
            '[style*="display: flex"]'
          ) as HTMLElement;
          if (!flex) return hasOverflowed(page);

          const leftCol = flex.children[0] as HTMLElement;
          const rightCol = flex.children[1] as HTMLElement;

          // Check if the page as a whole has overflowed
          const pageOverflowed = hasOverflowed(page);

          // If page hasn't overflowed, allow right column to continue
          if (!pageOverflowed) return false;

          // If page has overflowed, check if it's due to right column being too tall
          // compared to left column. Only move right content if right column is
          // significantly taller than left column
          const leftColHeight = leftCol.scrollHeight;
          const rightColHeight = rightCol.scrollHeight;

          // Move right content only if right column is much taller than left
          // or if right column alone exceeds page limit
          return (
            rightColHeight > leftColHeight + 200 ||
            rightColHeight > PAGE_HEIGHT_LIMIT - 100
          );
        };

        Array.from(rightSource.children).forEach((section) => {
          const sectionElement = section as HTMLElement;

          if (isSplittableSection(sectionElement)) {
            // Use item-level splitting for splittable sections
            const newPage = splitSectionItems(
              sectionElement,
              currentRightTarget,
              checkRightColumnOverflow,
              () => {
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
                return currentRightPage;
              },
              pages
            );

            // Update current page reference
            if (newPage !== currentRightPage) {
              currentRightPage = newPage;
              currentFlex = sectionFlexWrappers[rightColPageIndex];
              currentRightTarget = currentFlex.children[1] as HTMLElement;
            }
          } else {
            // Regular section handling
            currentRightTarget.appendChild(section);

            if (checkRightColumnOverflow(currentRightPage)) {
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
          }
        });
      } else {
        // Single Column Layout
        const hasSectionChildren = child.querySelector("[data-section]");
        const isWrapper = !child.dataset.section && hasSectionChildren;

        if (isWrapper) {
          let wrapperClone = child.cloneNode(false) as HTMLElement;
          currentPage.appendChild(wrapperClone);

          Array.from(child.children).forEach((section) => {
            const sectionElement = section as HTMLElement;

            if (isSplittableSection(sectionElement)) {
              // Use item-level splitting for splittable sections
              currentPage = splitSectionItems(
                sectionElement,
                wrapperClone,
                hasOverflowed,
                () => {
                  currentPage = createNewPage();
                  wrapperClone = child.cloneNode(false) as HTMLElement;
                  currentPage.appendChild(wrapperClone);
                  return currentPage;
                },
                pages
              );
            } else {
              // Regular section handling
              wrapperClone.appendChild(section);

              if (hasOverflowed(currentPage)) {
                wrapperClone.removeChild(section);
                currentPage = createNewPage();
                wrapperClone = child.cloneNode(false) as HTMLElement;
                currentPage.appendChild(wrapperClone);
                wrapperClone.appendChild(section);
              }
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
