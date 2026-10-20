"use client";

import React, { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface AddableSection {
  type: string;
  label: string;
  hint: string;
  /** Mini-preview shape drawn on the card. */
  preview: "entries" | "paragraph" | "tags" | "bars" | "list";
  multiple?: boolean;
}

export const ADDABLE_SECTIONS: AddableSection[] = [
  { type: "profileSummary", label: "Summary", hint: "Two or three lines on who you are", preview: "paragraph" },
  { type: "experience", label: "Experience", hint: "Jobs, internships, freelance work", preview: "entries" },
  { type: "education", label: "Education", hint: "Degrees and schools", preview: "entries" },
  { type: "skills", label: "Skills", hint: "Tools, languages, strengths", preview: "tags" },
  { type: "projects", label: "Projects", hint: "Things you built and shipped", preview: "entries" },
  { type: "certificates", label: "Certifications", hint: "Courses and licences you hold", preview: "list" },
  { type: "awards", label: "Awards", hint: "Recognition you received", preview: "list" },
  { type: "achievements", label: "Key achievements", hint: "Your proudest results", preview: "list" },
  { type: "languages", label: "Languages", hint: "Languages and fluency", preview: "bars" },
  { type: "courses", label: "Courses", hint: "Training and online courses", preview: "list" },
  { type: "organisations", label: "Volunteering", hint: "Clubs, NGOs, communities", preview: "entries" },
  { type: "publications", label: "Publications", hint: "Papers, articles, books", preview: "list" },
  { type: "interests", label: "Interests", hint: "What you do outside work", preview: "tags" },
  { type: "references", label: "References", hint: "People who can vouch for you", preview: "list" },
  { type: "declaration", label: "Declaration", hint: "Signed statement (common in India)", preview: "paragraph" },
  { type: "custom", label: "Custom section", hint: "Anything else, your own title", preview: "paragraph", multiple: true },
];

function Preview({ kind }: { kind: AddableSection["preview"] }) {
  const line = (w: string, dark = false) => (
    <span className={cn("block h-1.5 rounded-full", dark ? "bg-slate-400" : "bg-slate-200")} style={{ width: w }} />
  );
  if (kind === "entries")
    return (
      <div className="space-y-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              {line("45%", true)}
              {line("20%")}
            </div>
            {line("30%")}
            {line("90%")}
            {line("75%")}
          </div>
        ))}
      </div>
    );
  if (kind === "tags")
    return (
      <div className="flex flex-wrap gap-1.5">
        {["38%", "26%", "30%", "22%", "34%", "28%"].map((w, i) => (
          <span key={i} className="h-4 rounded border border-slate-300" style={{ width: w }} />
        ))}
      </div>
    );
  if (kind === "bars")
    return (
      <div className="space-y-2">
        {[80, 60, 40].map((v) => (
          <div key={v} className="flex items-center gap-2">
            {line("30%", true)}
            <span className="flex flex-1 gap-0.5">
              {[0, 1, 2, 3, 4].map((d) => (
                <span key={d} className={cn("h-1.5 flex-1 rounded-full", d * 20 < v ? "bg-primary/60" : "bg-slate-200")} />
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  if (kind === "list")
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            {line(i === 1 ? "55%" : "65%", true)}
            {line("40%")}
          </div>
        ))}
      </div>
    );
  return (
    <div className="space-y-1.5">
      {line("95%")}
      {line("88%")}
      {line("92%")}
      {line("60%")}
    </div>
  );
}

export function AddSectionDialog({
  open,
  onOpenChange,
  usedTypes,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usedTypes: Set<string>;
  onAdd: (type: string) => void;
}) {
  const [showUsed, setShowUsed] = useState(false);
  const items = ADDABLE_SECTIONS.filter((s) => showUsed || s.multiple || !usedTypes.has(s.type));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-y-auto p-5 sm:p-7">
        <DialogHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <DialogTitle>Add a section</DialogTitle>
            <DialogDescription className="mt-1">Pick a section, then type straight onto the page.</DialogDescription>
          </div>
          <label className="mr-8 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
            <input type="checkbox" className="h-3.5 w-3.5 accent-primary" checked={showUsed} onChange={(e) => setShowUsed(e.target.checked)} />
            Show used sections
          </label>
        </DialogHeader>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((section) => {
            const used = usedTypes.has(section.type) && !section.multiple;
            return (
              <button
                key={section.type}
                type="button"
                onClick={() => {
                  onAdd(section.type);
                  onOpenChange(false);
                }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="relative h-28 bg-slate-50 p-4 dark:bg-slate-900/40">
                  <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{section.label}</span>
                  <Preview kind={section.preview} />
                  <span className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition group-hover:bg-primary/10 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow">
                      {used ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {used ? "Show on resume" : "Add to resume"}
                    </span>
                  </span>
                </div>
                <div className="border-t border-border px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {section.label}
                    {used ? <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Used</span> : null}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{section.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
