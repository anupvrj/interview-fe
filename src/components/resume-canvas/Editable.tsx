"use client";

import React, { useCallback } from "react";
import type { CanvasEditApi } from "./CanvasEditContext";
import { plainFieldText, sanitizeRichHtml } from "./canvasOps";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * React 19 re-applies `dangerouslySetInnerHTML` whenever the prop object changes
 * identity, even with the same HTML. On an editable element that resets the text
 * mid-typing and swaps nodes under the pointer (so clicks never fire). One shared
 * object per HTML string keeps the prop stable until the HTML really changes.
 */
const htmlCache = new Map<string, { __html: string }>();
export function stableHtml(input: string | { __html: string }): { __html: string } {
  const html = typeof input === "string" ? input : input.__html ?? "";
  let entry = htmlCache.get(html);
  if (!entry) {
    entry = { __html: html };
    htmlCache.set(html, entry);
    if (htmlCache.size > 2000) htmlCache.delete(htmlCache.keys().next().value as string);
  }
  return entry;
}

/** Header fields that keep their hint even when nothing is selected (the page has no other way in). */
const ALWAYS_HINT = new Set(["personalInfo.fullName", "personalInfo.portfolio"]);

const FIELD_HINTS: Record<string, string> = {
  company: "Company",
  position: "Job title",
  location: "Location",
  institution: "School or university",
  degree: "Degree",
  field: "Field of study",
  gpa: "GPA",
  title: "Title",
  issuer: "Issued by",
  date: "Date",
  issueDate: "Date",
  technologies: "Tools & technologies",
  link: "Link",
  publisher: "Publisher",
  role: "Role",
  description: "Description",
};
const NAME_HINTS: Record<string, string> = {
  projects: "Project name",
  languages: "Language",
  organisations: "Organisation",
  references: "Reference name",
  courses: "Course name",
};

/** What an empty field shows on the canvas, from its path ("experience.2.company" → "Company"). */
export function fieldHint(path: string): string {
  const parts = path.split(".");
  const last = parts[parts.length - 1];
  if (last === "name") return NAME_HINTS[parts[0]] ?? "Name";
  if (/^\d+$/.test(last)) return parts[0] === "achievements" ? "Achievement" : "Add text";
  return FIELD_HINTS[last] ?? "Add text";
}

/**
 * Is this field inside what the user selected? Empty fields only show their hint
 * (and empty optional slots only appear) there — elsewhere the page is exactly the export.
 */
export function pathRevealed(canvas: CanvasEditApi | null, path: string): boolean {
  if (!canvas) return false;
  if (ALWAYS_HINT.has(path)) return true;
  const focus = canvas.focus;
  if (!focus) return false;
  const entry = /^([A-Za-z_]+)\.(\d+)(?:\.|$)/.exec(path);
  if (entry) return focus.sectionType === entry[1] && (focus.index === null || focus.index === Number(entry[2]));
  if (path.startsWith("personalInfo.")) return focus.sectionType === "personalInfo";
  if (path.startsWith("@custom:")) return focus.sectionId === path.slice("@custom:".length);
  if (path === "@profileSummary") return focus.sectionType === "profileSummary";
  return true;
}

/** Text the field had when it gained focus, so Escape can revert and blur can skip no-op commits. */
const ORIGINAL = "data-rx-original";

function selectAllIn(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Single-line field. Without the canvas it is just the text (no extra markup).
 * With it, a contentEditable span whose children React never reconciles
 * (it owns them via innerHTML), so typing never fights re-renders.
 */
export function EdText({
  canvas,
  path,
  value,
  placeholder,
  multiline = false,
  uppercase = false,
}: {
  canvas: CanvasEditApi | null;
  path: string;
  value: string | undefined | null;
  placeholder?: string;
  multiline?: boolean;
  /** Display in capitals (CSS only) while keeping the stored text as typed. */
  uppercase?: boolean;
}) {
  const text = value ?? "";
  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      const el = e.currentTarget;
      el.setAttribute(ORIGINAL, el.textContent ?? "");
      // Sample text is meant to be replaced: select it all so typing overwrites it.
      if (/^(sample|your)\b/i.test(el.textContent ?? "")) requestAnimationFrame(() => selectAllIn(el));
      canvas?.onFieldFocus?.(path, el);
    },
    [canvas, path],
  );
  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      const el = e.currentTarget;
      const next = multiline ? (el.innerText ?? "").replace(/ /g, " ").trim() : plainFieldText(el.textContent ?? "");
      const original = el.getAttribute(ORIGINAL);
      el.removeAttribute(ORIGINAL);
      canvas?.onFieldBlur?.(path);
      if (original !== null && plainFieldText(original) === next && next === text) return;
      if (next !== text) canvas?.commitField(path, next);
    },
    [canvas, path, text, multiline],
  );
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      const el = e.currentTarget;
      if (e.key === "Escape") {
        e.preventDefault();
        el.textContent = el.getAttribute(ORIGINAL) ?? text;
        el.blur();
      } else if (e.key === "Enter" && !(multiline && e.shiftKey)) {
        e.preventDefault();
        el.blur();
      }
    },
    [text, multiline],
  );
  const onPaste = useCallback((e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, multiline ? pasted : pasted.replace(/\s+/g, " "));
  }, [multiline]);

  if (!canvas) return <>{uppercase ? text.toUpperCase() : text}</>;
  const hint = placeholder ?? fieldHint(path);
  return (
    <span
      className="rx-ed"
      style={uppercase ? { textTransform: "uppercase" } : undefined}
      data-rx-path={path}
      data-placeholder={pathRevealed(canvas, path) ? hint : undefined}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      aria-label={hint}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      dangerouslySetInnerHTML={stableHtml(escapeHtml(text))}
    />
  );
}

/**
 * Props to spread onto an element that already renders rich HTML via
 * dangerouslySetInnerHTML (descriptions, bullets, summary). Returns nothing
 * outside the canvas, so the element is unchanged for PDF and thumbnails.
 */
export function richEditProps(
  canvas: CanvasEditApi | null,
  path: string,
  placeholder?: string,
): React.HTMLAttributes<HTMLElement> & Record<string, unknown> {
  if (!canvas) return {};
  return {
    "data-rx-path": path,
    "data-rx-rich": "",
    "data-placeholder": pathRevealed(canvas, path) ? placeholder ?? "Describe what you did and the impact it had" : undefined,
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: true,
    role: "textbox",
    "aria-multiline": true,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      e.currentTarget.setAttribute(ORIGINAL, e.currentTarget.innerHTML);
      canvas.onFieldFocus?.(path, e.currentTarget);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const original = el.getAttribute(ORIGINAL);
      el.removeAttribute(ORIGINAL);
      canvas.onFieldBlur?.(path);
      if (original === el.innerHTML) return;
      canvas.commitField(path, sanitizeRichHtml(el.innerHTML));
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        const original = e.currentTarget.getAttribute(ORIGINAL);
        if (original !== null) e.currentTarget.innerHTML = original;
        e.currentTarget.blur();
      }
    },
    onPaste: (e: React.ClipboardEvent<HTMLElement>) => {
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    },
  };
}
