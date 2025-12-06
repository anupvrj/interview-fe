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
  simple: "Simple",
  modern: "Modern",
  creative: "Creative",
};

export default function NewResumePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  const categories = ["simple", "modern", "creative"] as const;
  const templatesByCategory = categories.map((cat) => ({
    category: cat,
    templates: templates.filter((t) => t.category === cat),
  }));

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

      {/* Templates by Category */}
      {templatesByCategory.map(({ category, templates: categoryTemplates }) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {categoryLabels[category]} Templates
            </h2>
            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
              {categoryTemplates.length}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {categoryTemplates.map((template) => {
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
                    <TemplatePreview template={template} isSelected={isSelected} />

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
        </div>
      ))}

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
