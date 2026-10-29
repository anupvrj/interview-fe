"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  Crown,
  Target,
  Clock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { interviewApi, paymentApi } from "@/lib/api";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { useDefaultResumeQuery } from "@/hooks/queries/useDefaultResumeQuery";
import {
  getActiveSavedResumeDisplay,
  hasActiveSavedResume,
} from "@/lib/active-saved-resume";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import { PracticeLockedGate } from "@/components/upsell/PracticeLockedGate";
import { useUpsellState } from "@/components/upsell/useUpsellState";
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import { AppSelect } from "@/components/ui/app-select";
import {
  FormField,
} from "@/components/onboarding/onboarding-form-primitives";
import {
  resumeBuilderCard,
  resumeBuilderFooterActions,
  resumeBuilderOutlineButton,
  resumeBuilderPrimaryButton,
} from "@/components/resume-builder/resumeBuilderStyles";
import { dash2026Scope, Eyebrow, SegmentedSteps } from "@/components/dashboard-2026/ui";
import { cn } from "@/lib/utils";
import {
  applyJobCaptureToInterviewForm,
  mergeInterviewFormDefaults,
  type InterviewFormEdits,
} from "@/lib/interview-form-defaults";
import {
  clearPendingJobCapture,
  loadPendingJobCaptureFor,
  MIN_JOB_DESCRIPTION_CHARS,
  normalizeCapturedJob,
  type PendingJobCapture,
} from "@/lib/extension-job-handoff";
import { trimJobDescriptionForSend } from "@/lib/job-description-limits";
import { voiceApi } from "@/lib/voiceApi";
import { VoiceProviderSelect } from "@/components/interview/VoiceProviderSelect";
import {
  DEFAULT_VOICE_PROVIDER_OPTIONS,
  resolveVoiceProviderForDuration,
  type VoiceProvider,
  type VoiceProviderOption,
} from "@/lib/voiceProviders";

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Fresher" },
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "4", label: "4 years" },
  { value: "5", label: "5+ years" },
] as const;

