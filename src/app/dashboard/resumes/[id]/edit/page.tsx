"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Download,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Eye,
  Edit,
  X,
  Check,
} from "lucide-react";
import { Resume, ResumeTemplate, resumeApi, apiClient } from "@/lib/api";
import { ResumePreview } from "@/components/ResumePreview";
import { RichTextEditor } from "@/components/RichTextEditor";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { ExecutiveSkills } from "@/components/resume-editor/ExecutiveSkills";
import { LanguagesEditor } from "@/components/LanguagesEditor";
import { captureAndUploadThumbnail } from "@/lib/resume-thumbnail";
import { ATSFeedback } from "@/components/ATSFeedback";

interface Section {
  id: string;
  type:
    | "personalInfo"
    | "profileSummary"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "achievements"
    | "languages"
    | "certificates"
    | "interests"
    | "courses"
    | "awards"
    | "organisations"
    | "publications"
    | "references"
    | "declaration"
    | "spacer"
    | "custom";
  title: string;
  visible: boolean;
  expanded: boolean;
}

export default function EditResumePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState<string | null>(
    null
  );
  const [sectionTitleValue, setSectionTitleValue] = useState("");
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [layout, setLayout] = useState<{
    type: "single" | "double";
    columnWidths: { left: number; right: number };
    padding?: { top: number; bottom: number; left: number; right: number };
  } | null>(null);

  // Initialize sections as empty - will be populated from database
  const [sections, setSections] = useState<Section[]>([]);
  const [viewMode, setViewMode] = useState<"edit" | "ats">("edit");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoaded && user && resumeId) {
      localStorage.setItem("clerk-user-id", user.id);
      loadResume();
    }
  }, [mounted, isLoaded, user, resumeId]);

  // Autosave effect - saves 5 seconds after last change
  useEffect(() => {
    if (!hasChanges || !resume || !layout || sections.length === 0) {
      return;
    }

    const autoSaveTimer = setTimeout(async () => {
      try {
        setAutoSaving(true);
        const sectionOrderData = sections.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          visible: s.visible,
        }));

        await resumeApi.update(resumeId, {
          title: resume.title,
          content: resume.content,
          profileSummary: resume.profileSummary,
          sectionOrder: sectionOrderData,
          layout: layout,
        });

        setHasChanges(false);
        setLastSaved(new Date());
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        setAutoSaving(false);
      }
    }, 5000); // 5 seconds after last change

    return () => clearTimeout(autoSaveTimer);
  }, [hasChanges, resume, layout, sections, resumeId]);

  const loadResume = async () => {
    try {
      setLoading(true);
      const resumeData = await resumeApi.get(resumeId);

      // Normalize profileSummary - check multiple locations
      if (!resumeData.profileSummary) {
        // Check content.profileSummary
        if ((resumeData.content as any).profileSummary) {
          resumeData.profileSummary = (
            resumeData.content as any
          ).profileSummary;
        }
        // Check sections array
        else {
          const profileSection = (resumeData.content as any).sections?.find(
            (s: any) => s.type === "profileSummary"
          );
          if (profileSection?.content) {
            resumeData.profileSummary = profileSection.content;
          }
        }
      }

      setResume(resumeData);

      // Load layout from database or use default
      if (resumeData.layout) {
        setLayout({
          type: resumeData.layout.type || "single",
          columnWidths: resumeData.layout.columnWidths || {
            left: 60,
            right: 40,
          },
          padding: resumeData.layout.padding || {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        });
      }

      // Load template by templateId first to get padding configuration
      const templateList = await resumeApi.getTemplates();
      const foundTemplate = templateList.find(
        (t) => t.id === resumeData.templateId
      );

      // Set default layout if not provided, using optimized padding
      if (!resumeData.layout) {
        setLayout({
          type: "single",
          columnWidths: { left: 60, right: 40 },
          padding: { top: 5, bottom: 5, left: 8, right: 8 },
        });
      }

      // Load section order from database or use default
      if (resumeData.sectionOrder && resumeData.sectionOrder.length > 0) {
        setSections(
          resumeData.sectionOrder.map((s) => ({
            ...s,
            expanded: true,
          })) as Section[]
        );
      } else {
        // Initialize template-specific default sections if not in database
        const getDefaultSections = (): Section[] => {
          // Get extended template configuration
          if (foundTemplate) {
            const extendedTemplate = getExtendedTemplate(foundTemplate);

            // Check if template has specific default section order
            if (extendedTemplate.defaultSectionOrder) {
              return extendedTemplate.defaultSectionOrder.map((section) => ({
                ...section,
                type: section.type as Section["type"], // Cast to proper type
                expanded: section.visible, // Expand visible sections by default
              }));
            }
          }

          // Fallback to generic default sections
          return [
            {
              id: "personalInfo",
              type: "personalInfo",
              title: "Personal Information",
              visible: true,
              expanded: false, // Start collapsed (compact view)
            },
            {
              id: "profileSummary",
              type: "profileSummary",
              title: "Profile Summary",
              visible: true,
              expanded: true,
            },
            {
              id: "experience",
              type: "experience",
              title: "Experience",
              visible: true,
              expanded: true,
            },
            {
              id: "education",
              type: "education",
              title: "Education",
              visible: true,
              expanded: true,
            },
            {
              id: "skills",
              type: "skills",
              title: "Skills",
              visible: true,
              expanded: true,
            },
            {
              id: "projects",
              type: "projects",
              title: "Projects",
              visible: false,
              expanded: false,
            },
            {
              id: "languages",
              type: "languages",
              title: "Languages",
              visible: false,
              expanded: false,
            },
            {
              id: "certificates",
              type: "certificates",
              title: "Certificates",
              visible: false,
              expanded: false,
            },
            {
              id: "awards",
              type: "awards",
              title: "Awards",
              visible: false,
              expanded: false,
            },
            {
              id: "achievements",
              type: "achievements",
              title: "Achievements",
              visible: false,
              expanded: false,
            },
            {
              id: "interests",
              type: "interests",
              title: "Interests",
              visible: false,
              expanded: false,
            },
            {
              id: "courses",
              type: "courses",
              title: "Courses",
              visible: false,
              expanded: false,
            },
            {
              id: "organisations",
              type: "organisations",
              title: "Organisations",
              visible: false,
              expanded: false,
            },
            {
              id: "publications",
              type: "publications",
              title: "Publications",
              visible: false,
              expanded: false,
            },
            {
              id: "references",
              type: "references",
              title: "References",
              visible: false,
              expanded: false,
            },
            {
              id: "declaration",
              type: "declaration",
              title: "Declaration",
              visible: false,
              expanded: false,
            },
          ];
        };

        setSections(getDefaultSections());
      }

      // Template was already loaded above
      if (foundTemplate) {
        setTemplate(foundTemplate);
      }
    } catch (error) {
      console.error("Error loading resume:", error);
      alert("Failed to load resume. Please try again.");
      router.push("/dashboard/resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume) return;

    try {
      setSaving(true);
      const sectionOrderData = sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        visible: s.visible,
      }));

      await resumeApi.update(resumeId, {
        title: resume.title,
        content: resume.content,
        sectionOrder: sectionOrderData,
        layout: layout || {
          type: "single",
          columnWidths: { left: 60, right: 40 },
        },
      });
      setHasChanges(false);
      await loadResume();
    } catch (error) {
      console.error("Error saving resume:", error);
      alert("Failed to save resume. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Get ALL page elements (we now have multiple pages)
      // Use unique ID per resume to avoid conflicts
      const previewContainerId = `resume-preview-container-${resumeId}`;
      const page1Element = document.getElementById(previewContainerId);

      // Store current zoom level and reset to 100% for PDF generation
      let originalTransform = "";
      if (page1Element) {
        originalTransform = page1Element.style.transform;
        page1Element.style.transform = "scale(1)"; // Reset to 100%

        // Wait a moment for the DOM to update
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      try {
        // Get all pages: first page + additional pages
        const allPageElements: HTMLElement[] = [];
        if (page1Element) {
          allPageElements.push(page1Element as HTMLElement);
        }

        // Find additional pages (resume-preview-container-{id}-page-2, etc.)
        let pageNum = 2;
        while (true) {
          const pageElement = document.getElementById(
            `${previewContainerId}-page-${pageNum}`
          );
          if (!pageElement) break;
          allPageElements.push(pageElement as HTMLElement);
          pageNum++;
        }

        if (allPageElements.length === 0) {
          throw new Error("Preview element not found");
        }

        console.log(`Found ${allPageElements.length} page(s) to export`);

        // Wait for all images to load before capturing HTML
        const allImages: HTMLImageElement[] = [];
        allPageElements.forEach((pageElement) => {
          const images = pageElement.querySelectorAll("img");
          allImages.push(...Array.from(images));
        });

        await Promise.all(
          allImages.map((img) => {
            return new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight !== 0) {
                resolve();
              } else {
                img.onload = () => {
                  resolve();
                };
                img.onerror = () => {
                  resolve(); // Continue even if image fails
                };
                // Timeout after 5 seconds
                setTimeout(() => {
                  resolve();
                }, 5000);
              }
            });
          })
        );

        // Combine all pages into a single HTML document
        let combinedHTML = "";

        allPageElements.forEach((pageElement, index) => {
          const clonedPage = pageElement.cloneNode(true) as HTMLElement;

          // Keep the original styling but remove shadow
          clonedPage.classList.remove("shadow-2xl", "mx-auto");

          // Ensure all images in the cloned element have their src attributes preserved
          const originalImages = pageElement.querySelectorAll("img");
          const clonedImages = clonedPage.querySelectorAll("img");

          originalImages.forEach((originalImg, imgIndex) => {
            if (clonedImages[imgIndex]) {
              clonedImages[imgIndex].src = originalImg.src;
              clonedImages[imgIndex].setAttribute("crossorigin", "anonymous");
            }
          });

          // Add page break before each page except the first
          if (index > 0) {
            combinedHTML += '<div style="page-break-before: always;"></div>';
          }

          combinedHTML += clonedPage.outerHTML;
        });

        // Get the cleaned HTML content
        const htmlContent = combinedHTML;

        // Send HTML to backend for PDF generation with Puppeteer
        // Backend will generate pixel-perfect PDF matching the browser preview
        const { downloadUrl } = await resumeApi.generatePDF(
          resumeId,
          htmlContent,
          layout?.padding
        );

        // Open the PDF in a new tab
        window.open(downloadUrl, "_blank");
      } finally {
        // Restore original zoom level
        if (page1Element && originalTransform) {
          page1Element.style.transform = originalTransform;
        }
      }

      // Capture and upload thumbnail (run in background, don't block user)
      // Use setTimeout to let the page render completely before capturing
      // Store resumeId in closure to ensure we capture the correct resume
      const currentResumeId = resumeId;
      setTimeout(async () => {
        try {
          // Verify we're still on the same resume (user might have navigated away)
          if (currentResumeId !== resumeId) {
            console.log(
              "Resume changed, skipping thumbnail capture for:",
              currentResumeId
            );
            return;
          }

          // Use unique ID per resume to avoid capturing wrong resume
          const previewContainerId = `resume-preview-container-${currentResumeId}`;
          const previewElement = document.getElementById(previewContainerId);
          if (!previewElement) {
            console.error(
              `Resume preview element not found for thumbnail capture: ${previewContainerId}`
            );
            return;
          }

          console.log(
            "Starting thumbnail capture for resume:",
            currentResumeId
          );
          console.log("Preview element found:", previewElement);

          const result = await captureAndUploadThumbnail(
            currentResumeId,
            previewContainerId
          );

          if (result.success) {
            console.log(
              "✅ Thumbnail uploaded successfully!",
              result.thumbnailUrl
            );
            // Reload the resume to get updated data with thumbnail
            const updatedResume = await resumeApi.get(resumeId);
            setResume(updatedResume);
          } else {
            console.error("❌ Failed to upload thumbnail:", result.error);
          }
        } catch (error) {
          console.error("❌ Error capturing thumbnail:", error);
        }
      }, 8000); // Extended delay to ensure profile pictures and all images are fully loaded
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const updateContent = (updates: Partial<Resume["content"]>) => {
    if (!resume) return;
    setResume({
      ...resume,
      content: { ...resume.content, ...updates },
    });
    setHasChanges(true);
  };

  const toggleSection = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, expanded: !s.expanded } : s
      )
    );
  };

  const deleteSection = (sectionId: string) => {
    // Prevent deletion of essential sections
    const essentialSections = ["personalInfo", "experience", "education"];
    const sectionToDelete = sections.find((s) => s.id === sectionId);

    if (essentialSections.includes(sectionToDelete?.type || "")) {
      alert(
        "Cannot delete essential sections like Personal Info, Experience, and Education."
      );
      return;
    }

    // If deleting a custom section, also remove its data from customSections
    if (sectionToDelete?.type === "custom") {
      const updatedCustomSections =
        resume.content.customSections?.filter(
          (cs: any) => cs.id !== sectionId
        ) || [];
      updateContent({
        customSections: updatedCustomSections,
      });
    }

    if (
      confirm(
        `Are you sure you want to delete the "${sectionToDelete?.title}" section? This action cannot be undone.`
      )
    ) {
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      setHasChanges(true);
    }
  };

  const startEditingSectionTitle = (
    sectionId: string,
    currentTitle: string
  ) => {
    setEditingSectionTitle(sectionId);
    setSectionTitleValue(currentTitle);
  };

  const saveSectionTitle = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, title: sectionTitleValue } : s
      )
    );

    // If it's a custom section, also update the title in customSections
    if (section?.type === "custom") {
      const currentCustomSections = resume.content.customSections || [];
      const existingIndex = currentCustomSections.findIndex(
        (cs: any) => cs.id === sectionId
      );

      let updatedCustomSections;
      if (existingIndex >= 0) {
        updatedCustomSections = [...currentCustomSections];
        updatedCustomSections[existingIndex] = {
          ...updatedCustomSections[existingIndex],
          title: sectionTitleValue,
        };
      } else {
        updatedCustomSections = [
          ...currentCustomSections,
          {
            id: sectionId,
            title: sectionTitleValue,
            content: "",
          },
        ];
      }

      updateContent({
        customSections: updatedCustomSections,
      });
    }

    setEditingSectionTitle(null);
    setSectionTitleValue("");
    setHasChanges(true);
  };

  const addSection = (type: Section["type"]) => {
    // Convert type to readable title
    const titleMap: Record<Section["type"], string> = {
      personalInfo: "Personal Information",
      profileSummary: "Profile Summary",
      experience: "Professional Experience",
      education: "Education",
      skills: "Skills",
      projects: "Projects",
      achievements: "Achievements",
      languages: "Languages",
      certificates: "Certificates",
      interests: "Interests",
      courses: "Courses",
      awards: "Awards",
      organisations: "Organisations",
      publications: "Publications",
      references: "References",
      declaration: "Declaration",
      spacer: "Spacer",
      custom: "Custom Section",
    };

    const newSection: Section = {
      id: `${type}_${Date.now()}`,
      type,
      title: titleMap[type] || type.charAt(0).toUpperCase() + type.slice(1),
      visible: true,
      expanded: true,
    };
    setSections([...sections, newSection]);
    setHasChanges(true);
  };

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [layoutExpanded, setLayoutExpanded] = useState(true);

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedSection || draggedSection === targetId) {
      setDragOverId(null);
      return;
    }

    setDragOverId(targetId);

    const draggedIndex = sections.findIndex((s) => s.id === draggedSection);
    const targetIndex = sections.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    setSections(newSections);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverId(null);
    setHasChanges(true);
  };

  if (
    !mounted ||
    !isLoaded ||
    loading ||
    !resume ||
    !layout ||
    sections.length === 0
  ) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        suppressHydrationWarning
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" suppressHydrationWarning>
      {/* Top Header Bar */}
      <div className="bg-white border-b shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Back Button + Title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Link href="/dashboard/resumes">
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Input
                value={resume.title}
                onChange={(e) => {
                  setResume({ ...resume, title: e.target.value });
                  setHasChanges(true);
                }}
                className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent max-w-xs"
                placeholder="Resume Title"
              />
            </div>
            
            {/* Middle Section: ATS Score (Centered) */}
            <div className="flex items-center justify-center flex-1">
              {resume.atsScore !== undefined && resume.atsScore !== null && (
                <div
                  className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm flex items-center gap-2 ${
                    resume.atsScore >= 80
                      ? "bg-green-50 text-green-700 border-green-300"
                      : resume.atsScore >= 60
                      ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                      : "bg-red-50 text-red-700 border-red-300"
                  }`}
                >
                  <span>ATS Score:</span>
                  <span className="text-xl font-bold">{resume.atsScore}</span>
                  <span className="text-xs opacity-70">/100</span>
                </div>
              )}
            </div>
            
            {/* Right Section: Autosave Status + Buttons */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {/* Autosave Status */}
              {autoSaving && (
                <span className="text-sm text-gray-500 flex items-center">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Auto-saving...
                </span>
              )}
              {!autoSaving && lastSaved && !hasChanges && (
                <span className="text-sm text-gray-500">
                  Saved at {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}

              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges || autoSaving}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {hasChanges ? "Save Now" : "Saved"}
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                variant="outline"
                size="sm"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Side by Side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Edit Form */}
        <div className="w-1/2 border-r bg-white overflow-y-auto">
          {/* Toggle between Edit Resume and ATS Report */}
          <div className="border-b bg-gray-50">
            <div className="flex">
              <button
                onClick={() => setViewMode("edit")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  viewMode === "edit"
                    ? "bg-white text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Edit Resume
              </button>
              <button
                onClick={() => setViewMode("ats")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  viewMode === "ats"
                    ? "bg-white text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                ATS Report
              </button>
            </div>
          </div>

          {viewMode === "ats" ? (
            resume.atsFeedback ? (
              <ATSFeedback feedback={resume.atsFeedback} />
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>No ATS feedback available. Please calculate ATS score first.</p>
              </div>
            )
          ) : (
            <div className="p-6 space-y-4">
            {/* Layout Controls */}
            <Card className="border-2">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <Label className="text-sm font-semibold">Layout</Label>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setLayoutExpanded(!layoutExpanded)}
                >
                  {layoutExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {layoutExpanded && (
                <CardContent className="p-4 space-y-4">
                  {/* Column Type Selection */}
                  <div className="flex gap-2">
                    <Button
                      variant={layout.type === "single" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setLayout({ ...layout, type: "single" });
                        setHasChanges(true);
                      }}
                      className="flex-1"
                    >
                      Single Column
                    </Button>
                    <Button
                      variant={layout.type === "double" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setLayout({ ...layout, type: "double" });
                        setHasChanges(true);
                        // Redistribute sections evenly when switching to double column
                        const visibleSections = sections.filter(
                          (s) => s.visible
                        );
                        const hiddenSections = sections.filter(
                          (s) => !s.visible
                        );

                        // Alternate sections between columns
                        const reordered: Section[] = [];
                        for (let i = 0; i < visibleSections.length; i += 2) {
                          reordered.push(visibleSections[i]);
                          if (i + 1 < visibleSections.length) {
                            reordered.push(visibleSections[i + 1]);
                          }
                        }

                        setSections([...reordered, ...hiddenSections]);
                      }}
                      className="flex-1"
                    >
                      Double Column
                    </Button>
                  </div>

                  {/* Column Width Controls (only for double column) */}
                  {layout.type === "double" && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs text-gray-600">
                        Column Widths
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500">
                            Left: {layout.columnWidths.left}%
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                if (layout.columnWidths.left > 10) {
                                  const newLeft = layout.columnWidths.left - 5;
                                  setLayout({
                                    ...layout,
                                    columnWidths: {
                                      left: newLeft,
                                      right: 100 - newLeft,
                                    },
                                  });
                                  setHasChanges(true);
                                }
                              }}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="10"
                              max="90"
                              value={layout.columnWidths.left}
                              onChange={(e) => {
                                const value = Math.max(
                                  10,
                                  Math.min(90, Number(e.target.value))
                                );
                                setLayout({
                                  ...layout,
                                  columnWidths: {
                                    left: value,
                                    right: 100 - value,
                                  },
                                });
                                setHasChanges(true);
                              }}
                              className="w-16 h-7 text-center text-xs"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                if (layout.columnWidths.left < 90) {
                                  const newLeft = layout.columnWidths.left + 5;
                                  setLayout({
                                    ...layout,
                                    columnWidths: {
                                      left: newLeft,
                                      right: 100 - newLeft,
                                    },
                                  });
                                  setHasChanges(true);
                                }
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500">
                            Right: {layout.columnWidths.right}%
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                if (layout.columnWidths.right > 10) {
                                  const newRight =
                                    layout.columnWidths.right - 5;
                                  setLayout({
                                    ...layout,
                                    columnWidths: {
                                      left: 100 - newRight,
                                      right: newRight,
                                    },
                                  });
                                  setHasChanges(true);
                                }
                              }}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="10"
                              max="90"
                              value={layout.columnWidths.right}
                              onChange={(e) => {
                                const value = Math.max(
                                  10,
                                  Math.min(90, Number(e.target.value))
                                );
                                setLayout({
                                  ...layout,
                                  columnWidths: {
                                    left: 100 - value,
                                    right: value,
                                  },
                                });
                                setHasChanges(true);
                              }}
                              className="w-16 h-7 text-center text-xs"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                if (layout.columnWidths.right < 90) {
                                  const newRight =
                                    layout.columnWidths.right + 5;
                                  setLayout({
                                    ...layout,
                                    columnWidths: {
                                      left: 100 - newRight,
                                      right: newRight,
                                    },
                                  });
                                  setHasChanges(true);
                                }
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Padding Controls */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs text-gray-600 font-semibold">
                      Padding (mm)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Top</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newTop = Math.max(
                                0,
                                (layout.padding?.top || 5) - 1
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: newTop,
                                  bottom: layout.padding?.bottom || 5,
                                  left: layout.padding?.left || 8,
                                  right: layout.padding?.right || 8,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={layout.padding?.top || 5}
                            onChange={(e) => {
                              const value = Math.max(
                                0,
                                Math.min(50, Number(e.target.value))
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: value,
                                  bottom: layout.padding?.bottom || 5,
                                  left: layout.padding?.left || 8,
                                  right: layout.padding?.right || 8,
                                },
                              });
                              setHasChanges(true);
                            }}
                            className="w-14 h-7 text-center text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newTop = Math.min(
                                50,
                                (layout.padding?.top || 5) + 1
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: newTop,
                                  bottom: layout.padding?.bottom || 5,
                                  left: layout.padding?.left || 8,
                                  right: layout.padding?.right || 8,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Bottom</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newBottom = Math.max(
                                0,
                                (layout.padding?.bottom || 5) - 1
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: newBottom,
                                  left: layout.padding?.left || 20,
                                  right: layout.padding?.right || 20,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={layout.padding?.bottom || 5}
                            onChange={(e) => {
                              const value = Math.max(
                                0,
                                Math.min(50, Number(e.target.value))
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: value,
                                  left: layout.padding?.left || 20,
                                  right: layout.padding?.right || 20,
                                },
                              });
                              setHasChanges(true);
                            }}
                            className="w-14 h-7 text-center text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newBottom = Math.min(
                                50,
                                (layout.padding?.bottom || 5) + 1
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: newBottom,
                                  left: layout.padding?.left || 20,
                                  right: layout.padding?.right || 20,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Left</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newLeft = Math.max(
                                0,
                                (layout.padding?.left || 20) - 5
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: layout.padding?.bottom || 20,
                                  left: newLeft,
                                  right: layout.padding?.right || 20,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={layout.padding?.left || 20}
                            onChange={(e) => {
                              const value = Math.max(
                                0,
                                Math.min(50, Number(e.target.value))
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: layout.padding?.bottom || 20,
                                  left: value,
                                  right: layout.padding?.right || 20,
                                },
                              });
                              setHasChanges(true);
                            }}
                            className="w-14 h-7 text-center text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newLeft = Math.min(
                                50,
                                (layout.padding?.left || 20) + 5
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: layout.padding?.bottom || 20,
                                  left: newLeft,
                                  right: layout.padding?.right || 20,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Right</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newRight = Math.max(
                                0,
                                (layout.padding?.right || 20) - 5
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: layout.padding?.bottom || 20,
                                  left: layout.padding?.left || 20,
                                  right: newRight,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={layout.padding?.right || 20}
                            onChange={(e) => {
                              const value = Math.max(
                                0,
                                Math.min(50, Number(e.target.value))
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: layout.padding?.bottom || 20,
                                  left: layout.padding?.left || 20,
                                  right: value,
                                },
                              });
                              setHasChanges(true);
                            }}
                            className="w-14 h-7 text-center text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newRight = Math.min(
                                50,
                                (layout.padding?.right || 20) + 5
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: layout.padding?.top || 20,
                                  bottom: layout.padding?.bottom || 20,
                                  left: layout.padding?.left || 20,
                                  right: newRight,
                                },
                              });
                              setHasChanges(true);
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
            {/* Render sections in order from sections array */}
            {sections
              .filter((s) => s.visible)
              .map((section) => {
                // Personal Information Section - Compact view with expandable edit
                if (section.type === "personalInfo") {
                  const personalInfo = resume.content.personalInfo;

                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      style={{
                        cursor: "move",
                        opacity: draggedSection === section.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          <h3 className="font-semibold text-sm flex-1">
                            {section.title}
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditingPersonalInfo(!editingPersonalInfo)
                            }
                            className="h-7 text-xs"
                          >
                            {editingPersonalInfo ? "Done" : "Edit"}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Compact View (when not editing) */}
                      {!editingPersonalInfo && (
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">
                                {personalInfo.fullName || "Your Name"}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3">
                                {personalInfo.portfolio || "Your Title"}
                              </p>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                {personalInfo.email && (
                                  <span>{personalInfo.email}</span>
                                )}
                                {personalInfo.phone && (
                                  <span>{personalInfo.phone}</span>
                                )}
                                {personalInfo.location && (
                                  <span>{personalInfo.location}</span>
                                )}
                                {personalInfo.github && (
                                  <span>{personalInfo.github}</span>
                                )}
                                {personalInfo.linkedin && (
                                  <span>{personalInfo.linkedin}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}

                      {/* Expanded Edit View */}
                      {editingPersonalInfo && (
                        <CardContent className="p-4 space-y-4">
                          {/* Profile Picture Upload */}
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {personalInfo.profilePicture ? (
                                <img
                                  src={personalInfo.profilePicture}
                                  alt="Profile"
                                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                                  <span className="text-3xl">👤</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs mb-2 block">
                                Profile Picture
                              </Label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !resume) return;

                                  try {
                                    const formData = new FormData();
                                    formData.append("file", file);

                                    const response = await apiClient.post<{
                                      success: boolean;
                                      message: string;
                                      data: { profilePictureUrl: string };
                                    }>(
                                      `/resumes/${resume.resumeId}/profile-picture`,
                                      formData,
                                      {
                                        headers: {
                                          "Content-Type": "multipart/form-data",
                                        },
                                      }
                                    );

                                    if (
                                      response.data.success &&
                                      response.data.data?.profilePictureUrl
                                    ) {
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          profilePicture:
                                            response.data.data
                                              .profilePictureUrl,
                                        },
                                      });
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error uploading profile picture:",
                                      error
                                    );
                                    alert(
                                      "Failed to upload profile picture. Please try again."
                                    );
                                  }
                                }}
                                className="text-xs"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Upload a professional headshot (JPG, PNG)
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fullName" className="text-xs">
                                Full Name *
                              </Label>
                              <Input
                                id="fullName"
                                value={personalInfo.fullName || ""}
                                onChange={(e) =>
                                  updateContent({
                                    personalInfo: {
                                      ...personalInfo,
                                      fullName: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="portfolio" className="text-xs">
                                Professional Title
                              </Label>
                              <Input
                                id="portfolio"
                                value={personalInfo.portfolio || ""}
                                onChange={(e) =>
                                  updateContent({
                                    personalInfo: {
                                      ...personalInfo,
                                      portfolio: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email" className="text-xs">
                                Email *
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={personalInfo.email || ""}
                                onChange={(e) =>
                                  updateContent({
                                    personalInfo: {
                                      ...personalInfo,
                                      email: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone" className="text-xs">
                                Phone
                              </Label>
                              <Input
                                id="phone"
                                value={personalInfo.phone || ""}
                                onChange={(e) =>
                                  updateContent({
                                    personalInfo: {
                                      ...personalInfo,
                                      phone: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location" className="text-xs">
                                Location
                              </Label>
                              <Input
                                id="location"
                                value={personalInfo.location || ""}
                                onChange={(e) =>
                                  updateContent({
                                    personalInfo: {
                                      ...personalInfo,
                                      location: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="github" className="text-xs">
                                GitHub
                              </Label>
                              <Input
                                id="github"
                                value={personalInfo.github || ""}
                                onChange={(e) =>
                                  updateContent({
                                    personalInfo: {
                                      ...personalInfo,
                                      github: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="linkedin" className="text-xs">
                                LinkedIn
                              </Label>
                              <Input
                                id="linkedin"
                                value={personalInfo.linkedin || ""}
                                onChange={(e) =>
                                  updateContent({
                                    personalInfo: {
                                      ...personalInfo,
                                      linkedin: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                          </div>

                          {/* Additional Personal Information */}
                          <div className="pt-4 border-t">
                            <Label className="text-xs font-semibold mb-2 block">
                              Personal Information
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {!personalInfo.dateOfBirth && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        dateOfBirth: "",
                                      },
                                    })
                                  }
                                >
                                  + Date of Birth
                                </Button>
                              )}
                              {!personalInfo.nationality && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        nationality: "",
                                      },
                                    })
                                  }
                                >
                                  + Nationality
                                </Button>
                              )}
                              {!personalInfo.passport && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        passport: "",
                                      },
                                    })
                                  }
                                >
                                  + Passport or Id
                                </Button>
                              )}
                              {!personalInfo.maritalStatus && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        maritalStatus: "",
                                      },
                                    })
                                  }
                                >
                                  + Marital status
                                </Button>
                              )}
                              {!personalInfo.militaryService && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        militaryService: "",
                                      },
                                    })
                                  }
                                >
                                  + Military Service
                                </Button>
                              )}
                              {!personalInfo.drivingLicense && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        drivingLicense: "",
                                      },
                                    })
                                  }
                                >
                                  + Driving License
                                </Button>
                              )}
                              {!personalInfo.gender && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        gender: "",
                                      },
                                    })
                                  }
                                >
                                  + Gender/Pronoun
                                </Button>
                              )}
                              {!personalInfo.disability && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        disability: "",
                                      },
                                    })
                                  }
                                >
                                  + Disability
                                </Button>
                              )}
                              {!personalInfo.visa && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        visa: "",
                                      },
                                    })
                                  }
                                >
                                  + Visa
                                </Button>
                              )}
                            </div>

                            {/* Show fields that have been added */}
                            <div className="mt-3 space-y-2">
                              {personalInfo.dateOfBirth !== undefined && (
                                <div>
                                  <Label className="text-xs">
                                    Date of Birth
                                  </Label>
                                  <Input
                                    value={personalInfo.dateOfBirth || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          dateOfBirth: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                    type="date"
                                  />
                                </div>
                              )}
                              {personalInfo.nationality !== undefined && (
                                <div>
                                  <Label className="text-xs">Nationality</Label>
                                  <Input
                                    value={personalInfo.nationality || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          nationality: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.passport !== undefined && (
                                <div>
                                  <Label className="text-xs">
                                    Passport or Id
                                  </Label>
                                  <Input
                                    value={personalInfo.passport || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          passport: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.maritalStatus !== undefined && (
                                <div>
                                  <Label className="text-xs">
                                    Marital Status
                                  </Label>
                                  <Input
                                    value={personalInfo.maritalStatus || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          maritalStatus: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.militaryService !== undefined && (
                                <div>
                                  <Label className="text-xs">
                                    Military Service
                                  </Label>
                                  <Input
                                    value={personalInfo.militaryService || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          militaryService: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.drivingLicense !== undefined && (
                                <div>
                                  <Label className="text-xs">
                                    Driving License
                                  </Label>
                                  <Input
                                    value={personalInfo.drivingLicense || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          drivingLicense: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.gender !== undefined && (
                                <div>
                                  <Label className="text-xs">
                                    Gender/Pronoun
                                  </Label>
                                  <Input
                                    value={personalInfo.gender || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          gender: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.disability !== undefined && (
                                <div>
                                  <Label className="text-xs">Disability</Label>
                                  <Input
                                    value={personalInfo.disability || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          disability: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.visa !== undefined && (
                                <div>
                                  <Label className="text-xs">Visa</Label>
                                  <Input
                                    value={personalInfo.visa || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          visa: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional Links */}
                          <div className="pt-4 border-t">
                            <Label className="text-xs font-semibold mb-2 block">
                              Links
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {!personalInfo.website && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        website: "",
                                      },
                                    })
                                  }
                                >
                                  + Website
                                </Button>
                              )}
                              {!personalInfo.medium && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        medium: "",
                                      },
                                    })
                                  }
                                >
                                  + Medium
                                </Button>
                              )}
                              {!personalInfo.orcid && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        orcid: "",
                                      },
                                    })
                                  }
                                >
                                  + ORCID
                                </Button>
                              )}
                              {!personalInfo.skype && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        skype: "",
                                      },
                                    })
                                  }
                                >
                                  + Skype
                                </Button>
                              )}
                              {!personalInfo.bluesky && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        bluesky: "",
                                      },
                                    })
                                  }
                                >
                                  + Bluesky
                                </Button>
                              )}
                              {!personalInfo.threads && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        threads: "",
                                      },
                                    })
                                  }
                                >
                                  + Threads
                                </Button>
                              )}
                              {!personalInfo.x && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        x: "",
                                      },
                                    })
                                  }
                                >
                                  + X
                                </Button>
                              )}
                            </div>

                            {/* Show link fields that have been added */}
                            <div className="mt-3 space-y-2">
                              {personalInfo.website !== undefined && (
                                <div>
                                  <Label className="text-xs">Website</Label>
                                  <Input
                                    value={personalInfo.website || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          website: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.medium !== undefined && (
                                <div>
                                  <Label className="text-xs">Medium</Label>
                                  <Input
                                    value={personalInfo.medium || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          medium: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.orcid !== undefined && (
                                <div>
                                  <Label className="text-xs">ORCID</Label>
                                  <Input
                                    value={personalInfo.orcid || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          orcid: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.skype !== undefined && (
                                <div>
                                  <Label className="text-xs">Skype</Label>
                                  <Input
                                    value={personalInfo.skype || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          skype: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.bluesky !== undefined && (
                                <div>
                                  <Label className="text-xs">Bluesky</Label>
                                  <Input
                                    value={personalInfo.bluesky || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          bluesky: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.threads !== undefined && (
                                <div>
                                  <Label className="text-xs">Threads</Label>
                                  <Input
                                    value={personalInfo.threads || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          threads: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                              {personalInfo.x !== undefined && (
                                <div>
                                  <Label className="text-xs">X</Label>
                                  <Input
                                    value={personalInfo.x || ""}
                                    onChange={(e) =>
                                      updateContent({
                                        personalInfo: {
                                          ...personalInfo,
                                          x: e.target.value,
                                        },
                                      })
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Profile Summary Section (separate from personalInfo)
                if (section.type === "profileSummary") {
                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      style={{
                        cursor: "move",
                        opacity: draggedSection === section.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4">
                          <Label htmlFor="profileSummary" className="text-xs">
                            Profile Summary
                          </Label>
                          <RichTextEditor
                            value={resume.profileSummary || ""}
                            onChange={(html) => {
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      profileSummary: html,
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            placeholder="Write a brief professional summary that highlights your experience, skills, and career goals..."
                            className="mt-1"
                          />
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Experience Section
                if (section.type === "experience") {
                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      style={{
                        cursor: "move",
                        opacity: draggedSection === section.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              updateContent({
                                experience: [
                                  ...resume.content.experience,
                                  {
                                    id: nanoid(),
                                    company: "",
                                    position: "",
                                    startDate: "",
                                    current: false,
                                    description: [""],
                                  },
                                ],
                              });
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Experience
                          </Button>
                          {resume.content.experience.map((exp, index) => (
                            <div
                              key={exp.id || index}
                              className="p-3 border rounded-lg space-y-3"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Position *</Label>
                                  <Input
                                    value={exp.position}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.experience,
                                      ];
                                      updated[index] = {
                                        ...exp,
                                        position: e.target.value,
                                      };
                                      updateContent({ experience: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Company *</Label>
                                  <Input
                                    value={exp.company}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.experience,
                                      ];
                                      updated[index] = {
                                        ...exp,
                                        company: e.target.value,
                                      };
                                      updateContent({ experience: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Start Date</Label>
                                  <Input
                                    value={exp.startDate}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.experience,
                                      ];
                                      updated[index] = {
                                        ...exp,
                                        startDate: e.target.value,
                                      };
                                      updateContent({ experience: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    placeholder="MM/YYYY"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">End Date</Label>
                                  <Input
                                    value={exp.endDate || ""}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.experience,
                                      ];
                                      updated[index] = {
                                        ...exp,
                                        endDate: e.target.value,
                                        current: !e.target.value,
                                      };
                                      updateContent({ experience: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    placeholder="MM/YYYY or leave blank"
                                    disabled={exp.current}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Description</Label>
                                <RichTextEditor
                                  value={
                                    typeof exp.description === "string"
                                      ? exp.description
                                      : Array.isArray(exp.description)
                                      ? exp.description
                                          .map((d) => `<p>${d}</p>`)
                                          .join("")
                                      : ""
                                  }
                                  onChange={(html) => {
                                    const updated = [
                                      ...resume.content.experience,
                                    ];
                                    updated[index] = {
                                      ...exp,
                                      description: html,
                                    };
                                    updateContent({ experience: updated });
                                  }}
                                  placeholder="Enter job description with formatting..."
                                  className="mt-1"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated =
                                    resume.content.experience.filter(
                                      (_, i) => i !== index
                                    );
                                  updateContent({ experience: updated });
                                }}
                                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Education Section
                if (section.type === "education") {
                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      style={{
                        cursor: "move",
                        opacity: draggedSection === section.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              updateContent({
                                education: [
                                  ...resume.content.education,
                                  {
                                    id: nanoid(),
                                    institution: "",
                                    degree: "",
                                    startDate: "",
                                  },
                                ],
                              });
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Education
                          </Button>
                          {resume.content.education.map((edu, index) => (
                            <div
                              key={edu.id || index}
                              className="p-3 border rounded-lg space-y-3"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Degree *</Label>
                                  <Input
                                    value={edu.degree}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.education,
                                      ];
                                      updated[index] = {
                                        ...edu,
                                        degree: e.target.value,
                                      };
                                      updateContent({ education: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Institution *
                                  </Label>
                                  <Input
                                    value={edu.institution}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.education,
                                      ];
                                      updated[index] = {
                                        ...edu,
                                        institution: e.target.value,
                                      };
                                      updateContent({ education: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Start Date</Label>
                                  <Input
                                    value={edu.startDate}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.education,
                                      ];
                                      updated[index] = {
                                        ...edu,
                                        startDate: e.target.value,
                                      };
                                      updateContent({ education: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    placeholder="MM/YYYY"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">End Date</Label>
                                  <Input
                                    value={edu.endDate || ""}
                                    onChange={(e) => {
                                      const updated = [
                                        ...resume.content.education,
                                      ];
                                      updated[index] = {
                                        ...edu,
                                        endDate: e.target.value,
                                      };
                                      updateContent({ education: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    placeholder="MM/YYYY"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated =
                                    resume.content.education.filter(
                                      (_, i) => i !== index
                                    );
                                  updateContent({ education: updated });
                                }}
                                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Skills Section
                if (section.type === "skills") {
                  // Check if it's Executive template (uses new structure with items array)
                  const isExecutiveTemplate = resume.templateId === "executive";

                  // Get skills based on structure
                  let skillsData: any = null;
                  if (isExecutiveTemplate) {
                    // For Executive: Get from sections array or initialize
                    const skillsSection = (
                      resume.content as any
                    ).sections?.find((s: any) => s.type === "skills");
                    skillsData = skillsSection?.items || [];
                  } else {
                    // For other templates: Get from new single skills field (with backward compatibility)
                    const skillsField = resume.content.skills;
                    if (typeof skillsField === "string") {
                      skillsData = skillsField;
                    } else if (Array.isArray(skillsField)) {
                      skillsData = skillsField.join(", ");
                    } else if (typeof skillsField === "object" && skillsField !== null) {
                      // Old structure: backward compatibility - merge technical and soft
                      const oldSkills = skillsField as any;
                      const technicalSkills = oldSkills.technical;
                      const softSkills = oldSkills.soft;
                      const combined: string[] = [];
                      
                      if (technicalSkills) {
                        if (Array.isArray(technicalSkills)) {
                          combined.push(...technicalSkills);
                        } else if (typeof technicalSkills === "string") {
                          combined.push(technicalSkills);
                        }
                      }
                      
                      if (softSkills) {
                        if (Array.isArray(softSkills)) {
                          combined.push(...softSkills);
                        } else if (typeof softSkills === "string") {
                          combined.push(softSkills);
                        }
                      }
                      
                      skillsData = combined.join(", ");
                    } else {
                      skillsData = "";
                    }
                  }

                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      style={{
                        cursor: "move",
                        opacity: draggedSection === section.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          {isExecutiveTemplate ? (
                            // Executive Template: Skill items with ratings
                            <ExecutiveSkills
                              skills={skillsData}
                              onChange={(updatedSkills) => {
                                // Update or create sections array
                                const currentContent = resume.content as any;
                                const sections = currentContent.sections || [];
                                const skillsSectionIndex = sections.findIndex(
                                  (s: any) => s.type === "skills"
                                );

                                let updatedSections;
                                if (skillsSectionIndex >= 0) {
                                  // Update existing section
                                  updatedSections = [...sections];
                                  updatedSections[skillsSectionIndex] = {
                                    ...updatedSections[skillsSectionIndex],
                                    items: updatedSkills,
                                  };
                                } else {
                                  // Create new section
                                  updatedSections = [
                                    ...sections,
                                    {
                                      type: "skills",
                                      title: section.title,
                                      items: updatedSkills,
                                    },
                                  ];
                                }

                                updateContent({
                                  ...currentContent,
                                  sections: updatedSections,
                                });
                              }}
                            />
                          ) : (
                            // Other Templates: Rich text editor
                            <div>
                              <RichTextEditor
                                value={skillsData}
                                onChange={(html) =>
                                  updateContent({
                                    skills: html, // New structure: single skills field
                                  })
                                }
                                placeholder="List your skills..."
                                className="mt-1"
                              />
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Projects Section
                if (section.type === "projects") {
                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      style={{
                        cursor: "move",
                        opacity: draggedSection === section.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              updateContent({
                                projects: [
                                  ...(resume.content.projects || []),
                                  {
                                    id: nanoid(),
                                    name: "",
                                    description: "",
                                    technologies: [],
                                  },
                                ],
                              });
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Project
                          </Button>
                          {(resume.content.projects || []).map(
                            (project, index) => (
                              <div
                                key={project.id || index}
                                className="p-3 border rounded-lg space-y-3"
                              >
                                <div>
                                  <Label className="text-xs">
                                    Project Name *
                                  </Label>
                                  <Input
                                    value={project.name}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(resume.content.projects || []),
                                      ];
                                      updated[index] = {
                                        ...project,
                                        name: e.target.value,
                                      };
                                      updateContent({ projects: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Description</Label>
                                  <RichTextEditor
                                    value={project.description || ""}
                                    onChange={(html) => {
                                      const updated = [
                                        ...(resume.content.projects || []),
                                      ];
                                      updated[index] = {
                                        ...project,
                                        description: html,
                                      };
                                      updateContent({ projects: updated });
                                    }}
                                    placeholder="Enter project description with formatting..."
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Technologies (comma-separated)
                                  </Label>
                                  <Input
                                    value={project.technologies.join(", ")}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(resume.content.projects || []),
                                      ];
                                      updated[index] = {
                                        ...project,
                                        technologies: e.target.value
                                          .split(",")
                                          .map((t) => t.trim())
                                          .filter((t) => t),
                                      };
                                      updateContent({ projects: updated });
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    placeholder="React, Node.js..."
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updated = (
                                      resume.content.projects || []
                                    ).filter((_, i) => i !== index);
                                    updateContent({ projects: updated });
                                  }}
                                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            )
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Certificates Section
                if (section.type === "certificates") {
                  return (
                    <Card
                      key={section.id}
                      className="border transition-all"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-3">
                          {(resume.content.certificates || []).map(
                            (cert, index) => {
                              const today = new Date()
                                .toISOString()
                                .slice(0, 7); // YYYY-MM format
                              return (
                                <div
                                  key={cert.id}
                                  className="border p-3 rounded-md bg-gray-50"
                                >
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs">
                                        Certificate Title *
                                      </Label>
                                      <Input
                                        value={cert.title}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.certificates ||
                                              []),
                                          ];
                                          updated[index] = {
                                            ...cert,
                                            title: e.target.value,
                                          };
                                          setResume((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  content: {
                                                    ...prev.content,
                                                    certificates: updated,
                                                  },
                                                }
                                              : null
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="AWS Certified Solutions Architect"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Issuer *
                                      </Label>
                                      <Input
                                        value={cert.issuer}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.certificates ||
                                              []),
                                          ];
                                          updated[index] = {
                                            ...cert,
                                            issuer: e.target.value,
                                          };
                                          setResume((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  content: {
                                                    ...prev.content,
                                                    certificates: updated,
                                                  },
                                                }
                                              : null
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="Amazon Web Services"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Issue Date
                                      </Label>
                                      <Input
                                        value={cert.issueDate || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.certificates ||
                                              []),
                                          ];
                                          updated[index] = {
                                            ...cert,
                                            issueDate: e.target.value,
                                          };
                                          setResume((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  content: {
                                                    ...prev.content,
                                                    certificates: updated,
                                                  },
                                                }
                                              : null
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        type="month"
                                        max={today}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Expiry Date (Optional)
                                      </Label>
                                      <Input
                                        value={cert.expiryDate || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.certificates ||
                                              []),
                                          ];
                                          updated[index] = {
                                            ...cert,
                                            expiryDate: e.target.value,
                                          };
                                          setResume((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  content: {
                                                    ...prev.content,
                                                    certificates: updated,
                                                  },
                                                }
                                              : null
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        type="month"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Certificate ID (Optional)
                                      </Label>
                                      <Input
                                        value={cert.certificateId || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.certificates ||
                                              []),
                                          ];
                                          updated[index] = {
                                            ...cert,
                                            certificateId: e.target.value,
                                          };
                                          setResume((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  content: {
                                                    ...prev.content,
                                                    certificates: updated,
                                                  },
                                                }
                                              : null
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="e.g., AWS-ASA-123456"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Certificate Link (Optional)
                                      </Label>
                                      <Input
                                        value={cert.link || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.certificates ||
                                              []),
                                          ];
                                          updated[index] = {
                                            ...cert,
                                            link: e.target.value,
                                          };
                                          setResume((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  content: {
                                                    ...prev.content,
                                                    certificates: updated,
                                                  },
                                                }
                                              : null
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        type="url"
                                        placeholder="https://..."
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setResume((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              content: {
                                                ...prev.content,
                                                certificates:
                                                  prev.content.certificates?.filter(
                                                    (_, i) => i !== index
                                                  ) || [],
                                              },
                                            }
                                          : null
                                      );
                                      setHasChanges(true);
                                    }}
                                    className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </Button>
                                </div>
                              );
                            }
                          )}
                          <Button
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      content: {
                                        ...prev.content,
                                        certificates: [
                                          ...(prev.content.certificates || []),
                                          {
                                            id: nanoid(),
                                            title: "",
                                            issuer: "",
                                            issueDate: "",
                                            expiryDate: "",
                                            certificateId: "",
                                            link: "",
                                          },
                                        ],
                                      },
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Certificate
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Interests Section
                if (section.type === "interests") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4">
                          <Label className="text-xs">Interests</Label>
                          <RichTextEditor
                            value={resume.content.interests || ""}
                            onChange={(html) => {
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      content: {
                                        ...prev.content,
                                        interests: html,
                                      },
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            placeholder="List your interests..."
                            className="mt-1"
                          />
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Custom Section - with rich text editor
                if (section.type === "custom") {
                  const customSectionData = resume.content.customSections?.find(
                    (cs: any) => cs.id === section.id
                  );
                  const customContent = customSectionData?.content || "";

                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, section.id)}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          <RichTextEditor
                            value={customContent}
                            onChange={(html) => {
                              const currentCustomSections =
                                resume.content.customSections || [];
                              const existingIndex = currentCustomSections.findIndex(
                                (cs: any) => cs.id === section.id
                              );

                              let updatedCustomSections;
                              if (existingIndex >= 0) {
                                updatedCustomSections = [...currentCustomSections];
                                updatedCustomSections[existingIndex] = {
                                  ...updatedCustomSections[existingIndex],
                                  content: html,
                                };
                              } else {
                                updatedCustomSections = [
                                  ...currentCustomSections,
                                  {
                                    id: section.id,
                                    title: section.title,
                                    content: html,
                                  },
                                ];
                              }

                              updateContent({
                                customSections: updatedCustomSections,
                              });
                            }}
                            placeholder="Add your custom content here..."
                            className="mt-1"
                          />
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Spacer Section - for column alignment and even distribution
                if (section.type === "spacer") {
                  return (
                    <Card
                      key={section.id}
                      className={`border transition-all ${
                        dragOverId === section.id &&
                        draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, section.id)}
                    >
                      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          <h3 className="font-semibold text-sm text-gray-500">
                            {section.title}
                          </h3>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => toggleSection(section.id)}
                        >
                          {section.expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteSection(section.id)}
                          title="Delete Section"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-2">
                          <div className="text-xs text-gray-500 text-center py-1">
                            <p>Spacer for column alignment (5px margin)</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Use this to evenly distribute sections in columns
                            </p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Declaration Section
                if (section.type === "declaration") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4">
                          <Label className="text-xs">Declaration</Label>
                          <RichTextEditor
                            value={resume.content.declaration || ""}
                            onChange={(html) => {
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      content: {
                                        ...prev.content,
                                        declaration: html,
                                      },
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            placeholder="I hereby declare that..."
                            className="mt-1"
                          />
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Languages Section
                if (section.type === "languages") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4">
                          <LanguagesEditor
                            languages={
                              Array.isArray(resume.content.languages)
                                ? resume.content.languages.map((lang: any) => ({
                                    id:
                                      lang.id ||
                                      `lang-${Date.now()}-${Math.random()}`,
                                    name: lang.name || "",
                                    proficiency:
                                      typeof lang.proficiency === "number"
                                        ? lang.proficiency
                                        : typeof lang.level === "number"
                                        ? lang.level
                                        : undefined, // No default proficiency
                                  }))
                                : []
                            }
                            onChange={(updatedLanguages) => {
                              updateContent({ languages: updatedLanguages });
                            }}
                          />
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Awards Section
                if (section.type === "awards") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-3">
                          {(resume.content.awards || []).map((award, index) => (
                            <div
                              key={award.id}
                              className="border p-3 rounded-md bg-gray-50"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <Label className="text-xs">
                                    Award Title *
                                  </Label>
                                  <Input
                                    value={award.title}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(resume.content.awards || []),
                                      ];
                                      updated[index] = {
                                        ...award,
                                        title: e.target.value,
                                      };
                                      setResume((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              content: {
                                                ...prev.content,
                                                awards: updated,
                                              },
                                            }
                                          : null
                                      );
                                      setHasChanges(true);
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    placeholder="Employee of the Year"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Issuer *</Label>
                                  <Input
                                    value={award.issuer}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(resume.content.awards || []),
                                      ];
                                      updated[index] = {
                                        ...award,
                                        issuer: e.target.value,
                                      };
                                      setResume((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              content: {
                                                ...prev.content,
                                                awards: updated,
                                              },
                                            }
                                          : null
                                      );
                                      setHasChanges(true);
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    placeholder="Company Name"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Date</Label>
                                  <Input
                                    value={award.date || ""}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(resume.content.awards || []),
                                      ];
                                      updated[index] = {
                                        ...award,
                                        date: e.target.value,
                                      };
                                      setResume((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              content: {
                                                ...prev.content,
                                                awards: updated,
                                              },
                                            }
                                          : null
                                      );
                                      setHasChanges(true);
                                    }}
                                    className="mt-1 h-9 text-sm"
                                    type="month"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs">
                                    Description (Optional)
                                  </Label>
                                  <RichTextEditor
                                    value={award.description || ""}
                                    onChange={(html) => {
                                      const updated = [
                                        ...(resume.content.awards || []),
                                      ];
                                      updated[index] = {
                                        ...award,
                                        description: html,
                                      };
                                      setResume((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              content: {
                                                ...prev.content,
                                                awards: updated,
                                              },
                                            }
                                          : null
                                      );
                                      setHasChanges(true);
                                    }}
                                    className="mt-1"
                                    placeholder="Brief description..."
                                  />
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setResume((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          content: {
                                            ...prev.content,
                                            awards:
                                              prev.content.awards?.filter(
                                                (_, i) => i !== index
                                              ) || [],
                                          },
                                        }
                                      : null
                                  );
                                  setHasChanges(true);
                                }}
                                className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      content: {
                                        ...prev.content,
                                        awards: [
                                          ...(prev.content.awards || []),
                                          {
                                            id: nanoid(),
                                            title: "",
                                            issuer: "",
                                            date: "",
                                            description: "",
                                          },
                                        ],
                                      },
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Award
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // References Section
                if (section.type === "references") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-3">
                          {(resume.content.references || []).map(
                            (ref, index) => (
                              <div
                                key={ref.id}
                                className="border p-3 rounded-md bg-gray-50"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="col-span-2">
                                    <Label className="text-xs">Name *</Label>
                                    <Input
                                      value={ref.name}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(resume.content.references || []),
                                        ];
                                        updated[index] = {
                                          ...ref,
                                          name: e.target.value,
                                        };
                                        setResume((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                content: {
                                                  ...prev.content,
                                                  references: updated,
                                                },
                                              }
                                            : null
                                        );
                                        setHasChanges(true);
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      placeholder="John Smith"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Position *
                                    </Label>
                                    <Input
                                      value={ref.position}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(resume.content.references || []),
                                        ];
                                        updated[index] = {
                                          ...ref,
                                          position: e.target.value,
                                        };
                                        setResume((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                content: {
                                                  ...prev.content,
                                                  references: updated,
                                                },
                                              }
                                            : null
                                        );
                                        setHasChanges(true);
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      placeholder="Engineering Manager"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Company *</Label>
                                    <Input
                                      value={ref.company}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(resume.content.references || []),
                                        ];
                                        updated[index] = {
                                          ...ref,
                                          company: e.target.value,
                                        };
                                        setResume((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                content: {
                                                  ...prev.content,
                                                  references: updated,
                                                },
                                              }
                                            : null
                                        );
                                        setHasChanges(true);
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      placeholder="Company Name"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Email</Label>
                                    <Input
                                      value={ref.email || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(resume.content.references || []),
                                        ];
                                        updated[index] = {
                                          ...ref,
                                          email: e.target.value,
                                        };
                                        setResume((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                content: {
                                                  ...prev.content,
                                                  references: updated,
                                                },
                                              }
                                            : null
                                        );
                                        setHasChanges(true);
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      type="email"
                                      placeholder="email@example.com"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Phone</Label>
                                    <Input
                                      value={ref.phone || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(resume.content.references || []),
                                        ];
                                        updated[index] = {
                                          ...ref,
                                          phone: e.target.value,
                                        };
                                        setResume((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                content: {
                                                  ...prev.content,
                                                  references: updated,
                                                },
                                              }
                                            : null
                                        );
                                        setHasChanges(true);
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      type="tel"
                                      placeholder="+1 (555) 123-4567"
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setResume((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            content: {
                                              ...prev.content,
                                              references:
                                                prev.content.references?.filter(
                                                  (_, i) => i !== index
                                                ) || [],
                                            },
                                          }
                                        : null
                                    );
                                    setHasChanges(true);
                                  }}
                                  className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            )
                          )}
                          <Button
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      content: {
                                        ...prev.content,
                                        references: [
                                          ...(prev.content.references || []),
                                          {
                                            id: nanoid(),
                                            name: "",
                                            position: "",
                                            company: "",
                                            email: "",
                                            phone: "",
                                          },
                                        ],
                                      },
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Reference
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Courses Section
                if (section.type === "courses") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              const newCourse = {
                                id: nanoid(),
                                name: "",
                                institution: "",
                                date: "",
                                description: "",
                              };
                              updateContent({
                                courses: [
                                  ...(resume.content.courses || []),
                                  newCourse,
                                ],
                              });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Course
                          </Button>
                          {(resume.content.courses || []).map(
                            (course: any, index: number) => (
                              <div
                                key={course.id}
                                className="border rounded p-3 space-y-2"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-sm">
                                    Course {index + 1}
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const updatedCourses =
                                        resume.content.courses?.filter(
                                          (c: any) => c.id !== course.id
                                        );
                                      updateContent({
                                        courses: updatedCourses,
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">
                                      Course Name
                                    </Label>
                                    <Input
                                      value={course.name || ""}
                                      onChange={(e) => {
                                        const updatedCourses =
                                          resume.content.courses?.map(
                                            (c: any) =>
                                              c.id === course.id
                                                ? { ...c, name: e.target.value }
                                                : c
                                          );
                                        updateContent({
                                          courses: updatedCourses,
                                        });
                                      }}
                                      placeholder="e.g., AWS Solutions Architect"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Institution
                                    </Label>
                                    <Input
                                      value={course.institution || ""}
                                      onChange={(e) => {
                                        const updatedCourses =
                                          resume.content.courses?.map(
                                            (c: any) =>
                                              c.id === course.id
                                                ? {
                                                    ...c,
                                                    institution: e.target.value,
                                                  }
                                                : c
                                          );
                                        updateContent({
                                          courses: updatedCourses,
                                        });
                                      }}
                                      placeholder="e.g., Amazon Web Services"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Date</Label>
                                  <Input
                                    value={course.date || ""}
                                    onChange={(e) => {
                                      const updatedCourses =
                                        resume.content.courses?.map((c: any) =>
                                          c.id === course.id
                                            ? { ...c, date: e.target.value }
                                            : c
                                        );
                                      updateContent({
                                        courses: updatedCourses,
                                      });
                                    }}
                                    placeholder="e.g., 2023"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Description (Optional)
                                  </Label>
                                  <RichTextEditor
                                    value={course.description || ""}
                                    onChange={(html) => {
                                      const updatedCourses =
                                        resume.content.courses?.map((c: any) =>
                                          c.id === course.id
                                            ? {
                                                ...c,
                                                description: html,
                                              }
                                            : c
                                        );
                                      updateContent({
                                        courses: updatedCourses,
                                      });
                                    }}
                                    placeholder="Brief description of the course..."
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Organizations Section
                if (section.type === "organisations") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              const newOrganisation = {
                                id: nanoid(),
                                name: "",
                                role: "",
                                startDate: "",
                                endDate: "",
                                description: "",
                              };
                              updateContent({
                                organisations: [
                                  ...(resume.content.organisations || []),
                                  newOrganisation,
                                ],
                              });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Organisation
                          </Button>
                          {(resume.content.organisations || []).map(
                            (org: any, index: number) => (
                              <div
                                key={org.id}
                                className="border rounded p-3 space-y-2"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-sm">
                                    Organisation {index + 1}
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const updatedOrganisations =
                                        resume.content.organisations?.filter(
                                          (o: any) => o.id !== org.id
                                        );
                                      updateContent({
                                        organisations: updatedOrganisations,
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">
                                      Organisation Name
                                    </Label>
                                    <Input
                                      value={org.name || ""}
                                      onChange={(e) => {
                                        const updatedOrganisations =
                                          resume.content.organisations?.map(
                                            (o: any) =>
                                              o.id === org.id
                                                ? { ...o, name: e.target.value }
                                                : o
                                          );
                                        updateContent({
                                          organisations: updatedOrganisations,
                                        });
                                      }}
                                      placeholder="e.g., IEEE Computer Society"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Role/Position
                                    </Label>
                                    <Input
                                      value={org.role || ""}
                                      onChange={(e) => {
                                        const updatedOrganisations =
                                          resume.content.organisations?.map(
                                            (o: any) =>
                                              o.id === org.id
                                                ? { ...o, role: e.target.value }
                                                : o
                                          );
                                        updateContent({
                                          organisations: updatedOrganisations,
                                        });
                                      }}
                                      placeholder="e.g., Member, Volunteer"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">
                                      Start Date
                                    </Label>
                                    <Input
                                      value={org.startDate || ""}
                                      onChange={(e) => {
                                        const updatedOrganisations =
                                          resume.content.organisations?.map(
                                            (o: any) =>
                                              o.id === org.id
                                                ? {
                                                    ...o,
                                                    startDate: e.target.value,
                                                  }
                                                : o
                                          );
                                        updateContent({
                                          organisations: updatedOrganisations,
                                        });
                                      }}
                                      placeholder="e.g., Jan 2020"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">End Date</Label>
                                    <Input
                                      value={org.endDate || ""}
                                      onChange={(e) => {
                                        const updatedOrganisations =
                                          resume.content.organisations?.map(
                                            (o: any) =>
                                              o.id === org.id
                                                ? {
                                                    ...o,
                                                    endDate: e.target.value,
                                                  }
                                                : o
                                          );
                                        updateContent({
                                          organisations: updatedOrganisations,
                                        });
                                      }}
                                      placeholder="e.g., Present"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Description (Optional)
                                  </Label>
                                  <RichTextEditor
                                    value={org.description || ""}
                                    onChange={(html) => {
                                      const updatedOrganisations =
                                        resume.content.organisations?.map(
                                          (o: any) =>
                                            o.id === org.id
                                              ? {
                                                  ...o,
                                                  description: html,
                                                }
                                              : o
                                        );
                                      updateContent({
                                        organisations: updatedOrganisations,
                                      });
                                    }}
                                    placeholder="Brief description of your role and contributions..."
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Publications Section
                if (section.type === "publications") {
                  return (
                    <Card
                      key={section.id}
                      className="border"
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          {editingSectionTitle === section.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={sectionTitleValue}
                                onChange={(e) =>
                                  setSectionTitleValue(e.target.value)
                                }
                                className="h-8 text-sm font-semibold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSectionTitle(section.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSectionTitle(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => saveSectionTitle(section.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setEditingSectionTitle(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-sm flex-1">
                                {section.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditingSectionTitle(
                                    section.id,
                                    section.title
                                  )
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSection(section.id)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleSection(section.id)}
                          >
                            {section.expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {section.expanded && (
                        <CardContent className="p-4 space-y-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const nanoid = () =>
                                Math.random().toString(36).substring(2, 9);
                              const newPublication = {
                                id: nanoid(),
                                title: "",
                                publisher: "",
                                date: "",
                                link: "",
                              };
                              updateContent({
                                publications: [
                                  ...(resume.content.publications || []),
                                  newPublication,
                                ],
                              });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Publication
                          </Button>
                          {(resume.content.publications || []).map(
                            (pub: any, index: number) => (
                              <div
                                key={pub.id}
                                className="border rounded p-3 space-y-2"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-sm">
                                    Publication {index + 1}
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const updatedPublications =
                                        resume.content.publications?.filter(
                                          (p: any) => p.id !== pub.id
                                        );
                                      updateContent({
                                        publications: updatedPublications,
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div>
                                  <Label className="text-xs">Title</Label>
                                  <Input
                                    value={pub.title || ""}
                                    onChange={(e) => {
                                      const updatedPublications =
                                        resume.content.publications?.map(
                                          (p: any) =>
                                            p.id === pub.id
                                              ? { ...p, title: e.target.value }
                                              : p
                                        );
                                      updateContent({
                                        publications: updatedPublications,
                                      });
                                    }}
                                    placeholder="e.g., Machine Learning in Cloud Computing"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Publisher</Label>
                                    <Input
                                      value={pub.publisher || ""}
                                      onChange={(e) => {
                                        const updatedPublications =
                                          resume.content.publications?.map(
                                            (p: any) =>
                                              p.id === pub.id
                                                ? {
                                                    ...p,
                                                    publisher: e.target.value,
                                                  }
                                                : p
                                          );
                                        updateContent({
                                          publications: updatedPublications,
                                        });
                                      }}
                                      placeholder="e.g., IEEE Transactions"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Date</Label>
                                    <Input
                                      value={pub.date || ""}
                                      onChange={(e) => {
                                        const updatedPublications =
                                          resume.content.publications?.map(
                                            (p: any) =>
                                              p.id === pub.id
                                                ? { ...p, date: e.target.value }
                                                : p
                                          );
                                        updateContent({
                                          publications: updatedPublications,
                                        });
                                      }}
                                      placeholder="e.g., March 2023"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Link (Optional)
                                  </Label>
                                  <Input
                                    value={pub.link || ""}
                                    onChange={(e) => {
                                      const updatedPublications =
                                        resume.content.publications?.map(
                                          (p: any) =>
                                            p.id === pub.id
                                              ? { ...p, link: e.target.value }
                                              : p
                                        );
                                      updateContent({
                                        publications: updatedPublications,
                                      });
                                    }}
                                    placeholder="e.g., https://doi.org/10.1109/..."
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                }

                // Default handler for any remaining sections
                return null;
              })}

            {/* Add Section Button */}
            <Card className="border-dashed border-2">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Add More Sections
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        type: "languages" as const,
                        label: "Languages",
                        icon: "🌐",
                      },
                      {
                        type: "certificates" as const,
                        label: "Certificates",
                        icon: "📜",
                      },
                      {
                        type: "interests" as const,
                        label: "Interests",
                        icon: "🎨",
                      },
                      {
                        type: "courses" as const,
                        label: "Courses",
                        icon: "📚",
                      },
                      { type: "awards" as const, label: "Awards", icon: "🏆" },
                      {
                        type: "organisations" as const,
                        label: "Organisations",
                        icon: "🏢",
                      },
                      {
                        type: "publications" as const,
                        label: "Publications",
                        icon: "📄",
                      },
                      {
                        type: "references" as const,
                        label: "References",
                        icon: "👥",
                      },
                      {
                        type: "declaration" as const,
                        label: "Declaration",
                        icon: "✍️",
                      },
                      {
                        type: "spacer" as const,
                        label: "Spacer",
                        icon: "↔️",
                      },
                      {
                        type: "custom" as const,
                        label: "Custom Section",
                        icon: "📝",
                      },
                    ].map((section) => {
                      const alreadyAdded = sections.find(
                        (s) => s.type === section.type && s.visible
                      );
                      return (
                        <Button
                          key={section.type}
                          variant="outline"
                          size="sm"
                          className={`text-xs justify-start ${
                            alreadyAdded
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-purple-50"
                          }`}
                          onClick={() => {
                            if (!alreadyAdded) {
                              addSection(section.type);
                            }
                          }}
                          disabled={!!alreadyAdded}
                        >
                          <span className="mr-2">{section.icon}</span>
                          {section.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        {/* Right Panel: Preview */}
        <div className="w-1/2 bg-gray-100 overflow-auto">
          <div className="sticky top-0 bg-white border-b p-4 z-10 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </h3>
            <div className="text-xs text-gray-500">Live Preview</div>
          </div>
          <div className="p-4">
            {template ? (
              <ResumePreview
                resume={resume}
                template={template}
                sections={sections}
                layout={layout || undefined}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading template...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
