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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
          <Loader2 className="w-12 h-12 animate-spin text-landing-blue-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-landing-blue-600 via-landing-blue-700 to-landing-blue-800 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Your Profile</h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Manage your profile information and keep your resume up to date for
            better interview experiences
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Profile Information */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl lg:text-2xl">
                  Profile Information
                </CardTitle>
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
                    <UserIcon className="w-4 h-4 text-landing-blue-700" />
                    Full Name
                  </Label>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-100">
                    <p className="text-gray-900 font-semibold text-base">
                      {clerkUser?.firstName} {clerkUser?.lastName}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email Address
                  </Label>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100">
                    <p className="text-gray-900 font-semibold text-base break-all">
                      {clerkUser?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Member Since
                  </Label>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
                    <p className="text-gray-900 font-semibold text-base">
                      {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Award className="w-4 h-4 text-pink-600" />
                    Account Type
                  </Label>
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-100">
                    <p className="text-gray-900 font-semibold text-base capitalize">
                      {user?.role || "Student"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
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
                    <div className="space-y-4 p-4 bg-landing-blue-50 rounded-xl border-2 border-landing-blue-300">
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
                          className={`p-3 rounded-lg border-2 transition-all text-left text-sm ${
                            profileData.industries.includes(industry)
                              ? "border-purple-500 bg-landing-blue-50"
                              : "border-gray-200 bg-white hover:border-purple-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {industry}
                            </span>
                            {profileData.industries.includes(industry) && (
                              <CheckCircle className="w-4 h-4 text-landing-blue-700" />
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
                      className="flex items-center gap-2 bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900"
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
                  {/* User Type */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        User Type
                      </Label>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-100">
                        <p className="text-gray-900 font-semibold text-base capitalize">
                          {user?.userType || "Not set"}
                        </p>
                      </div>
                    </div>

                    {user?.affiliationInstitutionName?.trim() ? (
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Institute / organization
                        </Label>
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-slate-100">
                          <p className="text-gray-900 font-semibold text-base">
                            {user.affiliationInstitutionName}
                          </p>
                          {user.affiliationInstitutionId ? (
                            <p className="mt-1 text-xs text-gray-500">
                              Listed in our directory
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {user?.userType === "experienced" && user.experience && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Experience
                        </Label>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100">
                          <p className="text-gray-900 font-semibold text-base">
                            {user.experience}{" "}
                            {user.experience === 1 ? "year" : "years"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Job */}
                  {user?.currentJob?.company && (
                    <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-green-600" />
                        Current Job
                      </h4>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Company</p>
                          <p className="font-semibold text-gray-900">
                            {user.currentJob.company}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Role</p>
                          <p className="font-semibold text-gray-900">
                            {user.currentJob.role}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Industry</p>
                          <p className="font-semibold text-gray-900">
                            {user.currentJob.industry}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Industries of Interest */}
                  {user?.industries && user.industries.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Industries of Interest
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {user.industries.map((industry) => (
                          <span
                            key={industry}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 text-landing-blue-800 rounded-lg text-sm font-medium border border-landing-blue-300"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {user?.userType ? null : (
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-sm text-yellow-700">
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
          <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl lg:text-2xl">
                  Resume Management
                </CardTitle>
              </div>
              <CardDescription className="text-sm">
                Upload or update your resume. This will be used for new
                interviews automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              {/* Current Resume */}
              {user?.resume && (
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
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

              {/* Upload Area */}
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 lg:p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg scale-[1.02]"
                      : "border-gray-300 bg-gray-50/50 hover:border-purple-400 hover:bg-landing-blue-50/50 hover:shadow-md"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-700 mb-2">
                        {isDragActive
                          ? "Drop your resume here"
                          : "Drag & drop your resume here"}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        or click to browse
                      </p>
                      <p className="text-xs text-gray-400 bg-white/60 px-3 py-1.5 rounded-full inline-block">
                        PDF only • Max 5 MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
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
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2">
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
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white shadow-lg hover:shadow-xl transition-all"
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
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-xl sticky top-8">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
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
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
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
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
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
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
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
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
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
      <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
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
          <div className="p-4 bg-white/60 rounded-xl border-2 border-red-200">
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
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-white/80 rounded-xl border-2 border-red-300">
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
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
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
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
