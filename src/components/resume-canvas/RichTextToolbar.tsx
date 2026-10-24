"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Text styling for descriptions, bullets and the summary (fields marked data-rx-rich):
 * bold, italic, underline, bulleted / numbered list, alignment, link, clear formatting. Shown while such
 * a field is being edited (not only while text is selected), with the active styles lit.
 * Everything it makes (b/strong, i/em, u, ul/ol/li, text-align, a href) is kept by sanitizeRichHtml, so it
 * saves, reloads and prints in the PDF.
 */

export type RichCommand =
  | "bold"
  | "italic"
  | "underline"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull";

export const RICH_ACTIONS: Array<{ cmd: RichCommand; label: string; icon: React.ComponentType<{ className?: string }>; keys?: string }> = [
  { cmd: "bold", label: "Bold", icon: Bold, keys: "⌘B" },
  { cmd: "italic", label: "Italic", icon: Italic, keys: "⌘I" },
  { cmd: "underline", label: "Underline", icon: Underline, keys: "⌘U" },
  { cmd: "insertUnorderedList", label: "Bulleted list", icon: List },
  { cmd: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
  { cmd: "justifyLeft", label: "Align left", icon: AlignLeft },
  { cmd: "justifyCenter", label: "Align center", icon: AlignCenter },
  { cmd: "justifyRight", label: "Align right", icon: AlignRight },
  { cmd: "justifyFull", label: "Justify", icon: AlignJustify },
];
/** Toolbar groups start at these positions (a divider goes before each). */
const GROUP_STARTS = new Set([3, 5]);

/** The rich field the caret is in (inside `root`), if any. */
export function activeRichField(root: HTMLElement | null): HTMLElement | null {
  const active = document.activeElement as HTMLElement | null;
  return active && root?.contains(active) && active.hasAttribute("data-rx-rich") ? active : null;
}

export function applyRichCommand(cmd: RichCommand): void {
  document.execCommand(cmd);
}

/** Caret / selection as character offsets in `field` (survives the field losing focus). */
function saveOffsets(field: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!field.contains(range.startContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(field);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  return { start, end: start + range.toString().length };
}

function restoreOffsets(field: HTMLElement, { start, end }: { start: number; end: number }): void {
  const range = document.createRange();
  let pos = 0;
  let startSet = false;
  const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const len = node.textContent?.length ?? 0;
    if (!startSet && start <= pos + len) {
      range.setStart(node, start - pos);
      startSet = true;
    }
    if (startSet && end <= pos + len) {
      range.setEnd(node, end - pos);
      break;
    }
    pos += len;
  }
  if (!startSet) {
    range.selectNodeContents(field);
    range.collapse(false);
  }
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** https:// added when missing; only web and email links are kept by the sanitizer anyway. */
function normaliseUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^(https?:|mailto:)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(v)) return `https://${v}`;
  return null;
}

const insideLink = () => {
  const node = window.getSelection()?.anchorNode ?? null;
  return !!(node instanceof Element ? node : node?.parentElement)?.closest("a");
};

type Box = { top: number; left: number; width: number; height: number };

