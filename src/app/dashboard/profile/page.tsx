"use client";

import { useEffect, useState } from "react";
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
  Mail,
  Calendar,
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
import {
  affiliationFromUser,
  toProfileAffiliationPayload,
  type AffiliationValue,
} from "@/lib/affiliation-payload";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { formatDate } from "@/lib/utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";

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

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(37,99,235)] mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-md bg-blue-700 px-4 py-3 sm:px-5 sm:py-4 text-white shadow-lg">
        <div className="relative z-10">
          <div className="mb-1.5 flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 shadow-sm sm:h-9 sm:w-9">
              <UserIcon className="h-4 w-4" />
            </div>
            <h1 className="truncate text-lg font-bold leading-tight sm:text-xl lg:text-2xl">Your Profile</h1>
          </div>
          <p className="max-w-2xl text-[10px] leading-tight text-white/85 sm:text-xs md:text-sm">
            Manage your profile information and keep your resume up to date for
            better interview experiences
          </p>
        </div>
        <div className="absolute inset-0 bg-blue-700/30"></div>
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl"></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-4">
        {/* Left Column - Profile Information */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="rounded-md border border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl">
                    Profile Information
                  </CardTitle>
                </div>
                {!editingName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingName(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit name
                  </Button>
                )}
              </div>
              <CardDescription className="text-sm">
                Your account details and membership information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[rgb(37,99,235)]" />
                    Full Name
                  </Label>
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    {editingName ? (
                      <div className="space-y-3">
                        <Input
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="Enter full name"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveName}
                            disabled={savingName}
                            className="flex items-center gap-2 !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)]"
                          >
                            {savingName ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingName(false);
                              setFullNameInput(
                                user?.name ||
                                  `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim(),
                              );
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-900 font-semibold text-base">
                        {user?.name ||
                          `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
                          "N/A"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email Address
                  </Label>
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    <p className="text-gray-900 font-semibold text-base break-all">
                      {clerkUser?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    Member Since
                  </Label>
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    <p className="text-gray-900 font-semibold text-base">
                      {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-600" />
                    Account Type
                  </Label>
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    <p className="text-gray-900 font-semibold text-base capitalize">
                      {user?.role || "Student"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card className="rounded-md border border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl">
                    Professional Details
                  </CardTitle>
                </div>
                {!editingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription className="text-sm">
                Your professional background and interests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              {editingProfile ? (
                <>
                  {/* User Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      User Type
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
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="fresher">Fresher</SelectItem>
                        <SelectItem value="experienced">Experienced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience (for experienced users) */}
                  {profileData.userType === "experienced" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Years of Experience
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={profileData.experience || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            experience:
                              Number.parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        placeholder="Enter years of experience"
                      />
                    </div>
                  )}

                  {/* Current Job (for experienced users) */}
                  {profileData.userType === "experienced" && (
                    <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Current Job Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
                            Company
                          </Label>
                          <Input
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
                            placeholder="e.g., Google, TCS"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
                            Role
                          </Label>
                          <Input
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
                            placeholder="e.g., Software Engineer"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
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
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select industry" />
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

                  {/* Industries of Interest */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Industries of Interest (Optional)
                    </Label>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {INDUSTRIES.map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => toggleIndustry(industry)}
                          className={`p-3 rounded-lg border transition-all text-left text-sm ${
                            profileData.industries.includes(industry)
                              ? "border-[rgb(37,99,235)] bg-slate-50"
                              : "border-gray-200 bg-white hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {industry}
                            </span>
                            {profileData.industries.includes(industry) && (
                              <CheckCircle className="w-4 h-4 text-[rgb(37,99,235)]" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="flex items-center gap-2 !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)]"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingProfile(false);
                        // Reset to original data
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">User Type</Label>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <p className="text-base font-semibold capitalize text-gray-900">
                          {user?.userType || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Experience</Label>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <p className="text-base font-semibold text-gray-900">
                          {typeof user?.experience === "number" && user.experience > 0
                            ? `${user.experience} ${user.experience === 1 ? "year" : "years"}`
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Institute / organization
                      </Label>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <p className="text-base font-semibold text-gray-900">
                          {user?.affiliationInstitutionName?.trim() || "Not set"}
                        </p>
                        {user?.affiliationInstitutionId ? (
                          <p className="mt-1 text-xs text-gray-500">Listed in our directory</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      Current Job
                    </h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="mb-1 text-xs text-gray-600">Company</p>
                        <p className="font-semibold text-gray-900">
                          {user?.currentJob?.company?.trim() || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-600">Role</p>
                        <p className="font-semibold text-gray-900">
                          {user?.currentJob?.role?.trim() || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-600">Industry</p>
                        <p className="font-semibold text-gray-900">
                          {user?.currentJob?.industry?.trim() || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-semibold text-gray-700">
                      Industries of Interest
                    </Label>
                    {user?.industries && user.industries.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.industries.map((industry) => (
                          <span
                            key={industry}
                            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                        Not set
                      </div>
                    )}
                  </div>

                  {user?.userType ? null : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                      <p>
                        Complete your professional details to get personalized
                        interview experiences.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume Management */}
          <Card className="rounded-md border border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl">
                    Resume Management
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => open()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Resume
                </Button>
              </div>
              <CardDescription className="text-sm">
                Upload or update your resume. This will be used for new
                interviews automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              {/* Current Resume */}
              {user?.resume && (
                <div className="p-5 bg-slate-50 rounded-md border border-green-200 shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-emerald-600 rounded-md flex items-center justify-center shadow-lg flex-shrink-0">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-base mb-1 truncate">
                          {user.resume.filename}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(user.resume.uploadedAt)}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(user.resume.size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <input {...getInputProps()} />

              {!uploadedFile ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Click <span className="font-semibold text-slate-900">Upload New Resume</span> to
                  select a PDF (max 5 MB).
                </div>
              ) : (
                <div className="rounded-md border border-slate-300 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-emerald-600 rounded-md flex items-center justify-center shadow-md flex-shrink-0">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setUploadedFile(null)}
                      className="h-10 w-10 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start gap-2">
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Upload Button */}
              {uploadedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  size="lg"
                  className="w-full h-14 text-base font-semibold !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      {user?.resume ? "Update Resume" : "Upload Resume"}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 rounded-md border border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl">
                  Why Update Resume?
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 lg:space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      Personalized Questions
                    </p>
                    <p className="text-xs text-gray-600">
                      AI analyzes your resume to ask relevant questions
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      Better Matching
                    </p>
                    <p className="text-xs text-gray-600">
                      Questions tailored to your skills and experience
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      Auto-Selected
                    </p>
                    <p className="text-xs text-gray-600">
                      Your latest resume is automatically used for interviews
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      Improved Feedback
                    </p>
                    <p className="text-xs text-gray-600">
                      Get more accurate analysis based on your resume
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Profile Section */}
      <Card className="rounded-md border border-red-200 bg-red-50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl lg:text-2xl text-red-900">
              Danger Zone
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white/60 rounded-md border border-red-200">
            <p className="text-sm text-gray-700 mb-3">
              <strong className="text-red-700">Warning:</strong> This action
              cannot be undone. This will permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-4">
              <li>Your profile and account information</li>
              <li>All your interview history and reports</li>
              <li>All payment records</li>
              <li>Your uploaded resume and interview videos</li>
              <li>Your Clerk authentication account</li>
            </ul>
          </div>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-white/80 rounded-md border border-red-300">
              <p className="text-sm font-semibold text-red-700 mb-2">
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Yes, Delete My Account
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setError("");
                  }}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
