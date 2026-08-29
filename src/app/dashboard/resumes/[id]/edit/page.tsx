"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type SetStateAction,
} from "react";
import "@/styles/mercury-template.css";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
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
  Eye,
  Edit,
  X,
  Check,
  Palette,
  Upload,
  LayoutGrid,
  Undo2,
  Redo2,
  RefreshCw,
  Target,
} from "lucide-react";
import { Resume, ResumeTemplate, resumeApi, apiClient } from "@/lib/api";
import {
  normalizeExperienceList,
} from "@/lib/resume-date-utils";
import {
  ensureResumePersonalInfo,
  normalizeProjectsList,
} from "@/lib/resume-data-import";
import { isATSReportV3 } from "@/types/atsReport";
import { ResumePreview, type ResumePreviewHandle } from "@/components/ResumePreview";
import { RichTextEditor } from "@/components/RichTextEditor";
import { getExtendedTemplate } from "@/lib/templateConfigs";
import { getTemplateStyle } from "@/lib/templateRenderer";
import { ExecutiveSkills } from "@/components/resume-editor/ExecutiveSkills";
import { LayoutTypographyControls } from "@/components/resume-editor/LayoutTypographyControls";
import { LayoutPaddingControls } from "@/components/resume-editor/LayoutPaddingControls";
import { RESUME_FIELD_INPUT_CLASS } from "@/components/resume-editor/resumeFieldStyles";
import {
  resumeAddSectionButton,
  resumeAddSectionsCard,
  resumeAtsScoreShell,
  resumeAtsScoreTone,
  resumeEditorFormArea,
  resumeEditorPage,
  resumeEditorPanel,
  resumeEditorPanelMobileSheet,
  resumeEditorMobileOverlay,
  resumeEditorToolbarMobile,
  resumeEditorTabActive,
  resumeEditorTabBase,
  resumeEditorTabInactive,
  resumeEditorTabsRow,
  resumeEditorToolbar,
  resumeEditorToolbarInner,
  resumeEntryCard,
  resumePreviewHeader,
  resumePreviewPanel,
  resumePreviewPanelMobile,
  resumePrimaryCta,
  resumeSaveButton,
  resumeSectionCardClass,
  resumeSectionContent,
  resumeSectionHeader,
} from "@/components/resume-editor/resumeEditorStyles";
import { cn } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LanguagesEditor } from "@/components/LanguagesEditor";
import { captureAndUploadThumbnail } from "@/lib/resume-thumbnail";
import { generateResumePdfViaServer } from "@/lib/resume-pdf-export";
import {
  mergeLayoutPaddingWithTemplateStyle,
  resolveLayoutPaddingMm,
} from "@/lib/resume-page-dimensions";
import { ATSReportView } from "@/components/ats-checker/ATSReportView";
import { TrialUpsellDialog } from "@/components/upsell/TrialUpsellDialog";
import { useEntitlements } from "@/hooks/useEntitlements";
import { applyAtsIssueFixToResume } from "@/lib/atsIssueApply";
import {
  assignSectionColumnOnReorder,
  toSectionOrderPayload,
  type SectionWithColumn,
} from "@/lib/sectionColumnUtils";
import { ProfilePictureCropper } from "@/components/ProfilePictureCropper";
import { ChangeTemplateDialog } from "@/components/resume-editor/ChangeTemplateDialog";
import { MatchJobDescriptionDialog } from "@/components/resume-editor/MatchJobDescriptionDialog";
import { ImportResumeDialog } from "@/components/resume-editor/ImportResumeDialog";
import { RearrangeSectionsDialog } from "@/components/resume-editor/RearrangeSectionsDialog";
import { ResumeSectionCardHeader } from "@/components/resume-editor/ResumeSectionCardHeader";
import { ExperienceEntriesEditor } from "@/components/resume-editor/ExperienceEntriesEditor";
import { SectionNameField } from "@/components/resume-editor/SectionNameField";
import {
  ResumeEditorMobileChrome,
  ResumeEditorMobileEditBar,
} from "@/components/resume-editor/ResumeEditorMobileChrome";
import { ResumeEditorTitle } from "@/components/resume-editor/ResumeEditorTitle";
import { TemplateStyleLoader } from "@/components/TemplateStyleLoader";
import {
  canDeleteEmptyResumePage,
  isEmptyResumePageBand,
} from "@/lib/resume-page-delete";
import type { ResumePaginationSnapshot } from "@/components/PaginatedPreview";
import { buildResumeTemplateApplication } from "@/lib/applyResumeTemplate";
import { debugResumePagination } from "@/lib/debug-resume-pagination";
import { waitForResumePaginationSettled } from "@/lib/wait-for-resume-pagination";
import { useResumeEditorHistory } from "@/hooks/useResumeEditorHistory";
import { useMobileResumeEditor } from "@/hooks/useMobileResumeEditor";
import type { ResumeEditorLayout } from "@/lib/resume-editor-history";

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
  column?: "left" | "right";
}

function expandOnlySection(
  sections: Section[],
  expandedId: string | null,
): Section[] {
  return sections.map((s) => ({
    ...s,
    expanded: expandedId !== null && s.id === expandedId,
  }));
}

function withFirstVisibleExpanded(sections: Section[]): Section[] {
  let expandedAssigned = false;
  return sections.map((s) => {
    if (s.visible && !expandedAssigned) {
      expandedAssigned = true;
      return { ...s, expanded: true };
    }
    return { ...s, expanded: false };
  });
}

/**
 * Coerce an experience/project description (string or array) into HTML suitable
 * for the rich-text editor. Mirrors ResumeRenderer: a single array element that
 * is already a list (<ul>/<ol>) is passed through as-is, so tailored content
 * stored as ["<ul>...</ul>"] is not wrapped into invalid `<p><ul>...</ul></p>`.
 */
function descriptionToEditorHtml(description: unknown): string {
  if (typeof description === "string") return description;
  if (Array.isArray(description)) {
    const items = description.map((d) => String(d).trim()).filter(Boolean);
    if (items.length === 0) return "";
    if (
      items.length === 1 &&
      (/<ul[\s>]/i.test(items[0]) || /<ol[\s>]/i.test(items[0]))
    ) {
      return items[0];
    }
    return items.map((item) => `<p>${item}</p>`).join("");
  }
  return description == null ? "" : String(description);
}

