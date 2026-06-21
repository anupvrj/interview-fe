"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Loader2,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { ResumeTemplate, resumeApi } from "@/lib/api";
import { TemplatePreview } from "@/components/TemplatePreview";

const categoryLabels = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
};

type FilterCategory = "all" | "simple" | "modern" | "creative";

interface ATSImproveTemplatePickerProps {
  resumeId: string;
  currentTemplateId?: string;
  onComplete: (templateId?: string) => void;
}

export function ATSImproveTemplatePicker({
  resumeId,
  currentTemplateId,
  onComplete,
}: ATSImproveTemplatePickerProps) {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    currentTemplateId ?? null,
  );
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const list = await resumeApi.getTemplates();
        setTemplates(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredTemplates =
    activeFilter === "all"
      ? templates
      : templates.filter((t) => t.category === activeFilter);

  const filterButtons: { id: FilterCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "simple", label: "Popular" },
    { id: "modern", label: "Modern" },
    { id: "creative", label: "Creative" },
  ];

  const handleContinue = async (skipTemplate: boolean) => {
    if (applying) return;
    setApplying(true);
    try {
      if (!skipTemplate && selectedTemplate && selectedTemplate !== currentTemplateId) {
        await resumeApi.update(resumeId, { templateId: selectedTemplate });
        onComplete(selectedTemplate);
      } else {
        onComplete(currentTemplateId);
      }
    } catch {
      onComplete(currentTemplateId);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
          <Sparkles className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Resume enhanced
        </h1>
        <p className="mt-2 max-w-xl mx-auto text-muted-foreground">
          Your resume has been improved using ATS feedback. Choose a template
          for the editor, or skip to keep your current layout.
        </p>
      </div>

      {selectedTemplate && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Template selected</p>
                <p className="text-sm text-muted-foreground">
                  {templates.find((t) => t.id === selectedTemplate)?.name ??
                    selectedTemplate}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => void handleContinue(true)}
                disabled={applying}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip — keep current
              </Button>
              <Button
                onClick={() => void handleContinue(false)}
                disabled={applying}
              >
                {applying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Continue to editor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {filterButtons.map((filter) => (
          <Button
            key={filter.id}
            size="sm"
            variant={activeFilter === filter.id ? "default" : "outline"}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <Card
              key={template.id}
              className={`cursor-pointer overflow-hidden border-2 transition-all hover:shadow-lg ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardContent className="p-0">
                <TemplatePreview template={template} isSelected={isSelected} />
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    {categoryLabels[template.category]}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!selectedTemplate && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void handleContinue(true)} disabled={applying}>
            <SkipForward className="mr-2 h-4 w-4" />
            Skip template selection
          </Button>
        </div>
      )}
    </div>
  );
}
