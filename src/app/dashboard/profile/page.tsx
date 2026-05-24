"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  Building2,
  Edit2,
  Save,
  Trash2,
  AlertTriangle,
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
import { userApi, User } from "@/lib/api";
import { InstitutionAffiliationFields } from "@/components/profile/InstitutionAffiliationFields";
import { ProfileWelcomeHero } from "@/components/profile/ProfileWelcomeHero";
import {
  affiliationFromUser,
  toProfileAffiliationPayload,
  type AffiliationValue,
} from "@/lib/affiliation-payload";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { formatDate, cn } from "@/lib/utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import {
  appCard,
  appOutlineButton,
  appPrimaryButton,
  appBadgeInfo,
} from "@/lib/app-theme";

const INDUSTRIES = [
  "IT/Software",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "E-commerce",
  "Telecommunications",
  "Automotive",
  "Real Estate",
  "Media & Entertainment",
  "Other",
];

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
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children ?? (
        <p className="mt-1 text-sm font-medium text-foreground">{value ?? "—"}</p>
      )}
    </div>
  );
}

function SectionIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
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
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileData, setProfileData] = useState({
    userType: "" as "student" | "fresher" | "experienced" | "",
    experience: 0,
    currentJob: {
      company: "",
      role: "",
      industry: "",
    },
    industries: [] as string[],
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
      // Initialize profile data
      setProfileData({
        userType: profile.userType || "",
        experience: profile.experience || 0,
        currentJob: profile.currentJob || {
          company: "",
          role: "",
          industry: "",
        },
        industries: profile.industries || [],
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
        currentJob:
          profileData.userType === "experienced" &&
          profileData.currentJob.company
            ? profileData.currentJob
            : undefined,
        industries:
          profileData.industries.length > 0
            ? profileData.industries
            : undefined,
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

  const handleSaveName = async () => {
    const nextName = fullNameInput.trim();
    if (!nextName) {
      setError("Full name is required");
      return;
    }
    try {
      setSavingName(true);
      setError("");
      setSuccess("");
      await userApi.updateProfile({ name: nextName });

      // Keep Clerk profile display in sync where permitted.
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

      setSuccess("Name updated successfully!");
      setEditingName(false);
      await loadProfile();
    } catch (error: any) {
      console.error("Error updating name:", error);
      setError(
        error.response?.data?.message || "Failed to update name. Please try again.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setProfileData((prev) => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry],
    }));
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
  const jobParts = [
    user?.currentJob?.company?.trim(),
    user?.currentJob?.role?.trim(),
    user?.currentJob?.industry?.trim(),
  ].filter(Boolean);
  const jobSummary = jobParts.length > 0 ? jobParts.join(" · ") : null;

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ProfileWelcomeHero
        firstName={clerkUser?.firstName || user?.name?.split(/\s+/)[0] || ""}
      />

      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Profile summary */}
          <Card className={appCard}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  {clerkUser?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clerkUser.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl border border-border/80 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
                      <UserIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <div className="space-y-2">
                        <Input
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="Enter full name"
                          className="h-9"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveName}
                            disabled={savingName}
                            className={cn("gap-1.5", appPrimaryButton)}
                          >
                            {savingName ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-3.5 w-3.5" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={appOutlineButton}
                            onClick={() => {
                              setEditingName(false);
                              setFullNameInput(user?.name || displayName);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="truncate text-base font-semibold text-foreground">
                          {displayName}
                        </h2>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {displayEmail}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={appBadgeInfo}>
                            {user?.role || "Student"}
                          </span>
                          {user?.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              Member since {formatDate(user.createdAt)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {!editingName && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("shrink-0 gap-1.5", appOutlineButton)}
                    onClick={() => setEditingName(true)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit name
                  </Button>
                )}
              </div>

              <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                <ProfileField label="Full name" value={displayName} />
                <ProfileField label="Email" value={displayEmail} />
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
            </CardContent>
          </Card>

          {/* Professional details */}
          <Card className={appCard}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 px-4 pb-0 pt-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                <SectionIcon
                  icon={Briefcase}
                  className="bg-cyan-500/10 text-cyan-600"
                />
                <div>
                  <CardTitle className="text-base font-semibold">
                    Professional Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Background and interests
                  </CardDescription>
                </div>
              </div>
              {!editingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-1.5", appOutlineButton)}
                  onClick={() => setEditingProfile(true)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              {editingProfile ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
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
                        <SelectTrigger className="h-9 w-full">
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
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Years of experience
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          className="h-9"
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

                  {profileData.userType === "experienced" && (
                    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Current job
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Company
                          </Label>
                          <Input
                            className="h-9"
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
                            placeholder="Google, TCS..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Role
                          </Label>
                          <Input
                            className="h-9"
                            value={profileData.currentJob.role}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                currentJob: {
                                  ...prev.currentJob,
                                  role: e.target.value,
                                },
                              }))
                            }
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Industry
                          </Label>
                          <Select
                            value={profileData.currentJob.industry}
                            onValueChange={(value) =>
                              setProfileData((prev) => ({
                                ...prev,
                                currentJob: {
                                  ...prev.currentJob,
                                  industry: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <InstitutionAffiliationFields
                    value={profileData.affiliation}
                    onChange={(affiliation) =>
                      setProfileData((prev) => ({ ...prev, affiliation }))
                    }
                    disabled={savingProfile}
                  />

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Industries of interest (optional)
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {INDUSTRIES.map((industry) => {
                        const selected = profileData.industries.includes(industry);
                        return (
                          <button
                            key={industry}
                            type="button"
                            onClick={() => toggleIndustry(industry)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                              selected
                                ? "border-[#7367F0] bg-[#7367F0]/10 text-[#7367F0]"
                                : "border-border bg-card text-muted-foreground hover:border-[#7367F0]/40 hover:text-foreground",
                            )}
                          >
                            {industry}
                            {selected && <CheckCircle className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className={cn("gap-1.5", appPrimaryButton)}
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save changes
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={appOutlineButton}
                      onClick={() => {
                        setEditingProfile(false);
                        if (user) {
                          setProfileData({
                            userType: user.userType || "",
                            experience: user.experience || 0,
                            currentJob: user.currentJob || {
                              company: "",
                              role: "",
                              industry: "",
                            },
                            industries: user.industries || [],
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
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
                    <ProfileField
                      label="User type"
                      value={
                        <span className="capitalize">
                          {user?.userType || "Not set"}
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

                  {(jobSummary || user?.userType === "experienced") && (
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Current job
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {jobSummary || "Not set"}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Industries of interest
                    </p>
                    {user?.industries && user.industries.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.industries.map((industry) => (
                          <span key={industry} className={appBadgeInfo}>
                            {industry}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Not set</p>
                    )}
                  </div>

                  {!user?.userType && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      Complete your professional details for personalized
                      interview experiences.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume */}
          <Card className={appCard}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 px-4 pb-0 pt-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                <SectionIcon
                  icon={FileText}
                  className="bg-emerald-500/10 text-emerald-600"
                />
                <div>
                  <CardTitle className="text-base font-semibold">
                    Resume
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Used automatically for new interviews
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn("gap-1.5", appOutlineButton)}
                onClick={() => open()}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              {user?.resume && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.resume.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(user.resume.uploadedAt)} ·{" "}
                      {formatFileSize(user.resume.size)}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
              )}

              <input {...getInputProps()} />

              {!uploadedFile ? (
                <p className="text-xs text-muted-foreground">
                  Click <span className="font-medium text-foreground">Upload</span>{" "}
                  to select a PDF (max 5 MB).
                </p>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
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
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {uploadedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  size="sm"
                  className={cn("gap-1.5", appPrimaryButton)}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      {user?.resume ? "Update resume" : "Upload resume"}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar tips */}
        <div className="lg:col-span-1">
          <Card className={cn(appCard, "sticky top-6")}>
            <CardHeader className="px-4 pb-2 pt-4 sm:px-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#7367F0]" />
                <CardTitle className="text-sm font-semibold">
                  Why keep your resume updated?
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
              {[
                {
                  icon: Target,
                  title: "Personalized questions",
                  desc: "AI asks questions based on your resume",
                  color: "text-[#7367F0]",
                },
                {
                  icon: Shield,
                  title: "Better matching",
                  desc: "Tailored to your skills and experience",
                  color: "text-cyan-600",
                },
                {
                  icon: CheckCircle,
                  title: "Auto-selected",
                  desc: "Latest resume used for interviews",
                  color: "text-emerald-600",
                },
                {
                  icon: Award,
                  title: "Improved feedback",
                  desc: "More accurate performance analysis",
                  color: "text-amber-600",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-2.5">
                  <item.icon className={cn("mt-0.5 h-4 w-4 shrink-0", item.color)} />
                  <div>
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

      {/* Danger zone */}
      <Card className="rounded-xl border border-red-200 bg-red-50/80 shadow-sm">
        <CardHeader className="px-4 pb-2 pt-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <SectionIcon
              icon={AlertTriangle}
              className="bg-red-600 text-white"
            />
            <div>
              <CardTitle className="text-base font-semibold text-red-900">
                Danger zone
              </CardTitle>
              <CardDescription className="text-xs text-red-800/80">
                Permanently delete your account and all data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
          <p className="text-xs text-red-900/90">
            <strong>Warning:</strong> This cannot be undone. Deletes your profile,
            interviews, payments, resume, videos, and Clerk account.
          </p>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete my account
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-red-300 bg-white/80 p-3">
              <p className="text-xs font-semibold text-red-700">
                Are you absolutely sure?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                  className="gap-1.5 bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
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
