"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  FileEdit,
  Sparkles,
  Upload,
  FileText,
  X,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import { ResumeTemplate, resumeApi, resumeDataExtractionApi } from "@/lib/api";
import { TemplatePreview } from "@/components/TemplatePreview";
import { extractTextFromPDF } from "@/lib/pdf-utils";

const categoryLabels = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
};

type FilterCategory = "all" | "simple" | "modern" | "creative";
type Step = "template" | "upload" | "processing";

export default function NewResumePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("template");
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [extracting, setExtracting] = useState(false);

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

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setExtracting(true);

    try {
      // Extract text from PDF
      const text = await extractTextFromPDF(file);
      setResumeText(text);
    } catch (error) {
      console.error("Error extracting PDF:", error);
      alert(
        "Failed to extract text from PDF. You can still proceed without uploading."
      );
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleNext = () => {
    if (selectedTemplate) {
      setStep("upload");
    }
  };

  const handleSkip = () => {
    setStep("processing");
    handleCreateResumeWithDummyContent();
  };

  const handleCreateResumeWithDummyContent = async () => {
    if (!selectedTemplate || !user) return;

    try {
      setCreating(true);
      setStep("processing");

      console.log("📋 Loading dummy content from template...");

      // Load dummy content from template (no LLM call needed)
      const { TemplateLoader } = await import("@/lib/templateLoader");
      const dummyContent = await TemplateLoader.loadDummyContent(
        selectedTemplate
      );

      console.log("✅ Dummy content loaded:", dummyContent);

      // If no template-specific dummy content, use a basic structure
      const contentToUse = dummyContent || {
        personalInfo: {
          fullName: "John Doe",
          email: "john.doe@email.com",
          phone: "+1 234-567-8900",
          location: "San Francisco, CA",
          linkedin: "john-doe",
          github: "johndoe",
          portfolio: "Software Engineer",
        },
        profileSummary:
          "Experienced professional with a strong background in software development and project management.",
        experience: [],
        education: [],
        skills: [],
      };

      // Prepare template config for backend
      const templateConfig = await TemplateLoader.loadTemplate(selectedTemplate);
      const extended = templateConfig.extended;

      // Extract layout from extended config
      const renderingLayout = extended.rendering?.layout;
      const initialLayout = {
        type: (renderingLayout?.type === "header-plus-columns" ? "double" : (renderingLayout?.type || "single")) as "single" | "double",
        columnWidths: renderingLayout?.columnWidths || { left: 60, right: 40 },
        padding: extended.style?.padding || { top: 10, bottom: 10, left: 10, right: 10 },
      };

      // Prepare section order with column assignments
      let sectionOrder = extended.defaultSectionOrder || [];
      if (initialLayout.type === "double") {
        const hasColumnAssignment = renderingLayout?.columnAssignment && 
          (renderingLayout.columnAssignment.left.length > 0 || renderingLayout.columnAssignment.right.length > 0);
        
        if (hasColumnAssignment) {
          // Use explicit column assignments from config
          sectionOrder = sectionOrder.map((s) => ({
            ...s,
            column: renderingLayout.columnAssignment?.left.includes(s.id)
              ? ("left" as const)
              : renderingLayout.columnAssignment?.right.includes(s.id)
              ? ("right" as const)
              : ("left" as const),
          }));
        } else {
          // No explicit assignments - use alternating distribution
          // Skip personalInfo (header) - don't assign it a column
          // Distribute remaining sections evenly: 1st→left, 2nd→right, 3rd→left, etc.
          let nonPersonalIndex = 0;
          sectionOrder = sectionOrder.map((s) => {
            if (s.id === "personalInfo") {
              return s; // No column assignment for header
            }
            const column = nonPersonalIndex % 2 === 0 ? ("left" as const) : ("right" as const);
            nonPersonalIndex++;
            return { ...s, column };
          });
        }
      }

      // Create resume with dummy content (no API extraction needed)
      const resume = await resumeApi.create(user.id, {
        templateId: selectedTemplate,
        title: "My Resume",
        content: contentToUse,
        sectionOrder,
        layout: initialLayout,
      });

      console.log("✅ Resume created with dummy content:", resume.resumeId);
      router.push(`/dashboard/resumes/${resume.resumeId}/edit`);
    } catch (error: any) {
      console.error("❌ Error creating resume with dummy content:", error);

      // Reset step back to upload so user can try again
      setStep("upload");

      alert(
        `Failed to create resume: ${
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
        }`
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCreateResume = async () => {
    if (!selectedTemplate || !user) return;

    try {
      setCreating(true);
      setStep("processing");

      console.log("📋 Extracting resume data from uploaded text...");

      // Extract resume data using LLM (only when resume is uploaded)
      const extractedData = await resumeDataExtractionApi.extractResumeData(
        selectedTemplate,
        resumeText // Will have content since this is called after upload
      );

      console.log("✅ Data extracted via LLM");

      // Prepare template config for backend
      const { TemplateLoader } = await import("@/lib/templateLoader");
      const templateConfig = await TemplateLoader.loadTemplate(selectedTemplate);
      const extended = templateConfig.extended;

      // Extract layout from extended config
      const renderingLayout = extended.rendering?.layout;
      const initialLayout = {
        type: (renderingLayout?.type === "header-plus-columns" ? "double" : (renderingLayout?.type || "single")) as "single" | "double",
        columnWidths: renderingLayout?.columnWidths || { left: 60, right: 40 },
        padding: extended.style?.padding || { top: 10, bottom: 10, left: 10, right: 10 },
      };

      // Prepare section order with column assignments
      let sectionOrder = extended.defaultSectionOrder || [];
      if (initialLayout.type === "double") {
        const hasColumnAssignment = renderingLayout?.columnAssignment && 
          (renderingLayout.columnAssignment.left.length > 0 || renderingLayout.columnAssignment.right.length > 0);
        
        if (hasColumnAssignment) {
          // Use explicit column assignments from config
          sectionOrder = sectionOrder.map((s) => ({
            ...s,
            column: renderingLayout.columnAssignment?.left.includes(s.id)
              ? ("left" as const)
              : renderingLayout.columnAssignment?.right.includes(s.id)
              ? ("right" as const)
              : ("left" as const),
          }));
        } else {
          // No explicit assignments - use alternating distribution
          // Skip personalInfo (header) - don't assign it a column
          // Distribute remaining sections evenly: 1st→left, 2nd→right, 3rd→left, etc.
          let nonPersonalIndex = 0;
          sectionOrder = sectionOrder.map((s) => {
            if (s.id === "personalInfo") {
              return s; // No column assignment for header
            }
            const column = nonPersonalIndex % 2 === 0 ? ("left" as const) : ("right" as const);
            nonPersonalIndex++;
            return { ...s, column };
          });
        }
      }

      // Create resume with extracted data
      const resume = await resumeApi.create(user.id, {
        templateId: selectedTemplate,
        title: "My Resume",
        content: mapExtractedDataToResumeContent(extractedData.sections),
        sectionOrder,
        layout: initialLayout,
      });

      console.log("✅ Resume created:", resume.resumeId);
      router.push(`/dashboard/resumes/${resume.resumeId}/edit`);
    } catch (error: any) {
      console.error("❌ Error creating resume:", error);

      // Reset step back to upload so user can try again
      setStep("upload");

      // Check if it's a timeout error
      if (
        error?.code === "ECONNABORTED" ||
        error?.message?.includes("timeout") ||
        error?.message?.includes("Request timeout")
      ) {
        alert(
          "Resume extraction is taking longer than expected. This might be due to a large PDF or slow network. Please try again or upload a smaller PDF."
        );
      } else {
        alert(
          `Failed to create resume: ${
            error?.response?.data?.message ||
            error?.message ||
            "Please try again."
          }`
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const mapExtractedDataToResumeContent = (
    sections: Record<
      string,
      {
        sectionType: string;
        content: string | any;
        format: "html" | "list" | "paragraph" | "structured";
      }
    >
  ) => {
    const content: any = {};

    for (const [sectionType, sectionData] of Object.entries(sections)) {
      // Handle personalInfo specially - it's an object, not an array
      if (sectionType === "personalInfo") {
        if (
          sectionData.format === "structured" &&
          typeof sectionData.content === "object" &&
          !Array.isArray(sectionData.content)
        ) {
          content.personalInfo = sectionData.content;
        } else if (typeof sectionData.content === "object") {
          content.personalInfo = sectionData.content;
        }
      }
      // Handle technicalSkills - map to single skills field
      else if (sectionType === "technicalSkills") {
        // New structure: single skills field
        content.skills = sectionData.content;
      }
      // Handle skills - map to single skills field
      else if (sectionType === "skills") {
        // New structure: single skills field
        content.skills = sectionData.content;
      }
      // Handle array-based structured data (experience, education, projects, etc.)
      else if (
        sectionData.format === "structured" &&
        Array.isArray(sectionData.content)
      ) {
        content[sectionType] = sectionData.content;
      }
      // Handle string content (profileSummary, etc.)
      else if (typeof sectionData.content === "string") {
        content[sectionType] = sectionData.content;
      }
      // Fallback: assign content as-is
      else {
        content[sectionType] = sectionData.content;
      }
    }

    return content;
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

  const selectedTemplateName = templates.find(
    (t) => t.id === selectedTemplate
  )?.name;

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
            {step === "template" && "Choose a Template"}
            {step === "upload" && "Upload Your Resume (Optional)"}
            {step === "processing" && "Creating Your Resume"}
          </h1>
          <p className="text-gray-600 mt-1">
            {step === "template" &&
              "Select an ATS-friendly template to get started"}
            {step === "upload" &&
              "Upload your existing resume to auto-fill sections, or skip to use template defaults"}
            {step === "processing" &&
              "Setting up your resume with AI-powered content..."}
          </p>
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {step === "template" && (
        <>
          {/* Selected Template Actions */}
          {selectedTemplate && (
            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Template Selected
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedTemplateName} template
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Next: Upload Resume
                  <ArrowRight className="w-4 h-4 ml-2" />
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
                      : templates.filter((t) => t.category === filter.id)
                          .length}
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
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardContent className="p-0">
                        <TemplatePreview
                          template={template}
                          isSelected={isSelected}
                        />
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
        </>
      )}

      {/* Step 2: Resume Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">
                    Template: {selectedTemplateName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload your existing resume PDF to automatically extract and
                    fill in your information. This will save you time and ensure
                    accuracy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
            <CardContent className="p-8">
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`text-center cursor-pointer ${
                    isDragActive ? "opacity-70" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {extracting ? (
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-purple-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {extracting
                      ? "Extracting text from PDF..."
                      : isDragActive
                      ? "Drop your resume here"
                      : "Upload Your Resume PDF"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop your PDF file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported format: PDF (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                      setResumeText("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("template")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={creating}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip & Use Defaults
              </Button>
              <Button
                onClick={() => {
                  setStep("processing");
                  handleCreateResume();
                }}
                disabled={creating || extracting}
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
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === "processing" && (
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Creating Your Resume
            </h3>
            <p className="text-gray-600">
              {uploadedFile
                ? "Extracting data from your resume and structuring it..."
                : "Setting up your resume with default content..."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {step === "template" && (
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
      )}
    </div>
  );
}
