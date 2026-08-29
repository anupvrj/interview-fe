"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ResumeSectionDragHandle } from "@/components/resume-editor/ResumeSectionDragHandle";
import { RESUME_FIELD_INPUT_CLASS } from "@/components/resume-editor/resumeFieldStyles";
import {
  resumeEntryCard,
  resumePrimaryCta,
  resumeSectionCardDragOver,
} from "@/components/resume-editor/resumeEditorStyles";
import { cn } from "@/lib/utils";
import type { Resume } from "@/lib/api";

type ExperienceEntry = Resume["content"]["experience"][number];

function descriptionToEditorHtml(description: unknown): string {
  if (typeof description === "string") return description;
  if (Array.isArray(description)) {
    const items = description.map((d) => String(d).trim()).filter(Boolean);
    if (items.length === 0) return "";
    if (
      items.length === 1 &&
      (/<ul[\s>]/i.test(items[0]) || /<ol[\s>]/i.test(items[0]))
    ) {
      return items[0];
    }
    return items.map((item) => `<p>${item}</p>`).join("");
  }
  return description == null ? "" : String(description);
}

function entryId(exp: ExperienceEntry, index: number): string {
  return exp.id || `experience-${index}`;
}

function roleSummary(exp: ExperienceEntry): string {
  const title = exp.position?.trim() || "Untitled role";
  const company = exp.company?.trim();
  return company ? `${title} · ${company}` : title;
}

function roleDates(exp: ExperienceEntry): string {
  const start = exp.startDate?.trim();
  const end = exp.current ? "Present" : exp.endDate?.trim();
  const dates =
    start || end ? [start, end || "Present"].filter(Boolean).join(" – ") : "";
  const location = exp.location?.trim();
  return [dates, location].filter(Boolean).join(" · ");
}

function moveEntry(
  list: ExperienceEntry[],
  fromId: string,
  toId: string,
): ExperienceEntry[] {
  const from = list.findIndex((item, index) => entryId(item, index) === fromId);
  const to = list.findIndex((item, index) => entryId(item, index) === toId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

interface ExperienceEntriesEditorProps {
  experience: ExperienceEntry[];
  applyNonce: number;
  onChange: (experience: ExperienceEntry[]) => void;
  onReorderStart?: () => void;
  onReorderEnd?: () => void;
}

export function ExperienceEntriesEditor({
  experience,
  applyNonce,
  onChange,
  onReorderStart,
  onReorderEnd,
}: Readonly<ExperienceEntriesEditorProps>) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateAt = (index: number, patch: Partial<ExperienceEntry>) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const handleEntryDragStart = (event: React.DragEvent, id: string) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `experience:${id}`);
    onReorderStart?.();
    requestAnimationFrame(() => setDraggedId(id));
  };

  const handleEntryDragEnd = (event: React.DragEvent) => {
    event.stopPropagation();
    setDraggedId(null);
    setDragOverId(null);
    onReorderEnd?.();
  };

  const handleEntryDragOver = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      return;
    }
    setDragOverId(targetId);
    const reordered = moveEntry(experience, draggedId, targetId);
    if (reordered !== experience) {
      onChange(reordered);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Collapse a role, then drag the handle to reorder.
      </p>
      {experience.map((exp, index) => {
        const id = entryId(exp, index);
        const collapsed = collapsedIds.has(id);
        const isDragging = draggedId === id;
        const isDragOver = dragOverId === id && draggedId !== id;

        return (
          <div
            key={`${id}-${applyNonce}`}
            className={cn(
              resumeEntryCard,
              isDragOver && resumeSectionCardDragOver,
              isDragging && "opacity-50",
            )}
            onDragOver={(event) => handleEntryDragOver(event, id)}
            onDragLeave={() => {
              if (dragOverId === id) setDragOverId(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragOverId(null);
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <ResumeSectionDragHandle
                sectionId={id}
                onDragStart={handleEntryDragStart}
                onDragEnd={handleEntryDragEnd}
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => toggleCollapsed(id)}
              >
                <div className="truncate text-sm font-medium text-foreground">
                  {roleSummary(exp)}
                </div>
                {roleDates(exp) ? (
                  <div className="truncate text-xs text-muted-foreground">
                    {roleDates(exp)}
                  </div>
                ) : null}
              </button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                title={collapsed ? "Expand role" : "Minimize role"}
                onClick={() => toggleCollapsed(id)}
              >
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {collapsed ? null : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Position *</Label>
                    <Input
                      value={exp.position}
                      onChange={(e) =>
                        updateAt(index, { position: e.target.value })
                      }
                      className={RESUME_FIELD_INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company *</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) =>
                        updateAt(index, { company: e.target.value })
                      }
                      className={RESUME_FIELD_INPUT_CLASS}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Location</Label>
                    <Input
                      value={exp.location || ""}
                      onChange={(e) =>
                        updateAt(index, { location: e.target.value })
                      }
                      className={RESUME_FIELD_INPUT_CLASS}
                      placeholder="e.g. Ahmedabad, Gujarat"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) =>
                        updateAt(index, { startDate: e.target.value })
                      }
                      className={RESUME_FIELD_INPUT_CLASS}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      value={exp.endDate || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateAt(index, {
                          endDate: value,
                          current:
                            value.toLowerCase() === "present" || !value,
                        });
                      }}
                      className={RESUME_FIELD_INPUT_CLASS}
                      placeholder="MM/YYYY or Present"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <RichTextEditor
                    value={descriptionToEditorHtml(exp.description)}
                    onChange={(html) =>
                      updateAt(index, { description: html })
                    }
                    placeholder="Enter job description with formatting..."
                    className="mt-1"
                    preferredContentType="list"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onChange(experience.filter((_, i) => i !== index));
                    setCollapsedIds((prev) => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                    });
                  }}
                  className="w-full border-red-300 text-red-700 hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        onClick={() => {
          const id = Math.random().toString(36).substring(2, 9);
          onChange([
            ...experience,
            {
              id,
              company: "",
              position: "",
              startDate: "",
              current: false,
              description: [""],
            },
          ]);
        }}
        className={resumePrimaryCta}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}
