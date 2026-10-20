"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
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
}: {
  currentTemplateId: string | undefined;
  onSelectTemplate: (templateId: string) => void | Promise<void>;
  applying: boolean;
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
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-3">
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
                <button
                  key={template.id}
                  type="button"
                  disabled={applying || current}
                  onClick={() => void onSelectTemplate(template.id)}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border-2 bg-card text-left transition",
                    current ? "border-primary" : "border-transparent hover:border-primary/50",
                    applying && !current && "opacity-60",
                  )}
                  aria-pressed={current}
                >
                  <div className="pointer-events-none">
                    <TemplatePreview template={template} isSelected={current} />
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <span className="truncate text-xs font-semibold text-foreground">{template.name}</span>
                    {current ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </div>
                  {applying && current ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
