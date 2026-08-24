"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  Crown,
  Globe,
  Target,
  Clock,
  ArrowLeft,
  ArrowRight,
  Coins,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  interviewApi,
  paymentApi,
  userApi,
  User,
  type Resume,
} from "@/lib/api";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import {
  getActiveSavedResumeDisplay,
  hasActiveSavedResume,
  loadDefaultDesignedResume,
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
  appCard,
  appCardElevated,
  appPrimaryButton,
  appSurfaceMuted,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { mergeInterviewFormDefaults } from "@/lib/interview-form-defaults";

const disciplineOptionsByDepartment: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  engineering: [
    { value: "cse", label: "CSE" },
    { value: "it", label: "IT" },
    { value: "mech", label: "Mechanical" },
    { value: "civil", label: "Civil" },
  ],
  management: [
    { value: "mba", label: "MBA" },
    { value: "bba", label: "BBA" },
  ],
};

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Fresher" },
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "4", label: "4 years" },
  { value: "5", label: "5+ years" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
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
    title: "Role",
    icon: Target,
    headline: "What role are you preparing for?",
    description: "We'll tailor questions to your target role and company.",
  },
  {
    number: 2,
    title: "Background",
    icon: Globe,
    headline: "Tell us about your background",
    description: "Experience and language shape how the AI panel interviews you.",
  },
  {
    number: 3,
    title: "Session",
    icon: Clock,
    headline: "Choose session length",
    description: "Billed at 5 credits per minute.",
  },
  {
    number: 4,
    title: "Resume",
    icon: FileText,
    headline: "Add your resume",
    description: "Personalized questions are built from your resume.",
  },
] as const;

