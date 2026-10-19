"use client";

import { useEffect, useId, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  GraduationCap,
  Loader2,
  Rocket,
  TrendingUp,
  Upload,
  User,
  X,
} from "lucide-react";
import { IndustryRoleFields } from "@/components/career/IndustryRoleFields";
import { ProfilePhoneFields } from "@/components/profile/ProfilePhoneFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/lib/api";
import {
  formatPhoneForStorage,
  isValidPhoneForStorage,
  parseStoredPhone,
} from "@/lib/phone-utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import { cn } from "@/lib/utils";
import {
  hackathonFieldsFromProfile,
  isHackathonProfileReady,
  resolveHackathonOnboardingStep,
} from "../hackathonProfileFields";
import { hkSecondaryButton } from "./ResumeChallenge";
import { HK_EVENTS, classifyError, trackHackathon, type HackathonFormStep } from "../analytics";

type UserType = "student" | "fresher" | "experienced" | "";
type Step = 1 | 2 | 3;

const STEP_NAMES: Record<Step, HackathonFormStep> = { 1: "profile_type_phone", 2: "details", 3: "resume" };

function trackFormInvalid(step: Step, field: string) {
  trackHackathon(HK_EVENTS.validationError, { form_step: STEP_NAMES[step], field });
}

function trackFormFailure(step: Step, err: unknown) {
  trackHackathon(HK_EVENTS.signupError, { form_step: STEP_NAMES[step], error_type: classifyError(err) });
}

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
    accent: "border-[#3aa6ff]/40 bg-[#0d2550]/80 text-[#6fc0ff]",
  },
  {
    value: "fresher",
    label: "Fresher",
    description: "Recently graduated, seeking your first role",
    icon: Rocket,
    accent: "border-[#29d6a0]/40 bg-[#0b2e2b]/80 text-[#29d6a0]",
  },
  {
    value: "experienced",
    label: "Experienced",
    description: "Working professional exploring new opportunities",
    icon: TrendingUp,
    accent: "border-[#8a5ce6]/40 bg-[#1a1035]/80 text-[#c4a8ff]",
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
          ? "border-[#3aa6ff]/60 bg-[#0d2550]/90 shadow-[0_0_24px_rgba(58,166,255,0.15)] ring-1 ring-[#3aa6ff]/30"
          : "border-[#2f64a8]/50 bg-[#06142c]/60 hover:border-[#3aa6ff]/40",
      )}
    >
      <span className="mb-3 flex w-full items-center justify-between gap-2">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", accent)}>
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-[#3aa6ff] bg-[#3aa6ff]" : "border-[#2f64a8] bg-[#06142c]",
          )}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
        </span>
      </span>
      <span className="text-sm font-semibold text-white">{label}</span>
      <span className="mt-1 text-xs leading-relaxed text-[#9eb2ca]">{description}</span>
    </button>
  );
}

