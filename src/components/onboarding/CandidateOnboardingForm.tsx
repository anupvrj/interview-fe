"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  Rocket,
  TrendingUp,
  Upload,
  User,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstitutionAffiliationFields } from "@/components/profile/InstitutionAffiliationFields";
import { ProfileSkillsEditor } from "@/components/profile/ProfileSkillsEditor";
import {
  FormField,
  StepBlock,
  onboardingControlClass,
} from "@/components/onboarding/onboarding-form-primitives";
import { isPaidPlanId } from "@/lib/pricingPageContent";
import { consumePostSignInReturnUrl } from "@/lib/post-sign-in-redirect";
import { POST_ONBOARDING_TRIAL_OFFER_KEY } from "@/lib/trialFeatures";
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
import {
  appCardElevated,
  appPrimaryButton,
  appSurfaceMuted,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  DEFAULT_INTERVIEW_OPT_INS,
  IX_CATEGORY_KEYS,
  IX_CATEGORY_META,
  type InterviewOptIns,
} from "@/lib/ix-score-constants";
import { IndustryRoleFields } from "@/components/career/IndustryRoleFields";
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import { industrySelectOptions } from "@/lib/career-catalog";
import { AppSelect } from "@/components/ui/app-select";
import { OnboardingCardGraphics } from "@/components/onboarding/OnboardingAnimatedGraphics";

