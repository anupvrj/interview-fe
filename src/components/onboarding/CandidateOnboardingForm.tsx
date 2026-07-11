"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  Rocket,
  Sparkles,
  TrendingUp,
  Upload,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstitutionAffiliationFields } from "@/components/profile/InstitutionAffiliationFields";
import { ProfileSkillsEditor } from "@/components/profile/ProfileSkillsEditor";
import {
  FormField,
  FormSection,
  onboardingControlClass,
} from "@/components/onboarding/onboarding-form-primitives";
import { isPaidPlanId } from "@/lib/pricingPageContent";
import { userApi } from "@/lib/api";
import {
  toOnboardingAffiliationPayload,
  type AffiliationValue,
} from "@/lib/affiliation-payload";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  DEFAULT_INTERVIEW_OPT_INS,
  IX_CATEGORY_KEYS,
  IX_CATEGORY_META,
  type InterviewOptIns,
} from "@/lib/ix-score-constants";
import { IndustryRoleFields } from "@/components/career/IndustryRoleFields";
import { industrySelectOptions } from "@/lib/career-catalog";
import { AppSelect } from "@/components/ui/app-select";

const STEPS = [
  { number: 1, title: "Profile", icon: User },
  { number: 2, title: "Details", icon: Eye },
  { number: 3, title: "Finish", icon: CheckCircle },
] as const;

type UserType = "student" | "fresher" | "experienced" | "";

type ExtractedData = {
  name?: string;
  skills?: string[];
};

const USER_TYPE_OPTIONS: {
  value: Exclude<UserType, "">;
  label: string;
  description: string;
  icon: typeof GraduationCap;
  accent: string;
}[] = [
  {
    value: "student",
    label: "Student",
    description: "Currently studying or in college",
    icon: GraduationCap,
    accent: "bg-[#7367F0]/10 text-[#7367F0]",
  },
  {
    value: "fresher",
    label: "Fresher",
    description: "Recently graduated, seeking your first role",
    icon: Rocket,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    value: "experienced",
    label: "Experienced",
    description: "Working professional exploring new opportunities",
    icon: TrendingUp,
    accent: "bg-sky-500/10 text-sky-600",
  },
];

type CandidateOnboardingFormProps = {
  onBack?: () => void;
};

