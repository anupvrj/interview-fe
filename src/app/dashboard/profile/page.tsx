"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  User as UserIcon,
  Sparkles,
  Shield,
  Award,
  X,
  Target,
  Briefcase,
  Edit2,
  Save,
  Trash2,
  AlertTriangle,
  FileEdit,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userApi, User, type CandidateStatus, type Resume } from "@/lib/api";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import { InstitutionAffiliationFields } from "@/components/profile/InstitutionAffiliationFields";
import { ProfileSkillsEditor } from "@/components/profile/ProfileSkillsEditor";
import { ProfileDesignedResumePicker, type ProfileDesignedResumePickerHandle } from "@/components/profile/ProfileDesignedResumePicker";
import { ProfilePhoneFields } from "@/components/profile/ProfilePhoneFields";
import { ProfileWelcomeHero } from "@/components/profile/ProfileWelcomeHero";
import { IxScoreSummaryCard } from "@/components/ix-score/IxScoreSummaryCard";
import { CandidateStatusInlineSelect } from "@/components/recruiter/CandidateStatusInlineSelect";
import { CANDIDATE_STATUS_LABELS } from "@/lib/recruiter";
import { IxOptInNotice } from "@/components/ix-score/IxOptInNotice";
import {
  affiliationFromUser,
  toProfileAffiliationPayload,
  type AffiliationValue,
} from "@/lib/affiliation-payload";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { formatDate, cn } from "@/lib/utils";
import { parseStoredPhone, formatPhoneForStorage, isValidPhoneForStorage } from "@/lib/phone-utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { IndustryRoleFields } from "@/components/career/IndustryRoleFields";
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import { AddToChromeButton } from "@/components/chrome-extension/AddToChromeButton";
import { AppSelect } from "@/components/ui/app-select";
import { industrySelectOptions } from "@/lib/career-catalog";
import {
  partitionLegacyProfileSkills,
  resolveUserIndustry,
} from "@/lib/user-industry";

const profileCardClass =
  "overflow-hidden rounded-xl border border-border/60 bg-card shadow-card";

const profileInputClass =
  "h-11 w-full min-w-0 rounded-[0.625rem] border-border/60 bg-background shadow-sm";

const profileFormFieldClass = "flex min-w-0 flex-col gap-2";

const profileFieldTileClass =
  "rounded-xl border border-border/60 bg-muted/20 px-4 py-3";

const profileSectionLabelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

const profileFormLabelClass = "block text-sm font-medium text-foreground";

function profileUserTypeLabel(
  userType?: User["userType"] | "" | null,
): string {
  if (!userType) return "Not set";
  if (userType === "experienced") return "Experienced";
  if (userType === "fresher") return "Fresher";
  return "Student";
}

function designedResumeTemplateLabel(templateId: string): string {
  return TEMPLATES_CATALOG.find((t) => t.id === templateId)?.name ?? templateId;
}