export function RichTextToolbar({ rootRef }: Readonly<{ rootRef: React.RefObject<HTMLElement | null> }>) {
  const [box, setBox] = useState<Box | null>(null);
  const [state, setState] = useState<Record<string, boolean>>({});
  const [onLink, setOnLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const fieldRef = useRef<HTMLElement | null>(null);
  const offsetsRef = useRef<{ start: number; end: number } | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    const root = rootRef.current;
    if (linkDraft !== null) return; // typing a link: the field has lent its focus to the input
    const field = activeRichField(root);
    fieldRef.current = field;
    if (!root || !field) {
      setBox(null);
      return;
    }
    const o = root.getBoundingClientRect();
    const sel = window.getSelection();
    const range = sel && sel.rangeCount && !sel.isCollapsed && field.contains(sel.anchorNode) ? sel.getRangeAt(0) : null;
    // Above the selection while text is selected, else above the field.
    const r = range ? range.getBoundingClientRect() : field.getBoundingClientRect();
    setBox({ top: r.top - o.top, left: r.left - o.left, width: r.width, height: r.height });
    const next: Record<string, boolean> = {};
    for (const a of RICH_ACTIONS) {
      try {
        next[a.cmd] = document.queryCommandState(a.cmd);
      } catch {
        next[a.cmd] = false;
      }
    }
    setState(next);
    setOnLink(insideLink());
  }, [rootRef, linkDraft]);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    document.addEventListener("focusin", refresh);
    document.addEventListener("focusout", refresh);
    window.addEventListener("resize", refresh);
    const scroller = rootRef.current?.closest(".rx-canvas-scroll");
    scroller?.addEventListener("scroll", refresh);
    return () => {
      document.removeEventListener("selectionchange", refresh);
      document.removeEventListener("focusin", refresh);
      document.removeEventListener("focusout", refresh);
      window.removeEventListener("resize", refresh);
      scroller?.removeEventListener("scroll", refresh);
    };
  }, [refresh, rootRef]);

  const run = (cmd: RichCommand) => {
    applyRichCommand(cmd);
    refresh();
  };

  const startLink = () => {
    const field = fieldRef.current;
    if (!field) return;
    if (insideLink()) {
      document.execCommand("unlink");
      refresh();
      return;
    }
    offsetsRef.current = saveOffsets(field);
    setLinkError(false);
    setLinkDraft("");
    requestAnimationFrame(() => linkInputRef.current?.focus());
  };

  const finishLink = (apply: boolean) => {
    const field = fieldRef.current;
    const url = apply && linkDraft !== null ? normaliseUrl(linkDraft) : null;
    if (apply && !url) {
      setLinkError(true);
      return;
    }
    setLinkDraft(null);
    if (!field || !field.isConnected) return;
    field.focus();
    if (offsetsRef.current) restoreOffsets(field, offsetsRef.current);
    if (url) {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) document.execCommand("createLink", false, url);
      else {
        const text = url.replace(/^mailto:/, "").replace(/^https?:\/\//, "");
        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
        document.execCommand("insertHTML", false, `<a href="${esc(url)}">${esc(text)}</a>`);
      }
    }
  };

  const clear = () => {
    document.execCommand("removeFormat");
    document.execCommand("unlink");
    refresh();
  };

  if (!box && linkDraft === null) return null;
  const pos = box ?? { top: 0, left: 0, width: 0, height: 0 };

  return (
    <div
      data-rx-overlay
      role="toolbar"
      aria-label="Text style"
      className="pointer-events-auto absolute z-40 flex items-center gap-0.5 rounded-lg bg-slate-900 p-0.5 text-white shadow-xl"
      style={{ top: Math.max(0, pos.top - 40), left: Math.max(0, pos.left) }}
    >
      {linkDraft !== null ? (
        <form
          className="flex items-center gap-1 px-1"
          onSubmit={(e) => {
            e.preventDefault();
            finishLink(true);
          }}
        >
          <label htmlFor="rx-link-input" className="sr-only">
            Link address
          </label>
          <input
            id="rx-link-input"
            ref={linkInputRef}
            value={linkDraft}
            onChange={(e) => {
              setLinkDraft(e.target.value);
              setLinkError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                finishLink(false);
              }
            }}
            placeholder="Paste a link (github.com/you/project)"
            className={cn(
              "h-7 w-64 rounded-md bg-white/10 px-2 text-xs text-white placeholder:text-white/50 outline-none focus:ring-1",
              linkError ? "ring-1 ring-rose-400" : "focus:ring-white/40",
            )}
          />
          <button type="submit" className="h-7 rounded-md px-2 text-xs font-semibold hover:bg-white/15">
            Add
          </button>
          <button type="button" onClick={() => finishLink(false)} className="h-7 rounded-md px-2 text-xs text-white/70 hover:bg-white/15">
            Cancel
          </button>
        </form>
      ) : (
        <>
          {RICH_ACTIONS.map((a, i) => (
            <span key={a.cmd} className="contents">
              {GROUP_STARTS.has(i) ? <span className="mx-0.5 h-4 w-px bg-white/20" aria-hidden /> : null}
              <button
                type="button"
                title={a.keys ? `${a.label} (${a.keys})` : a.label}
                aria-label={a.label}
                aria-pressed={!!state[a.cmd]}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(a.cmd)}
                className={cn("flex h-7 w-8 items-center justify-center rounded-md hover:bg-white/15", state[a.cmd] && "bg-white/20")}
              >
                <a.icon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <span className="mx-0.5 h-4 w-px bg-white/20" aria-hidden />
          <button
            type="button"
            title={onLink ? "Remove link" : "Add link"}
            aria-label={onLink ? "Remove link" : "Add link"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={startLink}
            className="flex h-7 w-8 items-center justify-center rounded-md hover:bg-white/15"
          >
            {onLink ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            title="Clear formatting"
            aria-label="Clear formatting"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="flex h-7 w-8 items-center justify-center rounded-md hover:bg-white/15"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