export function CandidateOnboardingForm({ onBack }: Readonly<CandidateOnboardingFormProps>) {
  const { user } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState<UserType>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [reviewData, setReviewData] = useState({
    overallExperience: 0,
    experience: 0,
    currentJob: { company: "", role: "" },
    industry: "",
    skills: [] as string[],
  });
  const [affiliation, setAffiliation] = useState<AffiliationValue>({
    affiliationInstitutionId: null,
    affiliationInstitutionName: "",
  });
  const [interviewOptIns, setInterviewOptIns] = useState<InterviewOptIns>(
    DEFAULT_INTERVIEW_OPT_INS,
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    multiple: false,
    validator: pdfResumeFileValidator,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError("");
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        setError(
          err.code === "file-too-large"
            ? "File size must be less than 5 MB"
            : err.message || "Only PDF files are allowed",
        );
        return;
      }
      if (acceptedFiles.length > 0) setResumeFile(acceptedFiles[0]);
    },
  });

  const redirectAfterComplete = () => {
    const returnUrl = localStorage.getItem("resumeBuilderReturnUrl");
    if (returnUrl) {
      localStorage.removeItem("resumeBuilderReturnUrl");
      router.push(returnUrl);
      return;
    }
    const pendingPlan = localStorage.getItem("pendingPlan");
    if (pendingPlan === "enterprise") {
      localStorage.removeItem("pendingPlan");
      router.push("/contact");
    } else if (pendingPlan && isPaidPlanId(pendingPlan)) {
      localStorage.removeItem("pendingPlan");
      router.push(`/checkout?plan=${pendingPlan}&cycle=monthly`);
    } else {
      if (pendingPlan) localStorage.removeItem("pendingPlan");
      router.push("/select-role");
    }
  };

  const ensureUser = async () => {
    if (!user) throw new Error("User not found. Please sign in again.");
    await userApi.createOrGetUser(
      user.id,
      user.primaryEmailAddress?.emailAddress || "",
      user.fullName || user.firstName || "User",
    );
  };

  const buildPayload = (minimal = false) => ({
    userType: userType as "student" | "fresher" | "experienced",
    experience: minimal
      ? undefined
      : reviewData.overallExperience > 0
        ? reviewData.overallExperience
        : userType === "experienced"
          ? reviewData.experience
          : undefined,
    currentJob:
      minimal || userType !== "experienced" || !reviewData.currentJob.company
        ? undefined
        : reviewData.currentJob,
    industry: minimal || !reviewData.industry ? undefined : reviewData.industry,
    skills:
      minimal || reviewData.skills.length === 0 ? undefined : reviewData.skills,
    interviewOptIns: minimal ? undefined : interviewOptIns,
    ...toOnboardingAffiliationPayload(affiliation),
  });

  const handleStep1Next = async () => {
    if (!userType) {
      setError("Please select your profile type");
      return;
    }
    if (!resumeFile) {
      setExtractedData({ skills: [] });
      setReviewData({
        overallExperience: 0,
        experience: 0,
        currentJob: { company: "", role: "" },
        industry: "",
        skills: [],
      });
      setCurrentStep(2);
      return;
    }
    try {
      setExtracting(true);
      setError("");
      const result = await userApi.extractResumeData(resumeFile);
      setExtractedData(result.extracted);
      setReviewData({
        overallExperience: result.extracted.experience || 0,
        experience: result.extracted.experience || 0,
        currentJob: {
          company: result.extracted.currentJob?.company || "",
          role: result.extracted.currentJob?.role || "",
        },
        industry: result.extracted.currentJob?.industry || "",
        skills: result.extracted.skills?.slice(0, 20) || [],
      });
      setCurrentStep(2);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to extract data from resume. Please try again.";
      setError(message);
    } finally {
      setExtracting(false);
    }
  };

  const toggleInterviewOpt = (key: keyof InterviewOptIns) => {
    setInterviewOptIns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const enabled = IX_CATEGORY_KEYS.filter((k) => next[k]);
      if (enabled.length === 0) {
        setError("At least one interview type must stay selected");
        return prev;
      }
      setError("");
      return next;
    });
  };

  const completeOnboarding = async (minimal = false) => {
    if (!userType) {
      setError("Please select your profile type");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await ensureUser();
      await userApi.completeOnboarding(buildPayload(minimal));
      redirectAfterComplete();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to complete setup. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        {/* Header */}
        <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 via-transparent to-transparent px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="-ml-2 h-8 shrink-0 text-muted-foreground"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            ) : (
              <span className="w-16" />
            )}
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7367F0]">
                Step {currentStep} of {STEPS.length}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Set up your profile
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Personalize your interview prep experience
              </p>
            </div>
            <span className="w-16 shrink-0" />
          </div>

          {/* Step indicator */}
          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((step, index) => {
              const done = currentStep > step.number;
              const active = currentStep === step.number;
              const StepIcon = step.icon;
              return (
                <div key={step.number} className="flex min-w-0 flex-1 items-center gap-2">
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
                    {done ? <Check className="h-4 w-4" /> : <StepIcon className="h-3.5 w-3.5" />}
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

        {/* Body */}
        <div className="space-y-8 px-4 py-6 sm:px-6 sm:py-8">
          {currentStep === 1 ? (
            <>
              <FormSection
                icon={User}
                title="Who are you?"
                description="Pick the option that best describes you today."
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {USER_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = userType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setUserType(option.value)}
                        className={cn(
                          "flex flex-col items-start rounded-xl border p-4 text-left transition-all",
                          selected
                            ? "border-[#7367F0]/50 bg-[#7367F0]/[0.06] ring-2 ring-[#7367F0]/20"
                            : "border-border/70 bg-card hover:border-[#7367F0]/30 hover:bg-[#7367F0]/[0.03]",
                        )}
                      >
                        <span
                          className={cn(
                            "mb-3 flex h-10 w-10 items-center justify-center rounded-lg",
                            option.accent,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {option.label}
                        </span>
                        <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <InstitutionAffiliationFields
                value={affiliation}
                onChange={setAffiliation}
                disabled={loading || extracting}
                embedded
                collapsible
              />

              <FormSection
                icon={Upload}
                title="Resume upload"
                description="We'll pre-fill your profile from your CV. You can skip this step."
              >
                {!resumeFile ? (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "flex min-h-[9rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
                      isDragActive
                        ? "border-[#7367F0]/60 bg-[#7367F0]/[0.06]"
                        : "border-border/70 bg-muted/20 hover:border-[#7367F0]/40 hover:bg-[#7367F0]/[0.03]",
                    )}
                  >
                    <input {...getInputProps()} />
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF only · Max 5 MB · Optional
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-400/60 bg-emerald-50/50 px-4 py-3 dark:bg-emerald-950/20">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {resumeFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setResumeFile(null)}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </FormSection>
            </>
          ) : null}

          {currentStep === 2 ? (
            <>
              <FormSection
                icon={Sparkles}
                title={extractedData?.name ? "Review extracted info" : "Your experience"}
                description={
                  extractedData?.name
                    ? "We pulled these details from your resume. Adjust anything that looks off."
                    : "Tell us about your background so we can tailor practice sessions."
                }
              >
                {extractedData?.name ? (
                  <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Name from resume</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {extractedData.name}
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Overall experience"
                    htmlFor="overall-exp"
                    hint="Includes internships, projects, and full-time work."
                    className={userType === "experienced" ? undefined : "sm:col-span-2"}
                  >
                    <Input
                      id="overall-exp"
                      type="number"
                      min={0}
                      max={50}
                      value={reviewData.overallExperience || ""}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          overallExperience: Number.parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      placeholder="Years"
                      className={onboardingControlClass}
                    />
                  </FormField>

                  {userType === "experienced" ? (
                    <FormField
                      label="Professional work experience"
                      htmlFor="work-exp"
                      hint="Full-time roles only."
                    >
                      <Input
                        id="work-exp"
                        type="number"
                        min={0}
                        max={50}
                        value={reviewData.experience || ""}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            experience: Number.parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        placeholder="Years"
                        className={onboardingControlClass}
                      />
                    </FormField>
                  ) : null}
                </div>
              </FormSection>

              {userType === "experienced" ? (
                <FormSection
                  icon={Briefcase}
                  title="Current role"
                  description="Where you work today — helps us match interview difficulty."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Company" htmlFor="job-company" className="sm:col-span-2">
                      <Input
                        id="job-company"
                        value={reviewData.currentJob.company}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            currentJob: { ...prev.currentJob, company: e.target.value },
                          }))
                        }
                        placeholder="e.g. Acme Corp"
                        className={onboardingControlClass}
                      />
                    </FormField>
                    <div className="sm:col-span-2">
                      <IndustryRoleFields
                        industryId="onboarding-job-industry"
                        roleId="onboarding-job-role"
                        industry={reviewData.industry}
                        role={reviewData.currentJob.role}
                        onIndustryChange={(value) =>
                          setReviewData((prev) => ({ ...prev, industry: value }))
                        }
                        onRoleChange={(value) =>
                          setReviewData((prev) => ({
                            ...prev,
                            currentJob: { ...prev.currentJob, role: value },
                          }))
                        }
                        industryLabel="Industry"
                        roleLabel="Role / title"
                        layout="grid"
                        industryClassName={onboardingControlClass}
                        roleClassName={onboardingControlClass}
                      />
                    </div>
                  </div>
                </FormSection>
              ) : null}

              <FormSection
                icon={Eye}
                title="Which interviews are you practising?"
                description="Your iX Report is built from the categories you select here. You can change this later from My Profile."
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {IX_CATEGORY_KEYS.map((key) => {
                    const meta = IX_CATEGORY_META[key];
                    const active = interviewOptIns[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleInterviewOpt(key)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-[#7367F0] bg-[#7367F0]/5 shadow-sm"
                            : "border-border/70 bg-card hover:border-[#7367F0]/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {meta.label}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              active
                                ? "bg-[#7367F0] text-white"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {active ? "On" : "Off"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {meta.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <FormSection
                icon={Sparkles}
                title="Skills"
                description="Remove extracted skills with ×, pick from suggestions, or type your own."
              >
                <ProfileSkillsEditor
                  skills={reviewData.skills}
                  industry={reviewData.industry}
                  onChange={(skills) =>
                    setReviewData((prev) => ({ ...prev, skills }))
                  }
                />
              </FormSection>

              {userType !== "experienced" ? (
              <FormSection
                icon={TrendingUp}
                title="Industry"
                description="Optional — helps us tailor practice and recruiter discovery."
              >
                <FormField label="Industry" htmlFor="onboarding-industry">
                  <AppSelect
                    id="onboarding-industry"
                    value={reviewData.industry}
                    onChange={(value) =>
                      setReviewData((prev) => ({ ...prev, industry: value }))
                    }
                    allowEmpty
                    emptyLabel="Not specified"
                    placeholder="Select industry"
                    options={industrySelectOptions()}
                    className={onboardingControlClass}
                  />
                </FormField>
              </FormSection>
              ) : null}
            </>
          ) : null}

          {currentStep === 3 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle className="h-8 w-8" />
              </span>
              <h2 className="text-lg font-semibold text-foreground">You&apos;re all set</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Your profile is ready. Hit finish to jump into your dashboard and start
                practicing.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={loading || extracting}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {currentStep === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void completeOnboarding(true)}
                  disabled={loading || extracting || !userType}
                  className="w-full sm:w-auto"
                >
                  Skip for now
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleStep1Next()}
                  disabled={extracting || !userType}
                  className={cn("w-full sm:w-auto", appPrimaryButton)}
                >
                  {extracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reading resume…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            ) : null}

            {currentStep === 2 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void completeOnboarding(false)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Skip for now
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={loading}
                  className={cn("w-full sm:w-auto", appPrimaryButton)}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : null}

            {currentStep === 3 ? (
              <Button
                type="button"
                onClick={() => void completeOnboarding(false)}
                disabled={loading}
                className={cn("w-full sm:w-auto", appPrimaryButton)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finishing…
                  </>
                ) : (
                  <>
                    Finish setup
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
