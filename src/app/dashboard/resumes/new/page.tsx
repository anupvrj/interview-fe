"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  FileEdit,
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

export default function NewResumePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadTemplates();
    }
  }, [isLoaded, user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await resumeApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !user) return;

    try {
      setCreating(true);
      const resume = await resumeApi.create(user.id, {
        templateId: selectedTemplate,
        title: "My Resume",
      });
      router.push(`/dashboard/resumes/${resume.resumeId}/edit`);
    } catch (error) {
      console.error("Error creating resume:", error);
      alert("Failed to create resume. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  // Filter templates based on active filter
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/resumes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Choose a Template
          </h1>
          <p className="text-gray-600 mt-1">
            Select an ATS-friendly template to get started
          </p>
        </div>
      </div>

      {/* Selected Template Actions */}
      {selectedTemplate && (
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-900">Template Selected</p>
                <p className="text-sm text-gray-600">
                  {templates.find((t) => t.id === selectedTemplate)?.name}{" "}
                  template
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileEdit className="w-4 h-4 mr-2" />
                  Create Resume
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {filterButtons.map((filter) => (
          <Button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            variant={activeFilter === filter.id ? "default" : "outline"}
            className={
              activeFilter === filter.id
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                : "border-gray-300 hover:border-purple-400"
            }
          >
            {filter.label}
            {activeFilter === filter.id && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {filter.id === "all"
                  ? templates.length
                  : templates.filter((t) => t.category === filter.id).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">
            {activeFilter === "all"
              ? "All Templates"
              : `${categoryLabels[activeFilter]} Templates`}
          </h2>
          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
            {filteredTemplates.length}
          </span>
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplate === template.id;
              return (
                <Card
                  key={template.id}
                  className={`border-2 cursor-pointer transition-all hover:shadow-xl ${
                    isSelected
                      ? "border-purple-500 shadow-lg ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-0">
                    {/* Template Preview */}
                    <TemplatePreview
                      template={template}
                      isSelected={isSelected}
                    />

                    {/* Template Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: `${template.colors.primary}20`,
                            color: template.colors.primary,
                          }}
                        >
                          {categoryLabels[template.category]}
                        </span>
                        {template.atsOptimized && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                            ATS Optimized
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No templates found in this category.
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                All Templates are ATS-Friendly
              </h3>
              <p className="text-sm text-gray-600">
                Our templates are designed to pass Applicant Tracking Systems
                (ATS) with scores above 80%. You can edit your resume content
                and download as PDF anytime.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
