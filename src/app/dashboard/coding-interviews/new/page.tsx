"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Crown,
  CheckCircle,
  Target,
  Globe,
  FileText,
  Upload,
  X,
  AlertCircle,
  Code2,
} from "lucide-react";
import { codingInterviewApi, paymentApi } from "@/lib/api";
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
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import { AppSelect } from "@/components/ui/app-select";
import { FormField } from "@/components/onboarding/onboarding-form-primitives";
import {
  resumeBuilderCard,
  resumeBuilderFooterActions,
  resumeBuilderOutlineButton,
  resumeBuilderPrimaryButton,
} from "@/components/resume-builder/resumeBuilderStyles";
import { dash2026Scope, Eyebrow, SegmentedSteps } from "@/components/dashboard-2026/ui";
import { cn } from "@/lib/utils";
import {
  mergeInterviewFormDefaults,
  type InterviewFormEdits,
} from "@/lib/interview-form-defaults";
import { UpgradeUpsellDialog } from "@/components/upsell/UpgradeUpsellDialog";
import { TrialUpsellDialog } from "@/components/upsell/TrialUpsellDialog";
import { useUpsellState } from "@/components/upsell/useUpsellState";

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
    headline: "Which coding round are you preparing for?",
    description: "The role and company set how hard your three problems are.",
  },
  {
    number: 2,
    title: "Background",
    icon: Globe,
    headline: "Where are you coming from?",
    description: "Experience and background shape which problems you get.",
  },
  {
    number: 3,
    title: "Resume",
    icon: FileText,
    headline: "Which resume should it read?",
    description: "The discussion after coding asks about your own projects.",
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

export default function NewCodingInterviewPage() {
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
  const [useSavedResume, setUseSavedResume] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [limitCheck, setLimitCheck] = useState<any>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const initial = {
      role: "",
      experience: "0",
      department: "",
      discipline: "",
      targetCompany: "",
    };
    return userProfile
      ? mergeInterviewFormDefaults(initial, userProfile)
      : initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formEdits = useRef<InterviewFormEdits>({});
  const [upgradeUpsellOpen, setUpgradeUpsellOpen] = useState(false);
  const [trialUpsellOpen, setTrialUpsellOpen] = useState(false);
  const { showTrialUpsell, data: entitlements } = useUpsellState();

  const filledForm = useMemo(
    () =>
      userProfile
        ? mergeInterviewFormDefaults(
            formData,
            userProfile,
            formEdits.current,
          )
        : formData,
    [formData, userProfile],
  );

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
      const result = await paymentApi.checkInterviewLimit("codingRound");
      setLimitCheck(result);
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
              "Your subscription has expired. Renew your plan to start new coding sessions.",
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < STEPS.length) {
      if (validateStep(currentStep)) {
        setCurrentStep((step) => step + 1);
      }
      return;
    }

    await submitSession();
  };

  const submitSession = async () => {
    if (!user) {
      setErrors({ form: "Please sign in to continue" });
      return;
    }

    if (!validateStep(1) || !validateStep(3)) {
      if (!filledForm.role.trim()) setCurrentStep(1);
      else setCurrentStep(3);
      return;
    }

    const limitResult = await paymentApi.checkInterviewLimit("codingRound");
    if (!limitResult.allowed) {
      setLimitCheck(limitResult);
      return;
    }

    setLoading(true);
    try {
      const res = await codingInterviewApi.create(user.id, {
        role: filledForm.role.trim(),
        experience: Number.parseInt(filledForm.experience, 10) || 0,
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
        targetCompany: filledForm.targetCompany.trim() || undefined,
        resume: useSavedResume ? undefined : uploadedFile || undefined,
        useSavedResume:
          useSavedResume && savedResumeAvailable ? true : undefined,
      });
      await invalidate(["codingInterviews", "entitlements"]);
      router.push(
        `/dashboard/coding-interviews/${res.data.interviewId}?autostart=1`,
      );
    } catch (err: unknown) {
      console.error("Error creating coding session:", err);
      const data = (err as { response?: { data?: { code?: string; message?: string } } })
        ?.response?.data;
      if (data?.code === "BIOMETRIC_REQUIRED") {
        router.push("/dashboard/identity-verification");
        return;
      }
      const errorMessage =
        data?.message || "Failed to create coding session. Please try again.";
      if (
        typeof errorMessage === "string" &&
        (errorMessage.includes("limit") || errorMessage.includes("upgrade"))
      ) {
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
  const experienceLabel = EXPERIENCE_OPTIONS.find((o) => o.value === filledForm.experience)?.label;
  const departmentLabel = DEPARTMENT_OPTIONS.find((o) => o.value === formData.department)?.label;
  const disciplineLabel = disciplineOptionsByDepartment[formData.department]?.find((o) => o.value === formData.discipline)?.label;
  const summary: [string, string | null][] = [
    ["Role", filledForm.role.trim() || null],
    ["Company", filledForm.targetCompany.trim() || null],
    ["Experience", experienceLabel ?? null],
    ["Department", departmentLabel ?? null],
    ["Discipline", disciplineLabel ?? null],
    ["Resume", useSavedResume ? activeSavedResume?.title ?? null : uploadedFile?.name ?? null],
  ];

  const codingForm = (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className={resumeBuilderCard}>
        <form onSubmit={handleSubmit} className="p-5 sm:p-7">
          {currentStep === 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField label="Role you're preparing for" htmlFor="role">
                <JobRoleSelect
                  id="role"
                  className="w-full"
                  value={filledForm.role}
                  onChange={(value) => {
                    formEdits.current.role = true;
                    setFormData((prev) => ({ ...prev, role: value }));
                  }}
                  placeholder="e.g. Software Engineer"
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
                hint="Sets problem difficulty to that company's tier."
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
          ) : null}

          {currentStep === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
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

              <FormField label="Discipline" htmlFor="discipline" optional hint={!disciplineOptionsByDepartment[formData.department] ? "Pick Engineering or Management to choose one." : undefined}>
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
                  <Code2 className="mr-2 h-4 w-4" />
                  Start coding round
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
        <div className="mt-3 rounded-xl bg-muted/50 px-3.5 py-3">
          <p className="font-[family-name:var(--font-geist-mono)] text-[10.5px] text-muted-foreground">HOW IT RUNS</p>
          <ol className="mt-2 space-y-1.5 text-[13px] text-foreground">
            {["Solve three problems in the editor", "Run tests, then submit", "Talk through your approach with AI"].map((t, i) => (
              <li key={t} className="flex gap-2"><span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary">{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>
        <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
          Sessions use <b className="font-semibold text-foreground">5 credits/min</b>, same rules as AI interviews. The discussion needs a microphone.
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

  const creditsReady = !checkingLimit && profileReady && limitCheck && limitCheck.allowed;

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(115,103,240,.13),transparent_70%),radial-gradient(40%_70%_at_95%_20%,rgba(31,143,255,.09),transparent_70%)]" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard/coding-interviews" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Coding rounds
            </Link>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11.5px] text-muted-foreground">STEP {currentStep} OF {STEPS.length}</span>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <Eyebrow>NEW CODING ROUND</Eyebrow>
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

      {!checkingLimit && profileReady && limitCheck && !limitCheck.allowed ? (
        showTrialUpsell ? (
          <div className={cn(resumeBuilderCard, "relative border-primary/30")}>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(115,103,240,.10),transparent_70%)]" />
            <div className="relative flex flex-col items-center gap-4 px-6 py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-primary dark:from-primary/20 dark:to-sky-500/10">
                <Sparkles className="h-8 w-8" />
              </span>
              <div className="max-w-md space-y-2">
                <h3 className="text-[22px] font-extrabold tracking-[-0.03em] text-foreground">Start your free trial to practise</h3>
                <p className="text-[14px] text-muted-foreground">
                  Unlock coding rounds, AI interviews, system design, and 200 credits for 14 days.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => setTrialUpsellOpen(true)} className={resumeBuilderPrimaryButton}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start your free trial
                </Button>
                <Button variant="outline" onClick={() => setUpgradeUpsellOpen(true)} className={resumeBuilderOutlineButton}>
                  View paid plans
                </Button>
              </div>
            </div>
          </div>
        ) : (
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
                      "Coding rounds require Tech Basic or sufficient credits."}
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
                  {limitCheck.gate === "upgrade_required" ||
                  limitCheck.creditsAvailable === undefined ? (
                    <Button onClick={() => setUpgradeUpsellOpen(true)} className={resumeBuilderPrimaryButton}>
                      Upgrade to Tech Basic
                    </Button>
                  ) : limitCheck.isExpired ? (
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
        )
      ) : !checkingLimit && profileReady && !limitCheck ? (
        <div className={cn(resumeBuilderCard, "px-5 py-5")}>
          <p className="mb-3 text-sm text-muted-foreground">
            Could not verify your access. Please try again.
          </p>
          <Button type="button" variant="outline" className={resumeBuilderOutlineButton} onClick={() => checkInterviewLimit()}>
            Retry
          </Button>
        </div>
      ) : null}

      {creditsReady ? codingForm : null}

      <TrialUpsellDialog
        open={trialUpsellOpen}
        onOpenChange={setTrialUpsellOpen}
        variant="practice_coding"
        hasPurchasedTrial={
          entitlements ? !entitlements.canPurchaseTrial : false
        }
      />
      <UpgradeUpsellDialog
        open={upgradeUpsellOpen}
        onOpenChange={setUpgradeUpsellOpen}
        title="Coding interview practice"
        description="Run AI coding rounds with real-time feedback. Included on Tech Basic and Tech Pro."
        targetPlan="tech_basic"
      />
    </div>
  );
}
