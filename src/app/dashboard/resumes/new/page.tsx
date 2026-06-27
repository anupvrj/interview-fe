"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { userApi } from "@/lib/api";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Linkedin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ResumeTemplate, resumeApi } from "@/lib/api";
import {
  buildSectionOrderForExtractedContent,
  mapExtractedSectionsToContent,
  RESUME_IMPORT_PROCESSING_MESSAGES,
} from "@/lib/resume-data-import";
import { TemplatePreview } from "@/components/TemplatePreview";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import type { FileRejection } from "react-dropzone";

const categoryLabels = {
  simple: "Popular",
  modern: "Modern",
  creative: "Creative",
};

type FilterCategory = "all" | "simple" | "modern" | "creative";
type Step = "method" | "template" | "upload" | "linkedin" | "processing";
type ImportMethod = "new" | "linkedin";

const uploadedResumeProcessingMessages = [...RESUME_IMPORT_PROCESSING_MESSAGES];

const defaultResumeProcessingMessages = [
  "Setting up your resume with default content...",
  "Preparing sections and formatting your layout...",
  "Adding professional starter content...",
  "Arranging sections for maximum clarity...",
  "Fine-tuning headings and structure...",
  "Adding starter details so you can edit faster...",
  "Finalizing your resume structure...",
  "Final checks in progress. Almost done...",
];