function ProfileField({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(profileFieldTileClass, className)}>
      <p className={profileSectionLabelClass}>{label}</p>
      {children ?? (
        <p className="mt-1.5 text-sm font-medium text-foreground">
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}

function SectionIcon({
  icon: Icon,
  tone = "violet",
}: {
  icon: LucideIcon;
  tone?: "violet" | "cyan" | "emerald" | "amber";
}) {
  const toneClass = {
    violet: "border-[#7367F0]/15 bg-[#7367F0]/10 text-[#7367F0]",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  }[tone];

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
        toneClass,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingProfileInfo, setEditingProfileInfo] = useState(false);
  const [savingProfileInfo, setSavingProfileInfo] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ixScoreCardKey, setIxScoreCardKey] = useState(0);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [candidateStatus, setCandidateStatus] = useState<CandidateStatus>("actively_looking");
  const [defaultDesignedResume, setDefaultDesignedResume] = useState<Resume | null>(null);
  const designedResumePickerRef = useRef<ProfileDesignedResumePickerHandle>(null);
  const [profileData, setProfileData] = useState({
    userType: "" as "student" | "fresher" | "experienced" | "",
    experience: 0,
    targetJobRole: "",
    targetCompany: "",
    currentJob: {
      company: "",
      role: "",
    },
    industry: "",
    skills: [] as string[],
    affiliation: {
      affiliationInstitutionId: null,
      affiliationInstitutionName: "",
    } as AffiliationValue,
  });

  useEffect(() => {
    if (isLoaded && clerkUser) {
      loadProfile();
    }
  }, [isLoaded, clerkUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await userApi.getMyProfile();
      setUser(profile);
      setFullNameInput(profile.name || "");
      const parsedPhone = parseStoredPhone(profile.phone);
      setPhoneCountryCode(parsedPhone.countryCode);
      setPhoneLocal(parsedPhone.localNumber);
      setSavedPhone(profile.phone?.trim() || null);
      setCandidateStatus(profile.candidateStatus ?? "actively_looking");
      const skills = partitionLegacyProfileSkills(
        profile.industries,
        profile.skills,
      );
      setProfileData({
        userType: profile.userType || "",
        experience: profile.experience || 0,
        targetJobRole: profile.targetJobRole || "",
        targetCompany: profile.targetCompany || "",
        currentJob: {
          company: profile.currentJob?.company || "",
          role: profile.currentJob?.role || "",
        },
        industry: resolveUserIndustry(profile),
        skills,
        affiliation: affiliationFromUser(profile),
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setError("");
      setSuccess("");

      await userApi.updateProfile({
        userType: profileData.userType || undefined,
        experience:
          profileData.userType === "experienced"
            ? profileData.experience
            : undefined,
        targetJobRole: (profileData.targetJobRole ?? "").trim() || "",
        targetCompany: (profileData.targetCompany ?? "").trim() || "",
        currentJob:
          profileData.userType === "experienced" &&
          profileData.currentJob.company
            ? {
                company: profileData.currentJob.company,
                role: profileData.currentJob.role,
              }
            : undefined,
        industry: profileData.industry || undefined,
        skills: profileData.skills,
        ...toProfileAffiliationPayload(profileData.affiliation),
      });

      setSuccess("Profile updated successfully!");
      setEditingProfile(false);
      await loadProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(
        error.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const resetProfileInfoForm = () => {
    setFullNameInput(
      user?.name ||
        `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim(),
    );
    const parsedPhone = parseStoredPhone(user?.phone);
    setPhoneCountryCode(parsedPhone.countryCode);
    setPhoneLocal(parsedPhone.localNumber);
    setCandidateStatus(user?.candidateStatus ?? "actively_looking");
  };

  const handleCancelProfileInfo = () => {
    resetProfileInfoForm();
    setEditingProfileInfo(false);
    setError("");
  };

  const handleSaveProfileInfo = async () => {
    const nextName = fullNameInput.trim();
    if (!nextName) {
      setError("Full name is required");
      return;
    }

    const formattedPhone = formatPhoneForStorage(phoneCountryCode, phoneLocal);
    if (
      formattedPhone &&
      !isValidPhoneForStorage(phoneCountryCode, phoneLocal)
    ) {
      setError("Enter a valid phone number (6–15 digits)");
      return;
    }

    try {
      setSavingProfileInfo(true);
      setError("");
      setSuccess("");

      if (nextName !== (user?.name || "")) {
        await userApi.updateProfile({ name: nextName });

        if (clerkUser) {
          const [firstName, ...rest] = nextName.split(/\s+/);
          const lastName = rest.join(" ") || undefined;
          try {
            await clerkUser.update({
              firstName: firstName || undefined,
              lastName,
            });
          } catch {
            // Non-blocking: backend profile name is already updated.
          }
        }
      }

      if (formattedPhone !== (savedPhone ?? "")) {
        await userApi.updatePhone(formattedPhone);
      }

      const persistedStatus = user?.candidateStatus ?? null;
      if (candidateStatus !== persistedStatus) {
        await userApi.updateCandidateStatus(candidateStatus);
      }

      setSuccess("Profile updated successfully!");
      setEditingProfileInfo(false);
      await loadProfile();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Failed to update profile"));
    } finally {
      setSavingProfileInfo(false);
    }
  };

  const handleDeleteProfile = async () => {
    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      // Delete profile from backend
      await userApi.deleteProfile();

      // Sign out from Clerk
      await signOut();

      // Redirect to home page
      router.push("/");
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      setError(
        error.response?.data?.message ||
          "Failed to delete profile. Please try again."
      );
      setDeleting(false);
    }
  };

  const { getInputProps, open } = useDropzone({
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    multiple: false,
    validator: pdfResumeFileValidator,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError("");
      setSuccess("");

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        if (err.code === "file-too-large") {
          setError("File size must be less than 5 MB");
        } else {
          setError(err.message || "Only PDF files are allowed");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
      }
    },
  });

  const handleUpload = async () => {
    if (!uploadedFile) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      await userApi.updateResume(uploadedFile);

      setSuccess("Resume uploaded successfully!");
      setUploadedFile(null);
      setDefaultDesignedResume(null);

      await loadProfile();
    } catch (error: unknown) {
      console.error(
        "Error uploading resume:",
        error instanceof Error ? error.stack ?? error : error
      );
      setError(
        getApiErrorMessage(
          error,
          "Failed to upload resume. Please try again.",
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const displayName =
    user?.name ||
    `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
    "—";
  const displayEmail =
    clerkUser?.primaryEmailAddress?.emailAddress || "—";

  const displaySkills = partitionLegacyProfileSkills(
    user?.industries,
    user?.skills,
  );
  const displayIndustry = resolveUserIndustry(user);

  const profileCompletionScore = (() => {
    let score = 0;
    if (user?.name?.trim()) score += 25;
    if (user?.userType) score += 25;
    if (user?.resume || defaultDesignedResume) score += 30;
    if (displayIndustry || displaySkills.length || user?.affiliationInstitutionName)
      score += 20;
    return Math.min(100, score);
  })();

  const hasActiveResume = Boolean(user?.resume || defaultDesignedResume);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <ProfileWelcomeHero
        firstName={clerkUser?.firstName || user?.name?.split(/\s+/)[0] || ""}
      />

      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      <IxOptInNotice onSnapshotUpdated={() => setIxScoreCardKey((k) => k + 1)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <DashboardStatCard
          theme="violet"
          label="Profile type"
          value={profileUserTypeLabel(user?.userType)}
          hint={user?.createdAt ? `Since ${formatDate(user.createdAt)}` : "Member"}
          icon={UserIcon}
        />
        <DashboardStatCard
          theme="emerald"
          label="Resume"
          value={
            user?.resume
              ? "Uploaded"
              : defaultDesignedResume
                ? "Designed"
                : "Not set"
          }
          hint={
            user?.resume
              ? formatFileSize(user.resume.size)
              : defaultDesignedResume
                ? defaultDesignedResume.title?.trim() || "Default resume"
                : "Add PDF or choose designed resume"
          }
          icon={FileText}
          progress={hasActiveResume ? 100 : 0}
        />
        <DashboardStatCard
          theme="sky"
          label="Profile complete"
          value={`${profileCompletionScore}%`}
          hint={
            profileCompletionScore >= 100
              ? "All set"
              : "Fill professional details"
          }
          icon={Award}
          progress={profileCompletionScore}
        />
      </div>

      <IxScoreSummaryCard key={ixScoreCardKey} />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2">
          {/* Profile summary */}
          <Card className={profileCardClass}>
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  {clerkUser?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clerkUser.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-2xl border-2 border-[#7367F0]/20 object-cover shadow-sm ring-2 ring-[#7367F0]/10"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#7367F0]/15 bg-[#7367F0]/10 text-[#7367F0]">
                      <UserIcon className="h-7 w-7" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-xl font-bold text-foreground">
                      {displayName}
                    </CardTitle>
                    <CardDescription className="mt-1 truncate text-sm">
                      {displayEmail}
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {user?.userType ? (
                        <span className="inline-flex items-center rounded-full border border-[#7367F0]/20 bg-[#7367F0]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7367F0]">
                          {profileUserTypeLabel(user.userType)}
                        </span>
                      ) : null}
                      {user?.createdAt ? (
                        <span className="text-xs text-muted-foreground">
                          Member since {formatDate(user.createdAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {!editingProfileInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => {
                      resetProfileInfoForm();
                      setEditingProfileInfo(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {editingProfileInfo ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={profileFormFieldClass}>
                      <Label htmlFor="profile-full-name" className={profileFormLabelClass}>
                        Full name
                      </Label>
                      <Input
                        id="profile-full-name"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        placeholder="Enter full name"
                        className={profileInputClass}
                        disabled={savingProfileInfo}
                      />
                    </div>
                    <ProfileField label="Email" value={displayEmail} />
                    <ProfileField label="Phone number" className="sm:col-span-2">
                      <ProfilePhoneFields
                        countryCode={phoneCountryCode}
                        localNumber={phoneLocal}
                        savedPhone={savedPhone}
                        disabled={savingProfileInfo}
                        showSaveButton={false}
                        onCountryCodeChange={setPhoneCountryCode}
                        onLocalNumberChange={setPhoneLocal}
                        onSave={() => undefined}
                      />
                    </ProfileField>
                    <div className={profileFormFieldClass}>
                      <Label htmlFor="profile-job-status" className={profileFormLabelClass}>
                        Job status
                      </Label>
                      <CandidateStatusInlineSelect
                        id="profile-job-status"
                        value={candidateStatus}
                        disabled={savingProfileInfo}
                        onChange={setCandidateStatus}
                      />
                    </div>
                    <ProfileField
                      label="Member since"
                      value={
                        user?.createdAt ? formatDate(user.createdAt) : "—"
                      }
                    />
                    <ProfileField
                      label="Account type"
                      value={
                        <span className="capitalize">{user?.role || "Student"}</span>
                      }
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                    <Button
                      size="sm"
                      onClick={() => void handleSaveProfileInfo()}
                      disabled={savingProfileInfo}
                      className={cn("gap-1.5", institutePrimaryClass)}
                    >
                      {savingProfileInfo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingProfileInfo}
                      onClick={handleCancelProfileInfo}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <ProfileField label="Full name" value={displayName} />
                  <ProfileField label="Email" value={displayEmail} />
                  <ProfileField
                    label="Phone number"
                    value={savedPhone || "—"}
                  />
                  <ProfileField
                    label="Job status"
                    value={
                      user?.candidateStatus
                        ? CANDIDATE_STATUS_LABELS[user.candidateStatus]
                        : "Not set"
                    }
                  />
                  <ProfileField
                    label="Member since"
                    value={
                      user?.createdAt ? formatDate(user.createdAt) : "—"
                    }
                  />
                  <ProfileField
                    label="Profile type"
                    value={profileUserTypeLabel(user?.userType)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional details */}
          <Card className={profileCardClass}>
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Briefcase} tone="cyan" />
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Professional details
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-sm">
                      Background, skills, industry, and institute
                    </CardDescription>
                  </div>
                </div>
                {!editingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {editingProfile ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={profileFormFieldClass}>
                      <Label htmlFor="profile-user-type" className={profileFormLabelClass}>
                        User type
                      </Label>
                      <Select
                        value={profileData.userType}
                        onValueChange={(value) =>
                          setProfileData((prev) => ({
                            ...prev,
                            userType: value as
                              | "student"
                              | "fresher"
                              | "experienced",
                          }))
                        }
                      >
                        <SelectTrigger id="profile-user-type" className={profileInputClass}>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="fresher">Fresher</SelectItem>
                          <SelectItem value="experienced">Experienced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {profileData.userType === "experienced" && (
                      <div className={profileFormFieldClass}>
                        <Label htmlFor="profile-experience" className={profileFormLabelClass}>
                          Years of experience
                        </Label>
                        <Input
                          id="profile-experience"
                          type="number"
                          min="0"
                          max="50"
                          className={profileInputClass}
                          value={profileData.experience || ""}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              experience:
                                Number.parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          placeholder="e.g. 3"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-xl border border-[#7367F0]/20 bg-[#7367F0]/[0.04] p-4">
                    <div>
                      <p className={profileSectionLabelClass}>Interview targets</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Pre-fills role and company when you start practice sessions.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className={profileFormFieldClass}>
                        <Label htmlFor="profile-target-role" className={profileFormLabelClass}>
                          Role you are applying for
                        </Label>
                        <JobRoleSelect
                          id="profile-target-role"
                          value={profileData.targetJobRole ?? ""}
                          onChange={(value) =>
                            setProfileData((prev) => ({
                              ...prev,
                              targetJobRole: value,
                            }))
                          }
                          industry={profileData.industry}
                          disabled={savingProfile}
                          placeholder="e.g. Software Engineer"
                          inputClassName={profileInputClass}
                        />
                      </div>
                      <div className={profileFormFieldClass}>
                        <Label htmlFor="profile-target-company" className={profileFormLabelClass}>
                          Target company
                        </Label>
                        <Input
                          id="profile-target-company"
                          className={profileInputClass}
                          value={profileData.targetCompany ?? ""}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              targetCompany: e.target.value,
                            }))
                          }
                          disabled={savingProfile}
                          placeholder="e.g. Amazon, Google, TCS"
                        />
                      </div>
                    </div>
                  </div>

                  {profileData.userType === "experienced" && (
                    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className={profileSectionLabelClass}>Current job</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className={cn(profileFormFieldClass, "md:col-span-2")}>
                          <Label htmlFor="profile-company" className={profileFormLabelClass}>
                            Company
                          </Label>
                          <Input
                            id="profile-company"
                            className={profileInputClass}
                            value={profileData.currentJob.company}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                currentJob: {
                                  ...prev.currentJob,
                                  company: e.target.value,
                                },
                              }))
                            }
                            placeholder="Google, TCS…"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <IndustryRoleFields
                            industryId="profile-industry"
                            roleId="profile-role"
                            industry={profileData.industry}
                            role={profileData.currentJob.role}
                            onIndustryChange={(value) =>
                              setProfileData((prev) => ({ ...prev, industry: value }))
                            }
                            onRoleChange={(value) =>
                              setProfileData((prev) => ({
                                ...prev,
                                currentJob: { ...prev.currentJob, role: value },
                              }))
                            }
                            disabled={savingProfile}
                            industryLabel="Industry"
                            roleLabel="Role"
                            layout="grid"
                            industryClassName={profileInputClass}
                            roleClassName={profileInputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {profileData.userType !== "experienced" ? (
                    <div className={profileFormFieldClass}>
                      <Label htmlFor="profile-industry-only" className={profileFormLabelClass}>
                        Industry{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <AppSelect
                        id="profile-industry-only"
                        value={profileData.industry}
                        onChange={(value) =>
                          setProfileData((prev) => ({ ...prev, industry: value }))
                        }
                        disabled={savingProfile}
                        allowEmpty
                        emptyLabel="Not set"
                        placeholder="Select industry"
                        options={industrySelectOptions()}
                        className={profileInputClass}
                      />
                    </div>
                  ) : null}

                  <InstitutionAffiliationFields
                    value={profileData.affiliation}
                    onChange={(affiliation) =>
                      setProfileData((prev) => ({ ...prev, affiliation }))
                    }
                    disabled={savingProfile}
                  />

                  <div className="space-y-3">
                    <Label className={profileFormLabelClass}>Skills</Label>
                    <ProfileSkillsEditor
                      skills={profileData.skills}
                      industry={profileData.industry}
                      disabled={savingProfile}
                      inputClassName={profileInputClass}
                      onChange={(skills) =>
                        setProfileData((prev) => ({ ...prev, skills }))
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className={cn("gap-1.5", institutePrimaryClass)}
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save changes
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingProfile(false);
                        if (user) {
                          setProfileData({
                            userType: user.userType || "",
                            experience: user.experience || 0,
                            targetJobRole: user.targetJobRole || "",
                            targetCompany: user.targetCompany || "",
                            currentJob: {
                              company: user.currentJob?.company || "",
                              role: user.currentJob?.role || "",
                            },
                            industry: resolveUserIndustry(user),
                            skills: partitionLegacyProfileSkills(
                              user.industries,
                              user.skills,
                            ),
                            affiliation: affiliationFromUser(user),
                          });
                        }
                      }}
                      disabled={savingProfile}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ProfileField
                      label="User type"
                      value={
                        <span className="capitalize">
                          {profileUserTypeLabel(user?.userType)}
                        </span>
                      }
                    />
                    <ProfileField
                      label="Experience"
                      value={
                        typeof user?.experience === "number" &&
                        user.experience > 0
                          ? `${user.experience} ${user.experience === 1 ? "year" : "years"}`
                          : "Not set"
                      }
                    />
                    <ProfileField
                      label="Institute / organization"
                      value={
                        <>
                          {user?.affiliationInstitutionName?.trim() || "Not set"}
                          {user?.affiliationInstitutionId ? (
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                              Listed in our directory
                            </span>
                          ) : null}
                        </>
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <p className={profileSectionLabelClass}>Interview targets</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ProfileField
                        label="Role you are applying for"
                        value={user?.targetJobRole?.trim() || "Not set"}
                      />
                      <ProfileField
                        label="Target company"
                        value={user?.targetCompany?.trim() || "Not set"}
                      />
                    </div>
                  </div>

                  {user?.userType === "experienced" && (
                    <div className="space-y-3">
                      <p className={profileSectionLabelClass}>Current job</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <ProfileField
                          label="Company"
                          value={user?.currentJob?.company?.trim() || "Not set"}
                        />
                        <ProfileField
                          label="Role"
                          value={user?.currentJob?.role?.trim() || "Not set"}
                        />
                      </div>
                    </div>
                  )}

                  <ProfileField
                    label="Industry"
                    value={displayIndustry || "Not set"}
                  />

                  <div>
                    <p className={profileSectionLabelClass}>Skills</p>
                    {displaySkills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {displaySkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">Not set</p>
                    )}
                  </div>

                  {!user?.userType && (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                      Complete your professional details for personalized
                      interview experiences.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume */}
          <Card className={profileCardClass}>
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={FileText} tone="emerald" />
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Resume
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-sm">
                      One active resume for interviews and recruiters
                    </CardDescription>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => designedResumePickerRef.current?.open()}
                  >
                    <FileEdit className="h-4 w-4" />
                    Choose resume
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => open()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {user?.resume ? (
                <div className="flex items-center gap-4 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/5 to-transparent p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.resume.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded PDF · {formatDate(user.resume.uploadedAt)} ·{" "}
                      {formatFileSize(user.resume.size)}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
              ) : defaultDesignedResume ? (
                <div className="flex items-center gap-4 rounded-xl border border-[#7367F0]/25 bg-gradient-to-r from-[#7367F0]/5 to-transparent p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7367F0] text-white shadow-sm">
                    <FileEdit className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {defaultDesignedResume.title?.trim() || "Untitled resume"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Designed resume ·{" "}
                      {designedResumeTemplateLabel(defaultDesignedResume.templateId)} ·
                      Updated {formatDate(defaultDesignedResume.updatedAt)}
                    </p>
                  </div>
                  <Star className="h-5 w-5 shrink-0 fill-[#7367F0] text-[#7367F0]" />
                </div>
              ) : null}

              <input {...getInputProps()} />

              {!uploadedFile && !user?.resume && !defaultDesignedResume ? (
                <button
                  type="button"
                  onClick={() => open()}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center transition-colors hover:border-[#7367F0]/40 hover:bg-[#7367F0]/[0.03]",
                  )}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#7367F0]/15 bg-[#7367F0]/10 text-[#7367F0]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Click to upload resume
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF only · max 5 MB
                  </p>
                </button>
              ) : uploadedFile ? (
                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.size)}
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
              ) : null}

              {uploadedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={cn("gap-1.5", institutePrimaryClass)}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {user?.resume ? "Update resume" : "Upload resume"}
                    </>
                  )}
                </Button>
              )}

              <ProfileDesignedResumePicker
                ref={designedResumePickerRef}
                onDefaultResumeChange={setDefaultDesignedResume}
                onDefaultChanged={() => void loadProfile()}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar tips */}
        <div className="lg:col-span-1">
          <Card className={cn(profileCardClass, "sticky top-6")}>
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#7367F0]" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Why keep your resume updated?
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {[
                {
                  icon: Target,
                  title: "Personalized questions",
                  desc: "AI asks questions based on your resume",
                  tone: "violet" as const,
                },
                {
                  icon: Shield,
                  title: "Better matching",
                  desc: "Tailored to your skills and experience",
                  tone: "cyan" as const,
                },
                {
                  icon: CheckCircle,
                  title: "Auto-selected",
                  desc: "Latest resume used for interviews",
                  tone: "emerald" as const,
                },
                {
                  icon: Award,
                  title: "Improved feedback",
                  desc: "More accurate performance analysis",
                  tone: "amber" as const,
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <SectionIcon icon={item.icon} tone={item.tone} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className={profileCardClass}>
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Chrome extension
          </CardTitle>
          <CardDescription className="mt-0.5 text-sm">
            Capture a job description from LinkedIn, Naukri, Indeed, and other
            boards, then create a tailored resume copy while staying signed in.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <AddToChromeButton />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="overflow-hidden rounded-xl border border-destructive/25 bg-destructive/5 shadow-card">
        <CardHeader className="border-b border-destructive/15 px-5 py-4">
          <div className="flex items-center gap-3">
            <SectionIcon icon={AlertTriangle} tone="amber" />
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Danger zone
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm">
                Permanently delete your account and all data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            This cannot be undone. Deletes your profile, interviews, payments,
            resume, videos, and Clerk account.
          </p>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete my account
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border border-destructive/25 bg-background/80 p-4">
              <p className="text-sm font-semibold text-foreground">
                Are you absolutely sure?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                  className="gap-1.5"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Yes, delete
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setError("");
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
