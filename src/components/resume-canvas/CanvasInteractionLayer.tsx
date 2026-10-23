"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Camera,
  GripVertical,
  Pencil,
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
import { locateText, type TextHit } from "./textLocator";
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
  /** Section type the finding is about — outlined when it's picked and its text can't be pointed at. */
  section?: string;
}

/**
 * ATS findings (error/weak) are red boxes with a border so they stand out on the page;
 * keywords are a green underline and AI edits a dashed indigo one.
 */
const WAVY =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 2.5 Q1.5 0 3 2.5 T6 2.5' fill='none' stroke='%23e11d48' stroke-width='1'/%3E%3C/svg%3E\")";
const MARK_STYLE: Record<CanvasMark["tone"], string> = {
  error: "rounded-[3px] border border-rose-600/80 bg-rose-500/[0.14]",
  weak: "rounded-[3px] border border-rose-500/70 bg-rose-500/[0.08]",
  keyword: "border-b-2 border-teal-500",
  ai: "border-b-2 border-dashed border-indigo-500 bg-indigo-500/[0.06]",
};
const MARK_INLINE: Partial<Record<CanvasMark["tone"], React.CSSProperties>> = {};
/** Typos keep a wavy line under the word inside the red box. */
const TYPO_WAVE: React.CSSProperties = { backgroundImage: WAVY, backgroundRepeat: "repeat-x", backgroundPosition: "left bottom", backgroundSize: "6px 3px" };

/**
 * Find a mark's text on the page. AI quotes don't always match the page word for word
 * (trailing words cut, punctuation), so fall back to the first words of the quote.
 */
function locateMark(root: HTMLElement, mark: CanvasMark, max: number): TextHit[] {
  if (!mark.text.trim()) return [];
  const exact = locateText(root, mark.text, { wholeWord: mark.wholeWord, max });
  if (exact.length || mark.wholeWord) return exact;
  const words = mark.text.trim().split(/\s+/);
  for (const n of [8, 5, 3]) {
    if (words.length <= n) continue;
    const prefix = words.slice(0, n).join(" ");
    if (prefix.length < 8) continue;
    const hits = locateText(root, prefix, { max });
    if (hits.length) return hits;
  }
  // A quoted list ("Python, Go, Rag") where the design shows each item on its own (tags,
  // blocks): box each item instead.
  const items = mark.text.split(/\s*[,;]\s*/).map((t) => t.trim()).filter(Boolean);
  if (items.length >= 2 && items.every((t) => t.split(/\s+/).length <= 4)) {
    // Each item can also appear elsewhere ("AWS" in a bullet): keep the section most items share.
    const sectionOf = (hit: TextHit) => hit.field?.closest("[data-section]")?.getAttribute("data-section") ?? "";
    const perItem = items.map((item) => locateText(root, item, { wholeWord: true, max: 8 }));
    const votes = new Map<string, number>();
    for (const hits of perItem) for (const id of new Set(hits.map(sectionOf))) votes.set(id, (votes.get(id) ?? 0) + 1);
    const best = [...votes.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
    return perItem.flatMap((hits) => hits.filter((h) => sectionOf(h) === best).slice(0, 1));
  }
  return [];
}

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
  /** Whether ↑ / ↓ can move a section within its column (two-column designs move per column). */
  canMoveSection?: (sectionId: string) => { up: boolean; down: boolean };
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
  /** Profile photo on the page: pick a new one (opens upload + crop) or remove it. */
  onChangePhoto?: () => void;
  onRemovePhoto?: () => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}


/**
 * A popover anchored on the page that slides up when it would run past the bottom of
 * the window (a menu or date picker opened near the fold must stay fully usable).
 */
const KeepInView = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { "data-rx-overlay"?: boolean }>(
  function KeepInView(props, forwarded) {
    const ref = useRef<HTMLDivElement | null>(null);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || getComputedStyle(el).position === "fixed") return;
      el.style.translate = "";
      const rect = el.getBoundingClientRect();
      const overflow = rect.bottom - (window.innerHeight - 12);
      if (overflow > 0) el.style.translate = `0 ${-Math.min(overflow, Math.max(0, rect.top - 64))}px`;
    });
    return (
      <div
        {...props}
        ref={(node) => {
          ref.current = node;
          if (typeof forwarded === "function") forwarded(node);
          else if (forwarded) forwarded.current = node;
        }}
      />
    );
  },
);

