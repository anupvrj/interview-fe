"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bold,
  CalendarDays,
  Copy,
  EyeOff,
  Italic,
  List,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Trash2,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isEntrySection } from "./canvasOps";
import { locateText } from "./textLocator";
import { DatePickerPopover, type EntryDates } from "./DatePickerPopover";
import { TagListPopover } from "./TagListPopover";

/** Labels used by templates that merge several sections into one block. */
const LABEL_TO_SECTION: Record<string, string> = {
  languages: "languages",
  language: "languages",
  certifications: "certificates",
  certificates: "certificates",
  "awards/activities": "achievements",
  awards: "awards",
  achievements: "achievements",
  interests: "interests",
  skills: "skills",
  courses: "courses",
  publications: "publications",
};

/** Sections edited as a tag list (their items are derived text, not one field each). */
const TAG_SECTIONS = new Set(["skills"]);

/** Sections whose entries have a From/To date. */
const DATED_SECTIONS = new Set(["experience", "education", "projects", "organisations"]);

/** Text highlighted on the page: an issue (red/blue), a matched keyword (green) or an AI edit (orange). */
export interface CanvasMark {
  id: string;
  text: string;
  tone: "error" | "weak" | "keyword" | "ai";
  wholeWord?: boolean;
}

const MARK_STYLE: Record<CanvasMark["tone"], string> = {
  error: "bg-red-400/30 border-b-2 border-red-500",
  weak: "bg-sky-400/25",
  keyword: "bg-emerald-400/30",
  ai: "bg-orange-300/40 border-b-2 border-orange-500",
};

export interface CanvasSectionRef {
  id: string;
  type: string;
  title: string;
}

/** What is focused on the page: a section, optionally one entry in it. */
export interface CanvasFocus {
  sectionId: string;
  index: number | null;
}

