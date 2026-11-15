"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ResumeTemplate, resumeApi } from "@/lib/api";
import { buildResumeTemplateApplication } from "@/lib/applyResumeTemplate";
import { TemplatePreview } from "@/components/TemplatePreview";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { Mono } from "@/components/marketing-2026/primitives";
import { cn } from "@/lib/utils";

const categoryLabels = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
};

type FilterCategory = "all" | "simple" | "modern" | "creative";

interface ATSImproveTemplatePickerProps {
  resumeId: string;
  currentTemplateId?: string;
  /** "report": picked from the ATS report, nothing has been enhanced yet. */
  source?: "improve" | "report";
  onComplete: (templateId?: string) => void;
}

export function ATSImproveTemplatePicker({
  resumeId,
  currentTemplateId,
  source = "improve",
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
        const list = await resumeApi.getSelectableTemplates(currentTemplateId);
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
      if (!skipTemplate && selectedTemplate) {
        const resume = await resumeApi.get(resumeId);
        const templateApplication = await buildResumeTemplateApplication(
          selectedTemplate,
          resume,
        );
        await resumeApi.update(resumeId, templateApplication);
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

  const selected = templates.find((t) => t.id === selectedTemplate);
  const fromReport = source === "report";

  if (loading) {
    return (
      <div className={cn(dash2026Scope, "flex min-h-[50vh] flex-col items-center justify-center gap-4")}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading templates…</p>
      </div>
    );
  }

  return (
    <div className={cn(dash2026Scope, "mx-auto max-w-6xl space-y-5 pb-24 lg:space-y-6")}>
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card p-6 md:p-8">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative">
          <Eyebrow>{fromReport ? "TEMPLATES" : "RESUME ENHANCED"}</Eyebrow>
          <h1 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.05em] text-foreground sm:text-[38px]">
            {fromReport ? "Choose a template" : "Now choose a template"}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
            Your content stays the same. You can change it any time.
          </p>
        </div>
      </section>

      <div role="tablist" aria-label="Template type" className="flex flex-wrap gap-2">
        {filterButtons.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "min-h-10 rounded-xl border px-4 text-[13.5px] font-semibold transition-colors",
              activeFilter === filter.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <button
              key={template.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedTemplate(template.id)}
              className={cn(
                "overflow-hidden rounded-[22px] border bg-card text-left transition-all",
                isSelected ? "border-primary shadow-[0_0_0_3px_rgba(115,103,240,.2)]" : "border-border hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(30,20,90,.45)]",
              )}
            >
              <TemplatePreview template={template} isSelected={isSelected} />
              <div className="p-4">
                <h3 className="font-bold tracking-[-0.02em] text-foreground">{template.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
                <Mono className="mt-2 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] uppercase text-muted-foreground">
                  {categoryLabels[template.category]}
                </Mono>
              </div>
            </button>
          );
        })}
      </div>

      {/* always in reach, however far down the list they are */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-border bg-card/95 p-3 shadow-[0_24px_50px_-30px_rgba(30,20,90,.45)] backdrop-blur">
        <p className="min-w-0 truncate pl-2 text-[14px] text-muted-foreground">
          {selected ? <><span className="font-semibold text-foreground">{selected.name}</span> selected</> : "Pick a template"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void handleContinue(true)} disabled={applying} className="h-11 rounded-xl px-4 text-muted-foreground">
            Keep current
          </Button>
          <Button onClick={() => void handleContinue(false)} disabled={applying || !selectedTemplate} className="h-11 rounded-xl px-5 shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue to editor
          </Button>
        </div>
      </div>
    </div>
  );
}
