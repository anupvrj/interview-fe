"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import "@/styles/mercury-template.css";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RefreshCw,
  Palette,
} from "lucide-react";
import { Resume, ResumeTemplate, resumeApi, apiClient } from "@/lib/api";
import { ResumePreview } from "@/components/ResumePreview";
import { RichTextEditor } from "@/components/RichTextEditor";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import { ExecutiveSkills } from "@/components/resume-editor/ExecutiveSkills";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LanguagesEditor } from "@/components/LanguagesEditor";
import { captureAndUploadThumbnail } from "@/lib/resume-thumbnail";
import { generateResumePdfViaServer } from "@/lib/resume-pdf-export";
import {
  mergeLayoutPaddingWithTemplateStyle,
  resolveLayoutPaddingMm,
} from "@/lib/resume-page-dimensions";
import { ATSFeedback } from "@/components/ATSFeedback";
import { ProfilePictureCropper } from "@/components/ProfilePictureCropper";
import { ChangeTemplateDialog } from "@/components/resume-editor/ChangeTemplateDialog";
import {
  buildLayoutForTemplateSwitch,
  buildSectionsForTemplateSwitch,
} from "@/lib/resume-template-switch";
import { debugResumePagination } from "@/lib/debug-resume-pagination";

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
  const [refreshingATS, setRefreshingATS] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [profilePictureFileName, setProfilePictureFileName] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [editingSectionTitle, setEditingSectionTitle] = useState<string | null>(
    null,
  );
  const [sectionTitleValue, setSectionTitleValue] = useState("");
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [layout, setLayout] = useState<{
    type: "single" | "double";
    columnWidths: { left: number; right: number };
    padding?: { top: number; bottom: number; left: number; right: number };
    fontSize?: {
      heading?: number;
      subheading?: number;
      body?: number;
      small?: number;
      sectionHeader?: number;
    };
    fontFamily?: string;
  } | null>(null);

  // Effective typography: template defaults merged with layout overrides (for Layout UI)
  const effectiveTypography = useMemo(() => {
    if (!template || !layout) return null;
    const base = getTemplateStyle(getExtendedTemplate(template));
    return {
      fontSize: {
        heading: layout.fontSize?.heading ?? base.fontSize.heading,
        subheading: layout.fontSize?.subheading ?? base.fontSize.subheading,
        body: layout.fontSize?.body ?? base.fontSize.body,
        small: layout.fontSize?.small ?? base.fontSize.small,
        sectionHeader:
          layout.fontSize?.sectionHeader ?? base.sectionHeader.fontSize,
      },
      fontFamily: layout.fontFamily ?? base.fontFamily,
    };
  }, [template, layout]);

  const FONT_FAMILY_OPTIONS = [
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "'Zilla Slab', serif", label: "Zilla Slab" },
    { value: "'Open Sans', sans-serif", label: "Open Sans" },
    { value: "'Lato', sans-serif", label: "Lato" },
    { value: "'Roboto', sans-serif", label: "Roboto" },
    { value: "'Source Sans 3', sans-serif", label: "Source Sans 3" },
    { value: "'Merriweather', serif", label: "Merriweather" },
    { value: "'PT Sans', sans-serif", label: "PT Sans" },
  ];

  // Initialize sections as empty - will be populated from database
  const [sections, setSections] = useState<Section[]>([]);
  const [viewMode, setViewMode] = useState<"edit" | "ats">("edit");

  // Delete section dialog state
  const [changeTemplateOpen, setChangeTemplateOpen] = useState(false);
  const [changingTemplate, setChangingTemplate] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{
    id: string;
    title: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoaded && user && resumeId) {
      localStorage.setItem("clerk-user-id", user.id);
      loadResume();
    }
  }, [mounted, isLoaded, user, resumeId]);

  // Track dragging state
  const isDraggingRef = useRef(false);
  const isThumbnailUploadingRef = useRef(false);
  const autoThumbnailAttemptsRef = useRef(0);
  const MAX_AUTO_THUMBNAIL_ATTEMPTS = 3;

  const bumpPreviewKey = useCallback((reason: string) => {
    setPreviewKey((prev) => {
      const next = prev + 1;
      debugResumePagination("previewKey:bump", { reason, next });
      return next;
    });
  }, []);

  const triggerThumbnailCapture = useCallback(
    async (targetResumeId: string, options?: { force?: boolean }) => {
      if (!targetResumeId) return;
      if (isThumbnailUploadingRef.current) return;
      const force = options?.force === true;
      if (!force) {
        if (autoThumbnailAttemptsRef.current >= MAX_AUTO_THUMBNAIL_ATTEMPTS) {
          return;
        }
        if (resume?.thumbnailS3Key) {
          return;
        }
      }

      const previewContainerId = `resume-preview-container-${targetResumeId}`;
      const previewElement = document.getElementById(previewContainerId);
      if (!previewElement) {
        return;
      }

      isThumbnailUploadingRef.current = true;
      if (!force) {
        autoThumbnailAttemptsRef.current += 1;
      }

      try {
        const result = await captureAndUploadThumbnail(
          targetResumeId,
          previewContainerId,
        );

        if (result.success) {
          const updatedResume = await resumeApi.get(targetResumeId);
          debugResumePagination("thumbnail:auto:setResume", {
            targetResumeId,
          });
          setResume(updatedResume);
        } else {
          console.error("Auto thumbnail upload failed:", result.error);
        }
      } catch (error) {
        console.error("Error during auto thumbnail capture:", error);
      } finally {
        isThumbnailUploadingRef.current = false;
      }
    },
    [resume?.thumbnailS3Key, MAX_AUTO_THUMBNAIL_ATTEMPTS],
  );

  // Attempt thumbnail generation on initial preview render (not only after save).
  useEffect(() => {
    if (!mounted || loading || !resume || !template || !resumeId) return;
    if (resume.thumbnailS3Key) return;
    if (autoThumbnailAttemptsRef.current >= MAX_AUTO_THUMBNAIL_ATTEMPTS) return;

    const timers = [
      setTimeout(() => void triggerThumbnailCapture(resumeId), 1500),
      setTimeout(() => void triggerThumbnailCapture(resumeId), 4500),
      setTimeout(() => void triggerThumbnailCapture(resumeId), 9000),
    ];

    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
    };
  }, [
    mounted,
    loading,
    resume,
    template,
    resumeId,
    triggerThumbnailCapture,
    MAX_AUTO_THUMBNAIL_ATTEMPTS,
  ]);

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

        // Log customSections before saving
        console.log("💾 [Autosave] Saving resume with customSections:", {
          customSectionsCount: resume.content.customSections?.length || 0,
          customSections: resume.content.customSections,
        });

        await resumeApi.update(resumeId, {
          title: resume.title,
          templateId: resume.templateId,
          content: resume.content,
          profileSummary: resume.profileSummary,
          sectionOrder: sectionOrderData,
          layout: layout,
        });

        setHasChanges(false);
        setLastSaved(new Date());
        // Capture designed resume after save (force: bypass "already has thumbnail").
        await triggerThumbnailCapture(resumeId, { force: true });
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        setAutoSaving(false);
      }
    }, 5000); // 5 seconds after last change

    return () => clearTimeout(autoSaveTimer);
  }, [hasChanges, resume, layout, sections, resumeId, triggerThumbnailCapture]);

  const loadResume = async () => {
    try {
      debugResumePagination("loadResume:start", { resumeId });
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
            (s: any) => s.type === "profileSummary",
          );
          if (profileSection?.content) {
            resumeData.profileSummary = profileSection.content;
          }
        }
      }

      // Ensure customSections is properly initialized
      if (!resumeData.content.customSections) {
        resumeData.content.customSections = [];
      }

      setResume(resumeData);

      // Extract filename from profile picture URL if it exists
      if (resumeData.content.personalInfo?.profilePicture) {
        const profilePictureUrl =
          resumeData.content.personalInfo.profilePicture;
        // Extract filename from URL (handles both S3 URLs and data URLs)
        let filename = "";
        try {
          if (
            profilePictureUrl.startsWith("http://") ||
            profilePictureUrl.startsWith("https://")
          ) {
            // Extract from URL path (e.g., https://s3.amazonaws.com/bucket/path/filename.jpg)
            const urlParts = profilePictureUrl.split("/");
            filename = urlParts[urlParts.length - 1];
            // Remove query parameters if any
            filename = filename.split("?")[0];
            // If filename is empty or looks like an ID, use a generic name
            if (!filename || filename.length < 5 || !filename.includes(".")) {
              filename = "profile-picture.jpg";
            }
          } else if (profilePictureUrl.startsWith("data:")) {
            // For data URLs, use a generic name
            filename = "profile-picture.jpg";
          } else {
            filename = "profile-picture.jpg";
          }
        } catch (error) {
          filename = "profile-picture.jpg";
        }
        setProfilePictureFileName(filename);
      } else {
        setProfilePictureFileName("");
      }

      // Load template by templateId first to get padding configuration
      const templateList = await resumeApi.getTemplates();
      const foundTemplate = templateList.find(
        (t) => t.id === resumeData.templateId,
      );

      // Set template immediately so it's available when sections are initialized
      if (foundTemplate) {
        setTemplate(foundTemplate);
      }

      // Load layout from database or use default
      if (resumeData.layout) {
        // For Mercury template, ensure 20mm left/right padding
        const defaultPadding =
          resumeData.templateId === "mercury"
            ? { top: 20, bottom: 20, left: 20, right: 20 }
            : { top: 10, bottom: 10, left: 10, right: 10 };

        setLayout({
          type: resumeData.layout.type || "single",
          columnWidths: resumeData.layout.columnWidths || {
            left: 60,
            right: 40,
          },
          padding: resumeData.layout.padding || defaultPadding,
          fontSize: (
            resumeData.layout as {
              fontSize?: {
                heading?: number;
                subheading?: number;
                body?: number;
                small?: number;
                sectionHeader?: number;
              };
            }
          ).fontSize,
          fontFamily: (resumeData.layout as { fontFamily?: string }).fontFamily,
        });

        // If Mercury template has wrong padding, update it
        if (resumeData.templateId === "mercury" && resumeData.layout.padding) {
          if (
            resumeData.layout.padding.left !== 20 ||
            resumeData.layout.padding.right !== 20
          ) {
            const updatedLayout = {
              ...resumeData.layout,
              type: resumeData.layout.type || "single",
              columnWidths: resumeData.layout.columnWidths || {
                left: 60,
                right: 40,
              },
              padding: {
                ...resumeData.layout.padding,
                left: 20,
                right: 20,
              },
            };
            setLayout(updatedLayout as any);
            // Save updated layout to database
            (async () => {
              try {
                await resumeApi.update(resumeId, {
                  layout: updatedLayout,
                });
              } catch (error) {
                console.error("Error updating layout padding:", error);
              }
            })();
          }
        }
      } else {
        // Set default layout if not provided
        const defaultPadding =
          resumeData.templateId === "mercury"
            ? { top: 20, bottom: 20, left: 20, right: 20 }
            : { top: 5, bottom: 5, left: 8, right: 8 };

        setLayout({
          type: "single",
          columnWidths: { left: 60, right: 40 },
          padding: defaultPadding,
          fontSize: undefined,
          fontFamily: undefined,
        });
      }

      // Load section order from database or use default
      if (resumeData.sectionOrder && resumeData.sectionOrder.length > 0) {
        const loadedSections = resumeData.sectionOrder.map((s) => ({
          ...s,
          expanded: true,
        })) as Section[];

        // Ensure all custom sections in sectionOrder have corresponding entries in customSections
        const customSections = resumeData.content.customSections || [];
        const customSectionIds = new Set(
          customSections.map((cs: any) => cs.id),
        );

        const missingCustomSections = loadedSections
          .filter((s) => s.type === "custom" && !customSectionIds.has(s.id))
          .map((s) => ({
            id: s.id,
            title: s.title,
            content: "", // Initialize with empty content
          }));

        if (missingCustomSections.length > 0) {
          // Update resume data to include missing custom sections
          resumeData.content.customSections = [
            ...customSections,
            ...missingCustomSections,
          ];
          setResume(resumeData);

          // Immediately save missing custom sections to database to prevent data loss on reload
          (async () => {
            try {
              const sectionOrderData = loadedSections.map((s) => ({
                id: s.id,
                type: s.type,
                title: s.title,
                visible: s.visible,
              }));

              await resumeApi.update(resumeId, {
                content: resumeData.content,
                sectionOrder: sectionOrderData,
              });
              console.log("✅ Initialized missing custom sections in database");
            } catch (error) {
              console.error("Error saving missing custom sections:", error);
              // Don't block the UI - autosave will handle it
              setHasChanges(true);
            }
          })();
        } else {
          // All custom sections exist, ensure resume state has the latest customSections
          console.log(
            "✅ All custom sections found in database:",
            customSections,
          );
          // Update resume state to ensure customSections are preserved
          // Use a single update to ensure both resume and sections are in sync
          setResume((prevResume) => {
            if (!prevResume) {
              return {
                ...resumeData,
                content: {
                  ...resumeData.content,
                  customSections: customSections,
                },
              };
            }
            return {
              ...prevResume,
              content: {
                ...prevResume.content,
                customSections: customSections, // Ensure customSections are preserved from database
              },
            };
          });
        }

        // Set sections after resume state is updated to ensure they're in sync
        setSections(loadedSections);
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

      // Single remount after resume, template, layout, and sections are applied (avoids triple bump).
      bumpPreviewKey("loadResume:complete");
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
        templateId: resume.templateId,
        content: resume.content,
        sectionOrder: sectionOrderData,
        layout: layout || {
          type: "single",
          columnWidths: { left: 60, right: 40 },
        },
      });
      setHasChanges(false);
      // Capture thumbnail before loadResume — loadResume bumps preview key and remounts DOM.
      await triggerThumbnailCapture(resumeId, { force: true });
      await loadResume();

      // ATS score calculation is now only done on manual refresh
      // This improves UX by not blocking saves
    } catch (error) {
      console.error("Error saving resume:", error);
      alert("Failed to save resume. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeTemplate = async (newTemplateId: string) => {
    if (!resume || newTemplateId === resume.templateId) {
      setChangeTemplateOpen(false);
      return;
    }

    try {
      setChangingTemplate(true);
      const templateList = await resumeApi.getTemplates();
      const newTemplate = templateList.find((t) => t.id === newTemplateId);
      if (!newTemplate) {
        alert("Template not found. Please try again.");
        return;
      }

      const { TemplateLoader } = await import("@/lib/templateLoader");
      await TemplateLoader.loadTemplate(newTemplateId);

      const nextLayout = buildLayoutForTemplateSwitch(newTemplate);
      const nextSections = buildSectionsForTemplateSwitch(newTemplate, sections);

      setTemplate(newTemplate);
      setLayout(nextLayout);
      setSections(nextSections);
      setResume((prev) =>
        prev
          ? {
              ...prev,
              templateId: newTemplateId,
              layout: nextLayout,
              pdfS3Key: undefined,
            }
          : prev,
      );
      setChangeTemplateOpen(false);
      setHasChanges(true);
      bumpPreviewKey("templateChange");
    } catch (error) {
      console.error("Error changing template:", error);
      alert("Failed to change template. Please try again.");
    } finally {
      setChangingTemplate(false);
    }
  };

  const handleRefreshATS = async () => {
    if (!resume || !resumeId) return;

    try {
      setRefreshingATS(true);

      // Call the API to recalculate ATS score and wait for the response
      const updatedResume = await resumeApi.recalculateATS(resumeId);

      // Update the resume state with the new ATS score
      setResume((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          atsScore: updatedResume.atsScore,
          atsFeedback: updatedResume.atsFeedback,
        };
      });
    } catch (error) {
      console.error("Error refreshing ATS score:", error);
      alert("Failed to refresh ATS score. Please try again.");
    } finally {
      setRefreshingATS(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      debugResumePagination("download:start", { resumeId, zoomLevel });

      // Get ALL page elements (we now have multiple pages)
      // Use unique ID per resume to avoid conflicts
      const previewContainerId = `resume-preview-container-${resumeId}`;
      const page1Element = document.getElementById(previewContainerId);

      // Store current zoom level and reset to 100% for PDF generation
      let originalTransform = "";
      if (page1Element) {
        originalTransform = page1Element.style.transform;
        page1Element.style.transform = "scale(1)"; // Reset to 100%
        debugResumePagination("download:transformReset", {
          originalTransform,
        });

        // Wait a moment for the DOM to update
        await new Promise((resolve) => setTimeout(resolve, 100));
        debugResumePagination("download:after100ms", {});
      }

      try {
        const allPageElements: HTMLElement[] = [];

        if (page1Element) {
          const paginatedContainer = page1Element.querySelector(
            ".flex.flex-col.items-center",
          );

          if (paginatedContainer) {
            const pages = paginatedContainer.querySelectorAll(".resume-page");
            if (pages.length > 0) {
              pages.forEach((page) => {
                allPageElements.push(page as HTMLElement);
              });
            }
          }

          if (allPageElements.length === 0) {
            allPageElements.push(page1Element as HTMLElement);
          }
        }

        if (allPageElements.length === 0) {
          throw new Error("Preview element not found");
        }

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
          }),
        );
        debugResumePagination("download:imagesReady", {
          imageCount: allImages.length,
        });

        if (typeof document !== "undefined" && "fonts" in document) {
          await (document as Document & { fonts: FontFaceSet }).fonts.ready;
        }
        debugResumePagination("download:fontsReady", {
          fontsStatus:
            typeof document !== "undefined" && "fonts" in document
              ? (document as Document & { fonts: FontFaceSet }).fonts.status
              : "n/a",
        });

        const templateId =
          resume?.templateId || template?.id || "classic";
        const pdfTemplate = template ?? {
          id: templateId,
        } as ResumeTemplate;
        const pdfPadding = resolveLayoutPaddingMm(
          mergeLayoutPaddingWithTemplateStyle(
            resume?.layout?.padding ?? layout?.padding,
            getTemplateStyle(getExtendedTemplate(pdfTemplate)).padding,
          ),
        );

        let downloadUrl: string;

        try {
          debugResumePagination("download:pdfStart", {
            path: "server",
            pageCount: allPageElements.length,
          });
          const result = await generateResumePdfViaServer({
            resumeId,
            templateId,
            pageElements: allPageElements,
            padding: pdfPadding,
          });
          downloadUrl = result.downloadUrl;
          debugResumePagination("download:pdfDone", { path: "server" });
        } catch (serverErr) {
          console.warn(
            "Server PDF failed, falling back to client html2canvas:",
            serverErr,
          );
          debugResumePagination("download:pdfStart", {
            path: "client-html2canvas",
            pageCount: allPageElements.length,
          });
          const { generatePDFFromPages, uploadPDFToS3 } =
            await import("@/lib/pdf-generator");
          const pdfBlob = await generatePDFFromPages(allPageElements, {
            filename: `${resume?.title || "resume"}.pdf`,
          });

          const { uploadUrl, s3Key } =
            await resumeApi.getPresignedUploadUrl(resumeId);
          await uploadPDFToS3(pdfBlob, uploadUrl);
          const confirm = await resumeApi.confirmPDFUpload(resumeId, s3Key);
          downloadUrl = confirm.downloadUrl;
          debugResumePagination("download:pdfDone", {
            path: "client-html2canvas",
          });
        }

        window.open(downloadUrl, "_blank");
      } finally {
        // Restore original zoom level
        if (page1Element && originalTransform) {
          page1Element.style.transform = originalTransform;
          debugResumePagination("download:transformRestored", {
            originalTransform,
          });
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
              currentResumeId,
            );
            return;
          }

          // Use unique ID per resume to avoid capturing wrong resume
          const previewContainerId = `resume-preview-container-${currentResumeId}`;
          const previewElement = document.getElementById(previewContainerId);
          if (!previewElement) {
            console.error(
              `Resume preview element not found for thumbnail capture: ${previewContainerId}`,
            );
            return;
          }

          const result = await captureAndUploadThumbnail(
            currentResumeId,
            previewContainerId,
          );

          if (result.success) {
            // Reload the resume to get updated data with thumbnail
            const updatedResume = await resumeApi.get(resumeId);
            debugResumePagination("download:thumbnail:setResume", { resumeId });
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

    debugResumePagination("updateContent", {
      resumeId: resume.resumeId,
      keys: Object.keys(updates),
      customSectionsInUpdate: updates.customSections?.length ?? null,
    });

    // Deep merge customSections if it's being updated
    let mergedContent = { ...resume.content, ...updates };
    if (updates.customSections) {
      // Ensure we're preserving existing customSections and merging properly
      const existingCustomSections = resume.content.customSections || [];
      const updatedCustomSections = updates.customSections;

      // Merge: keep existing sections that aren't being updated, add/update new ones
      const mergedCustomSections = [...existingCustomSections];
      updatedCustomSections.forEach((updated: any) => {
        const existingIndex = mergedCustomSections.findIndex(
          (cs: any) => cs.id === updated.id,
        );
        if (existingIndex >= 0) {
          mergedCustomSections[existingIndex] = updated;
        } else {
          mergedCustomSections.push(updated);
        }
      });

      mergedContent.customSections = mergedCustomSections;
    }

    setResume({
      ...resume,
      content: mergedContent,
    });
    setHasChanges(true);
  };

  const toggleSection = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, expanded: !s.expanded } : s,
      ),
    );
  };

  const deleteSection = (sectionId: string) => {
    // Prevent deletion of essential sections
    const essentialSections = ["personalInfo", "experience", "education"];
    const section = sections.find((s) => s.id === sectionId);

    if (!section) return;

    if (essentialSections.includes(section.type || "")) {
      // Show error dialog for essential sections
      setSectionToDelete({
        id: sectionId,
        title: section.title,
        type: section.type,
      });
      setDeleteDialogOpen(true);
      return;
    }

    // Open confirmation dialog for non-essential sections
    setSectionToDelete({
      id: sectionId,
      title: section.title,
      type: section.type,
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!sectionToDelete) return;

    const essentialSections = ["personalInfo", "experience", "education"];

    // If it's an essential section, just close the dialog (error was shown)
    if (essentialSections.includes(sectionToDelete.type)) {
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
      return;
    }

    // For non-essential standard sections, just mark them as hidden
    const isMultipleAllowed =
      sectionToDelete.type === "spacer" || sectionToDelete.type === "custom";

    if (!isMultipleAllowed) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionToDelete.id
            ? { ...s, visible: false, expanded: false }
            : s,
        ),
      );
    } else {
      // If deleting a custom section, also remove its data from customSections
      if (sectionToDelete.type === "custom" && resume) {
        const updatedCustomSections =
          resume.content.customSections?.filter(
            (cs: any) => cs.id !== sectionToDelete.id,
          ) || [];
        updateContent({
          customSections: updatedCustomSections,
        });
      }
      // Remove the section entirely from the array
      setSections((prev) => prev.filter((s) => s.id !== sectionToDelete.id));
    }

    setHasChanges(true);

    // Close dialog and reset state
    setDeleteDialogOpen(false);
    setSectionToDelete(null);
  };

  const startEditingSectionTitle = (
    sectionId: string,
    currentTitle: string,
  ) => {
    setEditingSectionTitle(sectionId);
    setSectionTitleValue(currentTitle);
  };

  const saveSectionTitle = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);

    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, title: sectionTitleValue } : s,
      ),
    );

    // If it's a custom section, also update the title in customSections
    if (section?.type === "custom" && resume) {
      const currentCustomSections = resume.content.customSections || [];
      const existingIndex = currentCustomSections.findIndex(
        (cs: any) => cs.id === sectionId,
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
      spacer: "Column Placeholder", // Can be added multiple times
      custom: "Custom Section",
    };

    const isMultipleAllowed = type === "spacer" || type === "custom";

    // Check if the section already exists (and multiple isn't allowed).
    // If so, just make it visible and expanded.
    if (!isMultipleAllowed) {
      const existingSectionIndex = sections.findIndex((s) => s.type === type);
      if (existingSectionIndex >= 0) {
        setSections((prev) =>
          prev.map((s, idx) =>
            idx === existingSectionIndex
              ? { ...s, visible: true, expanded: true }
              : s
          )
        );
        setHasChanges(true);
        return;
      }
    }

    const sectionId = `${type}_${Date.now()}`;
    const newSection: Section = {
      id: sectionId,
      type,
      title: titleMap[type] || type.charAt(0).toUpperCase() + type.slice(1),
      visible: true,
      expanded: true,
    };
    setSections([...sections, newSection]);

    // If it's a custom section, initialize it in customSections with empty content
    if (type === "custom" && resume) {
      const currentCustomSections = resume.content.customSections || [];
      const existingIndex = currentCustomSections.findIndex(
        (cs: any) => cs.id === sectionId,
      );

      if (existingIndex < 0) {
        updateContent({
          customSections: [
            ...currentCustomSections,
            {
              id: sectionId,
              title: newSection.title,
              content: "", // Initialize with empty content
            },
          ],
        });
      }
    }

    setHasChanges(true);
  };

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [layoutExpanded, setLayoutExpanded] = useState(true);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // ============================================
  // DRAG AND DROP HANDLERS - Clean Implementation
  // ============================================

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    // Don't start drag when user is interacting with inputs (fixes Space/keys not working)
    const target = e.target as HTMLElement;
    if (
      target.closest(
        "input, textarea, select, button, [contenteditable='true']",
      )
    ) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionId);
    isDraggingRef.current = true;
    // Defer setting state to avoid blocking drag start
    requestAnimationFrame(() => {
      setDraggedSection(sectionId);
    });
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

    // Create new sections array with reordered items
    // IMPORTANT: Create a completely new array to ensure React detects the change
    // Also remove any column property to allow dynamic redistribution
    const newSections = sections.map((s) => {
      // TypeScript-safe way to remove column property if it exists
      const sectionWithoutColumn = { ...s };
      if ("column" in sectionWithoutColumn) {
        delete (sectionWithoutColumn as any).column;
      }
      return sectionWithoutColumn;
    });
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    const oldOrder = sections.map((s, idx) => `${idx}:${s.id}`).join(",");
    const newOrder = newSections.map((s, idx) => `${idx}:${s.id}`).join(",");

    // Update sections - MUST be a new array reference for React to detect change
    if (oldOrder !== newOrder) {
      setSections(newSections);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setDraggedSection(null);
    setDragOverId(null);
    setHasChanges(true);

    // Force preview update after drag ends to ensure column assignment is recalculated
    // Use setTimeout to ensure sections state has fully updated
    setTimeout(() => {
      bumpPreviewKey("dragEnd");
    }, 50);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragEnd();
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            {/* Left Section: Back Button + Title */}
            <div className="flex items-center gap-4 min-w-0 md:flex-1">
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
                className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent max-w-xs min-w-0 flex-1"
                placeholder="Resume Title"
              />
            </div>

            {/* Middle Section: ATS Score (Centered) */}
            <div className="flex items-center justify-center min-w-0 shrink-0 md:flex-1">
              {resume.atsScore !== undefined && resume.atsScore !== null && (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <div
                    className={`px-3 py-2 sm:px-4 rounded-lg border-2 font-semibold text-sm flex items-center gap-1.5 sm:gap-2 ${resume.atsScore >= 80
                      ? "bg-green-50 text-green-700 border-green-300"
                      : resume.atsScore >= 60
                        ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                        : "bg-red-50 text-red-700 border-red-300"
                      }`}
                  >
                    <span className="whitespace-nowrap">ATS Score:</span>
                    <span className="text-xl font-bold">{resume.atsScore}</span>
                    <span className="text-xs opacity-70">/100</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshATS}
                    disabled={refreshingATS}
                    className="h-8 w-8 p-0 shrink-0"
                    title="Refresh ATS Score"
                  >
                    {refreshingATS ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Right Section: Autosave Status + Buttons */}
            <div className="flex flex-wrap items-center gap-2 justify-start min-w-0 md:flex-1 md:justify-end">
              {/* Autosave Status */}
              {autoSaving && (
                <span className="text-sm text-gray-500 flex items-center min-w-0">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin shrink-0" />
                  Auto-saving...
                </span>
              )}
              {!autoSaving && lastSaved && !hasChanges && (
                <span className="text-sm text-gray-500 max-md:w-full max-md:text-center md:max-w-[min(100%,14rem)] md:truncate">
                  Saved at {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}

              <Button
                type="button"
                onClick={() => setChangeTemplateOpen(true)}
                variant="outline"
                size="sm"
                className="shrink-0 max-md:flex-1"
                disabled={changingTemplate}
              >
                {changingTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 mr-2" />
                    Change Template
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges || autoSaving}
                className="bg-gradient-to-r from-purple-600 to-primary hover:bg-slate-900 text-white shrink-0 max-md:flex-1"
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
                className="shrink-0 max-md:flex-1"
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

      {/* Main Content: preview on top on mobile; side-by-side from md */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Panel: Edit Form (below preview on mobile) */}
        <div className="order-2 flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-white md:order-none md:w-1/2 md:border-r">
          {/* Toggle between Edit Resume and ATS Report */}
          <div className="border-b bg-gray-50">
            <div className="flex">
              <button
                onClick={() => setViewMode("edit")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${viewMode === "edit"
                  ? "bg-white text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Edit Resume
              </button>
              <button
                onClick={() => setViewMode("ats")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${viewMode === "ats"
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
                <p>
                  No ATS feedback available. Please calculate ATS score first.
                </p>
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
                    {/* Column Type Selection - Hidden from user */}
                    {/* <div className="flex gap-2">
                      <Button
                        variant={
                          layout.type === "single" ? "default" : "outline"
                        }
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
                        variant={
                          layout.type === "double" ? "default" : "outline"
                        }
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
                    </div> */}

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
                                    const newLeft =
                                      layout.columnWidths.left - 5;
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
                                    Math.min(90, Number(e.target.value)),
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
                                    const newLeft =
                                      layout.columnWidths.left + 5;
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
                                    Math.min(90, Number(e.target.value)),
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
                                  (layout.padding?.top || 5) - 1,
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
                                  Math.min(50, Number(e.target.value)),
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
                                  (layout.padding?.top || 5) + 1,
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
                          <Label className="text-xs text-gray-500">
                            Bottom
                          </Label>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                const newBottom = Math.max(
                                  0,
                                  (layout.padding?.bottom || 5) - 1,
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
                                  Math.min(50, Number(e.target.value)),
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
                                  (layout.padding?.bottom || 5) + 1,
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
                                  (layout.padding?.left || 20) - 5,
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
                                  Math.min(50, Number(e.target.value)),
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
                                  (layout.padding?.left || 20) + 5,
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
                                  (layout.padding?.right || 20) - 5,
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
                                  Math.min(50, Number(e.target.value)),
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
                                  (layout.padding?.right || 20) + 5,
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

                    {/* Typography: font sizes and font family */}
                    {effectiveTypography && (
                      <div className="space-y-3 pt-2 border-t">
                        <Label className="text-xs text-gray-600">
                          Typography
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-500">
                              Heading
                            </Label>
                            <Input
                              type="number"
                              min="10"
                              max="48"
                              step="0.5"
                              value={effectiveTypography.fontSize.heading}
                              onChange={(e) => {
                                const value = Math.max(
                                  10,
                                  Math.min(48, Number(e.target.value) || 10),
                                );
                                setLayout({
                                  ...layout,
                                  fontSize: {
                                    ...layout?.fontSize,
                                    heading: value,
                                  },
                                });
                                setHasChanges(true);
                              }}
                              className="mt-1 h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              Subheading
                            </Label>
                            <Input
                              type="number"
                              min="8"
                              max="36"
                              step="0.5"
                              value={effectiveTypography.fontSize.subheading}
                              onChange={(e) => {
                                const value = Math.max(
                                  8,
                                  Math.min(36, Number(e.target.value) || 8),
                                );
                                setLayout({
                                  ...layout,
                                  fontSize: {
                                    ...layout?.fontSize,
                                    subheading: value,
                                  },
                                });
                                setHasChanges(true);
                              }}
                              className="mt-1 h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              Body
                            </Label>
                            <Input
                              type="number"
                              min="8"
                              max="24"
                              step="0.5"
                              value={effectiveTypography.fontSize.body}
                              onChange={(e) => {
                                const value = Math.max(
                                  8,
                                  Math.min(24, Number(e.target.value) || 8),
                                );
                                setLayout({
                                  ...layout,
                                  fontSize: {
                                    ...layout?.fontSize,
                                    body: value,
                                  },
                                });
                                setHasChanges(true);
                              }}
                              className="mt-1 h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              Small
                            </Label>
                            <Input
                              type="number"
                              min="6"
                              max="20"
                              step="0.5"
                              value={effectiveTypography.fontSize.small}
                              onChange={(e) => {
                                const value = Math.max(
                                  6,
                                  Math.min(20, Number(e.target.value) || 6),
                                );
                                setLayout({
                                  ...layout,
                                  fontSize: {
                                    ...layout?.fontSize,
                                    small: value,
                                  },
                                });
                                setHasChanges(true);
                              }}
                              className="mt-1 h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              Section header
                            </Label>
                            <Input
                              type="number"
                              min="8"
                              max="24"
                              step="0.5"
                              value={effectiveTypography.fontSize.sectionHeader}
                              onChange={(e) => {
                                const value = Math.max(
                                  8,
                                  Math.min(24, Number(e.target.value) || 8),
                                );
                                setLayout({
                                  ...layout,
                                  fontSize: {
                                    ...layout?.fontSize,
                                    sectionHeader: value,
                                  },
                                });
                                setHasChanges(true);
                              }}
                              className="mt-1 h-7 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Font family
                          </Label>
                          <Select
                            value={
                              effectiveTypography.fontFamily ||
                              FONT_FAMILY_OPTIONS[0].value
                            }
                            onValueChange={(value) => {
                              setLayout({
                                ...layout,
                                fontFamily: value,
                              });
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue placeholder="Font" />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_FAMILY_OPTIONS.map((opt) => (
                                <SelectItem
                                  key={opt.value}
                                  value={opt.value}
                                  className="text-xs"
                                >
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
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
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                              <div className="flex-shrink-0 relative">
                                {personalInfo.profilePicture ? (
                                  <>
                                    <img
                                      src={personalInfo.profilePicture}
                                      alt="Profile"
                                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!resume) return;
                                        updateContent({
                                          personalInfo: {
                                            ...personalInfo,
                                            profilePicture: "",
                                          },
                                        });
                                        setProfilePictureFileName("");
                                        if (profilePictureInputRef.current) {
                                          profilePictureInputRef.current.value =
                                            "";
                                        }
                                      }}
                                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                      title="Remove profile picture"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
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
                                {!personalInfo.profilePicture && (
                                  <input
                                    ref={profilePictureInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file || !resume) return;

                                      // Store the filename
                                      setProfilePictureFileName(file.name);

                                      // Create a preview URL for the cropper
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const imageUrl = event.target
                                          ?.result as string;
                                        setImageToCrop(imageUrl);
                                        setCropperOpen(true);
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                    className="text-xs"
                                  />
                                )}
                                {personalInfo.profilePicture && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        profilePictureInputRef.current?.click();
                                      }}
                                      className="text-xs"
                                    >
                                      Change
                                    </Button>
                                    <input
                                      ref={profilePictureInputRef}
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file || !resume) return;

                                        // Store the filename
                                        setProfilePictureFileName(file.name);

                                        // Create a preview URL for the cropper
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          const imageUrl = event.target
                                            ?.result as string;
                                          setImageToCrop(imageUrl);
                                          setCropperOpen(true);
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                      className="hidden"
                                    />
                                  </div>
                                )}
                                {profilePictureFileName && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {profilePictureFileName}
                                  </p>
                                )}
                                {!personalInfo.profilePicture && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Upload a professional headshot (JPG, PNG)
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Profile Picture Cropper Dialog */}
                            {imageToCrop && (
                              <ProfilePictureCropper
                                open={cropperOpen}
                                onOpenChange={(open) => {
                                  setCropperOpen(open);
                                  if (!open) {
                                    // Reset file input when dialog closes
                                    if (profilePictureInputRef.current) {
                                      profilePictureInputRef.current.value = "";
                                    }
                                    setImageToCrop(null);
                                  }
                                }}
                                imageSrc={imageToCrop}
                                onCropComplete={async (croppedImageUrl) => {
                                  if (!resume) return;

                                  try {
                                    // Convert data URL to blob
                                    const response =
                                      await fetch(croppedImageUrl);
                                    const blob = await response.blob();

                                    // Create FormData and upload
                                    const formData = new FormData();
                                    formData.append(
                                      "file",
                                      blob,
                                      "profile-picture.jpg",
                                    );

                                    const uploadResponse =
                                      await apiClient.post<{
                                        success: boolean;
                                        message: string;
                                        data: { profilePictureUrl: string };
                                      }>(
                                        `/resumes/${resume.resumeId}/profile-picture`,
                                        formData,
                                      );

                                    if (
                                      uploadResponse.data.success &&
                                      uploadResponse.data.data
                                        ?.profilePictureUrl
                                    ) {
                                      const profilePictureUrl =
                                        uploadResponse.data.data
                                          .profilePictureUrl;

                                      // Update resume state with new profile picture URL
                                      setResume((prevResume) => {
                                        if (!prevResume) return prevResume;
                                        return {
                                          ...prevResume,
                                          content: {
                                            ...prevResume.content,
                                            personalInfo: {
                                              ...prevResume.content
                                                .personalInfo,
                                              profilePicture: profilePictureUrl,
                                            },
                                          },
                                        };
                                      });

                                      // Wait a moment for S3 to propagate the file, then force re-render
                                      // This ensures the image is available before we try to load it
                                      setTimeout(() => {
                                        // Force resume preview to re-render by updating key
                                        // This ensures the image loads immediately after upload
                                        bumpPreviewKey(
                                          "profilePicture:upload-delay500",
                                        );
                                      }, 500);

                                      // Trigger hasChanges to enable autosave
                                      setHasChanges(true);

                                      console.log(
                                        "Profile picture updated in state:",
                                        profilePictureUrl,
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error uploading cropped profile picture:",
                                      error,
                                    );
                                    alert(
                                      "Failed to upload profile picture. Please try again.",
                                    );
                                  }
                                }}
                              />
                            )}

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
                                <Label
                                  htmlFor="yearsOfExperience"
                                  className="text-xs"
                                >
                                  Experience
                                </Label>
                                <Input
                                  id="yearsOfExperience"
                                  value={personalInfo.yearsOfExperience || ""}
                                  onChange={(e) =>
                                    updateContent({
                                      personalInfo: {
                                        ...personalInfo,
                                        yearsOfExperience: e.target.value,
                                      },
                                    })
                                  }
                                  className="mt-1 h-9 text-sm"
                                  placeholder="e.g., 5 years, 3+ years"
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
                              <Label className="text-xs font-semibold mb-3 block">
                                Additional Personal Information
                              </Label>

                              {/* Show all additional fields - always visible */}
                              <div className="grid grid-cols-2 gap-4">
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
                                    className="mt-1 h-9 text-sm"
                                    type="date"
                                    placeholder="Select date"
                                  />
                                </div>
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="e.g., American, Indian"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Passport/ID Number (Legacy)
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="Passport or ID number"
                                  />
                                </div>
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="e.g., Single, Married"
                                  />
                                </div>
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="Military service details"
                                  />
                                </div>
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="License number or class"
                                  />
                                </div>
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="e.g., Male, Female, Non-binary"
                                  />
                                </div>
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="Disability status (optional)"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Visa Status</Label>
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
                                    className="mt-1 h-9 text-sm"
                                    placeholder="e.g., Work Visa, Permanent Resident"
                                  />
                                </div>
                              </div>

                              {/* Passport Details Sub-section */}
                              <div className="pt-4 border-t mt-4">
                                <Label className="text-xs font-semibold mb-3 block">
                                  Passport Details
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs">
                                      Passport No.
                                    </Label>
                                    <Input
                                      value={personalInfo.passportNo || ""}
                                      onChange={(e) =>
                                        updateContent({
                                          personalInfo: {
                                            ...personalInfo,
                                            passportNo: e.target.value,
                                          },
                                        })
                                      }
                                      className="mt-1 h-9 text-sm"
                                      placeholder="e.g., V0305854"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Place of Issue
                                    </Label>
                                    <Input
                                      value={
                                        personalInfo.passportPlaceOfIssue || ""
                                      }
                                      onChange={(e) =>
                                        updateContent({
                                          personalInfo: {
                                            ...personalInfo,
                                            passportPlaceOfIssue:
                                              e.target.value,
                                          },
                                        })
                                      }
                                      className="mt-1 h-9 text-sm"
                                      placeholder="e.g., Lucknow"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Date of Issue
                                    </Label>
                                    <Input
                                      value={
                                        personalInfo.passportDateOfIssue || ""
                                      }
                                      onChange={(e) =>
                                        updateContent({
                                          personalInfo: {
                                            ...personalInfo,
                                            passportDateOfIssue: e.target.value,
                                          },
                                        })
                                      }
                                      className="mt-1 h-9 text-sm"
                                      type="date"
                                      placeholder="Select date"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Date of Expiry
                                    </Label>
                                    <Input
                                      value={
                                        personalInfo.passportDateOfExpiry || ""
                                      }
                                      onChange={(e) =>
                                        updateContent({
                                          personalInfo: {
                                            ...personalInfo,
                                            passportDateOfExpiry:
                                              e.target.value,
                                          },
                                        })
                                      }
                                      className="mt-1 h-9 text-sm"
                                      type="date"
                                      placeholder="Select date"
                                    />
                                  </div>
                                </div>
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
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                    : null,
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
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                            {resume.content.experience.map((exp, index) => (
                              <div
                                key={exp.id || index}
                                className="p-3 border rounded-lg space-y-3"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">
                                      Position *
                                    </Label>
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
                                    <Label className="text-xs">
                                      Start Date
                                    </Label>
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
                                        const value = e.target.value;
                                        updated[index] = {
                                          ...exp,
                                          endDate: value,
                                          current:
                                            value.toLowerCase() === "present" ||
                                            !value,
                                        };
                                        updateContent({ experience: updated });
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      placeholder="MM/YYYY or Present"
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
                                        (_, i) => i !== index,
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
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                    <Label className="text-xs">CGPA</Label>
                                    <Input
                                      value={edu.gpa || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...resume.content.education,
                                        ];
                                        updated[index] = {
                                          ...edu,
                                          gpa: e.target.value,
                                        };
                                        updateContent({ education: updated });
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      placeholder="e.g. 8.5/10 or 3.6/4.0"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Percentage
                                    </Label>
                                    <Input
                                      value={edu.percentage || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...resume.content.education,
                                        ];
                                        updated[index] = {
                                          ...edu,
                                          percentage: e.target.value,
                                        };
                                        updateContent({ education: updated });
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      placeholder="e.g. 85% or 8.5/10"
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
                                  <div className="col-span-2">
                                    <Label className="text-xs">
                                      Institution address
                                    </Label>
                                    <Input
                                      value={edu.location || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...resume.content.education,
                                        ];
                                        updated[index] = {
                                          ...edu,
                                          location: e.target.value,
                                        };
                                        updateContent({ education: updated });
                                      }}
                                      className="mt-1 h-9 text-sm"
                                      placeholder="e.g. City, State / Country"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Start Date
                                    </Label>
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
                                        (_, i) => i !== index,
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
                                      gpa: "",
                                      location: "",
                                      percentage: "",
                                    },
                                  ],
                                });
                              }}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Education
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    );
                  }

                  // Skills Section
                  if (section.type === "skills") {
                    // Check if it's Executive template (uses new structure with items array)
                    const isExecutiveTemplate =
                      resume.templateId === "executive";

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
                      } else if (
                        typeof skillsField === "object" &&
                        skillsField !== null
                      ) {
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
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                  const sections =
                                    currentContent.sections || [];
                                  const skillsSectionIndex = sections.findIndex(
                                    (s: any) => s.type === "skills",
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
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                            {(resume.content.projects || []).map(
                              (project, index) => (
                                <div
                                  key={project.id || index}
                                  className="p-3 border rounded-lg space-y-3"
                                >
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">
                                        Project Title *
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
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="mt-1 h-9 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Project Link
                                      </Label>
                                      <Input
                                        value={project.link || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.projects || []),
                                          ];
                                          updated[index] = {
                                            ...project,
                                            link: e.target.value,
                                          };
                                          updateContent({ projects: updated });
                                        }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="https://..."
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Start Date
                                      </Label>
                                      <Input
                                        value={project.startDate || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.projects || []),
                                          ];
                                          updated[index] = {
                                            ...project,
                                            startDate: e.target.value,
                                          };
                                          updateContent({ projects: updated });
                                        }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="MM/YYYY"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        End Date
                                      </Label>
                                      <Input
                                        value={project.endDate || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.projects || []),
                                          ];
                                          updated[index] = {
                                            ...project,
                                            endDate: e.target.value,
                                          };
                                          updateContent({ projects: updated });
                                        }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="MM/YYYY or Present"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Description
                                    </Label>
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
                                      value={
                                        typeof project.technologies === "string"
                                          ? project.technologies
                                          : (project.technologies || []).join(
                                            ", ",
                                          )
                                      }
                                      onChange={(e) => {
                                        const updated = [
                                          ...(resume.content.projects || []),
                                        ];
                                        updated[index] = {
                                          ...project,
                                          technologies: e.target.value,
                                        };
                                        updateContent({ projects: updated });
                                      }}
                                      onKeyDown={(e) => e.stopPropagation()}
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
                                    Remove Project
                                  </Button>
                                </div>
                              ),
                            )}
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
                                      link: "",
                                      startDate: "",
                                      endDate: "",
                                      description: "",
                                      technologies: "",
                                    },
                                  ],
                                });
                              }}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Project
                            </Button>
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                                : null,
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
                                                : null,
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
                                                : null,
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
                                                : null,
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
                                                : null,
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
                                                : null,
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
                                                    (_, i) => i !== index,
                                                  ) || [],
                                              },
                                            }
                                            : null,
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
                              },
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
                                          ...(prev.content.certificates ||
                                            []),
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
                                    : null,
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                    : null,
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
                    const customSectionData =
                      resume?.content.customSections?.find(
                        (cs: any) => cs.id === section.id,
                      );
                    const customContent = customSectionData?.content || "";

                    return (
                      <Card
                        key={section.id}
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
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
                                      section.title,
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
                              key={`${section.id}-${customContent.length > 0 ? "loaded" : "empty"
                                }`}
                              value={customContent}
                              onChange={(html) => {
                                if (!resume) return;
                                const currentCustomSections =
                                  resume.content.customSections || [];
                                const existingIndex =
                                  currentCustomSections.findIndex(
                                    (cs: any) => cs.id === section.id,
                                  );

                                let updatedCustomSections;
                                if (existingIndex >= 0) {
                                  updatedCustomSections = [
                                    ...currentCustomSections,
                                  ];
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

                  // Column Placeholder Section - for column alignment and even distribution
                  if (section.type === "spacer") {
                    return (
                      <Card
                        key={section.id}
                        className={`border transition-all ${dragOverId === section.id &&
                          draggedSection !== section.id
                          ? "border-purple-400 border-2 shadow-md"
                          : ""
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
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
                              <p>
                                Column Placeholder for column alignment (5px
                                margin)
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Use this to evenly distribute sections in
                                columns
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                    : null,
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                  ? resume.content.languages.map(
                                    (lang: any) => ({
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
                                    }),
                                  )
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                            {(resume.content.awards || []).map(
                              (award, index) => (
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
                                              : null,
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="Employee of the Year"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Issuer *
                                      </Label>
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
                                              : null,
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
                                              : null,
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
                                              : null,
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
                                                  (_, i) => i !== index,
                                                ) || [],
                                            },
                                          }
                                          : null,
                                      );
                                      setHasChanges(true);
                                    }}
                                    className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </Button>
                                </div>
                              ),
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
                                    : null,
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                            ...(resume.content.references ||
                                              []),
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
                                              : null,
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
                                            ...(resume.content.references ||
                                              []),
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
                                              : null,
                                          );
                                          setHasChanges(true);
                                        }}
                                        className="mt-1 h-9 text-sm"
                                        placeholder="Engineering Manager"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Company *
                                      </Label>
                                      <Input
                                        value={ref.company}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(resume.content.references ||
                                              []),
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
                                              : null,
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
                                            ...(resume.content.references ||
                                              []),
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
                                              : null,
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
                                            ...(resume.content.references ||
                                              []),
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
                                              : null,
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
                                                  (_, i) => i !== index,
                                                ) || [],
                                            },
                                          }
                                          : null,
                                      );
                                      setHasChanges(true);
                                    }}
                                    className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </Button>
                                </div>
                              ),
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
                                    : null,
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                            (c: any) => c.id !== course.id,
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
                                                  ? {
                                                    ...c,
                                                    name: e.target.value,
                                                  }
                                                  : c,
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
                                                    institution:
                                                      e.target.value,
                                                  }
                                                  : c,
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
                                          resume.content.courses?.map(
                                            (c: any) =>
                                              c.id === course.id
                                                ? { ...c, date: e.target.value }
                                                : c,
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
                                          resume.content.courses?.map(
                                            (c: any) =>
                                              c.id === course.id
                                                ? {
                                                  ...c,
                                                  description: html,
                                                }
                                                : c,
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
                              ),
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                            (o: any) => o.id !== org.id,
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
                                                  ? {
                                                    ...o,
                                                    name: e.target.value,
                                                  }
                                                  : o,
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
                                                  ? {
                                                    ...o,
                                                    role: e.target.value,
                                                  }
                                                  : o,
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
                                                  : o,
                                            );
                                          updateContent({
                                            organisations: updatedOrganisations,
                                          });
                                        }}
                                        placeholder="e.g., Jan 2020"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        End Date
                                      </Label>
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
                                                  : o,
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
                                                : o,
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
                              ),
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
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, section.id)}
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
                                      section.title,
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
                                            (p: any) => p.id !== pub.id,
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
                                                ? {
                                                  ...p,
                                                  title: e.target.value,
                                                }
                                                : p,
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
                                      <Label className="text-xs">
                                        Publisher
                                      </Label>
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
                                                  : p,
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
                                                  ? {
                                                    ...p,
                                                    date: e.target.value,
                                                  }
                                                  : p,
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
                                                : p,
                                          );
                                        updateContent({
                                          publications: updatedPublications,
                                        });
                                      }}
                                      placeholder="e.g., https://doi.org/10.1109/..."
                                    />
                                  </div>
                                </div>
                              ),
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
                          type: "projects" as const,
                          label: "Projects",
                          icon: "💼",
                        },
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
                        {
                          type: "awards" as const,
                          label: "Awards",
                          icon: "🏆",
                        },
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
                          label: "Column Placeholder",
                          icon: "↔️",
                        },
                        {
                          type: "custom" as const,
                          label: "Custom Section",
                          icon: "📝",
                        },
                      ].map((section) => {
                        // Allow multiple spacers and custom sections, but prevent duplicates of other sections
                        const allowMultiple =
                          section.type === "spacer" ||
                          section.type === "custom";
                        const alreadyAdded = allowMultiple
                          ? false // Always allow adding spacers and custom sections
                          : sections.find(
                            (s) => s.type === section.type && s.visible,
                          );
                        return (
                          <Button
                            key={section.type}
                            variant="outline"
                            size="sm"
                            className={`text-xs justify-start ${alreadyAdded
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

        {/* Right Panel: Preview (on top on mobile) */}
        <div className="order-1 flex min-h-0 w-full flex-1 flex-col overflow-auto border-b border-gray-200 bg-gray-100 md:order-none md:w-1/2 md:border-b-0">
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
                key={`resume-preview-${previewKey}`}
                resume={resume}
                template={template}
                sections={sections}
                layout={layout || undefined}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
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

      {/* Delete Section Confirmation Dialog */}
      <ChangeTemplateDialog
        open={changeTemplateOpen}
        onOpenChange={setChangeTemplateOpen}
        currentTemplateId={resume?.templateId}
        onSelectTemplate={handleChangeTemplate}
        applying={changingTemplate}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={
          sectionToDelete &&
            ["personalInfo", "experience", "education"].includes(
              sectionToDelete.type,
            )
            ? "Cannot Delete Essential Section"
            : "Delete Section"
        }
        description={
          sectionToDelete &&
            ["personalInfo", "experience", "education"].includes(
              sectionToDelete.type,
            )
            ? "Cannot delete essential sections like Personal Info, Experience, and Education. These sections are required for your resume."
            : `Are you sure you want to delete the "${sectionToDelete?.title}" section? This action cannot be undone.`
        }
        confirmText={
          sectionToDelete &&
            ["personalInfo", "experience", "education"].includes(
              sectionToDelete.type,
            )
            ? "OK"
            : "Delete"
        }
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant={
          sectionToDelete &&
            ["personalInfo", "experience", "education"].includes(
              sectionToDelete.type,
            )
            ? "default"
            : "destructive"
        }
      />
    </div>
  );
}
