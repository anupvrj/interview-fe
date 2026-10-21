"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Paintbrush } from "lucide-react";
import { ResumeTemplate, resumeApi } from "@/lib/api";
import { TemplatePreview } from "@/components/TemplatePreview";
import { cn } from "@/lib/utils";

type Filter = "all" | "simple" | "modern" | "creative";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "simple", label: "Popular" },
  { id: "modern", label: "Modern" },
  { id: "creative", label: "Creative" },
];

/** Template picker docked beside the page: click a thumbnail, the page re-renders in place. */
export function TemplatesPanel({
  currentTemplateId,
  onSelectTemplate,
  applying,
  onPreview,
}: {
  currentTemplateId: string | undefined;
  onSelectTemplate: (templateId: string) => void | Promise<void>;
  applying: boolean;
  /** Open a full preview of the user's resume in this template. */
  onPreview: (template: ResumeTemplate) => void;
}) {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    resumeApi
      .getSelectableTemplates(currentTemplateId)
      .then((data) => {
        if (!cancelled) setTemplates(data);
      })
      .catch((error) => console.error("Failed to load templates:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Load once per panel open; the current template only changes the highlight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => (filter === "all" ? templates : templates.filter((t) => t.category === filter)), [templates, filter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {shown.map((template) => {
              const current = template.id === currentTemplateId;
              return (
                <div
                  key={template.id}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border-2 bg-card p-1.5 transition",
                    current ? "border-primary" : "border-transparent hover:border-primary/40",
                    applying && !current && "opacity-60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onPreview(template)}
                    className="block w-full text-left"
                    aria-label={`Preview your resume in ${template.name}`}
                    aria-pressed={current}
                  >
                    <TemplatePreview template={template} isSelected={current} variant="thumb" />
                  </button>
                  <div className="absolute bottom-[34px] right-2.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => onPreview(template)}
                      title="Preview with my resume"
                      aria-label={`Preview ${template.name}`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background/95 text-foreground shadow-sm hover:border-primary/50 hover:text-primary"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {current ? (
                      <span
                        title="Current design"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={applying}
                        onClick={() => void onSelectTemplate(template.id)}
                        title="Apply this design"
                        aria-label={`Apply ${template.name}`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-background/95 text-primary shadow-sm hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                      >
                        <Paintbrush className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 px-0.5 text-xs font-semibold leading-snug text-foreground">{template.name}</p>
                  {applying && current ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