export default function NewResumePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("method");
  const [importMethod, setImportMethod] = useState<ImportMethod>("new");
  const [linkedinHandle, setLinkedinHandle] = useState<string>("");
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);

  const processingMessages =
    uploadedFile || importMethod === "linkedin"
      ? uploadedResumeProcessingMessages
      : defaultResumeProcessingMessages;

  useEffect(() => {
    if (step !== "processing") {
      setProcessingMessageIndex(0);
      return;
    }

    setProcessingMessageIndex(0);
    const lastIndex = processingMessages.length - 1;
    const interval = setInterval(() => {
      setProcessingMessageIndex((prev) => {
        if (prev >= lastIndex) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [step, processingMessages.length]);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        // User not logged in - redirect to sign-in with return URL
        const templateParam = searchParams.get("template");
        const skipTemplate = searchParams.get("skipTemplate");
        const returnUrl =
          templateParam && skipTemplate
            ? `/dashboard/resumes/new?template=${templateParam}&skipTemplate=true`
            : "/dashboard/resumes/new";
        router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // User is logged in - check onboarding status
      localStorage.setItem("clerk-user-id", user.id);
      checkOnboardingAndLoadTemplates();
    }
  }, [isLoaded, user, router, searchParams]);

  const checkOnboardingAndLoadTemplates = async () => {
    if (!user) return;

    try {
      // Check onboarding status
      const profile = await userApi.getMyProfile();

      if (!profile.onboardingCompleted) {
        // Onboarding not completed - redirect to onboarding with return URL
        const templateParam = searchParams.get("template");
        const skipTemplate = searchParams.get("skipTemplate");
        const returnUrl =
          templateParam && skipTemplate
            ? `/dashboard/resumes/new?template=${templateParam}&skipTemplate=true`
            : "/dashboard/resumes/new";
        localStorage.setItem("resumeBuilderReturnUrl", returnUrl);
        router.push("/onboarding");
        return;
      }

      // Onboarding completed - load templates and check for template param
      loadTemplates();

      // Check URL params to skip template selection
      const templateParam = searchParams.get("template");
      const skipTemplate = searchParams.get("skipTemplate") === "true";

      if (templateParam && skipTemplate) {
        setSelectedTemplate(templateParam);
        setStep("upload");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // If error, still try to load templates
      loadTemplates();
    }
  };

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

  const onDrop = async (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
  ) => {
    if (fileRejections.length > 0) {
      const err = fileRejections[0].errors[0];
      alert(
        err.code === "file-too-large"
          ? "File size must be less than 5 MB"
          : err.message || "Only PDF files are allowed",
      );
      return;
    }

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
        "Failed to extract text from PDF. You can still proceed without uploading.",
      );
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    maxFiles: 1,
    validator: pdfResumeFileValidator,
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const useTemplateAndGoToUpload = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (importMethod === "linkedin") {
      setStep("processing");
      handleCreateResumeFromLinkedIn(templateId);
      return;
    }
    setStep("upload");
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
      const dummyContent =
        await TemplateLoader.loadDummyContent(selectedTemplate);

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
      const templateConfig =
        await TemplateLoader.loadTemplate(selectedTemplate);
      const extended = templateConfig.extended;

      // Extract layout from extended config
      const renderingLayout = extended.rendering?.layout;
      const initialLayout = {
        type: (renderingLayout?.type === "header-plus-columns"
          ? "double"
          : renderingLayout?.type || "single") as "single" | "double",
        columnWidths: renderingLayout?.columnWidths || { left: 60, right: 40 },
        padding: extended.style?.padding || {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      };

      // Prepare section order with column assignments
      let sectionOrder = extended.defaultSectionOrder || [];
      if (initialLayout.type === "double") {
        const hasColumnAssignment =
          renderingLayout?.columnAssignment &&
          (renderingLayout.columnAssignment.left.length > 0 ||
            renderingLayout.columnAssignment.right.length > 0);

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
            const column =
              nonPersonalIndex % 2 === 0
                ? ("left" as const)
                : ("right" as const);
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

      const isLimitError =
        error?.response?.status === 403 &&
        (error?.response?.data?.message || error?.message || "")
          .toLowerCase()
          .includes("resume limit");
      if (isLimitError) {
        setShowLimitModal(true);
      } else {
        alert(
          `Failed to create resume: ${
            error?.response?.data?.message ||
            error?.message ||
            "Please try again."
          }`,
        );
      }
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

      const { resumeDataExtractionApi } = await import("@/lib/api");
      const extractedData = await resumeDataExtractionApi.extractResumeData(
        selectedTemplate,
        resumeText,
      );

      console.log("✅ Data extracted via LLM");

      const { TemplateLoader } = await import("@/lib/templateLoader");
      const templateConfig =
        await TemplateLoader.loadTemplate(selectedTemplate);
      const extended = templateConfig.extended;

      const renderingLayout = extended.rendering?.layout;
      const initialLayout = {
        type: (renderingLayout?.type === "header-plus-columns"
          ? "double"
          : renderingLayout?.type || "single") as "single" | "double",
        columnWidths: renderingLayout?.columnWidths || { left: 60, right: 40 },
        padding: extended.style?.padding || {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      };

      const content = mapExtractedSectionsToContent(extractedData.sections);
      const sectionOrder = buildSectionOrderForExtractedContent(
        extended,
        content,
        initialLayout.type,
      );

      const resume = await resumeApi.create(user.id, {
        templateId: selectedTemplate,
        title: "My Resume",
        content,
        sectionOrder,
        layout: initialLayout,
      });

      console.log("✅ Resume created:", resume.resumeId);
      router.push(`/dashboard/resumes/${resume.resumeId}/edit`);
    } catch (error: any) {
      console.error("❌ Error creating resume:", error);

      // Reset step back to upload so user can try again
      setStep("upload");

      const isLimitError =
        error?.response?.status === 403 &&
        (error?.response?.data?.message || error?.message || "")
          .toLowerCase()
          .includes("resume limit");

      if (isLimitError) {
        setShowLimitModal(true);
      } else if (
        error?.code === "ECONNABORTED" ||
        error?.message?.includes("timeout") ||
        error?.message?.includes("Request timeout")
      ) {
        alert(
          "Resume extraction is taking longer than expected. This might be due to a large PDF or slow network. Please try again or upload a smaller PDF.",
        );
      } else {
        alert(
          `Failed to create resume: ${
            error?.response?.data?.message ||
            error?.message ||
            "Please try again."
          }`,
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateResumeFromLinkedIn = async (templateId: string) => {
    if (!templateId || !user) return;

    const handle = linkedinHandle.trim();
    if (!handle) {
      setStep("linkedin");
      alert("Please enter your LinkedIn profile URL or username.");
      return;
    }

    try {
      setCreating(true);
      setStep("processing");

      console.log("🔗 Importing resume data from LinkedIn...");

      const { resumeDataExtractionApi } = await import("@/lib/api");
      const extractedData = await resumeDataExtractionApi.importLinkedInProfile(
        handle,
        templateId,
      );

      console.log("✅ LinkedIn data imported and enhanced via LLM");

      const { TemplateLoader } = await import("@/lib/templateLoader");
      const templateConfig = await TemplateLoader.loadTemplate(templateId);
      const extended = templateConfig.extended;

      const renderingLayout = extended.rendering?.layout;
      const initialLayout = {
        type: (renderingLayout?.type === "header-plus-columns"
          ? "double"
          : renderingLayout?.type || "single") as "single" | "double",
        columnWidths: renderingLayout?.columnWidths || { left: 60, right: 40 },
        padding: extended.style?.padding || {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      };

      const content = mapExtractedSectionsToContent(extractedData.sections);
      const sectionOrder = buildSectionOrderForExtractedContent(
        extended,
        content,
        initialLayout.type,
      );

      const resume = await resumeApi.create(user.id, {
        templateId,
        title: "My Resume",
        content,
        profileSummary:
          typeof content.profileSummary === "string"
            ? content.profileSummary
            : undefined,
        sectionOrder,
        layout: initialLayout,
      });

      console.log("✅ Resume created from LinkedIn:", resume.resumeId);
      router.push(`/dashboard/resumes/${resume.resumeId}/edit`);
    } catch (error: any) {
      console.error("❌ Error creating resume from LinkedIn:", error);

      // Reset back to the LinkedIn input so the user can correct and retry.
      setStep("linkedin");

      const isLimitError =
        error?.response?.status === 403 &&
        (error?.response?.data?.message || error?.message || "")
          .toLowerCase()
          .includes("resume limit");

      if (isLimitError) {
        setShowLimitModal(true);
      } else if (
        error?.code === "ECONNABORTED" ||
        error?.message?.includes("timeout") ||
        error?.message?.includes("Request timeout")
      ) {
        alert(
          "Importing your LinkedIn profile is taking longer than expected. Please try again.",
        );
      } else {
        alert(
          `Failed to import from LinkedIn: ${
            error?.response?.data?.message ||
            error?.message ||
            "Please try again."
          }`,
        );
      }
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

  const selectedTemplateName = templates.find(
    (t) => t.id === selectedTemplate,
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
            {step === "method" && "Create a Resume"}
            {step === "linkedin" && "Import from LinkedIn"}
            {step === "template" && "Choose a Template"}
            {step === "upload" && "Upload Your Resume (Optional)"}
            {step === "processing" && "Creating Your Resume"}
          </h1>
          <p className="text-gray-600 mt-1">
            {step === "method" &&
              "Start from scratch or import your details from LinkedIn"}
            {step === "linkedin" &&
              "Enter your LinkedIn profile and we'll build an ATS-optimized resume"}
            {step === "template" &&
              "Select an ATS-friendly template to get started"}
            {step === "upload" &&
              "Upload your existing resume to auto-fill sections, or skip to use template defaults"}
            {step === "processing" &&
              "Setting up your resume with AI-powered content..."}
          </p>
        </div>
      </div>

      {/* Step 0: Choose creation method */}
      {step === "method" && (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <Card
            className="group cursor-pointer border-2 border-gray-200 transition-all hover:border-purple-400 hover:shadow-xl"
            onClick={() => {
              setImportMethod("new");
              setStep("template");
            }}
          >
            <CardContent className="flex h-full flex-col p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-primary">
                <FileEdit className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Create New
              </h3>
              <p className="flex-1 text-sm text-gray-600">
                Start from scratch with a template, or upload an existing resume
                PDF to auto-fill your details.
              </p>
              <div className="mt-4 flex items-center text-sm font-semibold text-purple-600">
                Get started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-2 border-gray-200 transition-all hover:border-purple-400 hover:shadow-xl"
            onClick={() => {
              setImportMethod("linkedin");
              setStep("linkedin");
            }}
          >
            <CardContent className="flex h-full flex-col p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A66C2]">
                <Linkedin className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Import from LinkedIn
              </h3>
              <p className="flex-1 text-sm text-gray-600">
                Bring in your LinkedIn profile and let AI organize and enhance it
                into an ATS-optimized resume.
              </p>
              <div className="mt-4 flex items-center text-sm font-semibold text-purple-600">
                Connect LinkedIn
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: LinkedIn handle input */}
      {step === "linkedin" && (
        <div className="space-y-6">
          <Card className="border-2 border-border bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#0A66C2]">
                  <Linkedin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 font-bold text-gray-900">
                    Import your LinkedIn profile
                  </h3>
                  <p className="text-sm text-gray-600">
                    Paste your public LinkedIn profile URL or username. We&apos;ll
                    fetch your experience, education, skills and more, then use AI
                    to organize and enhance it for ATS.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardContent className="space-y-3 p-6">
              <label
                htmlFor="linkedin-handle"
                className="block text-sm font-medium text-gray-900"
              >
                LinkedIn profile URL or username
              </label>
              <Input
                id="linkedin-handle"
                value={linkedinHandle}
                onChange={(e) => setLinkedinHandle(e.target.value)}
                placeholder="https://www.linkedin.com/in/your-username  or  your-username"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && linkedinHandle.trim()) {
                    setStep("template");
                  }
                }}
              />
              <p className="text-xs text-gray-500">
                Example: https://www.linkedin.com/in/john-doe or just john-doe
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("method")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setStep("template")}
              disabled={!linkedinHandle.trim()}
              className="bg-gradient-to-r from-purple-600 to-primary text-white hover:bg-slate-900"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Template Selection */}
      {step === "template" && (
        <>
          {/* Back to method / linkedin */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setStep(importMethod === "linkedin" ? "linkedin" : "method")
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Selected Template Actions */}
          {selectedTemplate && (
            <Card className="sticky top-20 z-20 border-2 border-purple-200 bg-purple-50/95 backdrop-blur supports-[backdrop-filter]:bg-purple-50/80 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    ? "bg-gradient-to-r from-purple-600 to-primary hover:bg-slate-900 text-white"
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 items-stretch">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <Card
                      key={template.id}
                      className={`group relative flex h-full min-h-0 flex-col overflow-hidden border-2 cursor-pointer transition-all hover:shadow-xl ${
                        isSelected
                          ? "border-purple-500 shadow-lg ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardContent className="relative flex min-h-0 flex-1 flex-col p-0">
                        <TemplatePreview
                          template={template}
                          isSelected={isSelected}
                        />
                        <div className="flex flex-1 flex-col bg-white p-4">
                          <h3 className="font-bold text-gray-900 mb-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
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
                        <div
                          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            className="shadow-lg bg-gradient-to-r from-purple-600 to-primary hover:bg-slate-900 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              useTemplateAndGoToUpload(template.id);
                            }}
                            aria-label={`Use ${template.name} template and continue to upload`}
                          >
                            Use Template
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
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
          <Card className="border-2 border-border bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
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
                className="bg-gradient-to-r from-purple-600 to-primary hover:bg-slate-900 text-white"
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
              {processingMessages[processingMessageIndex]}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {step === "template" && (
        <Card className="border-2 border-border bg-muted/30">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
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

      {/* Resume limit reached – upgrade plan modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md border-2 border-purple-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Resume limit reached
            </DialogTitle>
            <DialogDescription className="text-left text-gray-600 pt-1">
              You&apos;ve used all the resumes included in your current plan.
              Upgrade your plan to create more resumes and keep building.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLimitModal(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLimitModal(false);
                router.push("/dashboard/plan");
              }}
              className="bg-gradient-to-r from-purple-600 to-primary hover:bg-slate-900 text-white"
            >
              Upgrade plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