export interface CanvasInteractionHandlers {
  onAddEntry: (sectionId: string, afterIndex: number | null) => void;
  onMoveEntry: (sectionId: string, index: number, delta: -1 | 1) => void;
  onDuplicateEntry: (sectionId: string, index: number) => void;
  onDeleteEntry: (sectionId: string, index: number) => void;
  onMoveSection: (sectionId: string, delta: -1 | 1) => void;
  onHideSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onOpenDetails: (sectionId: string) => void;
  onAddSectionAfter: (sectionId: string) => void;
  onNotice?: (message: string) => void;
  /** Current dates of an entry ("experience.2"). */
  getDates: (entryPath: string) => EntryDates;
  onSetDates: (entryPath: string, dates: EntryDates) => void;
  getTags: (sectionType: string) => string[];
  onSetTags: (sectionType: string, tags: string[]) => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ENTRY_LABEL: Record<string, string> = {
  experience: "Entry",
  education: "Entry",
  projects: "Project",
  certificates: "Certificate",
  awards: "Award",
  achievements: "Achievement",
  languages: "Language",
  references: "Reference",
  publications: "Publication",
  courses: "Course",
  organisations: "Entry",
};

function isVisible(el: Element): boolean {
  if ((el as HTMLElement).closest("[id^='resume-measure-']")) return false;
  return el.getClientRects().length > 0;
}

function cssEscape(value: string): string {
  return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value.replace(/"/g, '\\"');
}

/** Visible elements for a focus target, across pages (an entry can be split over two pages). */
function targetElements(root: HTMLElement, target: CanvasFocus): HTMLElement[] {
  const sections = Array.from(
    root.querySelectorAll<HTMLElement>(`.resume-page [data-section="${cssEscape(target.sectionId)}"]`),
  ).filter(isVisible);
  if (target.index === null) return sections;
  return sections.flatMap((section) =>
    Array.from(section.querySelectorAll<HTMLElement>(`[data-item-index="${target.index}"]`)).filter(
      (el) => isVisible(el) && el.closest("[data-section]") === section,
    ),
  );
}

function boxesFor(root: HTMLElement, elements: HTMLElement[], pad = 4): Box[] {
  const origin = root.getBoundingClientRect();
  return elements
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({
      top: r.top - origin.top - pad,
      left: r.left - origin.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    }));
}

function pageBoxes(root: HTMLElement): Box[] {
  const origin = root.getBoundingClientRect();
  return Array.from(root.querySelectorAll<HTMLElement>(".resume-page")).map((page) => {
    const r = page.getBoundingClientRect();
    return { top: r.top - origin.top, left: r.left - origin.left, width: r.width, height: r.height };
  });
}

function sameTarget(a: CanvasFocus | null, b: CanvasFocus | null) {
  return a?.sectionId === b?.sectionId && a?.index === b?.index;
}

/** Find what a pointer event landed on: the entry if the section has entries, else the section. */
function targetFromEvent(event: Event, sections: CanvasSectionRef[]): CanvasFocus | null {
  const el = event.target as HTMLElement | null;
  if (!el || !el.closest(".resume-page")) return null;
  const sectionEl = el.closest<HTMLElement>("[data-section]");
  if (!sectionEl) return null;
  const sectionId = sectionEl.getAttribute("data-section") ?? "";
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return null;
  if (isEntrySection(section.type)) {
    const item = el.closest<HTMLElement>("[data-item-index]");
    if (item && sectionEl.contains(item)) {
      const index = Number(item.getAttribute("data-item-index"));
      if (Number.isFinite(index)) return { sectionId, index };
    }
  }
  return { sectionId, index: null };
}

function ToolButton({
  label,
  onClick,
  children,
  disabled,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      // Keep focus (and the text selection) in the field being edited.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        tone === "primary" && "bg-primary px-3 text-primary-foreground hover:bg-primary/90",
        tone === "danger" && "text-slate-600 hover:bg-red-50 hover:text-red-600",
        tone === "default" && "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />;

export function CanvasInteractionLayer({
  rootRef,
  sections,
  entryCounts,
  focus,
  onFocusChange,
  handlers,
  isMobile,
  revision,
  marks = [],
  activeMarkId = null,
}: {
  /** Element wrapping the rendered pages; overlay coordinates are relative to it. */
  rootRef: React.RefObject<HTMLElement | null>;
  sections: CanvasSectionRef[];
  /** Number of entries per section id (for enabling move up/down). */
  entryCounts: Record<string, number>;
  focus: CanvasFocus | null;
  onFocusChange: (focus: CanvasFocus | null) => void;
  handlers: CanvasInteractionHandlers;
  isMobile: boolean;
  /** Changes whenever the rendered resume changes, so boxes are re-measured. */
  revision: unknown;
  marks?: CanvasMark[];
  /** The mark the user picked in a panel: outlined and scrolled into view. */
  activeMarkId?: string | null;
}) {
  const [hover, setHover] = useState<CanvasFocus | null>(null);
  const [focusBoxes, setFocusBoxes] = useState<Box[]>([]);
  const [hoverBoxes, setHoverBoxes] = useState<Box[]>([]);
  const [hoverSectionBoxes, setHoverSectionBoxes] = useState<Box[]>([]);
  const [pages, setPages] = useState<Box[]>([]);
  const [markBoxes, setMarkBoxes] = useState<Array<Box & { id: string; tone: CanvasMark["tone"] }>>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dateEdit, setDateEdit] = useState<{ path: string; top: number; left: number } | null>(null);
  const [tagEdit, setTagEdit] = useState<{ sectionType: string; title: string; top: number; left: number } | null>(null);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    setPages(pageBoxes(root));
    setFocusBoxes(focus ? boxesFor(root, targetElements(root, focus)) : []);
    setHoverBoxes(hover && !sameTarget(hover, focus) ? boxesFor(root, targetElements(root, hover), 3) : []);
    setHoverSectionBoxes(hover ? boxesFor(root, targetElements(root, { sectionId: hover.sectionId, index: null }), 3) : []);
    const origin = root.getBoundingClientRect();
    setMarkBoxes(
      marks.flatMap((mark) =>
        locateText(root, mark.text, { wholeWord: mark.wholeWord, max: mark.tone === "keyword" ? 6 : 2 }).flatMap((hit) =>
          hit.rects.map((r) => ({
            id: mark.id,
            tone: mark.tone,
            top: r.top - origin.top - 1,
            left: r.left - origin.left - 1,
            width: r.width + 2,
            height: r.height + 2,
          })),
        ),
      ),
    );
  }, [rootRef, focus, hover, marks]);