export function HackathonOnboardingForm({
  onComplete,
  onStart,
}: Readonly<{
  onComplete: () => void;
  /** Called once when the form opens, so the page lets the form finish (incl. the resume step). */
  onStart?: () => void;
}>) {
  const { user } = useUser();
  const industryId = useId();
  const roleId = useId();
  const courseId = useId();
  const collegeId = useId();
  const [step, setStep] = useState<Step>(1);
  const [hydrating, setHydrating] = useState(true);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState<UserType>("");
  const [industry, setIndustry] = useState("");
  const [targetJobRole, setTargetJobRole] = useState("");
  const [course, setCourse] = useState("");
  const [college, setCollege] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    onStart?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open
  }, []);

  useEffect(() => {
    let cancelled = false;
    userApi
      .getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        const fields = hackathonFieldsFromProfile(profile);
        setUserType((fields.userType || "") as UserType);
        setIndustry(fields.industry);
        setTargetJobRole(fields.targetJobRole);
        setCourse(fields.userType === "student" ? fields.targetJobRole : "");
        setCollege(fields.college);
        const parsed = parseStoredPhone(profile.phone);
        setPhoneCountryCode(parsed.countryCode);
        setPhoneLocal(parsed.localNumber);
        setSavedPhone(profile.phone?.trim() || null);
        setStep(resolveHackathonOnboardingStep(profile));
      })
      .catch(() => {
        /* first-time users have no profile row yet */
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    multiple: false,
    validator: pdfResumeFileValidator,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError("");
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        trackFormInvalid(3, err.code === "file-too-large" ? "resume_too_large" : "resume_file_type");
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

  const ensureUser = async () => {
    if (!user) throw new Error("User not found. Please sign in again.");
    await userApi.createOrGetUser(
      user.id,
      user.primaryEmailAddress?.emailAddress || "",
      user.fullName || user.firstName || "User",
    );
  };

  const finishPayload = (extra?: { name?: string; skills?: string[] }) => {
    const type = userType as "student" | "fresher" | "experienced";
    if (type === "student") {
      return {
        userType: type,
        targetJobRole: course.trim(),
        affiliationInstitutionName: college.trim(),
        name: extra?.name,
        skills: extra?.skills,
      };
    }
    return {
      userType: type,
      industry: industry.trim(),
      targetJobRole: targetJobRole.trim(),
      name: extra?.name,
      skills: extra?.skills,
    };
  };

  const handleStep1Next = async () => {
    if (!userType) {
      trackFormInvalid(1, "user_type");
      setError("Choose Student, Fresher, or Experienced to continue.");
      return;
    }
    if (!isValidPhoneForStorage(phoneCountryCode, phoneLocal)) {
      trackFormInvalid(1, "phone");
      setError("Enter a valid mobile number.");
      return;
    }
    const formattedPhone = formatPhoneForStorage(phoneCountryCode, phoneLocal);
    try {
      setLoading(true);
      setError("");
      await ensureUser();
      await userApi.updatePhone(formattedPhone);
      setSavedPhone(formattedPhone);
      await userApi.updateProfile({
        userType: userType as "student" | "fresher" | "experienced",
      });
      void userApi.sendWelcomeSignup("candidate").catch(() => undefined);
      trackHackathon(HK_EVENTS.formProgress, { form_step: STEP_NAMES[1], user_type: userType });
      setStep(
        isHackathonProfileReady({
          userType,
          industry,
          targetJobRole: userType === "student" ? course : targetJobRole,
          affiliationInstitutionName: userType === "student" ? college : undefined,
          phone: formattedPhone,
        })
          ? 3
          : 2,
      );
    } catch (err: unknown) {
      trackFormFailure(1, err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not save your profile. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Next = async () => {
    if (userType === "student") {
      if (!course.trim()) {
        trackFormInvalid(2, "course");
        setError("Enter your course or program.");
        return;
      }
      if (!college.trim()) {
        trackFormInvalid(2, "college");
        setError("Enter your college name.");
        return;
      }
    } else {
      if (!industry.trim()) {
        trackFormInvalid(2, "industry");
        setError("Please select your industry.");
        return;
      }
      if (!targetJobRole.trim()) {
        trackFormInvalid(2, "target_role");
        setError("Please select or enter your target role.");
        return;
      }
    }
    try {
      setLoading(true);
      setError("");
      await ensureUser();
      if (userType === "student") {
        await userApi.updateProfile({
          userType: "student",
          targetJobRole: course.trim(),
          affiliationInstitutionName: college.trim(),
        });
      } else {
        await userApi.updateProfile({
          userType: userType as "fresher" | "experienced",
          industry: industry.trim(),
          targetJobRole: targetJobRole.trim(),
        });
      }
      trackHackathon(HK_EVENTS.formProgress, { form_step: STEP_NAMES[2], user_type: userType });
      setStep(3);
    } catch (err: unknown) {
      trackFormFailure(2, err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not save your details. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (file?: File | null) => {
    try {
      setLoading(true);
      setError("");
      await ensureUser();
      if (file) {
        setExtracting(true);
        const result = await userApi.extractResumeData(file);
        await userApi.completeOnboarding({
          ...finishPayload({
            name: result.extracted.name?.trim() || undefined,
            skills: result.extracted.skills?.slice(0, 20),
          }),
        });
      } else {
        await userApi.completeOnboarding(finishPayload());
      }
      trackHackathon(HK_EVENTS.formProgress, {
        form_step: STEP_NAMES[3],
        user_type: userType,
        resume_uploaded: Boolean(file),
      });
      onComplete();
    } catch (err: unknown) {
      trackFormFailure(3, err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not finish signup. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
      setExtracting(false);
    }
  };

  if (hydrating) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#9eb2ca]">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden /> Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6fc0ff]">
          Step {step} of 3
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn("h-1.5 w-8 rounded-full sm:w-10", step >= n ? "bg-[#3aa6ff]" : "bg-[#1b3c62]")}
              aria-hidden
            />
          ))}
        </div>
      </div>

      <div className="rounded-[22px] border border-[#2a64b0]/60 bg-[#06142c]/80 p-5 shadow-[0_18px_50px_rgba(0,15,45,0.45)] sm:p-8">
        {step === 1 ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-[#3aa6ff]/40 bg-[#0d2550]/80 text-[#6fc0ff]">
                <User className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">You&apos;re joining as a candidate</h2>
                <p className="mt-1 text-sm text-[#9eb2ca]">
                  Hackathon registration is for candidates. Pick the option that best describes you.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {USER_TYPE_OPTIONS.map((option) => (
                <ProfileTypeCard
                  key={option.value}
                  selected={userType === option.value}
                  onSelect={() => setUserType(option.value)}
                  {...option}
                />
              ))}
            </div>
            <div className="dark hk-theme space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Mobile number</Label>
              <ProfilePhoneFields
                countryCode={phoneCountryCode}
                localNumber={phoneLocal}
                savedPhone={savedPhone}
                saving={loading}
                disabled={loading}
                showSaveButton={false}
                onCountryCodeChange={setPhoneCountryCode}
                onLocalNumberChange={setPhoneLocal}
                onSave={() => undefined}
                className="mt-0 sm:items-stretch"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleStep1Next()}
                className="hk-btn inline-flex min-h-11 items-center gap-2 px-6 text-sm disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-[#3aa6ff]/40 bg-[#0d2550]/80 text-[#6fc0ff]">
                <GraduationCap className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {userType === "student" ? "Course & college" : "Industry & role"}
                </h2>
                <p className="mt-1 text-sm text-[#9eb2ca]">
                  {userType === "student"
                    ? "We use this to tailor your mock interviews."
                    : "Tell us where you’re headed so interviews match your goals."}
                </p>
              </div>
            </div>
            <div className="dark hk-theme text-foreground">
              {userType === "student" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={courseId} className="text-xs font-medium text-muted-foreground">
                      Course / program
                    </Label>
                    <Input
                      id={courseId}
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. B.Tech Computer Science"
                      className="h-11 w-full bg-card"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={collegeId} className="text-xs font-medium text-muted-foreground">
                      College name
                    </Label>
                    <Input
                      id={collegeId}
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. IIT Delhi"
                      className="h-11 w-full bg-card"
                    />
                  </div>
                </div>
              ) : (
                <IndustryRoleFields
                  industryId={industryId}
                  roleId={roleId}
                  industry={industry}
                  role={targetJobRole}
                  onIndustryChange={setIndustry}
                  onRoleChange={setTargetJobRole}
                  industryLabel="Industry"
                  roleLabel="Target role"
                  layout="stack"
                />
              )}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                className={cn(hkSecondaryButton, "min-h-11")}
                disabled={loading}
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleStep2Next()}
                className="hk-btn inline-flex min-h-11 items-center gap-2 px-6 text-sm disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-[#3aa6ff]/40 bg-[#0d2550]/80 text-[#6fc0ff]">
                <FileText className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Resume (optional)</h2>
                <p className="mt-1 text-sm text-[#9eb2ca]">
                  Upload a PDF now or skip and add one in Challenge 1 on the hackathon dashboard.
                </p>
              </div>
            </div>
            <div
              {...getRootProps()}
              className={cn(
                "cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
                isDragActive
                  ? "border-[#3aa6ff] bg-[#0d2550]/50"
                  : "border-[#2f64a8]/70 bg-[#040b17]/40 hover:border-[#3aa6ff]/50",
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto size-8 text-[#6fc0ff]" aria-hidden />
              <p className="mt-3 text-sm font-medium text-white">
                {resumeFile ? resumeFile.name : "Drag & drop your resume PDF, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-[#7189a6]">PDF only, up to 5 MB</p>
            </div>
            {resumeFile ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm text-[#9eb2ca] hover:text-white"
                onClick={() => setResumeFile(null)}
              >
                <X className="size-4" /> Remove file
              </button>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className={cn(hkSecondaryButton, "min-h-11")}
                disabled={loading || extracting}
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
              >
                Back
              </button>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className={cn(hkSecondaryButton, "min-h-11")}
                  disabled={loading || extracting}
                  onClick={() => void completeSignup(null)}
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  disabled={loading || extracting}
                  onClick={() => void completeSignup(resumeFile)}
                  className="hk-btn inline-flex min-h-11 items-center justify-center gap-2 px-6 text-sm disabled:opacity-60"
                >
                  {loading || extracting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {extracting ? "Uploading…" : "Finishing…"}
                    </>
                  ) : (
                    <>
                      Go to hackathon dashboard
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-[#ff6f9f]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