const DEPARTMENT_OPTIONS = [
  { value: "engineering", label: "Engineering" },
  { value: "management", label: "Management" },
  { value: "commerce_finance", label: "Commerce & Finance" },
  { value: "healthcare_pharma", label: "Healthcare & Pharma" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
] as const;

const STEPS = [
  {
    number: 1,
    title: "Role & Background",
    icon: Target,
    headline: "Which round are you rehearsing?",
    description:
      "The role, company and job post shape every question you'll be asked.",
  },
  {
    number: 2,
    title: "Session",
    icon: Clock,
    headline: "How long, and which voice?",
    description: "Pick the length and the interviewer's voice. Credits follow the voice model.",
  },
  {
    number: 3,
    title: "Resume",
    icon: FileText,
    headline: "Which resume should it read?",
    description: "Follow-ups come straight from your own projects and numbers.",
  },
] as const;

const controlClass =
  "h-12 w-full rounded-xl border-border bg-background text-[14.5px] shadow-none";

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function jobCaptureHeading(capture: PendingJobCapture): string {
  const title = capture.title.trim();
  const company = capture.company.trim();
  if (title && company) return `Preparing for ${title} at ${company}`;
  if (title) return `Preparing for ${title}`;
  if (company) return `Preparing for a role at ${company}`;
  return "Job description attached";
}

function JobCaptureBanner({
  capture,
  onDismiss,
}: Readonly<{
  capture: PendingJobCapture;
  onDismiss: () => void;
}>) {
  return (
    <div
      className={cn(
        "mb-5 rounded-[18px] border border-primary/30 bg-[linear-gradient(120deg,rgba(115,103,240,.08),transparent_60%)] p-4",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_10px_24px_-12px_rgba(115,103,240,.8)]">
          <Briefcase className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {jobCaptureHeading(capture)}
          </p>
          {capture.location ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {capture.location}
            </p>
          ) : null}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-[#7367F0]">
              View job description
            </summary>
            <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {capture.jobDescription}
            </p>
          </details>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Remove job description"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ResumeOptionCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/[0.05] shadow-[0_0_0_4px_rgba(115,103,240,0.12)]"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-[#7367F0] bg-[#7367F0]"
            : "border-border bg-background",
        )}
      >
        {selected ? (
          <span className="h-2 w-2 rounded-full bg-white" />
        ) : null}
      </span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-primary dark:from-primary/20 dark:to-sky-500/10">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-foreground">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
      {selected ? (
        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
      ) : null}
    </button>
  );
}

export default function NewInterviewPage() {
  const { user, isLoaded } = useUser();
  const roleCtx = useActiveRole();
  const userProfile = roleCtx?.profile ?? null;
  const profileReady = roleCtx?.ready ?? false;
  const router = useRouter();
  const { invalidate } = useDashboardInvalidation();
  const { data: queriedDefaultResume, isFetched: defaultResumeFetched } =
    useDefaultResumeQuery(
      !userProfile?.resume?.s3Key &&
        userProfile?.defaultDesignedResume === undefined,
    );
  const defaultDesignedResume =
    userProfile?.defaultDesignedResume ?? queriedDefaultResume ?? null;
  const savedResumeKnown = Boolean(
    userProfile?.resume?.s3Key ||
      userProfile?.defaultDesignedResume ||
      userProfile?.defaultDesignedResume === null ||
      defaultResumeFetched,
  );
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useSavedResume, setUseSavedResume] = useState(true);
  const [formData, setFormData] = useState(() => {
    const initial = {
      role: "",
      experience: "0",
      department: "",
      targetCompany: "",
      duration: "15",
      voiceProvider: "sarvam" as VoiceProvider,
    };
    return userProfile
      ? mergeInterviewFormDefaults(initial, userProfile)
      : initial;
  });
  const [voiceProviderOptions, setVoiceProviderOptions] = useState<
    VoiceProviderOption[]
  >(DEFAULT_VOICE_PROVIDER_OPTIONS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limitCheck, setLimitCheck] = useState<any>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [currentStep, setCurrentStep] = useState(1);
  const [jobCapture, setJobCapture] = useState<PendingJobCapture | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const jobCaptureRef = useRef<PendingJobCapture | null>(null);
  const formEdits = useRef<InterviewFormEdits>({});
  const {
    canUse,
    showTrialUpsell,
    loading: entitlementsLoading,
  } = useUpsellState();

  const aiPracticeLocked =
    !entitlementsLoading && !canUse("aiMockInterview");

  const filledForm = useMemo(() => {
    const edits = formEdits.current;
    if (!userProfile) return formData;
    const merged = mergeInterviewFormDefaults(formData, userProfile, edits);
    if (!jobCapture) return merged;
    const captured = applyJobCaptureToInterviewForm(merged, jobCapture);
    return {
      ...captured,
      role: edits.role ? merged.role : captured.role,
      targetCompany: edits.targetCompany
        ? merged.targetCompany
        : captured.targetCompany,
    };
  }, [formData, userProfile, jobCapture]);

  useEffect(() => {
    if (!savedResumeKnown) return;
    setUseSavedResume(
      hasActiveSavedResume(userProfile, defaultDesignedResume),
    );
  }, [savedResumeKnown, userProfile, defaultDesignedResume]);

  const activeSavedResume = getActiveSavedResumeDisplay(
    userProfile,
    defaultDesignedResume,
  );
  const savedResumeAvailable = hasActiveSavedResume(
    userProfile,
    defaultDesignedResume,
  );

  const checkInterviewLimit = async () => {
    if (!user) return;
    setCheckingLimit(true);
    try {
      const result = await paymentApi.checkInterviewLimit("aiMockInterview");
      setLimitCheck(result);
      const sub = await paymentApi.getSubscription();
      setSubscriptionPlan(sub?.plan ?? "free");
    } catch (error: unknown) {
      console.error("Error checking limit:", error);
      try {
        const sub = await paymentApi.getSubscription();
        if (
          sub &&
          (sub.isExpired ||
            sub.needsRenewal ||
            sub.status === "expired" ||
            sub.expiredPlanId)
        ) {
          setLimitCheck({
            allowed: false,
            isExpired: true,
            reason:
              "Your subscription has expired. Renew your plan to start new interviews.",
            creditsAvailable: sub.creditsAvailable ?? 0,
            minimumRequired: 150,
          });
          return;
        }
      } catch {
        // fall through
      }
    } finally {
      setCheckingLimit(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "success") {
        setTimeout(() => {
          checkInterviewLimit();
        }, 1000);
      } else {
        checkInterviewLimit();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  useEffect(() => {
    void voiceApi
      .listProviders()
      .then(({ providers, defaultProvider }) => {
        const enabled = providers.filter((p) => p.enabled);
        if (enabled.length > 0) {
          const nextOptions = enabled.map((p) => ({
            id: p.id,
            label: p.label,
            creditsPerMinute: p.creditsPerMinute,
            enabled: p.enabled,
            beta: p.beta,
            status: p.status,
            isDefault: p.isDefault,
            highlightTag: p.highlightTag,
            highlightStyle: p.highlightStyle,
            allowedDurations: p.allowedDurations,
            decisionHint: p.decisionHint,
          }));
          setVoiceProviderOptions(nextOptions);
          setFormData((prev) => ({
            ...prev,
            voiceProvider: resolveVoiceProviderForDuration(
              defaultProvider,
              nextOptions,
              Number(prev.duration),
              prev.voiceProvider,
            ),
          }));
        }
      })
      .catch(() => {
        /* keep local defaults if API unavailable */
      });
  }, []);

  useEffect(() => {
    const apply = (next: PendingJobCapture | null) => {
      if (!next) return false;
      const normalized = normalizeCapturedJob(next);
      jobCaptureRef.current = normalized;
      setJobCapture(normalized);
      setJobDescription(normalized.jobDescription);
      setFormData((prev) => {
        const next = applyJobCaptureToInterviewForm(prev, normalized);
        const edits = formEdits.current;
        return {
          ...next,
          role: edits.role ? prev.role : next.role,
          targetCompany: edits.targetCompany
            ? prev.targetCompany
            : next.targetCompany,
        };
      });
      return true;
    };

    if (apply(loadPendingJobCaptureFor("practice-interview"))) {
      return;
    }

    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks += 1;
      if (apply(loadPendingJobCaptureFor("practice-interview")) || ticks >= 20) {
        window.clearInterval(timer);
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, []);

  const dismissJobCapture = () => {
    jobCaptureRef.current = null;
    setJobCapture(null);
    setJobDescription("");
    clearPendingJobCapture();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    multiple: false,
    validator: pdfResumeFileValidator,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        if (err.code === "file-too-large") {
          setErrors((prev) => ({
            ...prev,
            resume: "File size must be less than 5 MB",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            resume: err.message || "Only PDF files are allowed",
          }));
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        setErrors((prev) => ({ ...prev, resume: "" }));
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < STEPS.length) {
      if (validateStep(currentStep)) {
        setCurrentStep((step) => step + 1);
      }
      return;
    }

    await submitInterview();
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !filledForm.role.trim()) {
      newErrors.role = "Role is required";
    }

    if (step === 3) {
      if (!useSavedResume && !uploadedFile) {
        newErrors.resume = "Please upload your resume or use saved resume";
      }
      if (useSavedResume && !savedResumeAvailable) {
        newErrors.resume =
          "No saved resume found. Set a default on your profile or upload a PDF.";
      }
      if (
        useSavedResume &&
        savedResumeAvailable &&
        !userProfile?.resume?.s3Key &&
        !defaultDesignedResume?.pdfS3Key
      ) {
        newErrors.resume =
          "Generate a PDF of your default resume in the resume editor, then try again.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitInterview = async () => {
    if (!user) {
      setErrors({ form: "Please sign in to continue" });
      return;
    }

    if (!validateStep(1) || !validateStep(4)) {
      if (!filledForm.role.trim()) setCurrentStep(1);
      else setCurrentStep(3);
      return;
    }

    const limitResult = await paymentApi.checkInterviewLimit("aiMockInterview");
    if (!limitResult.allowed) {
      setLimitCheck(limitResult);
      return;
    }

    setLoading(true);
    try {
      const response = await interviewApi.create(user.id, {
        role: filledForm.role,
        experience: parseInt(filledForm.experience),
        language: "en",
        department: formData.department
          ? (formData.department as
              | "engineering"
              | "management"
              | "commerce_finance"
              | "healthcare_pharma"
              | "marketing"
              | "sales"
              | "general")
          : undefined,
        targetCompany: filledForm.targetCompany,
        resume: useSavedResume ? undefined : uploadedFile || undefined,
        useSavedResume:
          useSavedResume && savedResumeAvailable ? true : undefined,
        duration: parseInt(formData.duration),
        jobDescription: (() => {
          const jd = trimJobDescriptionForSend(jobDescription);
          return jd.length >= MIN_JOB_DESCRIPTION_CHARS ? jd : undefined;
        })(),
        voiceProvider: formData.voiceProvider,
        jobApplicationId: jobCaptureRef.current?.jobApplicationId,
      });

      clearPendingJobCapture();
      jobCaptureRef.current = null;
      setJobCapture(null);
      await invalidate(["interviews", "entitlements"]);
      router.push(`/interview/${response.data.interviewId}/realtime`);
    } catch (error: any) {
      console.error("Error creating interview:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create interview. Please try again.";

      if (error.response?.data?.code === "BIOMETRIC_REQUIRED") {
        router.push("/dashboard/identity-verification");
        return;
      }

      if (errorMessage.includes("limit") || errorMessage.includes("upgrade")) {
        await checkInterviewLimit();
      }

      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const goBackStep = () => {
    setErrors({});
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const activeStep = STEPS[currentStep - 1];
  const canUse30Min = ["tech_pro", "enterprise"].includes(subscriptionPlan);
  const voiceOption = voiceProviderOptions.find((o) => o.id === formData.voiceProvider);
  const estimatedCredits = voiceOption?.creditsPerMinute ? voiceOption.creditsPerMinute * Number(formData.duration) : null;
  const experienceLabel = EXPERIENCE_OPTIONS.find((o) => o.value === filledForm.experience)?.label;
  const summary: [string, string | null][] = [
    ["Role", filledForm.role.trim() || null],
    ["Company", filledForm.targetCompany.trim() || null],
    ["Experience", experienceLabel ?? null],
    ["Job post", jobDescription.trim().length >= MIN_JOB_DESCRIPTION_CHARS ? `${jobDescription.trim().length.toLocaleString()} characters` : null],
    ["Length", `${formData.duration} min`],
    ["Voice", voiceOption?.label ?? null],
    ["Resume", useSavedResume ? activeSavedResume?.title ?? null : uploadedFile?.name ?? null],
  ];

  const interviewForm = (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className={cn(resumeBuilderCard, "relative")}>
        <form onSubmit={handleSubmit} className="p-5 sm:p-7">
          {jobCapture && currentStep === 1 ? (
            <JobCaptureBanner
              capture={jobCapture}
              onDismiss={dismissJobCapture}
            />
          ) : null}
          {currentStep === 1 ? (
            <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField label="Role you're applying for" htmlFor="role">
                <JobRoleSelect
                  id="role"
                  className="w-full"
                  value={filledForm.role}
                  onChange={(value) => {
                    formEdits.current.role = true;
                    setFormData((prev) => ({ ...prev, role: value }));
                  }}
                  placeholder="e.g. Software Engineer, Product Manager"
                  inputClassName={cn(
                    controlClass,
                    errors.role &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {errors.role ? <FieldError message={errors.role} /> : null}
              </FormField>

              <FormField
                label="Target company"
                htmlFor="targetCompany"
                optional
                hint="Questions follow that company's usual interview pattern."
              >
                <Input
                  id="targetCompany"
                  placeholder="e.g. Amazon, Google, TCS"
                  value={filledForm.targetCompany}
                  onChange={(e) => {
                    formEdits.current.targetCompany = true;
                    setFormData((prev) => ({
                      ...prev,
                      targetCompany: e.target.value,
                    }));
                  }}
                  className={controlClass}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField label="Years of experience" htmlFor="experience">
                <AppSelect
                  id="experience"
                  value={filledForm.experience}
                  onChange={(value) => {
                    formEdits.current.experience = true;
                    setFormData((prev) => ({ ...prev, experience: value }));
                  }}
                  options={EXPERIENCE_OPTIONS}
                  className={controlClass}
                />
              </FormField>
              <FormField label="Department" htmlFor="department" optional>
                <AppSelect
                  id="department"
                  value={formData.department}
                  onChange={(value) =>
                    setFormData({ ...formData, department: value })
                  }
                  options={DEPARTMENT_OPTIONS}
                  allowEmpty
                  emptyLabel="Not specified"
                  placeholder="Select department"
                  className={controlClass}
                />
              </FormField>
            </div>
            <FormField label="Job description" htmlFor="jobDescription" optional>
              <div className="overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  placeholder="Paste the job post so the questions match this role"
                  className="min-h-[150px] resize-y !rounded-none !border-0 !bg-transparent px-4 py-3 text-[14px] leading-relaxed !shadow-none !ring-0"
                />
                <div className="flex items-center justify-between border-t border-border px-4 py-2">
                  <span className="text-[12px] text-muted-foreground">At least {MIN_JOB_DESCRIPTION_CHARS} characters</span>
                  <span className={cn("font-[family-name:var(--font-geist-mono)] text-[11px]", jobDescription.trim().length >= MIN_JOB_DESCRIPTION_CHARS ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                    {jobDescription.trim().length.toLocaleString()} CHARS
                  </span>
                </div>
              </div>
            </FormField>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6">
              <div>
                <p className="mb-2.5 text-xs font-medium text-muted-foreground">Session length</p>
                <div className="grid grid-cols-2 gap-3">
                {(["15", "30"] as const).map((duration) => {
                const is30 = duration === "30";
                const disabled = is30 && !canUse30Min;
                const selected = formData.duration === duration;
                return (
                  <button
                    key={duration}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        duration,
                        voiceProvider: resolveVoiceProviderForDuration(
                          prev.voiceProvider,
                          voiceProviderOptions,
                          Number(duration),
                          prev.voiceProvider,
                        ),
                      }))
                    }
                    className={cn(
                      "relative flex flex-col items-start rounded-[18px] border p-5 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/[0.05] shadow-[0_0_0_4px_rgba(115,103,240,0.12)]"
                        : "border-border bg-card hover:border-primary/40",
                      disabled && "cursor-not-allowed opacity-55 hover:border-border",
                    )}
                  >
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[34px] font-black leading-none tracking-[-0.04em] text-foreground tabular-nums">{duration}</span>
                      <span className="text-[14px] font-medium text-muted-foreground">min</span>
                    </span>
                    <span className="mt-2 text-[13px] text-muted-foreground">
                      {duration === "15" ? "A focused screening round" : "More depth and more follow-ups"}
                    </span>
                    {is30 && !canUse30Min ? (
                      <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[10px] text-amber-700 dark:text-amber-300">
                        <Crown className="h-3 w-3" />
                        TECH PRO
                      </span>
                    ) : null}
                    {selected ? <CheckCircle className="absolute right-4 top-4 h-5 w-5 text-primary" /> : null}
                  </button>
                );
              })}
                </div>
              </div>

              <FormField label="Interviewer voice" htmlFor="voiceProvider">
                <VoiceProviderSelect
                  id="voiceProvider"
                  value={formData.voiceProvider}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      voiceProvider: value,
                    })
                  }
                  options={voiceProviderOptions}
                  durationMinutes={Number(formData.duration)}
                  className={cn(controlClass, "h-auto min-h-12 py-1.5")}
                />
              </FormField>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-3">
              {savedResumeAvailable && activeSavedResume ? (
                <ResumeOptionCard
                  selected={useSavedResume}
                  onSelect={() => {
                    setUseSavedResume(true);
                    setUploadedFile(null);
                    setErrors((prev) => ({ ...prev, resume: "" }));
                  }}
                  icon={FileText}
                  title={activeSavedResume.title}
                  subtitle={activeSavedResume.subtitle}
                />
              ) : !savedResumeKnown ? (
                <div
                  className="h-[4.75rem] animate-pulse rounded-[18px] border border-border bg-muted/20"
                  aria-hidden
                />
              ) : null}

              <ResumeOptionCard
                selected={!useSavedResume}
                onSelect={() => setUseSavedResume(false)}
                icon={Upload}
                title="Upload a different resume"
                subtitle="PDF only · Max 5 MB"
              />

              {!useSavedResume ? (
                <div className="pt-1">
                  {!uploadedFile ? (
                    <div
                      {...getRootProps()}
                      className={cn(
                        "cursor-pointer rounded-[18px] border-2 border-dashed px-6 py-10 text-center transition-all",
                        isDragActive
                          ? "border-primary bg-primary/[0.06]"
                          : errors.resume
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-primary/30 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(115,103,240,.07),transparent_70%)] hover:border-primary/55",
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-primary/25 bg-card text-primary shadow-[0_14px_30px_-16px_rgba(75,63,208,.6)]">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-[16px] font-bold tracking-tight text-foreground">
                        {isDragActive ? "Drop it here" : "Drag your resume PDF here"}
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        or <span className="font-semibold text-primary underline decoration-primary/40 underline-offset-4">browse your files</span>
                      </p>
                      <p className="mt-3 font-[family-name:var(--font-geist-mono)] text-[11px] text-muted-foreground/80">PDF ONLY · MAX 5 MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-[18px] border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-foreground">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[12.5px] text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · ready
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove file"
                        onClick={() => setUploadedFile(null)}
                        className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}

              {errors.resume ? <FieldError message={errors.resume} /> : null}
            </div>
          ) : null}

          {errors.form ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          ) : null}

          <div className={cn(resumeBuilderFooterActions, "mt-7")}>
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={goBackStep}
                disabled={loading}
                className={cn(resumeBuilderOutlineButton, "w-full sm:w-auto")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}

            <Button
              type="submit"
              className={cn(resumeBuilderPrimaryButton, "w-full sm:ml-auto sm:w-auto")}
              disabled={loading || (limitCheck && !limitCheck.allowed)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating session…
                </>
              ) : currentStep < STEPS.length ? (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Start interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* what you're about to start, filled in as you go */}
      <aside className={cn(resumeBuilderCard, "p-5 lg:sticky lg:top-6")}>
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary">YOUR SESSION</p>
        <dl className="mt-3 divide-y divide-border">
          {summary.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-[13px] text-muted-foreground">{k}</dt>
              <dd className={cn("min-w-0 truncate text-right text-[13.5px]", v ? "font-medium text-foreground" : "text-muted-foreground/60")}>{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
        {estimatedCredits != null ? (
          <div className="mt-3 flex items-baseline justify-between rounded-xl bg-muted/50 px-3.5 py-3">
            <span className="text-[13px] text-muted-foreground">About</span>
            <span className="text-[13px] text-muted-foreground"><b className="font-[family-name:var(--font-geist-mono)] text-[18px] font-medium text-foreground">{estimatedCredits}</b> credits</span>
          </div>
        ) : null}
        <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
          You&apos;ll need a working microphone. Finish the session to unlock the transcript, scores and coaching in your report.
        </p>
      </aside>
    </div>
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const creditsReady = !checkingLimit && profileReady && !aiPracticeLocked && limitCheck && limitCheck.allowed;

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      {/* header: where you are in setup, and whether you can start */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(115,103,240,.13),transparent_70%),radial-gradient(40%_70%_at_95%_20%,rgba(31,143,255,.09),transparent_70%)]" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard/interviews" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> AI interviews
            </Link>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11.5px] text-muted-foreground">STEP {currentStep} OF {STEPS.length}</span>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <Eyebrow>NEW INTERVIEW</Eyebrow>
              <h1 className="text-balance mt-4 text-[30px] font-black leading-[1.04] tracking-[-0.045em] text-foreground md:text-[40px]">{activeStep.headline}</h1>
              <p className="text-balance mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">{activeStep.description}</p>
            </div>
            {checkingLimit || !profileReady ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-background/70 px-3.5 py-2.5 text-[13px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {checkingLimit ? "Checking your credits…" : "Loading your profile…"}
              </span>
            ) : creditsReady ? (
              <span className="inline-flex w-fit items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-3.5 py-2.5 text-[13px] text-foreground">
                <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
                Ready · <b className="font-[family-name:var(--font-geist-mono)] font-medium">{(limitCheck.creditsAvailable || 0).toLocaleString()}</b> credits
              </span>
            ) : null}
          </div>
        </div>
        <div className="relative border-t border-border px-6 py-4 md:px-8">
          <SegmentedSteps labels={STEPS.map((st) => st.title)} current={currentStep - 1} />
        </div>
      </section>

      {!checkingLimit && profileReady && !aiPracticeLocked && limitCheck && !limitCheck.allowed ? (
        <div className={cn(resumeBuilderCard, "border-amber-500/30")}>
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Crown className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h3 className="text-[20px] font-bold tracking-tight text-foreground">
                  {limitCheck.isExpired
                    ? "Subscription expired"
                    : limitCheck.gate === "upgrade_required"
                      ? "Upgrade required"
                      : "Not enough credits"}
                </h3>
                <p className="mt-1 text-[14px] text-muted-foreground">
                  {limitCheck.reason ||
                    "Purchase a plan to continue interviewing."}
                </p>
              </div>

              {limitCheck.creditsAvailable !== undefined &&
              limitCheck.minimumRequired !== undefined ? (
                <div className="grid w-fit grid-cols-2 divide-x divide-border rounded-xl border border-border">
                  <div className="px-4 py-2.5">
                    <p className="text-[12px] text-muted-foreground">Available</p>
                    <p className="font-[family-name:var(--font-geist-mono)] text-[20px] text-foreground">{limitCheck.creditsAvailable}</p>
                  </div>
                  <div className="px-4 py-2.5">
                    <p className="text-[12px] text-muted-foreground">Required</p>
                    <p className="font-[family-name:var(--font-geist-mono)] text-[20px] text-amber-600 dark:text-amber-400">{limitCheck.minimumRequired}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {limitCheck.isExpired ? (
                  <Button onClick={() => router.push("/dashboard/plan?renew=1")} className={resumeBuilderPrimaryButton}>
                    Renew subscription
                  </Button>
                ) : (
                  <Button onClick={() => router.push("/pricing")} className={resumeBuilderPrimaryButton}>
                    View plans
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : !checkingLimit && profileReady && !aiPracticeLocked && !limitCheck ? (
        <div className={cn(resumeBuilderCard, "px-5 py-5")}>
          <p className="mb-3 text-sm text-muted-foreground">
            Could not verify your interview access. Please try again.
          </p>
          <Button type="button" variant="outline" className={resumeBuilderOutlineButton} onClick={() => checkInterviewLimit()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!checkingLimit &&
        profileReady &&
        (aiPracticeLocked ? (
          <PracticeLockedGate
            type="ai"
            showTrialUpsell={showTrialUpsell}
            background={interviewForm}
          />
        ) : limitCheck && limitCheck.allowed ? (
          interviewForm
        ) : null)}
    </div>
  );
}