  // Bring the picked issue into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !activeMarkId) return;
    const mark = marks.find((m) => m.id === activeMarkId);
    if (!mark) return;
    const hit = locateText(root, mark.text, { wholeWord: mark.wholeWord, max: 1 })[0];
    const rect = hit?.rects[0];
    if (!rect) return;
    const scroller = root.closest(".rx-canvas-scroll") as HTMLElement | null;
    if (scroller) {
      const box = scroller.getBoundingClientRect();
      scroller.scrollBy({ top: rect.top - box.top - box.height / 3, behavior: "smooth" });
    }
  }, [activeMarkId, marks, rootRef]);

  useLayoutEffect(measure, [measure, revision]);

  // Re-measure when pagination re-flows or the window/zoom changes.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
      // Zoom animates (CSS transition); measure again once it has settled.
      clearTimeout(settle);
      settle = setTimeout(measure, 260);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "class"] });
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener("resize", schedule);
    root.addEventListener("transitionend", schedule);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      root.removeEventListener("transitionend", schedule);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [rootRef, measure]);

  // Pointer tracking + click-to-focus on the pages (delegated, so templates need no handlers).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const inOverlay = (e: Event) => Boolean((e.target as HTMLElement | null)?.closest("[data-rx-overlay]"));
    const onMove = (e: PointerEvent) => {
      if (inOverlay(e) || e.pointerType === "touch") return;
      const next = targetFromEvent(e, sectionsRef.current);
      setHover((prev) => (sameTarget(prev, next) ? prev : next));
    };
    const onLeave = () => setHover(null);
    const onClick = (e: MouseEvent) => {
      if (inOverlay(e)) return;
      const dateEl = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-rx-date]");
      if (dateEl && dateEl.closest(".resume-page")) {
        const origin = root.getBoundingClientRect();
        const r = dateEl.getBoundingClientRect();
        setDateEdit({ path: dateEl.getAttribute("data-rx-date") ?? "", top: r.bottom - origin.top + 6, left: r.left - origin.left });
      } else {
        setDateEdit(null);
      }
      // Skills: anywhere but the editable title opens the tag editor.
      const target = e.target as HTMLElement | null;
      const sectionEl = target?.closest<HTMLElement>(".resume-page [data-section]");
      const section = sectionEl ? sectionsRef.current.find((s) => s.id === sectionEl.getAttribute("data-section")) : undefined;
      if (section && TAG_SECTIONS.has(section.type) && !target?.closest("[data-rx-path], [data-section-header], h2")) {
        const origin = root.getBoundingClientRect();
        const r = sectionEl!.getBoundingClientRect();
        setTagEdit({ sectionType: section.type, title: section.title, top: r.bottom - origin.top + 6, left: r.left - origin.left });
      } else {
        setTagEdit(null);
        // Text with no inline editor (combined lines like "Spanish (Native)", labels):
        // open that section's full editor so nothing on the page is a dead end.
        const hasOwnText =
          !!target && Array.from(target.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 1);
        if (
          section &&
          hasOwnText &&
          !target!.closest("[data-rx-path], [data-rx-date], [data-section-header], a") &&
          section.type !== "personalInfo"
        ) {
          // Combined lines ("Languages: …", "Certifications: …") belong to another section.
          const line = target!.closest("li, p, div");
          const label = (line?.textContent ?? "").split(":")[0].trim().toLowerCase();
          const labelType = LABEL_TO_SECTION[label];
          const owner = labelType ? sectionsRef.current.find((s) => s.type === labelType) : undefined;
          handlersRef.current.onOpenDetails((owner ?? section).id);
        }
      }
      // Links on the page (email, LinkedIn…) must not navigate away while editing.
      if ((e.target as HTMLElement | null)?.closest(".resume-page a")) e.preventDefault();
      const next = targetFromEvent(e, sectionsRef.current);
      setMenuOpen(false);
      onFocusChange(next);
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("click", onClick, true);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("click", onClick, true);
    };
  }, [rootRef, onFocusChange]);

  // Escape (outside a field) leaves focus mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (dateEdit || tagEdit)) {
        setDateEdit(null);
        setTagEdit(null);
        return;
      }
      if (e.key !== "Escape" || !focus) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.isContentEditable) return;
      setMenuOpen(false);
      onFocusChange(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, onFocusChange, dateEdit, tagEdit]);

  const focusSection = focus ? sections.find((s) => s.id === focus.sectionId) : undefined;
  const hoverSection = hover ? sections.find((s) => s.id === hover.sectionId) : undefined;
  const sectionIndex = focusSection ? sections.findIndex((s) => s.id === focusSection.id) : -1;
  const count = focus ? entryCounts[focus.sectionId] ?? 0 : 0;
  const entryFocused = Boolean(focusSection && focus?.index !== null && isEntrySection(focusSection.type));
  const canAddEntry = Boolean(focusSection && isEntrySection(focusSection.type));

  const format = (command: "bold" | "italic" | "underline" | "insertUnorderedList") => {
    const active = document.activeElement as HTMLElement | null;
    if (!active?.hasAttribute("data-rx-rich")) {
      handlers.onNotice?.("Text styling works in descriptions and bullet points.");
      return;
    }
    document.execCommand(command);
  };

  const anchor = focusBoxes[0];
  const toolbarTop = anchor ? (anchor.top > 52 ? anchor.top - 48 : anchor.top + anchor.height + 8) : 0;

  const toolbar = focusSection && focus && (
    <div
      data-rx-overlay
      role="toolbar"
      aria-label={`${focusSection.title} tools`}
      className={cn(
        "pointer-events-auto z-30 flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10",
        isMobile ? "fixed inset-x-3 bottom-3 justify-between overflow-x-auto" : "absolute",
      )}
      style={isMobile || !anchor ? undefined : { top: toolbarTop, left: Math.max(anchor.left, 0) }}
    >
      {canAddEntry ? (
        <ToolButton
          label={`Add ${ENTRY_LABEL[focusSection.type] ?? "entry"}`}
          tone="primary"
          onClick={() => handlers.onAddEntry(focusSection.id, focus.index)}
        >
          <Plus className="h-3.5 w-3.5" />
          {ENTRY_LABEL[focusSection.type] ?? "Entry"}
        </ToolButton>
      ) : null}
      {entryFocused && focus.index !== null ? (
        <>
          <ToolButton label="Move up" disabled={focus.index <= 0} onClick={() => handlers.onMoveEntry(focusSection.id, focus.index!, -1)}>
            <ArrowUp className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="Move down"
            disabled={focus.index >= count - 1}
            onClick={() => handlers.onMoveEntry(focusSection.id, focus.index!, 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </ToolButton>
          {DATED_SECTIONS.has(focusSection.type) ? (
            <ToolButton
              label="Dates"
              onClick={() => {
                const b = focusBoxes[0];
                if (!b) return;
                setDateEdit((prev) =>
                  prev ? null : { path: `${focusSection.type}.${focus.index}`, top: b.top + 30, left: b.left + Math.max(0, b.width - 270) },
                );
              }}
            >
              <CalendarDays className="h-4 w-4" />
            </ToolButton>
          ) : null}
        </>
      ) : (
        <>
          <ToolButton label="Move section up" disabled={sectionIndex <= 0} onClick={() => handlers.onMoveSection(focusSection.id, -1)}>
            <ArrowUp className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="Move section down"
            disabled={sectionIndex < 0 || sectionIndex >= sections.length - 1}
            onClick={() => handlers.onMoveSection(focusSection.id, 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </ToolButton>
        </>
      )}
      <Divider />
      <ToolButton label="Bold" onClick={() => format("bold")}>
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Italic" onClick={() => format("italic")}>
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Underline" onClick={() => format("underline")}>
        <Underline className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Bullet list" onClick={() => format("insertUnorderedList")}>
        <List className="h-4 w-4" />
      </ToolButton>
      <Divider />
      <ToolButton label="More fields (dates, links, photo…)" onClick={() => handlers.onOpenDetails(focusSection.id)}>
        <SlidersHorizontal className="h-4 w-4" />
        {isMobile ? null : <span className="hidden lg:inline">Details</span>}
      </ToolButton>
      {entryFocused && focus.index !== null ? (
        <>
          <ToolButton label="Duplicate" onClick={() => handlers.onDuplicateEntry(focusSection.id, focus.index!)}>
            <Copy className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Delete entry" tone="danger" onClick={() => handlers.onDeleteEntry(focusSection.id, focus.index!)}>
            <Trash2 className="h-4 w-4" />
          </ToolButton>
        </>
      ) : null}
      {focusSection.type !== "personalInfo" ? (
        <div className="relative">
          <ToolButton label="Section options" onClick={() => setMenuOpen((v) => !v)}>
            <MoreHorizontal className="h-4 w-4" />
          </ToolButton>
          {menuOpen ? (
            <div
              className={cn(
                "absolute z-40 w-48 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl",
                isMobile ? "bottom-10 right-0" : "right-0 top-10",
              )}
            >
              {[
                { label: "Move section up", icon: ArrowUp, run: () => handlers.onMoveSection(focusSection.id, -1), off: sectionIndex <= 0 },
                {
                  label: "Move section down",
                  icon: ArrowDown,
                  run: () => handlers.onMoveSection(focusSection.id, 1),
                  off: sectionIndex >= sections.length - 1,
                },
                { label: "Add section below", icon: Plus, run: () => handlers.onAddSectionAfter(focusSection.id) },
                { label: "Hide section", icon: EyeOff, run: () => handlers.onHideSection(focusSection.id) },
                { label: "Delete section", icon: Trash2, run: () => handlers.onDeleteSection(focusSection.id), danger: true },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.off}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setMenuOpen(false);
                    item.run();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 disabled:opacity-40",
                    item.danger ? "text-red-600" : "text-slate-700",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  // "+ Section" / "+ Entry" divider under the hovered section (desktop only).
  const hoverBottom = hoverSectionBoxes.length ? hoverSectionBoxes[hoverSectionBoxes.length - 1] : null;
  const divider =
    !isMobile && hoverSection && hoverBottom && hoverSection.id !== focus?.sectionId ? (
      <div
        data-rx-overlay
        className="pointer-events-none absolute z-20 flex items-center"
        style={{ top: hoverBottom.top + hoverBottom.height - 11, left: hoverBottom.left, width: hoverBottom.width }}
      >
        <span className="h-px flex-1 bg-primary/40" />
        <div className="pointer-events-auto flex gap-1 px-1">
          <button
            type="button"
            onClick={() => handlers.onAddSectionAfter(hoverSection.id)}
            className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            + Section
          </button>
          {isEntrySection(hoverSection.type) ? (
            <button
              type="button"
              onClick={() => {
                handlers.onAddEntry(hoverSection.id, null);
              }}
              className="rounded-full border border-primary/40 bg-white px-2.5 py-1 text-[11px] font-semibold text-primary shadow hover:bg-primary/5"
            >
              + {ENTRY_LABEL[hoverSection.type] ?? "Entry"}
            </button>
          ) : null}
        </div>
        <span className="h-px flex-1 bg-primary/40" />
      </div>
    ) : null;

  return (
    <div data-rx-overlay className="pointer-events-none absolute inset-0 z-10" aria-hidden={false}>
      {/* Focus mode: dim each page except the active entry. */}
      {focusBoxes.length
        ? pages.map((page, i) => (
            <div
              key={`dim-${i}`}
              className="absolute overflow-hidden"
              style={{ top: page.top, left: page.left, width: page.width, height: page.height }}
            >
              {focusBoxes.some((b) => b.top < page.top + page.height && b.top + b.height > page.top) ? (
                focusBoxes
                  .filter((b) => b.top < page.top + page.height && b.top + b.height > page.top)
                  .map((b, j) => (
                    <div
                      key={j}
                      className="absolute rounded-md transition-all duration-150"
                      style={{
                        top: b.top - page.top,
                        left: b.left - page.left,
                        width: b.width,
                        height: b.height,
                        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.10)",
                      }}
                    />
                  ))
              ) : (
                <div className="absolute inset-0 bg-slate-900/10" />
              )}
            </div>
          ))
        : null}
      {focusBoxes.map((b, i) => (
        <div
          key={`focus-${i}`}
          className="absolute rounded-md ring-2 ring-primary transition-all duration-150"
          style={{ top: b.top, left: b.left, width: b.width, height: b.height }}
        />
      ))}
      {hoverBoxes.map((b, i) => (
        <div
          key={`hover-${i}`}
          className="absolute rounded-md border border-dashed border-primary/50"
          style={{ top: b.top, left: b.left, width: b.width, height: b.height }}
        />
      ))}
      {markBoxes.map((b, i) => (
        <div
          key={`mark-${b.id}-${i}`}
          className={cn(
            "absolute rounded-[2px] mix-blend-multiply",
            MARK_STYLE[b.tone],
            b.id === activeMarkId && "animate-pulse ring-2 ring-offset-1 ring-red-500/70",
          )}
          style={{ top: b.top, left: b.left, width: b.width, height: b.height }}
        />
      ))}
      {divider}
      {toolbar}
      {tagEdit ? (
        <div
          data-rx-overlay
          className={cn("pointer-events-auto z-40", isMobile ? "fixed inset-x-0 bottom-16 flex justify-center" : "absolute")}
          style={isMobile ? undefined : { top: tagEdit.top, left: Math.max(0, tagEdit.left) }}
        >
          <TagListPopover
            title={tagEdit.title}
            tags={handlers.getTags(tagEdit.sectionType)}
            onChange={(tags) => handlers.onSetTags(tagEdit.sectionType, tags)}
            onClose={() => setTagEdit(null)}
          />
        </div>
      ) : null}
      {dateEdit ? (
        <div
          data-rx-overlay
          className={cn("pointer-events-auto z-40", isMobile ? "fixed inset-x-0 bottom-16 flex justify-center" : "absolute")}
          style={isMobile ? undefined : { top: dateEdit.top, left: Math.max(0, dateEdit.left) }}
        >
          <DatePickerPopover
            key={dateEdit.path}
            dates={handlers.getDates(dateEdit.path)}
            allowPresent={!dateEdit.path.startsWith("education")}
            onChange={(dates) => handlers.onSetDates(dateEdit.path, dates)}
            onClose={() => setDateEdit(null)}
          />
        </div>
      ) : null}
    </div>
  );
}