export default function EditResumePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const resumeId = params.id as string;
  const showImprovedBanner = searchParams.get("improved") === "1";

  const [mounted, setMounted] = useState(false);
  const [resume, setResumeState] = useState<Resume | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [trialUpsellOpen, setTrialUpsellOpen] = useState(false);
  const { canUse, data: entitlements } = useEntitlements();
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [refreshingATS, setRefreshingATS] = useState(false);
  const [displayAtsScore, setDisplayAtsScore] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [profilePictureFileName, setProfilePictureFileName] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  // Bumped whenever content is applied wholesale (import / JD tailoring) so the
  // per-row rich-text editors remount and re-seed from the new values instead
  // of keeping their stale TipTap document.
  const [applyNonce, setApplyNonce] = useState(0);
  const previewRef = useRef<ResumePreviewHandle>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [layout, setLayoutState] = useState<{
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
    dismissedEmptyTrailingPages?: number;
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

  const fontFamilyOptions = useMemo(() => {
    const current = effectiveTypography?.fontFamily;
    if (!current) return FONT_FAMILY_OPTIONS;
    if (FONT_FAMILY_OPTIONS.some((opt) => opt.value === current)) {
      return FONT_FAMILY_OPTIONS;
    }
    const shortLabel =
      current
        .split(",")[0]
        ?.replace(/^['"]|['"]$/g, "")
        .trim() || "Custom";
    return [{ value: current, label: shortLabel }, ...FONT_FAMILY_OPTIONS];
  }, [effectiveTypography?.fontFamily]);

  const selectedFontFamily = useMemo(() => {
    const current = effectiveTypography?.fontFamily;
    if (!current) return FONT_FAMILY_OPTIONS[0].value;
    const exact = fontFamilyOptions.find((opt) => opt.value === current);
    return exact?.value ?? FONT_FAMILY_OPTIONS[0].value;
  }, [effectiveTypography?.fontFamily, fontFamilyOptions]);

  /** Keep preview/PDF aligned when template state updates before resume syncs from API. */
  const previewResume = useMemo(() => {
    if (!resume || !template) return resume;
    if (resume.templateId === template.id) return resume;
    return { ...resume, templateId: template.id };
  }, [resume, template]);

  // Initialize sections as empty - will be populated from database
  const [sections, setSectionsState] = useState<Section[]>([]);
  const [viewMode, setViewMode] = useState<"edit" | "ats">("edit");
  const mobileEditor = useMobileResumeEditor();
  const {
    isMobile,
    sectionPickerOpen,
    setSectionPickerOpen,
    editingSectionId,
    editingLayout,
    editingAddSections,
    mobileEditOpen,
    openSectionPicker,
    startSectionEdit,
    startLayoutEdit,
    startAddSectionsEdit,
    finishMobileEdit,
    returnToSectionPicker,
    closeMobileEditing,
  } = mobileEditor;
  const showMobileEditPanel =
    isMobile && (mobileEditOpen || viewMode === "ats");

  useEffect(() => {
    if (isMobile && editingLayout) {
      setLayoutExpanded(true);
    }
  }, [isMobile, editingLayout]);

  // Delete section dialog state
  const [changeTemplateOpen, setChangeTemplateOpen] = useState(false);
  const [changingTemplate, setChangingTemplate] = useState(false);
  const [importResumeOpen, setImportResumeOpen] = useState(false);
  const [rearrangeSectionsOpen, setRearrangeSectionsOpen] = useState(false);
  const [matchJobOpen, setMatchJobOpen] = useState(false);
  const [matchingJob, setMatchingJob] = useState(false);
  // Remembers the JD last used to tailor this session so reopening the dialog
  // reflects the latest input instead of the stale creation-time JD.
  const [lastMatchedJd, setLastMatchedJd] = useState<string | null>(null);
  // Confirmation before the (irreversible-after-reload) overwrite tailoring.
  const [confirmMatchOpen, setConfirmMatchOpen] = useState(false);
  const [pendingMatchJd, setPendingMatchJd] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{
    id: string;
    title: string;
    type: string;
  } | null>(null);
  const [pageDeleteDialogOpen, setPageDeleteDialogOpen] = useState(false);
  const [pendingPageDelete, setPendingPageDelete] = useState<{
    pageNumber: number;
  } | null>(null);
  const paginationSnapshotRef = useRef<ResumePaginationSnapshot>({
    pages: [],
    rawPages: [],
    pageUnits: [],
    measureRoot: null,
    isCalculated: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoaded && user && resumeId) {
      localStorage.setItem("clerk-user-id", user.id);
      loadResume();
    }
  }, [mounted, isLoaded, user, resumeId]);

  useEffect(() => {
    if (searchParams.get("view") === "ats") {
      setViewMode("ats");
    }
  }, [searchParams]);

  // Track dragging state
  const isDraggingRef = useRef(false);
  const isThumbnailUploadingRef = useRef(false);
  const autoThumbnailAttemptsRef = useRef(0);
  const MAX_AUTO_THUMBNAIL_ATTEMPTS = 3;
  const resumeRef = useRef(resume);
  const layoutRef = useRef(layout);
  const sectionsRef = useRef(sections);
  const hasChangesRef = useRef(hasChanges);

  useEffect(() => {
    resumeRef.current = resume;
  }, [resume]);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  const editorHistory = useResumeEditorHistory();
  const isApplyingHistoryRef = useRef(false);
  const suppressHistoryRef = useRef(false);
  const historyTransactionDepthRef = useRef(0);
  const contentEditHistoryPendingRef = useRef(false);
  const contentEditHistoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const getEditorSnapshot = useCallback(() => {
    const currentResume = resumeRef.current;
    const currentLayout = layoutRef.current;
    const currentSections = sectionsRef.current;
    if (!currentResume || !currentLayout) {
      throw new Error("Resume editor snapshot is not ready");
    }
    return {
      resume: currentResume,
      sections: currentSections,
      layout: currentLayout as ResumeEditorLayout,
    };
  }, []);

  const shouldRecordHistory = useCallback(() => {
    return (
      !isApplyingHistoryRef.current &&
      !suppressHistoryRef.current &&
      historyTransactionDepthRef.current === 0 &&
      !!resumeRef.current &&
      !!layoutRef.current
    );
  }, []);

  const recordImmediateHistory = useCallback(() => {
    if (!shouldRecordHistory()) return;
    editorHistory.record(getEditorSnapshot());
  }, [editorHistory, getEditorSnapshot, shouldRecordHistory]);

  const recordDebouncedHistory = useCallback(() => {
    if (!shouldRecordHistory()) return;
    if (!contentEditHistoryPendingRef.current) {
      recordImmediateHistory();
      contentEditHistoryPendingRef.current = true;
    }
    if (contentEditHistoryTimerRef.current) {
      clearTimeout(contentEditHistoryTimerRef.current);
    }
    contentEditHistoryTimerRef.current = setTimeout(() => {
      contentEditHistoryPendingRef.current = false;
      contentEditHistoryTimerRef.current = null;
    }, 800);
  }, [recordImmediateHistory, shouldRecordHistory]);

  const beginHistoryTransaction = useCallback(() => {
    if (historyTransactionDepthRef.current === 0) {
      recordImmediateHistory();
    }
    historyTransactionDepthRef.current += 1;
  }, [recordImmediateHistory]);

  const endHistoryTransaction = useCallback(() => {
    historyTransactionDepthRef.current = Math.max(
      0,
      historyTransactionDepthRef.current - 1,
    );
  }, []);

  const setResume = useCallback(
    (action: SetStateAction<Resume | null>) => {
      recordDebouncedHistory();
      setResumeState(action);
    },
    [recordDebouncedHistory],
  );

  const setSections = useCallback(
    (action: SetStateAction<Section[]>) => {
      if (shouldRecordHistory() && !isDraggingRef.current) {
        recordImmediateHistory();
      }
      setSectionsState(action);
    },
    [recordImmediateHistory, shouldRecordHistory],
  );

  const setLayout = useCallback(
    (action: SetStateAction<typeof layout>) => {
      if (shouldRecordHistory()) {
        recordImmediateHistory();
      }
      setLayoutState(action);
    },
    [recordImmediateHistory, shouldRecordHistory],
  );

  const invalidateAtsScoreDisplay = useCallback(() => {
    setDisplayAtsScore(null);
  }, []);

  const syncAtsScoreDisplayFromResume = useCallback((resumeData: Resume | null) => {
    setDisplayAtsScore(
      resumeData && typeof resumeData.atsScore === "number"
        ? resumeData.atsScore
        : null,
    );
  }, []);

  const bumpPreviewKey = useCallback((reason: string) => {
    setPreviewKey((prev) => {
      const next = prev + 1;
      debugResumePagination("previewKey:bump", { reason, next });
      return next;
    });
  }, []);

  const handleRearrangeDialogOpenChange = useCallback((open: boolean) => {
    setRearrangeSectionsOpen(open);
  }, []);

  const applyEditorSnapshot = useCallback(
    (snapshot: ReturnType<typeof getEditorSnapshot>) => {
      isApplyingHistoryRef.current = true;
      setResumeState(snapshot.resume);
      setSectionsState(snapshot.sections as Section[]);
      setLayoutState(snapshot.layout);
      resumeRef.current = snapshot.resume;
      sectionsRef.current = snapshot.sections;
      layoutRef.current = snapshot.layout;
      setHasChanges(true);
      invalidateAtsScoreDisplay();
      bumpPreviewKey("history");
      requestAnimationFrame(() => {
        isApplyingHistoryRef.current = false;
      });
    },
    [bumpPreviewKey, invalidateAtsScoreDisplay],
  );

  const handleUndo = useCallback(() => {
    try {
      const snapshot = editorHistory.undo(getEditorSnapshot());
      if (!snapshot) return;
      applyEditorSnapshot({
        resume: snapshot.resume,
        sections: snapshot.sections as Section[],
        layout: snapshot.layout,
      });
    } catch {
      // Snapshot not ready yet.
    }
  }, [applyEditorSnapshot, editorHistory, getEditorSnapshot]);

  const handleRedo = useCallback(() => {
    try {
      const snapshot = editorHistory.redo(getEditorSnapshot());
      if (!snapshot) return;
      applyEditorSnapshot({
        resume: snapshot.resume,
        sections: snapshot.sections as Section[],
        layout: snapshot.layout,
      });
    } catch {
      // Snapshot not ready yet.
    }
  }, [applyEditorSnapshot, editorHistory, getEditorSnapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if (
        (event.key.toLowerCase() === "z" && event.shiftKey) ||
        event.key.toLowerCase() === "y"
      ) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRedo, handleUndo]);

  const persistResumeToServer = useCallback(
    async (resumeSnapshot: Resume) => {
      const currentLayout = layoutRef.current;
      const currentSections = sectionsRef.current;
      if (!currentLayout || currentSections.length === 0) {
        throw new Error("Resume layout not ready");
      }

      const sectionOrderData = toSectionOrderPayload(currentSections);

      await resumeApi.update(resumeId, {
        title: resumeSnapshot.title,
        templateId: resumeSnapshot.templateId,
        content: resumeSnapshot.content,
        profileSummary: resumeSnapshot.profileSummary,
        sectionOrder: sectionOrderData,
        layout: currentLayout,
      });

      setHasChanges(false);
      setLastSaved(new Date());
    },
    [resumeId],
  );

  const ensureResumePersisted = useCallback(async () => {
    const current = resumeRef.current;
    if (!current || !hasChangesRef.current) return;
    await persistResumeToServer(current);
  }, [persistResumeToServer]);

  const applyAtsReportUpdate = useCallback((updatedResume: Resume) => {
    setResumeState((prev) =>
      prev
        ? {
            ...prev,
            atsScore: updatedResume.atsScore,
            atsFeedback: updatedResume.atsFeedback,
            atsImprovementMeta: updatedResume.atsImprovementMeta,
            atsScoringContext:
              updatedResume.atsScoringContext ?? prev.atsScoringContext,
          }
        : prev,
    );
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
          setResumeState((prev) => {
            if (!prev || !hasChangesRef.current) return updatedResume;
            return {
              ...updatedResume,
              templateId: prev.templateId,
              layout: prev.layout ?? updatedResume.layout,
              content: prev.content,
              profileSummary: prev.profileSummary,
              title: prev.title,
              sectionOrder: prev.sectionOrder,
              pdfS3Key: prev.pdfS3Key,
            };
          });
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
  const thumbnailS3Key = resume?.thumbnailS3Key;
  useEffect(() => {
    if (!mounted || loading || !resume || !template || !resumeId) return;
    if (thumbnailS3Key) return;
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
    resumeId,
    template,
    thumbnailS3Key,
    triggerThumbnailCapture,
    resume,
  ]);

  // Autosave only when the user has unsaved edits — not on ATS/thumbnail resume syncs.
  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    const autoSaveTimer = setTimeout(async () => {
      const currentResume = resumeRef.current;
      const currentLayout = layoutRef.current;
      const currentSections = sectionsRef.current;

      if (!currentResume || !currentLayout || currentSections.length === 0) {
        return;
      }

      try {
        setAutoSaving(true);
        const sectionOrderData = toSectionOrderPayload(currentSections);

        await resumeApi.update(resumeId, {
          title: currentResume.title,
          templateId: currentResume.templateId,
          content: currentResume.content,
          profileSummary: currentResume.profileSummary,
          sectionOrder: sectionOrderData,
          layout: currentLayout,
        });

        setHasChanges(false);
        setLastSaved(new Date());
        await triggerThumbnailCapture(resumeId, { force: true });
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        setAutoSaving(false);
      }
    }, 5000);

    return () => clearTimeout(autoSaveTimer);
  }, [hasChanges, resumeId, triggerThumbnailCapture]);

  const loadResume = async () => {
    try {
      debugResumePagination("loadResume:start", { resumeId });
      setLoading(true);
      suppressHistoryRef.current = true;
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

      if (Array.isArray(resumeData.content.experience)) {
        resumeData.content.experience = normalizeExperienceList(
          resumeData.content.experience,
        ) as Resume["content"]["experience"];
      }

      ensureResumePersonalInfo(
        resumeData.content as unknown as Record<string, unknown>,
      );

      setResumeState(resumeData);
      syncAtsScoreDisplayFromResume(resumeData);

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

      // Load template CSS + config before preview renders
      if (resumeData.templateId) {
        const { TemplateLoader } = await import("@/lib/templateLoader");
        await TemplateLoader.loadTemplate(resumeData.templateId);
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

      // Repair layout/section columns when saved data doesn't match the template
      // (e.g. clean-slate incorrectly persisted as single-column).
      if (foundTemplate) {
        try {
          const expected = await buildResumeTemplateApplication(
            resumeData.templateId,
            {
              content: resumeData.content,
              sectionOrder: resumeData.sectionOrder,
            },
          );
          const savedLayoutType = resumeData.layout?.type ?? "single";
          const expectedLayoutType = expected.layout.type;
          const sectionsMissingColumns =
            expectedLayoutType === "double" &&
            (resumeData.sectionOrder ?? []).some(
              (section) =>
                section.type !== "personalInfo" &&
                section.visible !== false &&
                !section.column,
            );

          if (
            savedLayoutType !== expectedLayoutType ||
            sectionsMissingColumns
          ) {
            resumeData.layout = expected.layout;
            resumeData.sectionOrder = expected.sectionOrder;
            void resumeApi
              .update(resumeId, {
                layout: expected.layout,
                sectionOrder: expected.sectionOrder,
              })
              .catch((error) => {
                console.error("Error repairing template layout:", error);
              });
          }
        } catch (error) {
          console.error("Could not verify template layout:", error);
        }
      }

      // Load layout from database or use default
      if (resumeData.layout) {
        // For Mercury template, ensure 20mm left/right padding
        const defaultPadding =
          resumeData.templateId === "mercury"
            ? { top: 20, bottom: 20, left: 20, right: 20 }
            : { top: 8, bottom: 8, left: 8, right: 8 };

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
          dismissedEmptyTrailingPages:
            (resumeData.layout as { dismissedEmptyTrailingPages?: number })
              .dismissedEmptyTrailingPages ?? 0,
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

        // Saffron Line: enforce double-column layout (padding stays user-controlled)
        if (resumeData.templateId === "saffron-line" && resumeData.layout) {
          const needsLayoutRepair =
            resumeData.layout.type !== "double" ||
            resumeData.layout.columnWidths?.left !== 36 ||
            resumeData.layout.columnWidths?.right !== 64;

          if (needsLayoutRepair) {
            const updatedLayout = {
              ...resumeData.layout,
              type: "double" as const,
              columnWidths: { left: 36, right: 64 },
            };
            setLayout(updatedLayout as typeof layout);
            void resumeApi
              .update(resumeId, { layout: updatedLayout })
              .catch((error) => {
                console.error("Error updating saffron-line layout:", error);
              });
          }
        }

        // Confident Grid: enforce header + 50/50 body layout
        if (resumeData.templateId === "confident-grid" && resumeData.layout) {
          const needsLayoutRepair =
            resumeData.layout.type !== "double" ||
            resumeData.layout.columnWidths?.left !== 50 ||
            resumeData.layout.columnWidths?.right !== 50;

          if (needsLayoutRepair) {
            const updatedLayout = {
              ...resumeData.layout,
              type: "double" as const,
              columnWidths: { left: 50, right: 50 },
            };
            setLayout(updatedLayout as typeof layout);
            void resumeApi
              .update(resumeId, { layout: updatedLayout })
              .catch((error) => {
                console.error("Error updating confident-grid layout:", error);
              });
          }
        }
      } else {
        // Set default layout if not provided
        const defaultPadding =
          resumeData.templateId === "mercury"
            ? { top: 20, bottom: 20, left: 20, right: 20 }
            : { top: 8, bottom: 8, left: 8, right: 8 };

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
        const loadedSections = withFirstVisibleExpanded(
          resumeData.sectionOrder.map((s) => ({
            ...s,
            expanded: false,
          })) as Section[],
        );

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
          setResumeState(resumeData);

          // Immediately save missing custom sections to database to prevent data loss on reload
          (async () => {
            try {
              const sectionOrderData = toSectionOrderPayload(loadedSections);

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
          setResumeState((prevResume) => {
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
              return withFirstVisibleExpanded(
                extendedTemplate.defaultSectionOrder.map((section) => ({
                  ...section,
                  type: section.type as Section["type"],
                  expanded: false,
                })),
              );
            }
          }

          // Fallback to generic default sections
          return withFirstVisibleExpanded([
            {
              id: "personalInfo",
              type: "personalInfo",
              title: "Personal Information",
              visible: true,
              expanded: false,
            },
            {
              id: "profileSummary",
              type: "profileSummary",
              title: "Profile Summary",
              visible: true,
              expanded: false,
            },
            {
              id: "experience",
              type: "experience",
              title: "Experience",
              visible: true,
              expanded: false,
            },
            {
              id: "education",
              type: "education",
              title: "Education",
              visible: true,
              expanded: false,
            },
            {
              id: "skills",
              type: "skills",
              title: "Skills",
              visible: true,
              expanded: false,
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
          ]);
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
      suppressHistoryRef.current = false;
      editorHistory.clear();
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume) return;

    try {
      setSaving(true);
      const sectionOrderData = toSectionOrderPayload(sections);

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
      setLastSaved(new Date());
      await triggerThumbnailCapture(resumeId, { force: true });
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

      const templateApplication = await buildResumeTemplateApplication(
        newTemplateId,
        { content: resume.content, sectionOrder: resume.sectionOrder },
      );

      const nextLayout = templateApplication.layout;
      const sectionOrderData = templateApplication.sectionOrder;

      const byId = new Map(sections.map((s) => [s.id, s]));
      const byType = new Map<string, Section>();
      for (const s of sections) {
        if (!byType.has(s.type)) {
          byType.set(s.type, s);
        }
      }

      const nextSections = withFirstVisibleExpanded(
        (sectionOrderData || []).map((s) => {
          const match = byId.get(s.id) ?? byType.get(s.type);
          return {
            ...s,
            visible: match?.visible ?? s.visible,
            expanded: match?.expanded ?? false,
          } as Section;
        }),
      );

      const updatedResume: Resume = {
        ...resume,
        templateId: newTemplateId,
        layout: nextLayout,
        sectionOrder: sectionOrderData,
        pdfS3Key: undefined,
      };

      await resumeApi.update(resumeId, {
        title: updatedResume.title,
        templateId: newTemplateId,
        content: updatedResume.content,
        profileSummary: updatedResume.profileSummary,
        sectionOrder: sectionOrderData,
        layout: nextLayout,
        pdfS3Key: "",
      });

      // History snapshotting is best-effort — never let it fail the (already
      // persisted) template change.
      try {
        recordImmediateHistory();
      } catch (historyError) {
        console.warn(
          "Skipped history snapshot during template change:",
          historyError,
        );
      }
      suppressHistoryRef.current = true;

      setTemplate(newTemplate);
      setLayoutState(nextLayout as typeof layout);
      setSectionsState(nextSections);
      setResumeState(updatedResume);
      suppressHistoryRef.current = false;
      resumeRef.current = updatedResume;
      layoutRef.current = nextLayout as typeof layout;
      sectionsRef.current = nextSections;

      setChangeTemplateOpen(false);
      setLastSaved(new Date());
      bumpPreviewKey("templateChange");
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      console.error("Error changing template:", {
        newTemplateId,
        status: error?.response?.status,
        serverMessage,
        error,
      });
      alert(
        serverMessage
          ? `Failed to change template: ${serverMessage}`
          : "Failed to change template. Please try again.",
      );
    } finally {
      setChangingTemplate(false);
    }
  };

  const handleResumeImported = (updatedResume: Resume) => {
    recordImmediateHistory();
    suppressHistoryRef.current = true;

    if (Array.isArray(updatedResume.content.experience)) {
      updatedResume.content.experience = normalizeExperienceList(
        updatedResume.content.experience,
      ) as Resume["content"]["experience"];
    }

    if (Array.isArray(updatedResume.content.projects)) {
      updatedResume.content.projects = normalizeProjectsList(
        updatedResume.content.projects,
      ) as Resume["content"]["projects"];
    }

    ensureResumePersonalInfo(
      updatedResume.content as unknown as Record<string, unknown>,
    );

    setResumeState(updatedResume);
    resumeRef.current = updatedResume;

    if (updatedResume.sectionOrder?.length) {
      const loadedSections = withFirstVisibleExpanded(
        updatedResume.sectionOrder.map((s) => ({
          ...s,
          expanded: false,
        })) as Section[],
      );
      setSectionsState(loadedSections);
      sectionsRef.current = loadedSections;
    }

    if (updatedResume.layout) {
      setLayoutState(updatedResume.layout as typeof layout);
      layoutRef.current = updatedResume.layout as typeof layout;
    }

    suppressHistoryRef.current = false;

    setHasChanges(false);
    setLastSaved(new Date());
    invalidateAtsScoreDisplay();
    bumpPreviewKey("importResume");
    // Force per-row rich-text editors to remount so they pick up new content.
    setApplyNonce((prev) => prev + 1);
  };

  // Step 1: user submits the JD -> stage it and ask for confirmation, since
  // tailoring overwrites the current resume content.
  const handleRequestMatchJobDescription = (jobDescription: string) => {
    setPendingMatchJd(jobDescription);
    setConfirmMatchOpen(true);
  };

  // Step 2: confirmed -> run the tailoring/overwrite.
  const handleMatchJobDescription = async (jobDescription: string) => {
    if (!resume) return;

    // Remember this input so the dialog reflects it on reopen (overrides the
    // stale creation-time JD), even if the request below fails.
    setLastMatchedJd(jobDescription);

    try {
      setMatchingJob(true);
      const result = await resumeApi.tailorToJobDescription(resumeId, {
        jobDescription,
      });

      // Persist the tailored content plus the JD used, so a reload reflects the
      // latest job description (and ATS re-checks use it). Merge to keep any
      // retained rawPdfText.
      const nextAtsContext = {
        ...resume.atsScoringContext,
        lastJobDescription: jobDescription,
      };
      await resumeApi.update(resumeId, {
        content: result.content,
        profileSummary: result.profileSummary,
        sectionOrder: result.sectionOrder,
        atsScoringContext: nextAtsContext,
        pdfS3Key: "",
      });

      const updatedResume: Resume = {
        ...resume,
        content: result.content,
        profileSummary: result.profileSummary ?? resume.profileSummary,
        sectionOrder: result.sectionOrder,
        atsScoringContext: nextAtsContext,
        pdfS3Key: undefined,
      };

      handleResumeImported(updatedResume);
      setMatchJobOpen(false);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      console.error("Error tailoring resume to job description:", {
        status: error?.response?.status,
        serverMessage,
        error,
      });
      alert(
        serverMessage
          ? `Failed to tailor resume: ${serverMessage}`
          : "Failed to tailor resume to the job description. Please try again.",
      );
    } finally {
      setMatchingJob(false);
    }
  };

  const handleSectionsRearranged = (reordered: SectionWithColumn[]) => {
    beginHistoryTransaction();
    try {
      const withExpanded: Section[] = reordered.map((section) => {
        const existing = sections.find((item) => item.id === section.id);
        if (!existing) {
          return {
            id: section.id,
            type: section.type as Section["type"],
            title: section.title,
            visible: section.visible,
            expanded: false,
            column: section.column,
          };
        }
        return {
          ...existing,
          title: section.title,
          visible: section.visible,
          column: section.column,
        };
      });

      setSectionsState(withExpanded);
      sectionsRef.current = withExpanded;
      setLayout((prev) =>
        prev
          ? { ...prev, dismissedEmptyTrailingPages: 0 }
          : prev,
      );
      setHasChanges(true);
    } finally {
      endHistoryTransaction();
    }
  };

  const handleCheckATS = async () => {
    const current = resumeRef.current;
    if (!current || !resumeId) return;

    try {
      setRefreshingATS(true);

      await ensureResumePersisted();

      const updatedResume = await resumeApi.recalculateATS(resumeId, {
        jobDescription: current.atsScoringContext?.lastJobDescription,
        rawPdfText: current.atsScoringContext?.rawPdfText,
      });

      applyAtsReportUpdate(updatedResume);
      setDisplayAtsScore(
        typeof updatedResume.atsScore === "number" ? updatedResume.atsScore : null,
      );

      const params = new URLSearchParams(searchParams.toString());
      params.delete("improved");
      if (viewMode === "ats") {
        params.set("view", "ats");
      }
      const query = params.toString();
      router.replace(
        query
          ? `/dashboard/resumes/${resumeId}/edit?${query}`
          : `/dashboard/resumes/${resumeId}/edit`,
        { scroll: false },
      );
    } catch (error) {
      console.error("Error checking ATS score:", error);
      alert("Failed to check ATS score. Please try again.");
    } finally {
      setRefreshingATS(false);
    }
  };

  const handleRunJobMatch = async (jobDescription: string) => {
    const current = resumeRef.current;
    if (!current || !resumeId) return;

    try {
      setRefreshingATS(true);

      await ensureResumePersisted();

      const updatedResume = await resumeApi.recalculateATS(resumeId, {
        jobDescription,
        rawPdfText: current.atsScoringContext?.rawPdfText,
      });

      applyAtsReportUpdate(updatedResume);
      setDisplayAtsScore(
        typeof updatedResume.atsScore === "number" ? updatedResume.atsScore : null,
      );
    } catch (error) {
      console.error("Error running Job Match analysis:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to run Job Match analysis. Please try again.");
    } finally {
      setRefreshingATS(false);
    }
  };

  const handleApplyAtsIssueFix = useCallback(
    (original: string, improved: string) => {
      const current = resumeRef.current;
      if (!current) return false;
      const next = applyAtsIssueFixToResume(current, original, improved);
      if (!next) return false;
      resumeRef.current = next;
      setResume(next);
      setHasChanges(true);
      invalidateAtsScoreDisplay();
      return true;
    },
    [],
  );

  const handleIgnoreATSIssue = useCallback(
    async (
      check: import("@/types/atsReport").ATSCheckResult,
      issue: import("@/types/atsReport").ATSIssue,
    ) => {
      if (!resumeId) return;
      const updated = await resumeApi.ignoreATSIssue(resumeId, {
        checkId: check.id,
        issue,
      });
      setResumeState((prev) =>
        prev
          ? {
              ...prev,
              atsScore: updated.atsScore,
              atsFeedback: updated.atsFeedback,
              atsIgnoredIssues: updated.atsIgnoredIssues,
            }
          : prev,
      );
      setDisplayAtsScore(
        typeof updated.atsScore === "number" ? updated.atsScore : null,
      );
    },
    [resumeId],
  );

  const handleDownload = async () => {
    if (!canUse("resumeDownload")) {
      setTrialUpsellOpen(true);
      return;
    }
    try {
      setDownloading(true);
      await ensureResumePersisted();
      debugResumePagination("download:start", { resumeId, zoomLevel });

      const previewContainerId = `resume-preview-container-${resumeId}`;
      await waitForResumePaginationSettled(previewContainerId);

      // Get ALL page elements (we now have multiple pages)
      // Use unique ID per resume to avoid conflicts
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
          template?.id ?? resumeRef.current?.templateId ?? resume?.templateId ?? "classic";
        const pdfTemplate =
          template ??
          ({
            id: templateId,
          } as ResumeTemplate);
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
            setResumeState(updatedResume);
          } else {
            console.error("❌ Failed to upload thumbnail:", result.error);
          }
        } catch (error) {
          console.error("❌ Error capturing thumbnail:", error);
        }
      }, 8000); // Extended delay to ensure profile pictures and all images are fully loaded
    } catch (error: unknown) {
      console.error("Error generating PDF:", error);
      const err = error as {
        response?: { status?: number; data?: { gate?: string } };
      };
      if (err.response?.status === 403) {
        setTrialUpsellOpen(true);
        return;
      }
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const updateContent = (updates: Partial<Resume["content"]>) => {
    if (!resume) return;

    recordDebouncedHistory();

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

    setResumeState({
      ...resume,
      content: mergedContent,
    });
    setHasChanges(true);
    invalidateAtsScoreDisplay();
  };

  const toggleSection = (sectionId: string) => {
    setSections((prev) => {
      const target = prev.find((s) => s.id === sectionId);
      if (!target) return prev;
      const nextExpandedId = target.expanded ? null : sectionId;
      return expandOnlySection(prev, nextExpandedId);
    });
  };

  const performSectionDelete = useCallback(
    (sectionId: string): boolean => {
      const section = sections.find((s) => s.id === sectionId);

      if (!section || section.type === "personalInfo") {
        return false;
      }

      beginHistoryTransaction();
      try {
        const isMultipleAllowed =
          section.type === "spacer" || section.type === "custom";

        if (!isMultipleAllowed) {
          setSectionsState((prev) =>
            prev.map((s) =>
              s.id === sectionId
                ? { ...s, visible: false, expanded: false }
                : s,
            ),
          );
        } else {
          const currentResume = resumeRef.current;
          if (section.type === "custom" && currentResume) {
            const updatedCustomSections =
              currentResume.content.customSections?.filter(
                (cs: { id: string }) => cs.id !== sectionId,
              ) || [];
            updateContent({
              customSections: updatedCustomSections,
            });
          }
          setSectionsState((prev) => prev.filter((s) => s.id !== sectionId));
        }

        setHasChanges(true);
        setLayout((prev) =>
          prev
            ? { ...prev, dismissedEmptyTrailingPages: 0 }
            : prev,
        );
        return true;
      } finally {
        endHistoryTransaction();
      }
    },
    [
      beginHistoryTransaction,
      endHistoryTransaction,
      sections,
      setLayout,
      updateContent,
    ],
  );

  const performEmptyPageDelete = useCallback(
    (pageNumber: number) => {
      const { pages, rawPages, measureRoot } = paginationSnapshotRef.current;
      const pageBands = pages.length > 0 ? pages : rawPages;
      const page = pageBands.find((entry) => entry.pageNumber === pageNumber);
      if (
        !page ||
        !measureRoot ||
        !isEmptyResumePageBand(measureRoot, page)
      ) {
        return false;
      }

      beginHistoryTransaction();
      try {
        setLayout((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            dismissedEmptyTrailingPages:
              (prev.dismissedEmptyTrailingPages ?? 0) + 1,
          };
        });
        setHasChanges(true);
        bumpPreviewKey("deleteEmptyPage");
        return true;
      } finally {
        endHistoryTransaction();
      }
    },
    [beginHistoryTransaction, bumpPreviewKey, endHistoryTransaction, setLayout],
  );

  const requestPageDelete = useCallback((payload: { pageNumber: number }) => {
    const { pages, rawPages, measureRoot } = paginationSnapshotRef.current;
    const pageBands = pages.length > 0 ? pages : rawPages;
    if (
      !canDeleteEmptyResumePage(measureRoot, payload.pageNumber, pageBands)
    ) {
      return;
    }

    setPendingPageDelete({ pageNumber: payload.pageNumber });
    setPageDeleteDialogOpen(true);
  }, []);

  const handlePaginationSnapshot = useCallback(
    (snapshot: ResumePaginationSnapshot) => {
      paginationSnapshotRef.current = snapshot;
    },
    [],
  );

  const handleConfirmPageDelete = () => {
    if (!pendingPageDelete) return;
    performEmptyPageDelete(pendingPageDelete.pageNumber);
    setPendingPageDelete(null);
  };

  const handlePreviewPageDelete = useCallback(
    (payload: { pageNumber: number; totalPages: number }) => {
      requestPageDelete({ pageNumber: payload.pageNumber });
    },
    [requestPageDelete],
  );

  const handlePreviewRefresh = useCallback(() => {
    bumpPreviewKey("previewRefresh");
  }, [bumpPreviewKey]);

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

    if (essentialSections.includes(sectionToDelete.type)) {
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
      return;
    }

    performSectionDelete(sectionToDelete.id);
    setDeleteDialogOpen(false);
    setSectionToDelete(null);
  };

  const openSectionForEdit = (sectionId: string) => {
    setSections((prev) => {
      const target = prev.find((s) => s.id === sectionId);
      if (!target || target.expanded) return prev;
      return expandOnlySection(prev, sectionId);
    });
  };

  const updateSectionTitle = useCallback(
    (sectionId: string, title: string) => {
      const section = sections.find((s) => s.id === sectionId);
      const trimmed = title.trim();
      if (!section || !trimmed || trimmed === section.title) return;

      beginHistoryTransaction();
      try {
        setSectionsState((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, title: trimmed } : s,
          ),
        );

        if (section.type === "custom" && resume) {
          const currentCustomSections = resume.content.customSections || [];
          const existingIndex = currentCustomSections.findIndex(
            (cs: { id: string }) => cs.id === sectionId,
          );

          let updatedCustomSections;
          if (existingIndex >= 0) {
            updatedCustomSections = [...currentCustomSections];
            updatedCustomSections[existingIndex] = {
              ...updatedCustomSections[existingIndex],
              title: trimmed,
            };
          } else {
            updatedCustomSections = [
              ...currentCustomSections,
              {
                id: sectionId,
                title: trimmed,
                content: "",
              },
            ];
          }

          updateContent({
            customSections: updatedCustomSections,
          });
        }

        setHasChanges(true);
      } finally {
        endHistoryTransaction();
      }
    },
    [
      beginHistoryTransaction,
      endHistoryTransaction,
      resume,
      sections,
      updateContent,
    ],
  );

  const focusMobileSectionAfterAdd = (
    sectionId: string,
    sectionType: Section["type"],
  ) => {
    if (!isMobile || !editingAddSections) return;
    setLayoutExpanded(false);
    startSectionEdit(sectionId);
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
        const existingSectionId = sections[existingSectionIndex].id;
        setSections((prev) =>
          expandOnlySection(
            prev.map((s, idx) =>
              idx === existingSectionIndex ? { ...s, visible: true } : s,
            ),
            existingSectionId,
          ),
        );
        setHasChanges(true);
        focusMobileSectionAfterAdd(existingSectionId, type);
        return;
      }
    }

    beginHistoryTransaction();
    try {
      const sectionId = `${type}_${Date.now()}`;
      const newSection: Section = {
        id: sectionId,
        type,
        title: titleMap[type] || type.charAt(0).toUpperCase() + type.slice(1),
        visible: true,
        expanded: true,
      };
      setSectionsState(expandOnlySection([...sections, newSection], sectionId));

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
                content: "",
              },
            ],
          });
        }
      }

      setHasChanges(true);
      focusMobileSectionAfterAdd(sectionId, type);
    } finally {
      endHistoryTransaction();
    }
  };

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [layoutExpanded, setLayoutExpanded] = useState(false);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // ============================================
  // DRAG AND DROP HANDLERS - Clean Implementation
  // ============================================

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionId);
    isDraggingRef.current = true;
    recordImmediateHistory();
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

    const oldSignature = sections
      .map((s, idx) => `${idx}:${s.id}:${s.column ?? ""}`)
      .join(",");
    const newSections = assignSectionColumnOnReorder(
      sections,
      draggedSection,
      targetId,
      {
        layoutType: layout?.type,
        template,
      },
    );
    const newSignature = newSections
      .map((s, idx) => `${idx}:${s.id}:${s.column ?? ""}`)
      .join(",");

    if (oldSignature !== newSignature) {
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

  const handleMobilePickSection = (sectionId: string) => {
    const picked = sections.find((s) => s.id === sectionId);
    setSections(expandOnlySection(sections, sectionId));
    setLayoutExpanded(false);
    startSectionEdit(sectionId);
  };

  const handleMobilePickLayout = () => {
    setLayoutExpanded(true);
    startLayoutEdit();
  };

  const handleMobilePickAddSections = () => {
    startAddSectionsEdit();
  };

  const handleMobileDone = () => {
    if (viewMode === "ats") {
      setViewMode("edit");
      return;
    }
    returnToSectionPicker();
    bumpPreviewKey("mobileDone");
  };

  const handleMobilePickerDone = () => {
    closeMobileEditing();
    bumpPreviewKey("mobilePickerDone");
  };

  useEffect(() => {
    if (
      !isMobile ||
      !mobileEditOpen ||
      viewMode !== "edit" ||
      !editingSectionId
    ) {
      return;
    }
    setSections((prev) => {
      const target = prev.find((section) => section.id === editingSectionId);
      if (!target || target.expanded) return prev;
      return expandOnlySection(prev, editingSectionId);
    });
  }, [isMobile, mobileEditOpen, viewMode, editingSectionId]);

  const mobileEditBarTitle = editingLayout
    ? "Layout & typography"
    : editingAddSections
      ? "Add more sections"
      : sections.find((s) => s.id === editingSectionId)?.title ?? "Edit section";

  const visibleSectionsForPicker = sections.filter((s) => s.visible);

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
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={resumeEditorPage} suppressHydrationWarning>
      {/* Top Header Bar */}
      <div className={resumeEditorToolbar}>
        <div className={cn(resumeEditorToolbarInner, "md:py-3", resumeEditorToolbarMobile)}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 lg:gap-4">
            {/* Left Section: Back Button + Title + Save Status */}
            {isMobile ? (
              <div className="flex min-w-0 flex-1 items-start gap-1.5">
                <Link
                  href="/dashboard/resumes"
                  className="shrink-0 pt-0.5"
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>

                <div className="min-w-0 flex-1">
                  <ResumeEditorTitle
                    compact
                    value={resume.title}
                    onChange={(title) => {
                      setResume({ ...resume, title });
                      setHasChanges(true);
                    }}
                  />
                  <p className="mt-0.5 flex min-h-[0.875rem] min-w-0 items-center truncate text-[10px] text-muted-foreground">
                    {autoSaving ? (
                      <>
                        <Loader2 className="mr-1 h-2.5 w-2.5 shrink-0 animate-spin" />
                        Saving...
                      </>
                    ) : hasChanges ? (
                      "Unsaved"
                    ) : lastSaved ? (
                      `Saved ${new Date(lastSaved).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    ) : (
                      "\u00A0"
                    )}
                  </p>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-0.5 self-center">
                  {displayAtsScore === null ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCheckATS}
                      disabled={refreshingATS || autoSaving || saving}
                      className="h-7 whitespace-nowrap px-2 text-[10px] font-semibold"
                    >
                      {refreshingATS ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Check ATS"
                      )}
                    </Button>
                  ) : (
                    <>
                      <div
                        className={cn(
                          resumeAtsScoreShell,
                          resumeAtsScoreTone(displayAtsScore),
                          "gap-0.5 px-1.5 py-0.5 text-[10px]",
                        )}
                      >
                        <span className="font-bold tabular-nums">
                          {displayAtsScore}
                        </span>
                        <span className="opacity-70">/100</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={handleCheckATS}
                        disabled={refreshingATS || autoSaving || saving}
                        aria-label="Recheck ATS score"
                      >
                        {refreshingATS ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <Link href="/dashboard/resumes" className="shrink-0 pt-0.5">
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <ResumeEditorTitle
                  value={resume.title}
                  onChange={(title) => {
                    setResume({ ...resume, title });
                    setHasChanges(true);
                  }}
                />
                <p className="mt-0.5 flex min-h-[1.1rem] items-center text-xs text-muted-foreground">
                  {autoSaving ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 shrink-0 animate-spin" />
                      Auto-saving...
                    </>
                  ) : hasChanges ? (
                    "Unsaved changes"
                  ) : lastSaved ? (
                    `Saved at ${new Date(lastSaved).toLocaleTimeString()}`
                  ) : (
                    "\u00A0"
                  )}
                </p>
              </div>
            </div>
            )}

            {/* Middle Section: ATS Score — desktop toolbar */}
            <div className="hidden shrink-0 items-center justify-center md:flex">
              {displayAtsScore === null ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCheckATS}
                  disabled={refreshingATS || autoSaving || saving}
                  className="h-9 whitespace-nowrap px-4 text-sm font-semibold"
                >
                  {refreshingATS ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking ATS…
                    </>
                  ) : (
                    "Check ATS Score"
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      resumeAtsScoreShell,
                      resumeAtsScoreTone(displayAtsScore),
                    )}
                  >
                    <span className="whitespace-nowrap">ATS Score:</span>
                    <span className="text-xl font-bold">{displayAtsScore}</span>
                    <span className="text-xs opacity-70">/100</span>
                  </div>
                  <IconTooltipButton
                    onClick={handleCheckATS}
                    variant="outline"
                    label={
                      refreshingATS ? "Rechecking ATS…" : "Recheck ATS score"
                    }
                    disabled={refreshingATS || autoSaving || saving}
                  >
                    {refreshingATS ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </IconTooltipButton>
                </div>
              )}
            </div>

            {/* Right Section: Action Buttons — desktop only */}
            <div className="hidden w-full shrink-0 items-center justify-start gap-2 lg:ml-auto lg:flex lg:w-auto lg:justify-end">
              <div className="flex w-full items-center justify-start gap-1.5 sm:w-auto">
                <IconTooltipButton
                  onClick={handleUndo}
                  variant="outline"
                  label="Undo (Ctrl+Z)"
                  disabled={!editorHistory.canUndo || autoSaving || saving}
                >
                  <Undo2 className="h-4 w-4" />
                </IconTooltipButton>
                <IconTooltipButton
                  onClick={handleRedo}
                  variant="outline"
                  label="Redo (Ctrl+Shift+Z)"
                  disabled={!editorHistory.canRedo || autoSaving || saving}
                >
                  <Redo2 className="h-4 w-4" />
                </IconTooltipButton>
                <IconTooltipButton
                  onClick={() => setImportResumeOpen(true)}
                  variant="outline"
                  label="Import resume data"
                  disabled={
                    refreshingATS || autoSaving || saving || changingTemplate
                  }
                >
                  <Upload className="h-4 w-4" />
                </IconTooltipButton>
                <IconTooltipButton
                  onClick={() => setMatchJobOpen(true)}
                  variant="outline"
                  label={
                    matchingJob
                      ? "Tailoring to job…"
                      : "Match with job description"
                  }
                  disabled={
                    refreshingATS ||
                    autoSaving ||
                    saving ||
                    changingTemplate ||
                    matchingJob
                  }
                >
                  {matchingJob ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                </IconTooltipButton>
                <IconTooltipButton
                  onClick={() => setRearrangeSectionsOpen(true)}
                  variant="outline"
                  label="Rearrange sections"
                  disabled={
                    refreshingATS ||
                    autoSaving ||
                    saving ||
                    changingTemplate ||
                    !layout ||
                    sections.length === 0
                  }
                >
                  <LayoutGrid className="h-4 w-4" />
                </IconTooltipButton>
                <IconTooltipButton
                  onClick={() => setChangeTemplateOpen(true)}
                  variant="outline"
                  label={changingTemplate ? "Applying template…" : "Change template"}
                  disabled={changingTemplate}
                >
                  {changingTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Palette className="h-4 w-4" />
                  )}
                </IconTooltipButton>
                <IconTooltipButton
                  onClick={handleSave}
                  disabled={saving || !hasChanges || autoSaving}
                  label={
                    saving ? "Saving…" : hasChanges ? "Save now" : "Saved"
                  }
                  className={resumeSaveButton}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : hasChanges ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </IconTooltipButton>
                <IconTooltipButton
                  onClick={handleDownload}
                  disabled={downloading}
                  variant="outline"
                  label={downloading ? "Generating PDF…" : "Download PDF"}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </IconTooltipButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile && resume ? (
        <ResumeEditorMobileChrome
          sectionPickerOpen={sectionPickerOpen}
          onSectionPickerOpenChange={(open) => {
            if (open) {
              openSectionPicker();
            } else {
              handleMobilePickerDone();
            }
          }}
          sections={visibleSectionsForPicker.map((s) => ({
            id: s.id,
            title: s.title,
            type: s.type,
          }))}
          onPickSection={handleMobilePickSection}
          onPickLayout={handleMobilePickLayout}
          onPickAddSections={handleMobilePickAddSections}
          onOpenSections={openSectionPicker}
          onPickerDone={handleMobilePickerDone}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            if (mode === "ats") {
              finishMobileEdit();
            }
          }}
          canUndo={editorHistory.canUndo}
          onUndo={handleUndo}
          canRedo={editorHistory.canRedo}
          onRedo={handleRedo}
          onImport={() => setImportResumeOpen(true)}
          onMatchJobDescription={() => setMatchJobOpen(true)}
          matchingJob={matchingJob}
          onRearrange={() => setRearrangeSectionsOpen(true)}
          rearrangeDisabled={!layout || sections.length === 0}
          onChangeTemplate={() => setChangeTemplateOpen(true)}
          changingTemplate={changingTemplate}
          onSave={handleSave}
          saving={saving}
          hasChanges={hasChanges}
          autoSaving={autoSaving}
          onDownload={handleDownload}
          downloading={downloading}
          refreshingATS={refreshingATS}
          actionsDisabled={autoSaving || saving}
        />
      ) : null}

      {/* Main Content: mobile = live preview canvas; md+ = side-by-side */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {isMobile && showMobileEditPanel ? (
          <div className={resumeEditorMobileOverlay} aria-hidden />
        ) : null}
        {/* Edit panel — centered popup on mobile when editing */}
        <div
          className={cn(
            resumeEditorPanel,
            isMobile && showMobileEditPanel && resumeEditorPanelMobileSheet,
            isMobile && showMobileEditPanel && "overflow-hidden",
            isMobile && !showMobileEditPanel && "hidden",
          )}
        >
          {isMobile && mobileEditOpen && viewMode === "edit" ? (
            <ResumeEditorMobileEditBar
              title={mobileEditBarTitle}
              onDone={handleMobileDone}
            />
          ) : null}
          {isMobile && viewMode === "ats" ? (
            <ResumeEditorMobileEditBar
              title="ATS Report"
              onDone={handleMobileDone}
            />
          ) : null}
          <div
            className={cn(
              isMobile &&
                showMobileEditPanel &&
                "min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y",
            )}
          >
          {/* Toggle between Edit Resume and ATS Report */}
          <div className={cn(resumeEditorTabsRow, isMobile && "hidden")}>
            <div className="flex">
              <button
                onClick={() => setViewMode("edit")}
                className={cn(
                  resumeEditorTabBase,
                  viewMode === "edit"
                    ? resumeEditorTabActive
                    : resumeEditorTabInactive,
                )}
              >
                Edit Resume
              </button>
              <button
                onClick={() => setViewMode("ats")}
                className={cn(
                  resumeEditorTabBase,
                  viewMode === "ats"
                    ? resumeEditorTabActive
                    : resumeEditorTabInactive,
                )}
              >
                ATS Report
              </button>
            </div>
          </div>

          {viewMode === "ats" ? (
            resume.atsFeedback ? (
              <div className="min-w-0 bg-card p-3 sm:p-4">
                {showImprovedBanner && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 break-words dark:border-green-900/40 dark:bg-green-950/25 dark:text-green-200">
                    Resume improved from ATS feedback. Issues addressed by AI
                    are hidden here; re-run ATS check anytime to see a fresh
                    full report.
                  </div>
                )}
                <ATSReportView
                  key={`${resume.atsScore ?? 0}-${isATSReportV3(resume.atsFeedback) ? resume.atsFeedback.issueCount : 0}-${resume.atsImprovementMeta?.improvedAt ?? "fresh"}`}
                  feedback={resume.atsFeedback}
                  resumeId={resume.resumeId}
                  embedded
                  enableIssueMagic
                  onApplyIssueFix={handleApplyAtsIssueFix}
                  onIgnoreIssue={handleIgnoreATSIssue}
                  suppressedCheckIds={
                    showImprovedBanner
                      ? resume.atsImprovementMeta?.suppressedCheckIds
                      : undefined
                  }
                  onRunJobMatch={handleRunJobMatch}
                  jobMatchRunning={refreshingATS}
                  initialJobDescription={
                    resume.atsScoringContext?.lastJobDescription
                  }
                />
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>
                  No ATS feedback yet. Click <strong>Check ATS Score</strong> in
                  the header to run a score and report.
                </p>
              </div>
            )
          ) : (
            <div
              className={cn(
                resumeEditorFormArea,
                isMobile && mobileEditOpen && "pb-10",
              )}
            >
              {/* Layout & typography — above all sections */}
              {(!isMobile || editingLayout) && layout && (
              <Card className={resumeSectionCardClass(false, false)}>
                <div className={resumeSectionHeader}>
                  <p className="text-sm font-semibold text-foreground">
                    Layout &amp; typography
                  </p>
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
                  <CardContent className={resumeSectionContent}>
                    {layout.type === "double" && (
                      <div className="space-y-2 border-b border-border/60 pb-3">
                        <Label className="text-xs text-muted-foreground">
                          Column widths
                        </Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 space-y-1">
                            <Label className="block text-xs text-muted-foreground">
                              Left: {layout.columnWidths.left}%
                            </Label>
                            <div className="flex items-center gap-1">
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
                                className="h-7 w-[4.25rem] shrink-0 !h-7 !px-1.5 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                          <div className="flex-1 space-y-1">
                            <Label className="block text-xs text-muted-foreground">
                              Right: {layout.columnWidths.right}%
                            </Label>
                            <div className="flex items-center gap-1">
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
                                className="h-7 w-[4.25rem] shrink-0 !h-7 !px-1.5 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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

                    <LayoutPaddingControls
                      padding={resolveLayoutPaddingMm(layout.padding)}
                      onChange={(padding) => {
                        setLayout({
                          ...layout,
                          padding,
                        });
                        setHasChanges(true);
                      }}
                    />

                    {effectiveTypography && (
                      <LayoutTypographyControls
                        typography={effectiveTypography}
                        fontFamilyOptions={fontFamilyOptions}
                        selectedFontFamily={selectedFontFamily}
                        onFontSizeChange={(key, value) => {
                          setLayout({
                            ...layout,
                            fontSize: {
                              ...layout.fontSize,
                              [key]: value,
                            },
                          });
                          setHasChanges(true);
                        }}
                        onFontFamilyChange={(value) => {
                          setLayout({
                            ...layout,
                            fontFamily: value,
                          });
                          setHasChanges(true);
                        }}
                      />
                    )}
                  </CardContent>
                )}
              </Card>
              )}

              {/* Render sections in order from sections array */}
              {sections
                .filter((s) => s.visible)
                .filter((s) => {
                  if (!isMobile || !mobileEditOpen || viewMode !== "edit") {
                    return true;
                  }
                  if (editingLayout || editingAddSections) return false;
                  return s.id === editingSectionId;
                })
                .map((section) => {
                  // Personal Information Section - Compact view with expandable edit
                  if (section.type === "personalInfo") {
                    const personalInfo =
                      resume.content.personalInfo ?? {
                        fullName: "",
                        email: "",
                        phone: "",
                        location: "",
                        linkedin: "",
                        github: "",
                        portfolio: "",
                      };

                    return (
                      <Card
                        key={section.id}
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        style={{
                          opacity: draggedSection === section.id ? 0.5 : 1,
                        }}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          showDelete={false}
                        />

                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            {/* Profile Picture Upload */}
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 relative">
                                {personalInfo.profilePicture ? (
                                  <>
                                    <img
                                      src={personalInfo.profilePicture}
                                      alt="Profile"
                                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
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
                                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
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
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {profilePictureFileName}
                                  </p>
                                )}
                                {!personalInfo.profilePicture && (
                                  <p className="text-xs text-muted-foreground mt-1">
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                  className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                    className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        style={{
                          opacity: draggedSection === section.id ? 0.5 : 1,
                        }}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-4">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        style={{
                          opacity: draggedSection === section.id ? 0.5 : 1,
                        }}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            <ExperienceEntriesEditor
                              experience={resume.content.experience}
                              applyNonce={applyNonce}
                              onChange={(experience) =>
                                updateContent({ experience })
                              }
                              onReorderStart={() => {
                                isDraggingRef.current = true;
                                recordImmediateHistory();
                              }}
                              onReorderEnd={() => {
                                isDraggingRef.current = false;
                                setHasChanges(true);
                              }}
                            />
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
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        style={{
                          opacity: draggedSection === section.id ? 0.5 : 1,
                        }}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            {resume.content.education.map((edu, index) => (
                              <div
                                key={edu.id || index}
                                className={resumeEntryCard}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                  className="w-full border-red-300 text-red-700 hover:bg-red-950/30"
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
                              className={resumePrimaryCta}
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
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        style={{
                          opacity: draggedSection === section.id ? 0.5 : 1,
                        }}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        style={{
                          opacity: draggedSection === section.id ? 0.5 : 1,
                        }}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            {(resume.content.projects || []).map(
                              (project, index) => (
                                <div
                                  key={`${project.id || index}-${applyNonce}`}
                                  className={resumeEntryCard}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
                                        placeholder="MM/YYYY or Present"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Description
                                    </Label>
                                    <RichTextEditor
                                      preferredContentType="list"
                                      value={descriptionToEditorHtml(
                                        project.description,
                                      )}
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
                                      className={RESUME_FIELD_INPUT_CLASS}
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
                                    className="w-full border-red-300 text-red-700 hover:bg-red-950/30"
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
                              className={resumePrimaryCta}
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-4 space-y-3">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            {(resume.content.certificates || []).map(
                              (cert, index) => {
                                const today = new Date()
                                  .toISOString()
                                  .slice(0, 7); // YYYY-MM format
                                return (
                                  <div
                                    key={cert.id}
                                    className="border p-3 rounded-md bg-muted/20"
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
                                          className={RESUME_FIELD_INPUT_CLASS}
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
                                          className={RESUME_FIELD_INPUT_CLASS}
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
                                          className={RESUME_FIELD_INPUT_CLASS}
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
                                          className={RESUME_FIELD_INPUT_CLASS}
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
                                          className={RESUME_FIELD_INPUT_CLASS}
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
                                          className={RESUME_FIELD_INPUT_CLASS}
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
                                      className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-950/30"
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
                              className={resumePrimaryCta}
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-4">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            <RichTextEditor
                              key={`${section.id}-${
                                customContent.length > 0 ? "loaded" : "empty"
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
                        className={resumeSectionCardClass(
                          dragOverId === section.id &&
                          draggedSection !== section.id,
                          draggedSection === section.id,
                        )}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-2">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            <div className="text-xs text-muted-foreground text-center py-1">
                              <p>
                                Column Placeholder for column alignment (5px
                                margin)
                              </p>
                              <p className="text-xs text-muted-foreground/80 mt-1">
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-4">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-4">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-4 space-y-3">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            {(resume.content.awards || []).map(
                              (award, index) => (
                                <div
                                  key={award.id}
                                  className="border p-3 rounded-md bg-muted/20"
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                    className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-950/30"
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
                              className={resumePrimaryCta}
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className="p-4 space-y-3">
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
                            {(resume.content.references || []).map(
                              (ref, index) => (
                                <div
                                  key={ref.id}
                                  className="border p-3 rounded-md bg-muted/20"
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                        className={RESUME_FIELD_INPUT_CLASS}
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
                                    className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-950/30"
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
                              className={resumePrimaryCta}
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <ResumeSectionCardHeader
                          section={section}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onOpenForEdit={openSectionForEdit}
                          onToggle={toggleSection}
                          onDelete={deleteSection}
                        />
                        {section.expanded && (
                          <CardContent className={resumeSectionContent}>
                            <SectionNameField
                              sectionId={section.id}
                              title={section.title}
                              onTitleChange={updateSectionTitle}
                            />
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

              {/* Add more sections — separate from layout */}
              {(!isMobile || editingAddSections) && (
              <Card className={resumeAddSectionsCard}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="mb-3 text-sm font-semibold text-foreground">
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
                            className={cn(
                              "justify-start text-xs",
                              alreadyAdded
                                ? "cursor-not-allowed opacity-50"
                                : resumeAddSectionButton,
                            )}
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
              )}
            </div>
          )}
          </div>
        </div>

        {/* Preview — full canvas on mobile */}
        <div
          className={cn(
            resumePreviewPanel,
            isMobile && resumePreviewPanelMobile,
            isMobile && "flex min-h-0 flex-1 flex-col",
          )}
        >
          <div className={resumePreviewHeader}>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="h-4 w-4 text-primary" />
              Preview
            </h3>
            <div className="text-xs text-muted-foreground">Live Preview</div>
          </div>
          <div className={cn("p-4", isMobile && "min-h-0 flex-1 p-0")}>
            {template && previewResume ? (
              <>
                <TemplateStyleLoader templateId={template.id} />
                <ResumePreview
                ref={previewRef}
                key={`resume-preview-${previewKey}`}
                resume={previewResume}
                template={template}
                sections={sections}
                layout={layout || undefined}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                compact={isMobile}
                onPageDelete={handlePreviewPageDelete}
                onPaginationSnapshot={handlePaginationSnapshot}
                onRefresh={handlePreviewRefresh}
              />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
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
      <MatchJobDescriptionDialog
        open={matchJobOpen}
        onOpenChange={setMatchJobOpen}
        onSubmit={handleRequestMatchJobDescription}
        applying={matchingJob}
        initialJobDescription={
          lastMatchedJd ?? resume?.atsScoringContext?.lastJobDescription ?? ""
        }
      />
      <ConfirmationDialog
        open={confirmMatchOpen}
        onOpenChange={(open) => {
          if (matchingJob) return;
          setConfirmMatchOpen(open);
          if (!open) setPendingMatchJd(null);
        }}
        title="Tailor and overwrite this resume?"
        description="AI will rewrite your profile summary, skills, experience, projects, and certificates to match this job description, replacing the current content. You can undo it while editing, but this cannot be reversed after you reload or leave the page."
        confirmText="Tailor my resume"
        cancelText="Cancel"
        variant="destructive"
        isLoading={matchingJob}
        onConfirm={() => {
          // Close the confirmation immediately, then run tailoring in the
          // background (progress is shown on the toolbar button + match dialog).
          const jd = pendingMatchJd;
          setConfirmMatchOpen(false);
          setPendingMatchJd(null);
          if (jd) void handleMatchJobDescription(jd);
        }}
      />
      {resume && template ? (
        <ImportResumeDialog
          open={importResumeOpen}
          onOpenChange={setImportResumeOpen}
          resumeId={resumeId}
          templateId={resume.templateId}
          layout={layout}
          onImported={handleResumeImported}
        />
      ) : null}
      {resume && template && layout ? (
        <RearrangeSectionsDialog
          open={rearrangeSectionsOpen}
          onOpenChange={handleRearrangeDialogOpenChange}
          sections={sections}
          layoutType={layout.type}
          template={template}
          onSectionsChange={handleSectionsRearranged}
          onSectionDelete={performSectionDelete}
        />
      ) : null}
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
      <ConfirmationDialog
        open={pageDeleteDialogOpen}
        onOpenChange={(open) => {
          setPageDeleteDialogOpen(open);
          if (!open) setPendingPageDelete(null);
        }}
        title={`Remove blank page ${pendingPageDelete?.pageNumber ?? ""}?`}
        description="This removes an empty trailing page from the preview. Your resume sections and content are not changed."
        confirmText="Remove blank page"
        cancelText="Cancel"
        onConfirm={handleConfirmPageDelete}
        variant="destructive"
      />
      <TrialUpsellDialog
        open={trialUpsellOpen}
        onOpenChange={setTrialUpsellOpen}
        variant="resume_download"
        hasPurchasedTrial={
          entitlements ? !entitlements.canPurchaseTrial : false
        }
      />
    </div>
  );
}