const STEPS = [
  {
    number: 1,
    title: "Profile",
    icon: User,
    headline: "Who are you?",
    description:
      "Pick your profile type and optionally link your college or institution.",
  },
  {
    number: 2,
    title: "Resume",
    icon: FileText,
    headline: "Add your resume",
    description:
      "Upload your CV to pre-fill experience and skills. You can skip this step.",
  },
  {
    number: 3,
    title: "Details",
    icon: Eye,
    headline: "Fine-tune your profile",
    description:
      "Review extracted info, choose interview types, and add skills for tailored practice.",
  },
  {
    number: 4,
    title: "Finish",
    icon: CheckCircle,
    headline: "You're all set",
    description:
      "Your profile is ready — finish to jump into your dashboard and start practicing.",
  },
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

function ProfileTypeCard({
  selected,
  onSelect,
  icon: Icon,
  accent,
  label,
  description,
}: Readonly<{
  selected: boolean;
  onSelect: () => void;
  icon: typeof GraduationCap;
  accent: string;
  label: string;
  description: string;
}>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-[#7367F0]/50 bg-[#7367F0]/[0.06] shadow-sm ring-1 ring-[#7367F0]/20"
          : "border-border/70 bg-card hover:border-[#7367F0]/30 hover:bg-muted/20",
      )}
    >
      <span className="mb-3 flex w-full items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected
              ? "border-[#7367F0] bg-[#7367F0]"
              : "border-border bg-background",
          )}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
        </span>
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function OptInCard({
  active,
  onToggle,
  label,
  description,
}: Readonly<{
  active: boolean;
  onToggle: () => void;
  label: string;
  description: string;
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-xl border p-4 text-left transition-all",
        active
          ? "border-[#7367F0]/50 bg-[#7367F0]/[0.06] shadow-sm ring-1 ring-[#7367F0]/20"
          : "border-border/70 bg-card hover:border-[#7367F0]/30 hover:bg-muted/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            active ? "bg-[#7367F0] text-white" : "bg-muted text-muted-foreground",
          )}
        >
          {active ? "On" : "Off"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

export function CandidateOnboardingForm() {
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
    targetJobRole: "",
    targetCompany: "",
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
    const returnUrl = consumePostSignInReturnUrl();
    if (returnUrl) {
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
      sessionStorage.setItem(POST_ONBOARDING_TRIAL_OFFER_KEY, "1");
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
    targetJobRole:
      minimal || !reviewData.targetJobRole.trim()
        ? undefined
        : reviewData.targetJobRole.trim(),
    targetCompany:
      minimal || !reviewData.targetCompany.trim()
        ? undefined
        : reviewData.targetCompany.trim(),
    skills:
      minimal || reviewData.skills.length === 0 ? undefined : reviewData.skills,
    interviewOptIns: minimal ? undefined : interviewOptIns,
    ...toOnboardingAffiliationPayload(affiliation),
  });

  const handleStep1Next = () => {
    if (!userType) {
      setError("Please select your profile type");
      return;
    }
    setError("");
    setCurrentStep(2);
  };

  const handleStep2Next = async () => {
    if (!resumeFile) {
      setExtractedData({ skills: [] });
      setReviewData({
        overallExperience: 0,
        experience: 0,
        currentJob: { company: "", role: "" },
        targetJobRole: "",
        targetCompany: "",
        industry: "",
        skills: [],
      });
      setError("");
      setCurrentStep(3);
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
        targetJobRole: result.extracted.currentJob?.role || "",
        targetCompany: "",
        industry: result.extracted.currentJob?.industry || "",
        skills: result.extracted.skills?.slice(0, 20) || [],
      });
      setError("");
      setCurrentStep(3);
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

  const goBackStep = () => {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const activeStep = STEPS[currentStep - 1];
  const selectedUserTypeLabel =
    USER_TYPE_OPTIONS.find((option) => option.value === userType)?.label ?? "";
  const enabledInterviewCount = IX_CATEGORY_KEYS.filter(
    (key) => interviewOptIns[key],
  ).length;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className={cn(appCardElevated, "overflow-hidden")}>
        <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 via-transparent to-transparent px-5 py-5 sm:px-6">
          <OnboardingCardGraphics step={currentStep} />
          <div className="relative z-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7367F0]">
            Step {currentStep} of {STEPS.length}
          </p>
          <h1 className="mt-2 text-center text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {activeStep.headline}
          </h1>
          <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted-foreground">
            {activeStep.description}
          </p>

          <div className="mt-6 flex justify-center px-1 sm:px-2">
            <ol className="flex items-start">
              {STEPS.map((step, index) => {
                const done = currentStep > step.number;
                const active = currentStep === step.number;
                const StepIcon = step.icon;
                return (
                  <li key={step.number} className="flex items-start">
                    <div className="flex w-[4.25rem] flex-col items-center sm:w-[5.25rem]">
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
                          "mt-1.5 text-center text-[10px] font-medium leading-tight sm:text-xs",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 ? (
                      <div
                        className={cn(
                          "mt-4 h-px w-5 shrink-0 sm:w-9 md:w-12",
                          done ? "bg-emerald-400/70" : "bg-border",
                        )}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div
            key={currentStep}
            className="animate-fadeInUp"
            style={{ animation: "fadeInUp 0.45s ease-out both" }}
          >
          {currentStep === 1 ? (
            <div className="space-y-8">
              <StepBlock
                title="Profile type"
                description="Pick the option that best describes you today."
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {USER_TYPE_OPTIONS.map((option) => (
                    <ProfileTypeCard
                      key={option.value}
                      selected={userType === option.value}
                      onSelect={() => {
                        setUserType(option.value);
                        setError("");
                      }}
                      icon={option.icon}
                      accent={option.accent}
                      label={option.label}
                      description={option.description}
                    />
                  ))}
                </div>
              </StepBlock>

              <StepBlock
                title="College or institution"
                description="Optional — link your account to your campus for institute features."
              >
                <InstitutionAffiliationFields
                  value={affiliation}
                  onChange={setAffiliation}
                  disabled={loading || extracting}
                  embedded
                  collapsible
                />
              </StepBlock>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <StepBlock
              title="Resume upload"
              description="We'll pre-fill your profile from your CV. You can continue without uploading."
            >
              {!resumeFile ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex min-h-[12rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
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
                    {isDragActive
                      ? "Drop your resume here"
                      : "Drag & drop or click to upload"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF only · Max 5 MB · Optional
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
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
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </StepBlock>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-8">
              <StepBlock
                title={
                  extractedData?.name ? "Review extracted info" : "Your experience"
                }
                description={
                  extractedData?.name
                    ? "We pulled these details from your resume. Adjust anything that looks off."
                    : "Tell us about your background so we can tailor practice sessions."
                }
              >
                {extractedData?.name ? (
                  <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Name from resume
                    </p>
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
              </StepBlock>

              {userType === "experienced" ? (
                <StepBlock
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
                </StepBlock>
              ) : null}

              <StepBlock
                title="Interview targets"
                description="We'll pre-fill these when you start AI mock, coding, or other practice sessions."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Role you are applying for"
                    htmlFor="onboarding-target-role"
                    hint="Optional — e.g. Software Engineer, Product Manager"
                  >
                    <JobRoleSelect
                      id="onboarding-target-role"
                      value={reviewData.targetJobRole}
                      onChange={(value) =>
                        setReviewData((prev) => ({
                          ...prev,
                          targetJobRole: value,
                        }))
                      }
                      industry={reviewData.industry}
                      placeholder="e.g. Software Engineer"
                      inputClassName={onboardingControlClass}
                    />
                  </FormField>
                  <FormField
                    label="Target company"
                    htmlFor="onboarding-target-company"
                    hint="Optional — helps tailor question style"
                  >
                    <Input
                      id="onboarding-target-company"
                      value={reviewData.targetCompany}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          targetCompany: e.target.value,
                        }))
                      }
                      placeholder="e.g. Amazon, Google, TCS"
                      className={onboardingControlClass}
                    />
                  </FormField>
                </div>
              </StepBlock>

              <StepBlock
                title="Which interviews are you practising?"
                description="Your iX Report is built from the categories you select here. You can change this later from My Profile."
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {IX_CATEGORY_KEYS.map((key) => {
                    const meta = IX_CATEGORY_META[key];
                    return (
                      <OptInCard
                        key={key}
                        active={interviewOptIns[key]}
                        onToggle={() => toggleInterviewOpt(key)}
                        label={meta.label}
                        description={meta.description}
                      />
                    );
                  })}
                </div>
              </StepBlock>

              <StepBlock
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
              </StepBlock>

              {userType !== "experienced" ? (
                <StepBlock
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
                </StepBlock>
              ) : null}
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-2 text-center">
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle className="h-8 w-8" />
                </span>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Everything looks good. Finish setup to open your dashboard and
                  start your first practice session.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Profile</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {selectedUserTypeLabel || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Resume</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {resumeFile ? resumeFile.name : "Skipped"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Interview types
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {enabledInterviewCount} selected
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Interview targets
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {reviewData.targetJobRole.trim() ||
                    reviewData.targetCompany.trim()
                      ? [
                          reviewData.targetJobRole.trim() || null,
                          reviewData.targetCompany.trim() || null,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Skills</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {reviewData.skills.length > 0
                      ? `${reviewData.skills.length} added`
                      : "None yet"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          </div>

          {error ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goBackStep}
                disabled={loading || extracting}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : currentStep < 4 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void completeOnboarding(true)}
                disabled={loading || extracting || !userType}
                className="w-full sm:w-auto"
              >
                Skip for now
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {currentStep === 1 ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleStep1Next}
                  disabled={!userType}
                  className={cn(
                    "h-12 w-full px-8 text-base font-semibold sm:w-auto",
                    appPrimaryButton,
                  )}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : null}

              {currentStep === 2 ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => void handleStep2Next()}
                  disabled={extracting}
                  className={cn(
                    "h-12 w-full px-8 text-base font-semibold sm:w-auto",
                    appPrimaryButton,
                  )}
                >
                  {extracting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Reading resume…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => void completeOnboarding(false)}
                    disabled={loading}
                    className="w-full sm:w-auto sm:hidden"
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      setError("");
                      setCurrentStep(4);
                    }}
                    disabled={loading}
                    className={cn(
                      "h-12 w-full px-8 text-base font-semibold sm:w-auto",
                      appPrimaryButton,
                    )}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </>
              ) : null}

              {currentStep === 4 ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => void completeOnboarding(false)}
                  disabled={loading}
                  className={cn(
                    "h-12 w-full px-8 text-base font-semibold sm:w-auto",
                    appPrimaryButton,
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Finishing…
                    </>
                  ) : (
                    <>
                      Finish setup
                      <CheckCircle className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={cn(appSurfaceMuted, "px-4 py-3.5 text-center sm:px-5")}>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          You can update profile details, skills, and interview preferences anytime
          from{" "}
          <span className="font-medium text-foreground">My Profile</span> in your
          dashboard.
        </p>
      </div>
    </div>
  );
}
