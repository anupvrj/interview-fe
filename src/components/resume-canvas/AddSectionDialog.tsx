"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CornerDownLeft,
  FileSignature,
  FolderGit2,
  GraduationCap,
  Heart,
  HeartHandshake,
  Languages,
  Library,
  ListChecks,
  PenLine,
  Search,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  profileSummary: PenLine,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderGit2,
  certificates: BadgeCheck,
  awards: Award,
  achievements: Star,
  languages: Languages,
  courses: BookOpen,
  organisations: HeartHandshake,
  publications: Library,
  interests: Heart,
  references: Users,
  declaration: FileSignature,
  custom: ListChecks,
};

/** "Insert section": a searchable, keyboard-first command list. */
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
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = ADDABLE_SECTIONS.filter((s) => !q || `${s.label} ${s.hint} ${s.type}`.toLowerCase().includes(q));
    // New sections first; ones already on the page go last.
    return [...matches.filter((s) => s.multiple || !usedTypes.has(s.type)), ...matches.filter((s) => !s.multiple && usedTypes.has(s.type))];
  }, [query, usedTypes]);
  const choose = (type: string) => {
    onAdd(type);
    onOpenChange(false);
  };
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] w-[calc(100vw-1.5rem)] max-w-lg translate-y-0 gap-0 overflow-hidden p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Insert section</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(items.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && items[active]) {
                e.preventDefault();
                choose(items[active].type);
              }
            }}
            placeholder="Insert a section… (try “projects” or “volunteer”)"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search sections"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">Esc</kbd>
        </div>
        <ul ref={listRef} role="listbox" aria-label="Sections" className="max-h-[50vh] overflow-y-auto p-1.5">
          {items.map((section, index) => {
            const Icon = ICONS[section.type] ?? ListChecks;
            const onPage = usedTypes.has(section.type) && !section.multiple;
            return (
              <li key={section.type} role="option" aria-selected={index === active} data-index={index}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(section.type)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                    index === active ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{section.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{section.hint}</span>
                  </span>
                  {onPage ? (
                    <span className="shrink-0 text-[11px] text-muted-foreground">On page</span>
                  ) : index === active ? (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : null}
                </button>
              </li>
            );
          })}
          {items.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">No section matches “{query}”.</li> : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
