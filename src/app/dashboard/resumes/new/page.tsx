"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { userApi, ResumeTemplate, resumeApi } from "@/lib/api";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { safeAppRedirectPath } from "@/lib/post-sign-in-redirect";
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
  ArrowRight,
  SkipForward,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import {
  buildResumeFromExtractedData,
  buildSectionOrderForExtractedContent,
  getResumeProcessingMessages,
  mapExtractedSectionsToContent,
  normalizeResumeImportContent,
  type BuildResumeImportPayload,
} from "@/lib/resume-data-import";
import { TemplatePreview } from "@/components/TemplatePreview";
import { PageHeader } from "@/components/app/PageHeader";
import { ResumeBuilderImportChoiceCards } from "@/components/resume-builder/ResumeBuilderImportChoiceCards";
import { ResumeBuilderLinkedInForm } from "@/components/resume-builder/ResumeBuilderLinkedInForm";
import { ResumeBuilderPdfDropzone } from "@/components/resume-builder/ResumeBuilderPdfDropzone";
import { ResumeBuilderProcessingView } from "@/components/resume-builder/ResumeBuilderProcessingView";
import { ResumeBuilderChatPanel } from "@/components/resume-builder/ResumeBuilderChatPanel";
import { ResumeBuilderVoicePanel } from "@/components/resume-builder/ResumeBuilderVoicePanel";
import {
  ResumeBuilderChatModeModal,
  type ResumeChatSubMode,
} from "@/components/resume-builder/ResumeBuilderChatModeModal";
import { ResumeBuilderJobDescriptionStep } from "@/components/resume-builder/ResumeBuilderJobDescriptionStep";
import { HackathonResumeStartChoices } from "@/components/resume-builder/HackathonResumeStartChoices";
import { pickHackathonTemplate } from "@/lib/hackathon-resume-template";
import { hackathonSlugFromDashboardPath } from "@/lib/interview-return-to";
import { hackathonApi } from "@/features/hackathon/api";
import { ResumeCreationStepper } from "@/components/resume-builder/ResumeCreationStepper";
import { ResumeEnhanceChoiceDialog } from "@/components/resume-builder/ResumeEnhanceChoiceDialog";
import { trimJobDescriptionForSend } from "@/lib/job-description-limits";
import {
  loadPendingJobCaptureFor,
  normalizeCapturedJob,
} from "@/lib/extension-job-handoff";
import type { ResumeImportSource } from "@/components/resume-builder/ResumeBuilderImportChoiceCards";
import type {
  ChatCollectedProfile,
  JDRequirements,
} from "@/lib/api";
import {
  resumeBuilderFooterActions,
  resumeBuilderHeroCard,
  resumeBuilderInfoBanner,
  resumeBuilderOutlineButton,
  resumeBuilderPage,
  resumeBuilderPrimaryButton,
  resumeBuilderFilterPill,
  resumeBuilderFilterPillActive,
  resumeBuilderSelectedBanner,
  resumeBuilderTemplateCard,
  resumeBuilderTemplateCardSelected,
} from "@/components/resume-builder/resumeBuilderStyles";
import { appCard, appOutlineButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
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
type Step = "template" | "import" | "jobDescription" | "processing";

export default function NewResumePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { invalidate } = useDashboardInvalidation();
  const searchParams = useSearchParams();
  /**
   * From the hackathon's "Build my resume": template preselected (skipTemplate), a short
   * start-from-real-details chooser, and no job-description step.
   */
  const quickHackathon = searchParams.get("hk") === "1";
  const forwardReturnTo = (params: URLSearchParams) => {
    const returnTo = safeAppRedirectPath(searchParams.get("returnTo"));
    if (!returnTo) return;
    params.set("returnTo", returnTo);
    const label = searchParams.get("returnLabel");
    if (label) params.set("returnLabel", label.slice(0, 40));
  };
  const resumeEditorPath = (resumeId: string) => {
    const params = new URLSearchParams();
    if (searchParams.get("extensionSync") === "1") params.set("extensionSync", "1");
    forwardReturnTo(params);
    const query = params.toString();
    return query
      ? `/dashboard/resumes/${resumeId}/edit?${query}`
      : `/dashboard/resumes/${resumeId}/edit`;
  };
  // Hackathon: their submitted resume and other resumes, so they can continue instead of
  // starting over.
  const { getToken } = useAuth();
  const hackathonSlug = quickHackathon ? hackathonSlugFromDashboardPath(safeAppRedirectPath(searchParams.get("returnTo"))) : null;
  const hackathonMe = useQuery({
    queryKey: ["hackathon", hackathonSlug, "me", "resume-start"],
    queryFn: () => hackathonApi.me(hackathonSlug!, () => getToken()),
    enabled: Boolean(hackathonSlug),
    staleTime: 30_000,
  });
  const hackathonResumes = useQuery({
    queryKey: ["hackathon", hackathonSlug, "resumes", "resume-start"],
    queryFn: () => hackathonApi.listResumes(hackathonSlug!, () => getToken()),
    enabled: Boolean(hackathonSlug),
    staleTime: 30_000,
  });
  const submittedHackathonResume =
    hackathonMe.data?.resume?.submittedAt ? { ...hackathonMe.data.resume, updatedAt: undefined } : null;
  const newResumeReturnUrl = () => {
    const params = new URLSearchParams();
    forwardReturnTo(params);
    const templateParam = searchParams.get("template");
    const skipTemplate = searchParams.get("skipTemplate");
    if (templateParam && skipTemplate) {
      params.set("template", templateParam);
      params.set("skipTemplate", skipTemplate);
    }
    if (searchParams.get("extensionSync") === "1") {
      params.set("extensionSync", "1");
    }
    if (quickHackathon) params.set("hk", "1");
    const query = params.toString();
    return query ? `/dashboard/resumes/new?${query}` : "/dashboard/resumes/new";
  };
  const [step, setStep] = useState<Step>("template");
  const [importSource, setImportSource] = useState<ResumeImportSource | null>(
    null,
  );
  const [linkedinHandle, setLinkedinHandle] = useState<string>("");
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  /** CV already uploaded on the profile (onboarding / hackathon), offered as a one-click import. */
  const [uploadedCv, setUploadedCv] = useState<{ url: string; filename: string } | null>(null);
  const [loadingUploadedCv, setLoadingUploadedCv] = useState(false);
  /** Shown inline on the job-description step when building/creating the resume fails. */
  const [createError, setCreateError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const [pendingImport, setPendingImport] =
    useState<BuildResumeImportPayload | null>(null);
  const [chatProfile, setChatProfile] = useState<ChatCollectedProfile | null>(
    null,
  );
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatSubMode, setChatSubMode] = useState<ResumeChatSubMode | null>(null);
  const [showChatModeModal, setShowChatModeModal] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [jobFromExtension, setJobFromExtension] = useState(false);
  const [jdRequirements, setJdRequirements] = useState<JDRequirements | null>(
    null,
  );
  const [jdSummary, setJdSummary] = useState<string | null>(null);
  const [analyzingJd, setAnalyzingJd] = useState(false);
  const [enhanceChoiceOpen, setEnhanceChoiceOpen] = useState(false);

  useEffect(() => {
    const apply = () => {
      const pending = loadPendingJobCaptureFor("resume");
      if (!pending?.jobDescription) return false;
      const normalized = normalizeCapturedJob(pending);
      if (normalized.jobDescription.trim().length < 50) return false;
      setJobDescription(normalized.jobDescription);
      setJobFromExtension(true);
      return true;
    };

    if (apply()) return;

    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks += 1;
      if (apply() || ticks >= 20) {
        window.clearInterval(timer);
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, []);

  const processingMessages = getResumeProcessingMessages(
    pendingImport,
    !!(jdRequirements || jobDescription.trim().length > 50),
  );

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
        const returnUrl = newResumeReturnUrl();
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
        const returnUrl = newResumeReturnUrl();
        localStorage.setItem("resumeBuilderReturnUrl", returnUrl);
        router.push("/onboarding");
        return;
      }

      // Onboarding completed - load templates and check for template param
      loadTemplates();

      // A template Super Admin turned off can't be preselected from a link.
      const { fetchDisabledResumeTemplateIds } = await import(
        "@/lib/resume-template-availability"
      );
      const disabledTemplates = await fetchDisabledResumeTemplateIds();

      // Check URL params to skip template selection
      const templateParam = (quickHackathon && pickHackathonTemplate(disabledTemplates)) || searchParams.get("template");
      const skipTemplate = quickHackathon || searchParams.get("skipTemplate") === "true";
      if (templateParam && skipTemplate && !disabledTemplates.includes(templateParam)) {
        setSelectedTemplate(templateParam);
        setStep("import");
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
      const data = await resumeApi.getSelectableTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    userApi
      .getMyResumeUrl()
      .then((cv) => {
        if (!cancelled) setUploadedCv(cv);
      })
      .catch(() => {
        /* 404 = no uploaded CV; nothing to offer */
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  const importUploadedCv = async () => {
    if (!uploadedCv) return;
    setImportSource("pdf");
    setLoadingUploadedCv(true);
    try {
      // Signed URLs are short-lived: refresh if needed, then hand the file to the normal PDF import.
      const fresh = await userApi.getMyResumeUrl().catch(() => uploadedCv);
      const res = await fetch(fresh.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], fresh.filename || "resume.pdf", { type: "application/pdf" });
      await onDrop([file], []);
    } catch (error) {
      console.error("Could not load uploaded CV:", error);
      alert("We couldn't open your uploaded CV. Upload the PDF here instead.");
    } finally {
      setLoadingUploadedCv(false);
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

  const useTemplateAndGoToImport = (templateId: string) => {
    setSelectedTemplate(templateId);
    setImportSource(null);
    setUploadedFile(null);
    setResumeText("");
    setLinkedinHandle("");
    setPendingImport(null);
    setChatProfile(null);
    setChatSessionId(null);
    setChatSubMode(null);
    if (!jobFromExtension) {
      setJobDescription("");
      setJdRequirements(null);
      setJdSummary(null);
    }
    setEnhanceChoiceOpen(false);
    setStep("import");
  };

  const proceedToJobDescription = (payload: BuildResumeImportPayload) => {
    setPendingImport(payload);
    setStep("jobDescription");
  };

  const handleChatReady = (profile: ChatCollectedProfile) => {
    setChatProfile(profile);
    if (!selectedTemplate) return;
    proceedToJobDescription({
      source: "chat",
      templateId: selectedTemplate,
      chatProfile: profile,
    });
  };

  const handleLinkedInContinue = () => {
    if (!selectedTemplate || !linkedinHandle.trim()) return;
    proceedToJobDescription({
      source: "linkedin",
      templateId: selectedTemplate,
      linkedinHandle: linkedinHandle.trim(),
    });
  };

  const handlePdfContinue = () => {
    if (!selectedTemplate || !resumeText) return;
    setEnhanceChoiceOpen(true);
  };

  const proceedFromPdfWithEnhance = (enhance: boolean) => {
    if (!selectedTemplate || !resumeText) return;
    proceedToJobDescription({
      source: "pdf",
      templateId: selectedTemplate,
      resumeText,
      enhance,
    });
  };

  const handleAnalyzeJobDescription = async (jd: string) => {
    try {
      setAnalyzingJd(true);
      const { resumeDataExtractionApi } = await import("@/lib/api");
      const result = await resumeDataExtractionApi.analyzeJobDescription(jd);
      setJdRequirements(result.requirements);
      setJdSummary(result.summary);
      return result.requirements;
    } catch (error) {
      console.error("JD analysis failed:", error);
      alert("Could not analyze the job description. You can still continue.");
      return null;
    } finally {
      setAnalyzingJd(false);
    }
  };

  const handleSkipJobDescription = () => {
    setJobDescription("");
    setJdRequirements(null);
    setJdSummary(null);
    void handleBuildResume(undefined, undefined);
  };

  // Hackathon: no job-description step — build as soon as the import is ready.
  useEffect(() => {
    if (!quickHackathon || step !== "jobDescription" || !pendingImport || creating || createError) return;
    handleSkipJobDescription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickHackathon, step, pendingImport, creating, createError]);

  const handleBuildResume = async (
    jdOverride?: string,
    jdReqOverride?: JDRequirements | null,
  ) => {
    if (!selectedTemplate || !user || !pendingImport) return;

    const jdText = jdOverride ?? jobDescription;
    const jdReq = jdReqOverride === undefined ? jdRequirements : jdReqOverride;

    try {
      setCreating(true);
      setCreateError(null);
      setStep("processing");

      if (pendingImport.source === "dummy") {
        await createResumeWithDummyContent(jdText);
        return;
      }

      const sections = await buildResumeFromExtractedData({
        ...pendingImport,
        jobDescription: jdText.trim().length > 50 ? jdText.trim() : undefined,
        jdRequirements: jdReq ?? undefined,
      });

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

      const content = mapExtractedSectionsToContent(sections);
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
        ...(jdText.trim().length > 50
          ? {
              atsScoringContext: {
                lastJobDescription: trimJobDescriptionForSend(jdText),
              },
            }
          : {}),
      });

      await invalidate(["resumes"]);
      router.push(resumeEditorPath(resume.resumeId));
    } catch (error: any) {
      console.error("Error building resume:", error);
      setStep("jobDescription");

      const isLimitError =
        error?.response?.status === 403 &&
        (error?.response?.data?.message || error?.message || "")
          .toLowerCase()
          .includes("resume limit");
      if (isLimitError) {
        setShowLimitModal(true);
      } else {
        setCreateError(
          `Couldn't build your resume: ${
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

  const handleSkip = () => {
    if (!selectedTemplate) return;
    proceedToJobDescription({
      source: "dummy",
      templateId: selectedTemplate,
    });
  };

  const createResumeWithDummyContent = async (jdText?: string) => {
    if (!selectedTemplate || !user) return;

    try {
      setCreating(true);
      setCreateError(null);
      setStep("processing");

      console.log("📋 Loading dummy content from template...");

      // Load dummy content from template (no LLM call needed)
      const { TemplateLoader } = await import("@/lib/templateLoader");
      const dummyContent =
        await TemplateLoader.loadDummyContent(selectedTemplate);

      console.log("✅ Dummy content loaded:", dummyContent);

      // If no template-specific dummy content, use a basic structure.
      // Obvious placeholders on purpose — the download/submit check flags them.
      const contentToUse = normalizeResumeImportContent(
        (dummyContent || {
          personalInfo: {
            fullName: "Your Name",
            email: "your.email@example.com",
            phone: "+00 00000 00000",
            location: "Sample City, Country",
            linkedin: "linkedin.com/in/your-profile",
            github: "github.com/your-username",
            portfolio: "Your Title",
          },
          profileSummary:
            "Sample summary — write 2–3 lines about your experience, your strongest skills and the role you want.",
          experience: [
            {
              position: "Sample Job 1",
              company: "Sample Company 1",
              location: "Sample City, Country",
              startDate: "2021-01",
              endDate: "",
              current: true,
              description: [
                "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
                "Sample bullet 2 — describe a project or responsibility you owned and its result.",
              ],
            },
          ],
          education: [
            {
              degree: "Sample Degree 1",
              institution: "Sample University 1",
              location: "Sample City, Country",
              startDate: "2016",
              endDate: "2020",
            },
          ],
          skills: ["Sample Skill 1", "Sample Skill 2", "Sample Skill 3", "Sample Skill 4"],
        }) as Record<string, unknown>,
      );

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
        ...(jdText && jdText.trim().length > 50
          ? { atsScoringContext: { lastJobDescription: jdText.trim() } }
          : {}),
      });

      console.log("✅ Resume created with dummy content:", resume.resumeId);
      await invalidate(["resumes"]);
      router.push(resumeEditorPath(resume.resumeId));
    } catch (error: any) {
      console.error("❌ Error creating resume with dummy content:", error);

      // Reset step back to import so user can try again
      setStep("jobDescription");
      setPendingImport(
        selectedTemplate
          ? { source: "dummy", templateId: selectedTemplate }
          : null,
      );

      const isLimitError =
        error?.response?.status === 403 &&
        (error?.response?.data?.message || error?.message || "")
          .toLowerCase()
          .includes("resume limit");
      if (isLimitError) {
        setShowLimitModal(true);
      } else {
        setCreateError(
          `Couldn't create your resume: ${
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
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading templates…</p>
        </div>
      </div>
    );
  }

  const stepMeta: Record<
    Step,
    { title: string; description: string; badge?: string }
  > = {
    template: {
      badge: "Resume builder",
      title: "Choose a template",
      description:
        "Pick a layout — designs marked ATS optimized read cleanly in every ATS we tested. You can change templates anytime in the editor.",
    },
    import: {
      badge: "Import data",
      title:
        importSource === "chat"
          ? "Chat with Live AI"
          : importSource === "linkedin"
            ? "Connect your LinkedIn profile"
            : importSource === "pdf"
              ? "Upload your resume PDF"
              : "How would you like to start?",
      description:
        importSource === "chat"
          ? "Paste your full profile or answer guided questions. Skip anytime and build with what you have."
          : importSource === "linkedin"
            ? "We’ll fetch your public LinkedIn data and enhance it with AI for recruiters and ATS."
            : importSource === "pdf"
              ? quickHackathon
                ? "Any old resume PDF works — we’ll pull your details into a fresh design."
                : "Upload a PDF to auto-fill sections, then optionally tailor to a target job."
              : "Chat with AI, import from LinkedIn, or upload an existing PDF.",
    },
    jobDescription: {
      badge: "Target role",
      title: "Tailor to a job description",
      description:
        "Optionally paste a job description so AI aligns your resume to that role. You can skip this step.",
    },
    processing: {
      badge: "Almost there",
      title: "Building your resume",
      description: "AI is organizing your content into a polished, editable draft.",
    },
  };

  const processingLabel =
    pendingImport?.source === "linkedin"
      ? linkedinHandle.trim() || "LinkedIn profile"
      : pendingImport?.source === "chat"
        ? "your chat profile"
        : uploadedFile?.name || "your resume";

  const handleImportBack = () => {
    if (importSource) {
      setImportSource(null);
      setUploadedFile(null);
      setResumeText("");
      setChatProfile(null);
      setChatSubMode(null);
      return;
    }
    setStep("template");
  };

  const handleJobDescriptionBack = () => {
    setStep("import");
  };

  const currentMeta = stepMeta[step];
  const quickHackathonChooser = quickHackathon && step === "import" && !importSource;

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
    <div className={resumeBuilderPage}>
      <div className="flex items-start gap-3">
        <Link href={(quickHackathon && safeAppRedirectPath(searchParams.get("returnTo"))) || "/dashboard/resumes"}>
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        {quickHackathonChooser ? null : (
          <div className="min-w-0 flex-1">
            <PageHeader
              badge={currentMeta.badge}
              title={currentMeta.title}
              description={currentMeta.description}
            />
          </div>
        )}
      </div>

      {quickHackathon ? null : <ResumeCreationStepper currentStep={step} />}

      {step === "template" && (
        <>
          {selectedTemplate ? (
            <div className={resumeBuilderSelectedBanner}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {selectedTemplateName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Selected template — hover a card and click Use Template to
                    continue
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map((filter) => {
              const isActive = activeFilter === filter.id;
              const count =
                filter.id === "all"
                  ? templates.length
                  : templates.filter((t) => t.category === filter.id).length;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    isActive
                      ? resumeBuilderFilterPillActive
                      : resumeBuilderFilterPill,
                  )}
                >
                  {filter.label}
                  <span
                    className={cn(
                      "ml-2 rounded-full px-2 py-0.5 text-xs",
                      isActive
                        ? "bg-card/20 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {activeFilter === "all"
                  ? "All templates"
                  : `${categoryLabels[activeFilter]} templates`}
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {filteredTemplates.length}
              </span>
            </div>

            {filteredTemplates.length > 0 ? (
              <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <div
                      key={template.id}
                      className={cn(
                        resumeBuilderTemplateCard,
                        isSelected && resumeBuilderTemplateCardSelected,
                      )}
                      onClick={() => handleTemplateSelect(template.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleTemplateSelect(template.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <TemplatePreview
                        template={template}
                        isSelected={isSelected}
                      />
                      <div className="flex flex-1 flex-col bg-card p-4">
                        <h3 className="mb-1 font-semibold text-foreground">
                          {template.name}
                        </h3>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-md px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${template.colors.primary}20`,
                              color: template.colors.primary,
                            }}
                          >
                            {categoryLabels[template.category]}
                          </span>
                          {template.atsOptimized ? (
                            <span
                              className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700"
                              title="Every ATS reader we tested picked up all of this design's details, in the right sections."
                            >
                              ATS optimized
                            </span>
                          ) : (
                            <span
                              className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-300"
                              title="Two columns: reads well in most current ATS, but older ones read straight across the page and can mix the columns."
                            >
                              Two-column
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#2f2b3d]/45 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          className={resumeBuilderPrimaryButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            useTemplateAndGoToImport(template.id);
                          }}
                        >
                          Use template
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={cn(resumeBuilderHeroCard, "py-12 text-center")}>
                <p className="text-muted-foreground">
                  No templates found in this category.
                </p>
              </div>
            )}
          </div>

          <div className={resumeBuilderInfoBanner}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Tested against ATS parsers
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Designs marked &ldquo;ATS optimized&rdquo; were fully read by every ATS reader we tested.
                  Two-column designs read well in most current ATS, but older systems can mix the columns — for
                  big-company portals (Workday, Taleo, iCIMS) pick a one-column design. In the editor, the ATS
                  score shows exactly what an ATS reads from your resume.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {step === "import" && (
        <div className="space-y-5">
          {quickHackathonChooser ? (
            <HackathonResumeStartChoices
              templateName={selectedTemplateName}
              uploadedCvName={uploadedCv ? uploadedCv.filename || "resume.pdf" : null}
              loadingUploadedCv={loadingUploadedCv || extracting}
              busy={creating}
              onUseUploadedCv={() => void importUploadedCv()}
              onUploadPdf={() => setImportSource("pdf")}
              onTalkToAi={() => setShowChatModeModal(true)}
              onLinkedIn={() => setImportSource("linkedin")}
              onUseSample={handleSkip}
              submitted={submittedHackathonResume}
              resumes={hackathonResumes.data ?? []}
              loadingResumes={Boolean(hackathonSlug) && (hackathonMe.isLoading || hackathonResumes.isLoading)}
              onOpenResume={(resumeId) => router.push(resumeEditorPath(resumeId))}
            />
          ) : null}
          {selectedTemplateName && !quickHackathon ? (
            <div className={resumeBuilderSelectedBanner}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Template: {selectedTemplateName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Choose how you&apos;d like to populate your resume
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!importSource && quickHackathon ? null : !importSource ? (
            <>
              {uploadedCv ? (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Use the CV you already uploaded</p>
                      <p className="truncate text-xs text-muted-foreground">{uploadedCv.filename}</p>
                    </div>
                  </div>
                  <Button
                    className={resumeBuilderPrimaryButton}
                    onClick={() => void importUploadedCv()}
                    disabled={loadingUploadedCv || extracting}
                  >
                    {loadingUploadedCv ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    Use this CV
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <ResumeBuilderImportChoiceCards
                selectedSource={importSource}
                onSelectChat={() => setShowChatModeModal(true)}
                onSelectLinkedIn={() => setImportSource("linkedin")}
                onSelectPdf={() => setImportSource("pdf")}
              />
              <div className={resumeBuilderFooterActions}>
                <Button
                  variant="outline"
                  className={resumeBuilderOutlineButton}
                  onClick={() => setStep("template")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  className={resumeBuilderOutlineButton}
                  onClick={handleSkip}
                  disabled={creating}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip & use defaults
                </Button>
              </div>
            </>
          ) : importSource === "chat" ? (
            selectedTemplate ? (
              chatSubMode === "voice" ? (
                <ResumeBuilderVoicePanel
                  templateId={selectedTemplate}
                  onReady={handleChatReady}
                  onBack={handleImportBack}
                  onSessionCreated={setChatSessionId}
                />
              ) : (
                <ResumeBuilderChatPanel
                  templateId={selectedTemplate}
                  onReady={handleChatReady}
                  onBack={handleImportBack}
                  onSessionCreated={setChatSessionId}
                />
              )
            ) : null
          ) : importSource === "linkedin" ? (
            <ResumeBuilderLinkedInForm
              value={linkedinHandle}
              onChange={setLinkedinHandle}
              onSubmit={handleLinkedInContinue}
              footer={
                <div className={resumeBuilderFooterActions}>
                  <Button
                    variant="outline"
                    className={resumeBuilderOutlineButton}
                    onClick={handleImportBack}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className={resumeBuilderPrimaryButton}
                    onClick={handleLinkedInContinue}
                    disabled={!linkedinHandle.trim()}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              }
            />
          ) : (
            <ResumeBuilderPdfDropzone
              uploadedFile={uploadedFile}
              extracting={extracting}
              isDragActive={isDragActive}
              maxSizeLabel={`${(PDF_RESUME_MAX_BYTES / 1024 / 1024).toFixed(0)} MB`}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              onRemoveFile={() => {
                setUploadedFile(null);
                setResumeText("");
              }}
              footer={
                <div className={resumeBuilderFooterActions}>
                  <Button
                    variant="outline"
                    className={resumeBuilderOutlineButton}
                    onClick={handleImportBack}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {/* Hackathon: sample data blocks the submit — the chooser keeps a small link instead. */}
                    {quickHackathon ? null : (
                      <Button
                        variant="outline"
                        className={resumeBuilderOutlineButton}
                        onClick={handleSkip}
                        disabled={creating}
                      >
                        <SkipForward className="mr-2 h-4 w-4" />
                        Skip & use defaults
                      </Button>
                    )}
                    <Button
                      className={resumeBuilderPrimaryButton}
                      onClick={handlePdfContinue}
                      disabled={extracting || !uploadedFile}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              }
            />
          )}
        </div>
      )}

      {step === "jobDescription" && createError ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1">{createError}</p>
          <button
            type="button"
            onClick={() => setCreateError(null)}
            className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
      {step === "jobDescription" && (
        <ResumeBuilderJobDescriptionStep
          value={jobDescription}
          onChange={setJobDescription}
          jdSummary={jdSummary}
          analyzing={analyzingJd}
          onAnalyze={handleAnalyzeJobDescription}
          onContinueWithJd={(requirements) =>
            void handleBuildResume(jobDescription, requirements ?? jdRequirements)
          }
          onSkip={handleSkipJobDescription}
          onBack={handleJobDescriptionBack}
        />
      )}

      {step === "processing" && (
        <ResumeBuilderProcessingView
          label={processingLabel}
          messageIndex={processingMessageIndex}
          messages={processingMessages}
        />
      )}

      <ResumeEnhanceChoiceDialog
        open={enhanceChoiceOpen}
        onOpenChange={setEnhanceChoiceOpen}
        onSkip={() => proceedFromPdfWithEnhance(false)}
        onEnhance={() => proceedFromPdfWithEnhance(true)}
      />

      <ResumeBuilderChatModeModal
        open={showChatModeModal}
        onOpenChange={setShowChatModeModal}
        onSelect={(mode) => {
          setChatSubMode(mode);
          setImportSource("chat");
          setShowChatModeModal(false);
        }}
      />

      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className={cn(appCard, "sm:max-w-md border-primary/20")}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Resume limit reached
            </DialogTitle>
            <DialogDescription className="pt-1 text-left text-muted-foreground">
              You&apos;ve used all the resumes included in your current plan.
              Upgrade to create more resumes and keep building.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 pt-4 sm:flex-row">
            <Button
              variant="outline"
              className={appOutlineButton}
              onClick={() => setShowLimitModal(false)}
            >
              Cancel
            </Button>
            <Button
              className={resumeBuilderPrimaryButton}
              onClick={() => {
                setShowLimitModal(false);
                router.push("/dashboard/plan");
              }}
            >
              Upgrade plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
