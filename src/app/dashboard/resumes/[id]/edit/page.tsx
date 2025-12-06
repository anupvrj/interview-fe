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
import { Resume, ResumeTemplate, resumeApi } from "@/lib/api";
import { ResumePreview } from "@/components/ResumePreview";
import { RichTextEditor } from "@/components/RichTextEditor";

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
    | "declaration";
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
      } else {
        setLayout({
          type: "single",
          columnWidths: { left: 60, right: 40 },
          padding: { top: 10, bottom: 10, left: 10, right: 10 },
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
        // Initialize default sections if not in database
        const defaultSections: Section[] = [
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
            id: "achievements",
            type: "achievements",
            title: "Achievements",
            visible: false,
            expanded: false,
          },
        ];
        setSections(defaultSections);
      }

      // Load template by templateId
      const templateList = await resumeApi.getTemplates();
      const foundTemplate = templateList.find(
        (t) => t.id === resumeData.templateId
      );
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

      // Get the preview element's HTML
      const previewElement = document.getElementById(
        "resume-preview-container"
      );
      if (!previewElement) {
        throw new Error("Preview element not found");
      }

      // Clone the element to clean it for PDF generation
      const clonedElement = previewElement.cloneNode(true) as HTMLElement;

      // Remove preview-specific constraints that break multi-page PDFs
      clonedElement.style.height = "auto";
      clonedElement.style.maxHeight = "none";
      clonedElement.style.overflow = "visible";
      clonedElement.style.padding = "0";
      clonedElement.style.pageBreakInside = "auto";
      clonedElement.classList.remove("shadow-2xl", "mx-auto");

      // Get the cleaned HTML content
      const htmlContent = clonedElement.innerHTML;

      // Send HTML to backend for PDF generation with Puppeteer
      // Backend will generate pixel-perfect PDF matching the browser preview
      const { downloadUrl } = await resumeApi.generatePDF(
        resumeId,
        htmlContent,
        layout?.padding
      );

      // Open the PDF in a new tab
      window.open(downloadUrl, "_blank");
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

  const startEditingSectionTitle = (
    sectionId: string,
    currentTitle: string
  ) => {
    setEditingSectionTitle(sectionId);
    setSectionTitleValue(currentTitle);
  };

  const saveSectionTitle = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, title: sectionTitleValue } : s
      )
    );
    setEditingSectionTitle(null);
    setSectionTitleValue("");
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
            <div className="flex items-center gap-2">
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
                                (layout.padding?.top || 20) - 5
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: newTop,
                                  bottom: layout.padding?.bottom || 20,
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
                            value={layout.padding?.top || 20}
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
                                  bottom: layout.padding?.bottom || 20,
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
                              const newTop = Math.min(
                                50,
                                (layout.padding?.top || 20) + 5
                              );
                              setLayout({
                                ...layout,
                                padding: {
                                  ...layout.padding,
                                  top: newTop,
                                  bottom: layout.padding?.bottom || 20,
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
                        <Label className="text-xs text-gray-500">Bottom</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newBottom = Math.max(
                                0,
                                (layout.padding?.bottom || 20) - 5
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
                            value={layout.padding?.bottom || 20}
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
                                (layout.padding?.bottom || 20) + 5
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
                            value={resume.content.profileSummary || ""}
                            onChange={(html) =>
                              updateContent({
                                profileSummary: html,
                              })
                            }
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
                  const combinedSkills =
                    typeof resume.content.skills.technical === "string"
                      ? resume.content.skills.technical
                      : resume.content.skills.technical.join(", ");

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
                          <div>
                            <RichTextEditor
                              value={combinedSkills}
                              onChange={(html) =>
                                updateContent({
                                  skills: {
                                    ...resume.content.skills,
                                    technical: html,
                                    soft: html,
                                  },
                                })
                              }
                              placeholder="List your skills..."
                              className="mt-1"
                            />
                          </div>
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
                          <h3 className="font-semibold text-sm">
                            {section.title}
                          </h3>
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
                          <h3 className="font-semibold text-sm">
                            {section.title}
                          </h3>
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
                          <h3 className="font-semibold text-sm">
                            {section.title}
                          </h3>
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
                          <Input
                            value={resume.content.declaration || ""}
                            onChange={(e) => {
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      content: {
                                        ...prev.content,
                                        declaration: e.target.value,
                                      },
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            placeholder="I hereby declare that..."
                            className="mt-1 h-9 text-sm"
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
                          <h3 className="font-semibold text-sm">
                            {section.title}
                          </h3>
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
                          <Label className="text-xs">Languages</Label>
                          <RichTextEditor
                            value={resume.content.languages || ""}
                            onChange={(html) => {
                              setResume((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      content: {
                                        ...prev.content,
                                        languages: html,
                                      },
                                    }
                                  : null
                              );
                              setHasChanges(true);
                            }}
                            placeholder="List languages you know..."
                            className="mt-1"
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
                          <h3 className="font-semibold text-sm">
                            {section.title}
                          </h3>
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
                                  <Input
                                    value={award.description || ""}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(resume.content.awards || []),
                                      ];
                                      updated[index] = {
                                        ...award,
                                        description: e.target.value,
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
                          <h3 className="font-semibold text-sm">
                            {section.title}
                          </h3>
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

                // Default handler for any remaining sections (publications, courses, organisations)
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
