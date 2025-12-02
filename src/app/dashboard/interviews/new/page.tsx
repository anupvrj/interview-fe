"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  Crown,
  Sparkles,
  Briefcase,
  Globe,
  Building2,
  Zap,
  Target,
  Clock,
  Mic,
  BarChart3,
} from "lucide-react";
import { interviewApi, paymentApi, userApi, User } from "@/lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function NewInterviewPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [useSavedResume, setUseSavedResume] = useState(true);
  const [formData, setFormData] = useState({
    role: "",
    experience: "0",
    language: "en",
    targetCompany: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limitCheck, setLimitCheck] = useState<any>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const profile = await userApi.getMyProfile();
      setUserProfile(profile);
      if (profile.resume) {
        setUseSavedResume(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const checkInterviewLimit = async () => {
    if (!user) return;
    setCheckingLimit(true);
    try {
      const result = await paymentApi.checkInterviewLimit();
      setLimitCheck(result);
    } catch (error: any) {
      console.error("Error checking limit:", error);
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
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        if (error.code === "file-too-large") {
          setErrors({ ...errors, resume: "File size must be less than 5 MB" });
        } else {
          setErrors({ ...errors, resume: "Only PDF files are allowed" });
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        setErrors({ ...errors, resume: "" });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrors({ form: "Please sign in to continue" });
      return;
    }

    const limitResult = await paymentApi.checkInterviewLimit();
    if (!limitResult.allowed) {
      setLimitCheck(limitResult);
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
    }
    if (!useSavedResume && !uploadedFile) {
      newErrors.resume = "Please upload your resume or use saved resume";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await interviewApi.create(user.id, {
        role: formData.role,
        experience: parseInt(formData.experience),
        language: formData.language as "en" | "hi",
        targetCompany: formData.targetCompany,
        resume: useSavedResume ? undefined : uploadedFile || undefined,
        useSavedResume:
          useSavedResume && userProfile?.resume ? true : undefined,
      });

      router.push(`/interview/${response.data.interviewId}/realtime`);
    } catch (error: any) {
      console.error("Error creating interview:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create interview. Please try again.";

      if (errorMessage.includes("limit") || errorMessage.includes("upgrade")) {
        await checkInterviewLimit();
      }

      setErrors({
        form: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 lg:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 p-4 sm:p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Start Your AI Interview
            </h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Get personalized feedback and ace your next interview with our
            AI-powered mock interview platform
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Status Cards */}
      {checkingLimit ? (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <p className="text-gray-700 font-medium">
                Checking your interview limit...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : limitCheck && !limitCheck.allowed ? (
        <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Upgrade Your Free Tier
                </h3>
                <p className="text-gray-700 mb-4 text-lg">
                  {limitCheck.reason ||
                    "You've used all your free interviews. Upgrade to continue practicing!"}
                </p>
                {limitCheck.interviewsUsed !== undefined &&
                  limitCheck.interviewsLimit !== undefined && (
                    <div className="mb-6 p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                      <p className="text-sm text-gray-700">
                        You've used{" "}
                        <span className="font-bold text-orange-600 text-lg">
                          {limitCheck.interviewsUsed}
                        </span>{" "}
                        out of{" "}
                        <span className="font-bold text-orange-600 text-lg">
                          {limitCheck.interviewsLimit}
                        </span>{" "}
                        interviews.
                      </p>
                    </div>
                  )}
                <Button
                  onClick={() => router.push("/pricing")}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  View Plans & Upgrade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : limitCheck && limitCheck.allowed ? (
        <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-800 font-semibold text-lg">
                  You have{" "}
                  <span className="font-bold text-green-600 text-xl">
                    {limitCheck.interviewsLimit! - limitCheck.interviewsUsed!}
                  </span>{" "}
                  interviews remaining this period.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Ready to start your next mock interview!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Main Form - Only show if limit check allows */}
      {limitCheck && limitCheck.allowed && (
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-xl lg:text-2xl">
                    Interview Details
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  Fill in the details to personalize your interview experience
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Role Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="role"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <Target className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      Role You're Applying For
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="role"
                      placeholder="e.g., Software Developer"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className={`h-11 sm:h-12 text-sm sm:text-base w-full ${
                        errors.role
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      } transition-all`}
                    />
                    {errors.role && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        {errors.role}
                      </p>
                    )}
                  </div>

                  {/* Experience and Language Grid */}
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="experience"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4 text-blue-600" />
                        Years of Experience
                      </Label>
                      <Select
                        value={formData.experience}
                        onValueChange={(value) =>
                          setFormData({ ...formData, experience: value })
                        }
                      >
                        <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base w-full">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Fresher</SelectItem>
                          <SelectItem value="1">1 Year</SelectItem>
                          <SelectItem value="2">2 Years</SelectItem>
                          <SelectItem value="3">3 Years</SelectItem>
                          <SelectItem value="4">4 Years</SelectItem>
                          <SelectItem value="5">5+ Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="language"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Globe className="w-4 h-4 text-green-600" />
                        Interview Language
                      </Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) =>
                          setFormData({ ...formData, language: value })
                        }
                      >
                        <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Target Company */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="targetCompany"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-pink-600 flex-shrink-0" />
                      Target Company (Optional)
                    </Label>
                    <Input
                      id="targetCompany"
                      placeholder="e.g., TCS, Amazon, Google"
                      value={formData.targetCompany}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetCompany: e.target.value,
                        })
                      }
                      className="h-11 sm:h-12 text-sm sm:text-base w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      We'll tailor questions based on the company's interview
                      pattern
                    </p>
                  </div>

                  {/* Resume Selection */}
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                      Resume
                      <span className="text-red-500">*</span>
                    </Label>

                    {/* Saved Resume Option */}
                    {userProfile?.resume && (
                      <div className="space-y-2">
                        <div
                          className={`relative border-2 rounded-lg p-2.5 sm:p-3 cursor-pointer transition-all ${
                            useSavedResume
                              ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50"
                              : "border-gray-200 bg-white"
                          }`}
                          onClick={() => {
                            setUseSavedResume(true);
                            setUploadedFile(null);
                            setErrors({ ...errors, resume: "" });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setUseSavedResume(true);
                              setUploadedFile(null);
                              setErrors({ ...errors, resume: "" });
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div
                              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                useSavedResume
                                  ? "border-purple-600 bg-purple-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {useSavedResume && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                {userProfile.resume.filename}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(
                                  userProfile.resume.uploadedAt
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            {useSavedResume && (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 pl-11 sm:pl-12">
                          Or upload new below
                        </p>
                      </div>
                    )}

                    {/* Upload New Resume Option */}
                    <div
                      className={`relative border-2 rounded-lg p-2.5 sm:p-3 cursor-pointer transition-all ${
                        !useSavedResume
                          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                      onClick={() => {
                        setUseSavedResume(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setUseSavedResume(false);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            !useSavedResume
                              ? "border-purple-600 bg-purple-600"
                              : "border-gray-300"
                          }`}
                        >
                          {!useSavedResume && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 flex-1">
                          Upload new resume
                        </span>
                        {!useSavedResume && (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* File Upload Area */}
                    {!useSavedResume && (
                      <div className="mt-2">
                        {!uploadedFile ? (
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all ${
                              isDragActive
                                ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50"
                                : errors.resume
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300 bg-gray-50/50"
                            }`}
                          >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-2 sm:gap-3">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                                <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                                  {isDragActive
                                    ? "Drop here"
                                    : "Tap to upload"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  PDF only • Max 5 MB
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2.5 sm:p-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setUploadedFile(null)}
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {errors.resume && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                        <X className="w-4 h-4" />
                        {errors.resume}
                      </p>
                    )}
                  </div>

                  {/* Form Error */}
                  {errors.form && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                      <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{errors.form}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 sm:pt-3">
                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                      disabled={loading || (limitCheck && !limitCheck.allowed)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Start Interview
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info Card */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-xl sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">What happens next?</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        Resume Analysis
                      </p>
                      <p className="text-xs text-gray-600">
                        AI analyzes your resume and prepares personalized
                        questions
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        Interview Session
                      </p>
                      <p className="text-xs text-gray-600">
                        10-15 tailored questions based on your role and
                        experience
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Mic className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        Voice Response
                      </p>
                      <p className="text-xs text-gray-600">
                        Answer using your voice (microphone required)
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        Detailed Feedback
                      </p>
                      <p className="text-xs text-gray-600">
                        Get scores, behavioral analysis, and improvement
                        suggestions
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