const controlClass =
  "h-11 w-full rounded-[0.625rem] border-border/60 bg-card text-sm shadow-sm sm:h-12";

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
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
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all sm:p-4",
        selected
          ? "border-[#7367F0]/50 bg-[#7367F0]/[0.06] shadow-sm ring-1 ring-[#7367F0]/20"
          : "border-border/70 bg-card hover:border-[#7367F0]/30 hover:bg-muted/20",
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
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
  const router = useRouter();
  const { invalidate } = useDashboardInvalidation();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [defaultDesignedResume, setDefaultDesignedResume] =
    useState<Resume | null>(null);
  const [useSavedResume, setUseSavedResume] = useState(true);
  const [formData, setFormData] = useState({
    role: "",
    experience: "0",
    language: "en",
    department: "",
    discipline: "",
    targetCompany: "",
    duration: "15",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limitCheck, setLimitCheck] = useState<any>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [currentStep, setCurrentStep] = useState(1);
  const {
    canUse,
    showTrialUpsell,
    loading: entitlementsLoading,
  } = useUpsellState();

  const aiPracticeLocked =
    !entitlementsLoading && !canUse("aiMockInterview");

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const [profile, designedDefault] = await Promise.all([
        userApi.getMyProfile(),
        loadDefaultDesignedResume(user.id),
      ]);
      setUserProfile(profile);
      setDefaultDesignedResume(designedDefault);
      setFormData((prev) => mergeInterviewFormDefaults(prev, profile));
      if (hasActiveSavedResume(profile, designedDefault)) {
        setUseSavedResume(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

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
      loadUserProfile();
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

    if (step === 1 && !formData.role.trim()) {
      newErrors.role = "Role is required";
    }

    if (step === 4) {
      if (!useSavedResume && !uploadedFile) {
        newErrors.resume = "Please upload your resume or use saved resume";
      }
      if (useSavedResume && !savedResumeAvailable) {
        newErrors.resume =
          "No saved resume found. Set a default on your profile or upload a PDF.";
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
      if (!formData.role.trim()) setCurrentStep(1);
      else setCurrentStep(4);
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
        role: formData.role,
        experience: parseInt(formData.experience),
        language: formData.language as "en" | "hi",
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
        discipline: formData.discipline
          ? (formData.discipline as
              | "cse"
              | "it"
              | "mech"
              | "civil"
              | "mba"
              | "bba"
              | "none")
          : undefined,
        targetCompany: formData.targetCompany,
        resume: useSavedResume ? undefined : uploadedFile || undefined,
        useSavedResume:
          useSavedResume && savedResumeAvailable ? true : undefined,
        duration: parseInt(formData.duration),
      });

      await invalidate(["interviews", "entitlements"]);
      router.push(`/interview/${response.data.interviewId}/realtime`);
    } catch (error: any) {
      console.error("Error creating interview:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create interview. Please try again.";

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

  const interviewForm = (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className={cn(appCardElevated, "overflow-hidden")}>
        <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 via-transparent to-transparent px-5 py-5 sm:px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7367F0]">
            Step {currentStep} of {STEPS.length}
          </p>
          <h2 className="mt-2 text-center text-lg font-semibold text-foreground sm:text-xl">
            {activeStep.headline}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted-foreground">
            {activeStep.description}
          </p>

          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((step, index) => {
              const done = currentStep > step.number;
              const active = currentStep === step.number;
              const StepIcon = step.icon;
              return (
                <div
                  key={step.number}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      active &&
                        "border-[#7367F0] bg-[#7367F0] text-white shadow-[0_2px_6px_rgba(115,103,240,0.35)]",
                      done && "border-emerald-500 bg-emerald-500 text-white",
                      !active &&
                        !done &&
                        "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden truncate text-xs font-medium sm:block",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 ? (
                    <div
                      className={cn(
                        "mx-1 h-px min-w-[1rem] flex-1",
                        done ? "bg-emerald-400/70" : "bg-border",
                      )}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-6">
          {currentStep === 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField label="Role you're applying for" htmlFor="role">
                <JobRoleSelect
                  id="role"
                  className="w-full"
                  value={formData.role}
                  onChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
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
                hint="We'll match questions to the company's typical interview pattern."
              >
                <Input
                  id="targetCompany"
                  placeholder="e.g. Amazon, Google, TCS"
                  value={formData.targetCompany}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetCompany: e.target.value,
                    })
                  }
                  className={controlClass}
                />
              </FormField>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Years of experience" htmlFor="experience">
                <AppSelect
                  id="experience"
                  value={formData.experience}
                  onChange={(value) =>
                    setFormData({ ...formData, experience: value })
                  }
                  options={EXPERIENCE_OPTIONS}
                  className={controlClass}
                />
              </FormField>

              <FormField label="Interview language" htmlFor="language">
                <AppSelect
                  id="language"
                  value={formData.language}
                  onChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                  options={LANGUAGE_OPTIONS}
                  className={controlClass}
                />
              </FormField>

              <FormField label="Department" htmlFor="department" optional>
                <AppSelect
                  id="department"
                  value={formData.department}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      department: value,
                      discipline: disciplineOptionsByDepartment[value]?.some(
                        (option) => option.value === prev.discipline,
                      )
                        ? prev.discipline
                        : "",
                    }));
                  }}
                  options={DEPARTMENT_OPTIONS}
                  allowEmpty
                  emptyLabel="Not specified"
                  placeholder="Select department"
                  className={controlClass}
                />
              </FormField>

              <FormField label="Discipline" htmlFor="discipline" optional>
                <AppSelect
                  id="discipline"
                  value={formData.discipline}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, discipline: value }))
                  }
                  options={
                    disciplineOptionsByDepartment[formData.department] ?? []
                  }
                  disabled={!disciplineOptionsByDepartment[formData.department]}
                  allowEmpty
                  emptyLabel="Not specified"
                  placeholder="Select discipline"
                  className={controlClass}
                />
              </FormField>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {(["15", "30"] as const).map((duration) => {
                const is30 = duration === "30";
                const disabled = is30 && !canUse30Min;
                const selected = formData.duration === duration;
                return (
                  <button
                    key={duration}
                    type="button"
                    disabled={disabled}
                    onClick={() => setFormData({ ...formData, duration })}
                    className={cn(
                      "relative flex min-w-[9rem] flex-col items-start rounded-xl border px-5 py-4 text-left transition-all",
                      selected
                        ? "border-[#7367F0]/50 bg-[#7367F0]/[0.08] ring-1 ring-[#7367F0]/25"
                        : "border-border/70 bg-card hover:border-[#7367F0]/30",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="text-base font-semibold text-foreground">
                      {duration} min
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {duration === "15"
                        ? "Standard session · 75 credits"
                        : "Extended depth · 150 credits"}
                    </span>
                    {is30 && !canUse30Min ? (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                        <Crown className="h-3 w-3" />
                        Tech Pro
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {currentStep === 4 ? (
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
              ) : null}

              <ResumeOptionCard
                selected={!useSavedResume}
                onSelect={() => setUseSavedResume(false)}
                icon={Upload}
                title="Upload a new resume"
                subtitle="PDF only · Max 5 MB"
              />

              {!useSavedResume ? (
                <div className="pt-1">
                  {!uploadedFile ? (
                    <div
                      {...getRootProps()}
                      className={cn(
                        "cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all",
                        isDragActive
                          ? "border-[#7367F0]/50 bg-[#7367F0]/[0.06]"
                          : errors.resume
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border/70 bg-muted/15 hover:border-[#7367F0]/35 hover:bg-[#7367F0]/[0.04]",
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {isDragActive
                          ? "Drop your PDF here"
                          : "Drag & drop or click to upload"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF only · Max 5 MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setUploadedFile(null)}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}

              {errors.resume ? <FieldError message={errors.resume} /> : null}

              <p className="pt-1 text-xs text-muted-foreground">
                You&apos;ll need a working microphone for the live session.
              </p>
            </div>
          ) : null}

          {errors.form ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goBackStep}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}

            <Button
              type="submit"
              size="lg"
              className={cn(
                "h-12 w-full px-8 text-base font-semibold sm:ml-auto sm:w-auto",
                appPrimaryButton,
              )}
              disabled={loading || (limitCheck && !limitCheck.allowed)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating session…
                </>
              ) : currentStep < STEPS.length ? (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  Start interview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className={cn(appSurfaceMuted, "px-4 py-3.5 text-center sm:px-5")}>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Sessions use{" "}
          <span className="font-medium text-foreground">5 credits/min</span>.
          Wrap cleanly to unlock transcripts, scores, and discussion coaching in
          your report.
        </p>
      </div>
    </div>
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" asChild className="-ml-2 text-muted-foreground">
          <Link href="/dashboard/interviews">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to interviews
          </Link>
        </Button>
      </div>

      {checkingLimit ? (
        <div
          className={cn(
            appCard,
            "flex items-center justify-center gap-3 px-6 py-8",
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin text-[#7367F0]" />
          <p className="text-sm font-medium text-muted-foreground">
            Checking your credits…
          </p>
        </div>
      ) : !aiPracticeLocked && limitCheck && !limitCheck.allowed ? (
        <div
          className={cn(
            appCardElevated,
            "overflow-hidden border-amber-500/25",
          )}
        >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Crown className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  {limitCheck.isExpired
                    ? "Subscription expired"
                    : limitCheck.gate === "upgrade_required"
                      ? "Upgrade required"
                      : "Not enough credits"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {limitCheck.reason ||
                    "Purchase a plan to continue interviewing."}
                </p>
              </div>

              {limitCheck.creditsAvailable !== undefined &&
              limitCheck.minimumRequired !== undefined ? (
                <div className="flex flex-wrap gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {limitCheck.creditsAvailable}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Required</span>
                    <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                      {limitCheck.minimumRequired}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {limitCheck.isExpired ? (
                  <Button
                    onClick={() => router.push("/dashboard/plan?renew=1")}
                    className={appPrimaryButton}
                  >
                    Renew subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/pricing")}
                    className={appPrimaryButton}
                  >
                    View plans
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : !aiPracticeLocked && limitCheck && limitCheck.allowed ? (
        <div
          className={cn(
            appCard,
            "flex flex-col gap-3 border-emerald-500/25 bg-emerald-500/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Ready to practice
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {limitCheck.creditsAvailable || 0}
                </span>{" "}
                credits available · 5 credits/min
              </p>
            </div>
          </div>
        </div>
      ) : !aiPracticeLocked && !limitCheck ? (
        <div className={cn(appCard, "px-5 py-5")}>
          <p className="mb-3 text-sm text-muted-foreground">
            Could not verify your interview access. Please try again.
          </p>
          <Button type="button" variant="outline" onClick={() => checkInterviewLimit()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!checkingLimit &&
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
