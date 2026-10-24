"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

/**
 * Skills are stored as an array, a comma list, lines, or an HTML list depending on
 * where they came from. Edit them as tags and write back in the same shape.
 */
export type TagShape = "array" | "comma" | "lines" | "html" | "html-inline";

export function parseTags(value: unknown): { tags: string[]; shape: TagShape } {
  if (Array.isArray(value)) {
    return { tags: value.map((v) => String(v ?? "").trim()).filter(Boolean), shape: "array" };
  }
  const text = typeof value === "string" ? value : "";
  if (/<li[\s>]/i.test(text)) {
    const tags = Array.from(text.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    // One bullet holding a comma list ("Chess, Running, Travel"): edit the items, keep the look.
    if (tags.length === 1 && tags[0].includes(",")) {
      return { tags: tags[0].split(",").map((t) => t.trim()).filter(Boolean), shape: "html-inline" };
    }
    return { tags, shape: "html" };
  }
  const plain = text.replace(/<[^>]+>/g, "\n").replace(/&amp;/g, "&");
  if (/\n/.test(plain.trim())) {
    // One line per group ("Languages: Go, Java") — keep each line whole.
    return { tags: plain.split(/\n+/).map((l) => l.trim()).filter(Boolean), shape: "lines" };
  }
  return { tags: plain.split(",").map((t) => t.trim()).filter(Boolean), shape: "comma" };
}

export function serialiseTags(tags: string[], shape: TagShape): string | string[] {
  const clean = tags.map((t) => t.trim()).filter(Boolean);
  if (shape === "array") return clean;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (shape === "html") {
    return clean.length ? `<ul>${clean.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
  }
  if (shape === "html-inline") return clean.length ? `<ul><li>${esc(clean.join(", "))}</li></ul>` : "";
  if (shape === "lines") return clean.join("\n");
  return clean.join(", ");
}

export function TagListPopover({
  title,
  tags,
  onChange,
  onClose,
  placeholder = "Add a skill and press Enter",
}: {
  title: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  onClose: () => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !tags.some((t) => t.toLowerCase() === p.toLowerCase()));
    if (parts.length) onChange([...tags, ...parts]);
    setDraft("");
  };
  const move = (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= tags.length) return;
    const next = [...tags];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="w-80 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl" role="dialog" aria-label={title}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
        {/* Move arrows keep their space (fade in on hover) so "remove" never slides under the pointer. */}
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} className="group inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/50 py-0.5 pl-2 pr-0.5 text-xs">
            <button type="button" aria-label={`Move ${tag} earlier`} onClick={() => move(i, -1)} className="text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100">
              <ArrowLeft className="h-3 w-3" />
            </button>
            <span className="max-w-[14rem] truncate" title={tag}>
              {tag}
            </span>
            <button type="button" aria-label={`Move ${tag} later`} onClick={() => move(i, 1)} className="text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100">
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((_, k) => k !== i))}
              className="rounded p-0.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 ? <span className="text-xs italic text-muted-foreground">Nothing here yet.</span> : null}
      </div>
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        placeholder={placeholder}
        className="mt-3 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Tip: paste a comma list to add many.</span>
        <button type="button" onClick={onClose} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          Done
        </button>
      </div>
    </div>
  );
}
