"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ResumeTemplate, resumeApi } from "@/lib/api";
import { TemplatePreview } from "@/components/TemplatePreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const categoryLabels = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
} as const;

type FilterCategory = "all" | "simple" | "modern" | "creative";

const filterButtons: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "simple", label: "Popular" },
  { id: "modern", label: "Modern" },
  { id: "creative", label: "Creative" },
];

export function ChangeTemplateDialog({
  open,
  onOpenChange,
  currentTemplateId,
  onSelectTemplate,
  applying = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplateId: string | undefined;
  onSelectTemplate: (templateId: string) => void | Promise<void>;
  applying?: boolean;
}) {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await resumeApi.getTemplates();
        if (!cancelled) setTemplates(data);
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  const filteredTemplates = useMemo(
    () =>
      activeFilter === "all"
        ? templates
        : templates.filter((t) => t.category === activeFilter),
    [templates, activeFilter],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>Change template</DialogTitle>
          <DialogDescription>
            Pick a new design. Your resume content stays the same and updates
            in the preview right away.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 border-b px-6 py-3">
          {filterButtons.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              variant={activeFilter === filter.id ? "default" : "outline"}
              className={cn(
                activeFilter === filter.id &&
                  "bg-gradient-to-r from-purple-600 to-primary text-white hover:bg-slate-900",
              )}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No templates found in this category.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const isCurrent = template.id === currentTemplateId;
                return (
                  <Card
                    key={template.id}
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden border-2 transition-all hover:shadow-lg",
                      isCurrent
                        ? "border-purple-500 ring-2 ring-purple-200"
                        : "border-gray-200 hover:border-purple-300",
                      applying && "pointer-events-none opacity-60",
                    )}
                  >
                    <button
                      type="button"
                      disabled={applying || isCurrent}
                      className="flex h-full min-h-0 flex-col text-left"
                      onClick={() => void onSelectTemplate(template.id)}
                    >
                      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                        <TemplatePreview
                          template={template}
                          isSelected={isCurrent}
                        />
                        <div className="flex flex-1 flex-col bg-white p-4">
                          <h3 className="mb-1 font-bold text-gray-900">
                            {template.name}
                          </h3>
                          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                            {template.description}
                          </p>
                          <div className="mt-auto flex items-center justify-between gap-2">
                            <span className="text-xs capitalize text-gray-500">
                              {categoryLabels[template.category]}
                            </span>
                            {isCurrent ? (
                              <span className="text-xs font-semibold text-purple-600">
                                Current
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                Use template
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