/** Visible page elements of the sections with this type ("skills", "personalInfo"…). */
function sectionElementsOfType(root: HTMLElement, sections: CanvasSectionRef[], type: string): HTMLElement[] {
  const ids = new Set(sections.filter((s) => s.type === type).map((s) => s.id));
  return Array.from(root.querySelectorAll<HTMLElement>(".resume-page [data-section]")).filter(
    (el) => ids.has(el.getAttribute("data-section") ?? "") && isVisible(el) && el.getBoundingClientRect().height > 0,
  );
}

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
  /** Skills sections with nothing in them yet: where to put the "Add skills" button. */
  const [emptyTagBoxes, setEmptyTagBoxes] = useState<Array<Box & { sectionId: string; type: string; title: string }>>([]);
  const [photoBox, setPhotoBox] = useState<Box | null>(null);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [markBoxes, setMarkBoxes] = useState<Array<Box & { id: string; tone: CanvasMark["tone"]; typo: boolean }>>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  /** Rect of the current text selection inside a description (for the style bar). */
  const [selBox, setSelBox] = useState<Box | null>(null);
  const [dateEdit, setDateEdit] = useState<{ path: string; top: number; left: number } | null>(null);
  const [tagEdit, setTagEdit] = useState<{ sectionType: string; title: string; top: number; left: number } | null>(null);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  /**
   * Keeps the selected item where it is on screen when the layout changes under it
   * (pages re-flowing after an edit, autosave work). The user's own scrolling just
   * moves the anchor.
   */
  const anchorRef = useRef<{ key: string; top: number } | null>(null);
  const keepFocusInPlace = useCallback(
    (root: HTMLElement) => {
      if (!focus) {
        anchorRef.current = null;
        return;
      }
      const el = targetElements(root, focus)[0];
      if (!el) return;
      const key = `${focus.sectionId}:${focus.index}`;
      const top = el.getBoundingClientRect().top;
      const scroller = root.closest(".rx-canvas-scroll") as HTMLElement | null;
      const prev = anchorRef.current;
      // Only hold the item in place while it is on screen — if the user has scrolled
      // elsewhere, never pull the view back to it.
      const view = scroller?.getBoundingClientRect();
      const onScreen = !!view && prev !== null && prev.top > view.top - 40 && prev.top < view.bottom;
      if (scroller && prev && onScreen && prev.key === key && Math.abs(top - prev.top) > 2) {
        scroller.scrollTop += top - prev.top;
        anchorRef.current = { key, top: el.getBoundingClientRect().top };
        return;
      }
      anchorRef.current = { key, top };
    },
    [focus],
  );

  // Scrolling (by the user or by us) re-bases the anchor instead of fighting it. Listen at
  // the document (capture) so a re-mounted canvas scroller is always covered.
  useEffect(() => {
    const onScroll = () => {
      const root = rootRef.current;
      if (!root || !focus) return;
      const el = targetElements(root, focus)[0];
      if (el) anchorRef.current = { key: `${focus.sectionId}:${focus.index}`, top: el.getBoundingClientRect().top };
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [rootRef, focus]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    keepFocusInPlace(root);
    setPages(pageBoxes(root));
    setFocusBoxes(focus ? boxesFor(root, targetElements(root, focus)) : []);
    setHoverBoxes(hover && !sameTarget(hover, focus) ? boxesFor(root, targetElements(root, hover), 3) : []);
    setHoverSectionBoxes(hover ? boxesFor(root, targetElements(root, { sectionId: hover.sectionId, index: null }), 3) : []);
    setEmptyTagBoxes(
      sectionsRef.current
        .filter((s) => TAG_SECTIONS.has(s.type) && handlersRef.current.getTags(s.type).length === 0)
        .flatMap((s) => {
          const boxes = boxesFor(root, targetElements(root, { sectionId: s.id, index: null }), 0);
          const last = boxes[boxes.length - 1];
          return last ? [{ ...last, sectionId: s.id, type: s.type, title: s.title }] : [];
        }),
    );
    const photo = Array.from(root.querySelectorAll<HTMLElement>(".resume-page [data-rx-photo]")).find(isVisible);
    setPhotoBox(photo ? boxesFor(root, [photo], 0)[0] ?? null : null);
    const origin = root.getBoundingClientRect();
    setMarkBoxes(
      marks.flatMap((mark) => {
        // Keywords: every mention; typos: up to 2; a quoted sentence: where it is, once.
        const hits = locateMark(root, mark, mark.tone === "keyword" ? 6 : mark.wholeWord ? 2 : 1);
        if (hits.length) {
          return hits.flatMap((hit) =>
            hit.rects.map((r) => ({
              id: mark.id,
              tone: mark.tone,
              typo: !!mark.wholeWord,
              top: r.top - origin.top - 1,
              left: r.left - origin.left - 1,
              width: r.width + 2,
              height: r.height + 2,
            })),
          );
        }
        // Nothing quotable (e.g. "Missing LinkedIn"): outline its section once it's picked.
        if (mark.section && mark.id === activeMarkId) {
          return sectionElementsOfType(root, sectionsRef.current, mark.section)
            .slice(0, 1)
            .flatMap((el) => boxesFor(root, [el], 3))
            .map((b) => ({ ...b, id: mark.id, tone: mark.tone, typo: false }));
        }
        return [];
      }),
    );
  }, [rootRef, focus, hover, marks, keepFocusInPlace, activeMarkId]);

  // Bring the picked issue into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !activeMarkId) return;
    const mark = marks.find((m) => m.id === activeMarkId);
    if (!mark) return;
    const hit = locateMark(root, mark, 1)[0];
    const rect =
      hit?.rects[0] ??
      (mark.section ? sectionElementsOfType(root, sectionsRef.current, mark.section)[0]?.getBoundingClientRect() : undefined);
    if (!rect) return;
    const scroller = root.closest(".rx-canvas-scroll") as HTMLElement | null;
    if (scroller) {
      const box = scroller.getBoundingClientRect();
      // Sideways only when it's off screen (a zoomed-in page on a phone): centre it.
      const left = rect.left - box.left;
      const offX = left < 0 || left + rect.width > box.width;
      scroller.scrollBy({
        top: rect.top - box.top - box.height / 3,
        left: offX ? left - (box.width - Math.min(rect.width, box.width)) / 2 : 0,
        behavior: "smooth",
      });
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
    // Text and index changes too: adding/moving an entry often reuses DOM nodes in place.
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-item-index", "data-section"],
    });
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
      // "Add …" slot of an empty section: create its first entry right there.
      const emptySlot = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-rx-empty-section]");
      if (emptySlot) {
        e.preventDefault();
        handlersRef.current.onAddEntry(emptySlot.getAttribute("data-rx-empty-section") ?? "", null);
        return;
      }
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
      // Clicking the photo opens its Change / Remove menu.
      setPhotoMenu(!!(e.target as HTMLElement | null)?.closest?.("[data-rx-photo]"));
      onFocusChange(next);
    };
    // Clicking the canvas around the pages leaves the selection, like clicking outside a doc.
    const scroller = root.closest(".rx-canvas-scroll");
    const onCanvasClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || root.contains(target) || target.closest("[data-rx-overlay], button, a, input, select, textarea")) return;
      setMenuOpen(false);
      setPhotoMenu(false);
      setDateEdit(null);
      setTagEdit(null);
      onFocusChange(null);
    };
    scroller?.addEventListener("click", onCanvasClick);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("click", onClick, true);
    return () => {
      scroller?.removeEventListener("click", onCanvasClick);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("click", onClick, true);
    };
  }, [rootRef, onFocusChange]);

  // Track text selections in rich fields so the style bar can follow them.
  useEffect(() => {
    const onSelection = () => {
      const root = rootRef.current;
      const sel = window.getSelection();
      if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelBox(null);
        return;
      }
      const node = sel.anchorNode;
      const el = (node instanceof Element ? node : node?.parentElement)?.closest("[data-rx-rich]");
      if (!el || !root.contains(el)) {
        setSelBox(null);
        return;
      }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const o = root.getBoundingClientRect();
      setSelBox({ top: r.top - o.top, left: r.left - o.left, width: r.width, height: r.height });
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, [rootRef]);

  // Shortcuts for the selected item: Alt+↑/↓ move it, Ctrl/⌘+Enter adds one below.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!focus || focus.index === null) return;
      const section = sectionsRef.current.find((s) => s.id === focus.sectionId);
      if (!section || !isEntrySection(section.type)) return;
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.();
        handlersRef.current.onMoveEntry(section.id, focus.index, e.key === "ArrowUp" ? -1 : 1);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.();
        handlersRef.current.onAddEntry(section.id, focus.index);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

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

  // The handle follows the selected item, or the item under the pointer.
  const handleTarget: CanvasFocus | null = focus ?? hover;
  const handleSection = handleTarget ? sections.find((s) => s.id === handleTarget.sectionId) : undefined;
  const handleBox = focus ? focusBoxes[0] : hoverBoxes[0] ?? hoverSectionBoxes[0];
  const handleIsEntry = Boolean(handleSection && handleTarget?.index !== null && isEntrySection(handleSection.type));
  const handleIndex = handleTarget?.index ?? null;
  const handleSectionIndex = handleSection ? sections.findIndex((s) => s.id === handleSection.id) : -1;
  const handleMoves = handleSection
    ? handlers.canMoveSection?.(handleSection.id) ?? { up: handleSectionIndex > 0, down: handleSectionIndex < sections.length - 1 }
    : { up: false, down: false };
  const handleCount = handleSection ? entryCounts[handleSection.id] ?? 0 : 0;

  const addBelow = () => {
    if (!handleSection) return;
    if (isEntrySection(handleSection.type)) handlers.onAddEntry(handleSection.id, handleIndex);
    else handlers.onAddSectionAfter(handleSection.id);
  };
  const openDates = () => {
    if (!handleSection || handleIndex === null || !handleBox) return;
    setMenuOpen(false);
    setTagEdit(null);
    setDateEdit({ path: `${handleSection.type}.${handleIndex}`, top: handleBox.top + 22, left: handleBox.left + 8 });
  };

  type MenuItem = { label: string; icon: React.ComponentType<{ className?: string }>; run: () => void; off?: boolean; danger?: boolean; hint?: string };
  const menuItems: MenuItem[] = handleSection
    ? [
        ...(isEntrySection(handleSection.type)
          ? [{ label: "Add item below", icon: Plus, run: addBelow, hint: "Ctrl/⌘ ↵" }]
          : []),
        ...(handleIsEntry && handleIndex !== null
          ? [
              { label: "Duplicate item", icon: Copy, run: () => handlers.onDuplicateEntry(handleSection.id, handleIndex) },
              { label: "Move item up", icon: ArrowUp, run: () => handlers.onMoveEntry(handleSection.id, handleIndex, -1), off: handleIndex <= 0, hint: "Alt ↑" },
              {
                label: "Move item down",
                icon: ArrowDown,
                run: () => handlers.onMoveEntry(handleSection.id, handleIndex, 1),
                off: handleIndex >= handleCount - 1,
                hint: "Alt ↓",
              },
              ...(DATED_SECTIONS.has(handleSection.type) ? [{ label: "Edit dates", icon: CalendarDays, run: openDates }] : []),
            ]
          : []),
        ...(TAG_SECTIONS.has(handleSection.type) && handleBox
          ? [
              {
                label: "Edit skills",
                icon: Plus,
                run: () =>
                  setTagEdit({
                    sectionType: handleSection.type,
                    title: handleSection.title,
                    top: handleBox.top + handleBox.height + 6,
                    left: handleBox.left,
                  }),
              },
            ]
          : []),
        { label: "All fields…", icon: SlidersHorizontal, run: () => handlers.onOpenDetails(handleSection.id) },
        ...(handleSection.type !== "personalInfo"
          ? [
              { label: "Move section up", icon: ArrowUp, run: () => handlers.onMoveSection(handleSection.id, -1), off: !handleMoves.up },
              {
                label: "Move section down",
                icon: ArrowDown,
                run: () => handlers.onMoveSection(handleSection.id, 1),
                off: !handleMoves.down,
              },
              { label: "Insert section below", icon: Plus, run: () => handlers.onAddSectionAfter(handleSection.id) },
              { label: "Hide section", icon: EyeOff, run: () => handlers.onHideSection(handleSection.id) },
            ]
          : []),
        ...(handleIsEntry && handleIndex !== null
          ? [{ label: "Delete item", icon: Trash2, run: () => handlers.onDeleteEntry(handleSection.id, handleIndex), danger: true }]
          : []),
        ...(handleSection.type !== "personalInfo"
          ? [{ label: "Delete section", icon: Trash2, run: () => handlers.onDeleteSection(handleSection.id), danger: true }]
          : []),
      ]
    : [];

  const menu = menuOpen && handleSection ? (
    <KeepInView
      data-rx-overlay
      role="menu"
      className={cn(
        "pointer-events-auto z-40 w-56 rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-xl",
        isMobile ? "fixed bottom-[8.5rem] right-3 max-h-[60dvh] overflow-y-auto" : "absolute",
      )}
      style={isMobile || !handleBox ? undefined : { top: handleBox.top + 30, left: Math.max(0, handleBox.left - 44) }}
    >
      {menuItems.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.off}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setMenuOpen(false);
            item.run();
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-muted disabled:opacity-40",
            item.danger ? "text-rose-600" : "",
          )}
        >
          <item.icon className="h-4 w-4 opacity-70" />
          <span className="flex-1">{item.label}</span>
          {item.hint && !isMobile ? <span className="text-[10px] text-muted-foreground">{item.hint}</span> : null}
        </button>
      ))}
    </KeepInView>
  ) : null;

  // Desktop gutter handle (＋ / ⋮⋮) beside the item, Notion-style rather than a toolbar on top.
  const handle =
    !isMobile && handleSection && handleBox ? (
      <div
        data-rx-overlay
        className="pointer-events-auto absolute z-30 flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm"
        style={{ top: handleBox.top, left: Math.max(0, handleBox.left - 34) }}
      >
        <button
          type="button"
          title={isEntrySection(handleSection.type) ? "Add item below" : "Insert section below"}
          aria-label={isEntrySection(handleSection.type) ? "Add item below" : "Insert section below"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={addBelow}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Item options"
          aria-label="Item options"
          aria-haspopup="menu"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!focus && hover) onFocusChange(hover);
            setMenuOpen((v) => !v);
          }}
          className="flex h-6 w-6 items-center justify-center border-t border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : null;

  // Mobile: compact action strip above the studio tab bar while an item is selected.
  const mobileBar =
    isMobile && focus && focusSection ? (
      <div
        data-rx-overlay
        role="toolbar"
        aria-label="Item actions"
        className="pointer-events-auto fixed inset-x-2 bottom-[4.5rem] z-30 flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-900 p-1.5 text-white shadow-2xl [&::-webkit-scrollbar]:hidden"
      >
        {canAddEntry ? (
          <button type="button" onClick={addBelow} className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold">
            <Plus className="h-4 w-4" /> Add item
          </button>
        ) : null}
        {entryFocused && DATED_SECTIONS.has(focusSection.type) ? (
          <button type="button" onClick={openDates} className="shrink-0 rounded-xl px-3 py-2 text-xs" aria-label="Edit dates">
            <CalendarDays className="h-4 w-4" />
          </button>
        ) : null}
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format("bold")} className="shrink-0 rounded-xl px-3 py-2" aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format("insertUnorderedList")} className="shrink-0 rounded-xl px-3 py-2" aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setMenuOpen((v) => !v)} className="ml-auto flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs" aria-label="More actions">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    ) : null;

  // Formatting appears only while text is selected inside a description (Medium-style).
  const selectionBar =
    !isMobile && selBox ? (
      <div
        data-rx-overlay
        role="toolbar"
        aria-label="Text style"
        className="pointer-events-auto absolute z-40 flex items-center gap-0.5 rounded-lg bg-slate-900 p-0.5 text-white shadow-xl"
        style={{ top: Math.max(0, selBox.top - 38), left: Math.max(0, selBox.left + selBox.width / 2 - 70) }}
      >
        {[
          { label: "Bold", icon: Bold, cmd: "bold" as const },
          { label: "Italic", icon: Italic, cmd: "italic" as const },
          { label: "Underline", icon: Underline, cmd: "underline" as const },
          { label: "Bullet list", icon: List, cmd: "insertUnorderedList" as const },
        ].map((b) => (
          <button
            key={b.cmd}
            type="button"
            title={b.label}
            aria-label={b.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => format(b.cmd)}
            className="flex h-7 w-8 items-center justify-center rounded-md hover:bg-white/15"
          >
            <b.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div data-rx-overlay className="pointer-events-none absolute inset-0 z-10" aria-hidden={false}>
      {/* Selected item: soft tint + accent bar on the left (no page dimming). */}
      {focusBoxes.map((b, i) => (
        <React.Fragment key={`focus-${i}`}>
          <div className="absolute rounded-md bg-primary/[0.045] transition-all duration-150" style={{ top: b.top, left: b.left, width: b.width, height: b.height }} />
          <div className="absolute w-[3px] rounded-full bg-primary transition-all duration-150" style={{ top: b.top + 2, left: b.left - 6, height: b.height - 4 }} />
        </React.Fragment>
      ))}
      {hoverBoxes.map((b, i) => (
        <div key={`hover-${i}`} className="absolute rounded-md bg-primary/[0.025]" style={{ top: b.top, left: b.left, width: b.width, height: b.height }} />
      ))}
      {markBoxes.map((b, i) => (
        <div
          key={`mark-${b.id}-${i}`}
          className={cn(
            "absolute transition-shadow",
            MARK_STYLE[b.tone],
            b.id === activeMarkId &&
              (b.tone === "error" || b.tone === "weak"
                ? "z-10 border-2 border-rose-600 bg-rose-500/20 shadow-[0_0_0_4px_rgba(225,29,72,0.18)]"
                : "rounded-sm bg-primary/10 ring-2 ring-primary/60"),
          )}
          style={{ top: b.top, left: b.left, width: b.width, height: b.height, ...MARK_INLINE[b.tone], ...(b.typo && b.tone === "error" ? TYPO_WAVE : {}) }}
        />
      ))}
      {emptyTagBoxes.map((b) => (
        <button
          key={`add-tags-${b.sectionId}`}
          type="button"
          data-rx-overlay
          onClick={() => {
            setMenuOpen(false);
            setDateEdit(null);
            setTagEdit({ sectionType: b.type, title: b.title, top: b.top + b.height + 6, left: b.left });
          }}
          className="pointer-events-auto absolute z-20 inline-flex items-center gap-1 rounded-full border border-dashed border-primary/60 bg-background px-3 py-1 text-xs font-semibold text-primary shadow-sm hover:bg-primary/5"
          style={{ top: b.top + Math.max(0, b.height / 2 - 13), left: Math.max(b.left, b.left + b.width - 118) }}
        >
          <Plus className="h-3.5 w-3.5" /> Add skills
        </button>
      ))}
      {photoBox && handlers.onChangePhoto ? (
        <>
          <button
            type="button"
            data-rx-overlay
            aria-label="Edit photo"
            title="Change or remove photo"
            aria-expanded={photoMenu}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setMenuOpen(false);
              setPhotoMenu((open) => !open);
            }}
            className="pointer-events-auto absolute z-30 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md hover:border-primary/50 hover:text-primary"
            style={{ top: photoBox.top - 8, left: photoBox.left + photoBox.width - 20 }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {photoMenu ? (
            <KeepInView
              data-rx-overlay
              role="menu"
              className="pointer-events-auto absolute z-40 w-44 rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-xl"
              style={{ top: photoBox.top + 24, left: Math.max(0, photoBox.left + photoBox.width - 176) }}
            >
              <button
                type="button"
                role="menuitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setPhotoMenu(false);
                  handlers.onChangePhoto?.();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-muted"
              >
                <Camera className="h-4 w-4 opacity-70" /> Change photo
              </button>
              {handlers.onRemovePhoto ? (
                <button
                  type="button"
                  role="menuitem"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setPhotoMenu(false);
                    handlers.onRemovePhoto?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 hover:bg-muted"
                >
                  <Trash2 className="h-4 w-4 opacity-70" /> Remove photo
                </button>
              ) : null}
            </KeepInView>
          ) : null}
        </>
      ) : null}
      {handle}
      {menu}
      {mobileBar}
      {selectionBar}
      {tagEdit ? (
        <KeepInView
          data-rx-overlay
          className={cn("pointer-events-auto z-40", isMobile ? "fixed inset-x-0 bottom-[8.5rem] flex justify-center" : "absolute")}
          style={isMobile ? undefined : { top: tagEdit.top, left: Math.max(0, tagEdit.left) }}
        >
          <TagListPopover
            title={tagEdit.title}
            tags={handlers.getTags(tagEdit.sectionType)}
            onChange={(tags) => handlers.onSetTags(tagEdit.sectionType, tags)}
            onClose={() => setTagEdit(null)}
          />
        </KeepInView>
      ) : null}
      {dateEdit ? (
        <KeepInView
          data-rx-overlay
          className={cn("pointer-events-auto z-40", isMobile ? "fixed inset-x-0 bottom-[8.5rem] flex justify-center" : "absolute")}
          style={isMobile ? undefined : { top: dateEdit.top, left: Math.max(0, dateEdit.left) }}
        >
          <DatePickerPopover
            key={dateEdit.path}
            dates={handlers.getDates(dateEdit.path)}
            allowPresent={!dateEdit.path.startsWith("education")}
            onChange={(dates) => handlers.onSetDates(dateEdit.path, dates)}
            onClose={() => setDateEdit(null)}
          />
        </KeepInView>
      ) : null}
    </div>
  );
}
