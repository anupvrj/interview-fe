"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Link2, Trash2 } from "lucide-react";
import { normaliseUrl } from "./RichTextToolbar";
import { cn } from "@/lib/utils";

/**
 * Edit an entry's link right on the page (a project's or certificate's "Link"), like the link
 * box in Google Docs: type or paste, Save (Enter), Open to check it, Remove. Escape cancels.
 */
export function LinkEditPopover({
  value,
  onSave,
  onClose,
}: {
  value: string;
  /** The link to store ("" removes it). */
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);
  const current = normaliseUrl(value);

  const save = () => {
    if (!draft.trim()) {
      onSave("");
      onClose();
      return;
    }
    const url = normaliseUrl(draft);
    if (!url) {
      setError(true);
      return;
    }
    onSave(url);
    onClose();
  };

  return (
    <div className="w-80 space-y-2.5 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl" role="dialog" aria-label="Link">
      <label htmlFor="rx-entry-link" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Link2 className="h-3.5 w-3.5" /> Link
      </label>
      <input
        id="rx-entry-link"
        ref={inputRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
        placeholder="github.com/you/project"
        aria-invalid={error}
        className={cn(
          "h-8 w-full rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:border-primary",
          error ? "border-rose-500" : "border-border",
        )}
      />
      {error ? <p className="text-[11px] font-medium text-rose-600">That doesn&apos;t look like a link — try github.com/you/project.</p> : null}
      <div className="flex items-center gap-2 pt-0.5">
        {current ? (
          <>
            <a
              href={current}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
            <button
              type="button"
              onClick={() => {
                onSave("");
                onClose();
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </>
        ) : null}
        <button type="button" onClick={save} className="ml-auto rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          Save
        </button>
      </div>
    </div>
  );
}
