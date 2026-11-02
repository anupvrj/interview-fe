"use client";

import { useEffect, useRef } from "react";
import { FilePlus2, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { SavedJobDescription } from "@/lib/api";
import { MIN_JOB_DESCRIPTION_CHARS } from "@/lib/extension-job-handoff";
import {
  matchSavedJobDescription,
  savedJobDescriptionPreview,
  savedJobDescriptionTitle,
} from "@/lib/saved-job-descriptions";
import { cn } from "@/lib/utils";

const MAX_SAVED = 5;

function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase();
}

/**
 * The job-description field of every interview setup: the user's saved job posts (five
 * at most, newest first) plus "New job post". Picking a saved post fills the box, where
 * it can still be edited. The server keeps the list: a post used for an interview moves
 * to the top, a sixth pushes out the oldest.
 */
export function JobDescriptionPicker({
  id,
  saved,
  value,
  onChange,
  preselectId,
  placeholder = "Paste the job post so the questions match this role",
}: {
  id: string;
  saved: readonly SavedJobDescription[];
  value: string;
  onChange: (text: string) => void;
  /** Saved post to fill in once, if the box is still empty when the list arrives (see defaultJobDescription). */
  preselectId?: string | null;
  placeholder?: string;
}) {
  const selected = matchSavedJobDescription(saved, value);
  const autoPicked = useRef(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoPicked.current || saved.length === 0) return;
    autoPicked.current = true;
    const pick = preselectId ? saved.find((s) => s.id === preselectId) : undefined;
    if (pick && !value.trim()) onChange(pick.text);
    // Only when the list first arrives; later edits (including clearing the box) stay the user's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const chars = value.trim().length;
  const cardClass = (active: boolean) =>
    cn(
      "flex min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
      active ? "border-primary bg-primary/[0.06] ring-2 ring-primary/15" : "border-border bg-background hover:border-primary/40",
    );

  return (
    <div className="space-y-3">
      {saved.length > 0 ? (
        <div role="radiogroup" aria-label="Saved job posts" className="grid gap-2 sm:grid-cols-2">
          {saved.map((s) => {
            const active = selected?.id === s.id;
            return (
              <button key={s.id} type="button" role="radio" aria-checked={active} onClick={() => onChange(s.text)} className={cardClass(active)}>
                <FileText className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-foreground">{savedJobDescriptionTitle(s)}</span>
                    <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-muted-foreground">{shortDate(s.lastUsedAt)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] leading-snug text-muted-foreground">{savedJobDescriptionPreview(s)}</span>
                </span>
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={!selected}
            onClick={() => {
              if (selected) onChange("");
              textRef.current?.focus();
            }}
            className={cardClass(!selected)}
          >
            <FilePlus2 className={cn("mt-0.5 h-4 w-4 shrink-0", !selected ? "text-primary" : "text-muted-foreground")} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-foreground">New job post</span>
              <span className="mt-0.5 block truncate text-[12px] leading-snug text-muted-foreground">
                {saved.length >= MAX_SAVED ? "Paste a different one. It replaces your oldest saved post." : "Paste a different one. It's saved for next time."}
              </span>
            </span>
          </button>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
        <Textarea
          ref={textRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder={placeholder}
          className="min-h-[124px] resize-y !rounded-none !border-0 !bg-transparent px-4 py-3 text-[14px] leading-relaxed !shadow-none !ring-0"
        />
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="text-[12px] text-muted-foreground">
            {selected ? "From your saved job posts. Edit it if you like." : `At least ${MIN_JOB_DESCRIPTION_CHARS} characters`}
          </span>
          <span className={cn("font-[family-name:var(--font-geist-mono)] text-[11px]", chars >= MIN_JOB_DESCRIPTION_CHARS ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {chars.toLocaleString()} CHARS
          </span>
        </div>
      </div>
    </div>
  );
}
